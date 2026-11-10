-- Migration 12: verified Telegram handles.
--
-- Until now a student could type any handle, including someone else's. Now the handle comes
-- only from Telegram Login: the page opens Telegram's own sign-in window, Telegram returns the
-- student's id and username signed with our bot's token, and connect_telegram() checks that
-- signature here in the database. The bot token stays in Vault (encrypted) and never reaches
-- the page. Students can no longer write the contacts table directly; they can only connect,
-- change (connect again) or disconnect (delete their own row).
-- Handles saved before this migration stay, marked as not verified (verified_at is null).
--
-- Before running this file:
--   1. Create a bot in Telegram with @BotFather (/newbot).
--   2. In @BotFather: /setdomain, choose the bot, send  insarbabyr.github.io
--   3. Store the bot token in Vault by running this line on its own in the SQL Editor
--      (type the token there; never put it in the code or in a chat):
--        select vault.create_secret('<bot token>', 'telegram_bot_token');
-- Rollback: supabase/rollback/20261110_12_verified_telegram.sql

-- 1. Who the handle belongs to and when Telegram confirmed it
alter table public.contacts
  add column telegram_id bigint unique,
  add column verified_at timestamptz,
  add constraint contacts_verified_complete check ((telegram_id is null) = (verified_at is null));

-- 2. Students read and delete their own contact, but cannot write it
drop policy "contacts own" on public.contacts;
create policy "contacts own read"   on public.contacts for select to authenticated using (user_id = auth.uid());
create policy "contacts own delete" on public.contacts for delete to authenticated using (user_id = auth.uid());
revoke insert, update on public.contacts from anon, authenticated;

-- 3. The bot id is the public part of the token (before the colon); the login window needs it
create or replace function public.telegram_bot_id()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select nullif(split_part(s.decrypted_secret, ':', 1), '')::bigint
  from vault.decrypted_secrets s
  where s.name = 'telegram_bot_token'
  limit 1
$$;

-- 4. Check the data Telegram signed and save the handle.
-- Telegram's rule (core.telegram.org/widgets/login#checking-authorization):
-- every field except "hash", as key=value, sorted by key, joined with newlines, signed with
-- HMAC-SHA256 whose key is SHA-256 of the bot token; the result must equal "hash".
create or replace function public.connect_telegram(p_auth jsonb)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid      uuid := auth.uid();
  token    text;
  payload  text;
  expected text;
  tg_id    bigint;
  uname    text;
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;

  select s.decrypted_secret into token
  from vault.decrypted_secrets s where s.name = 'telegram_bot_token' limit 1;
  if token is null then
    raise exception 'Telegram sign-in is not set up yet';
  end if;

  select string_agg(e.key || '=' || e.value, E'\n' order by e.key collate "C")
  into payload
  from jsonb_each_text(p_auth) e
  where e.key <> 'hash';

  expected := encode(extensions.hmac(convert_to(coalesce(payload, ''), 'UTF8'),
                                     extensions.digest(token, 'sha256'), 'sha256'), 'hex');
  if p_auth ->> 'hash' is null or lower(p_auth ->> 'hash') <> expected then
    raise exception 'Telegram could not confirm this account. Try again.';
  end if;

  if (p_auth ->> 'auth_date')::bigint < extract(epoch from now()) - 86400 then
    raise exception 'The Telegram sign-in has expired. Try again.';
  end if;

  uname := p_auth ->> 'username';
  if uname is null or uname !~ '^[A-Za-z][A-Za-z0-9_]{4,31}$' then
    raise exception 'Set a username in Telegram first (Settings, then Username), then connect again.';
  end if;

  tg_id := (p_auth ->> 'id')::bigint;
  if exists (select 1 from public.contacts c where c.telegram_id = tg_id and c.user_id <> uid) then
    raise exception 'This Telegram account is already connected to another TeamUp account.';
  end if;

  insert into public.contacts (user_id, telegram, telegram_id, verified_at)
  values (uid, '@' || uname, tg_id, now())
  on conflict (user_id) do update
    set telegram = excluded.telegram, telegram_id = excluded.telegram_id, verified_at = excluded.verified_at;

  return '@' || uname;
end;
$$;

revoke execute on function public.telegram_bot_id()        from public, anon;
grant  execute on function public.telegram_bot_id()        to authenticated;
revoke execute on function public.connect_telegram(jsonb)  from public, anon;
grant  execute on function public.connect_telegram(jsonb)  to authenticated;

-- 5. Applying no longer takes a typed handle; it needs a connected Telegram instead
drop function public.apply_to_project(uuid, int, text, text, text, text, text);

create function public.apply_to_project(
  p_project_id   uuid,
  p_skill_id     int,
  p_level        text,
  p_link         text,
  p_note         text,
  p_availability text
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid    uuid := auth.uid();
  app_id uuid;
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if not exists (select 1 from contacts where user_id = uid) then
    raise exception 'Connect your Telegram first, so the author can reach you after accepting.';
  end if;
  if not exists (select 1 from project_skills where project_id = p_project_id and skill_id = p_skill_id) then
    raise exception 'This skill is not listed in the project' using errcode = '23514';
  end if;

  insert into user_skills (user_id, skill_id, level, link_url, evidence_note)
  values (uid, p_skill_id, p_level, nullif(p_link, ''), p_note)
  on conflict (user_id, skill_id) do update
    set level = excluded.level, link_url = excluded.link_url, evidence_note = excluded.evidence_note;

  update profiles set availability = p_availability where id = uid;

  insert into applications (project_id, candidate_id, note)
  values (p_project_id, uid, p_note)
  returning id into app_id;

  return app_id;
end;
$$;

revoke execute on function public.apply_to_project(uuid, int, text, text, text, text) from public, anon;
grant  execute on function public.apply_to_project(uuid, int, text, text, text, text) to authenticated;
