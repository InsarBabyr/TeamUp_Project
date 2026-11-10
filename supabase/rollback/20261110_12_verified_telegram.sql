-- Undo migration 12 (20261110_12_verified_telegram.sql): students type their Telegram handle
-- again, as before. Handles connected through Telegram stay, without the verified mark.
-- Run only if something goes wrong after migration 12, together with reverting the page
-- (core.js, app.js, mobile.js) to the version before it. All or nothing.
begin;

-- 1. The old apply_to_project, which saves the typed handle
drop function if exists public.apply_to_project(uuid, int, text, text, text, text);

create function public.apply_to_project(
  p_project_id   uuid,
  p_skill_id     int,
  p_level        text,
  p_link         text,
  p_note         text,
  p_telegram     text,
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
  if not exists (select 1 from project_skills where project_id = p_project_id and skill_id = p_skill_id) then
    raise exception 'This skill is not listed in the project' using errcode = '23514';
  end if;

  insert into user_skills (user_id, skill_id, level, link_url, evidence_note)
  values (uid, p_skill_id, p_level, nullif(p_link, ''), p_note)
  on conflict (user_id, skill_id) do update
    set level = excluded.level, link_url = excluded.link_url, evidence_note = excluded.evidence_note;

  insert into contacts (user_id, telegram)
  values (uid, p_telegram)
  on conflict (user_id) do update set telegram = excluded.telegram;

  update profiles set availability = p_availability where id = uid;

  insert into applications (project_id, candidate_id, note)
  values (p_project_id, uid, p_note)
  returning id into app_id;

  return app_id;
end;
$$;

revoke execute on function public.apply_to_project(uuid, int, text, text, text, text, text) from public, anon;
grant  execute on function public.apply_to_project(uuid, int, text, text, text, text, text) to authenticated;

-- 2. Remove the Telegram Login functions
drop function if exists public.connect_telegram(jsonb);
drop function if exists public.telegram_bot_id();

-- 3. Students write their own contact again
drop policy if exists "contacts own read"   on public.contacts;
drop policy if exists "contacts own delete" on public.contacts;
create policy "contacts own" on public.contacts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
grant insert, update on public.contacts to anon, authenticated;

-- 4. Remove the verification columns
alter table public.contacts
  drop constraint if exists contacts_verified_complete,
  drop column if exists verified_at,
  drop column if exists telegram_id;

commit;

-- The bot token stays in Vault; to remove it as well:
--   delete from vault.secrets where name = 'telegram_bot_token';
