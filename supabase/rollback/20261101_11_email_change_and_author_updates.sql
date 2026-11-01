-- Undo migration 11 (20261101_11_email_change_and_author_updates.sql): returns the database
-- exactly to how it was before it (checked on the live database on 2026-11-01).
-- Run only if something goes wrong after migration 11. All or nothing.
begin;

-- 1. Remove the email-change check (the sign-up check stays, it existed before)
drop trigger if exists university_email_only_on_change on auth.users;

-- 2. Restore the default rights: update on the whole applications table for anon and authenticated
revoke update (status) on public.applications from authenticated;
grant update on public.applications to anon, authenticated;

-- 3. Restore the previous notify_assembled (notifies on every switch to assembled)
create or replace function private.notify_assembled()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'assembled' and old.status is distinct from 'assembled' then
    -- status = that candidate's application status, so the page can tell members from the rest
    insert into notifications (user_id, kind, project_id, project_title, status)
    select a.candidate_id, 'assembled', new.id, new.title, a.status
    from applications a
    where a.project_id = new.id;
  end if;
  return null;
end;
$$;

commit;
