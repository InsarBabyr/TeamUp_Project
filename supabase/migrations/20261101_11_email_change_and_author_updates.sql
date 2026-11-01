-- Three fixes from the architecture review. All or nothing: if any statement fails, nothing changes.
-- To undo: supabase/rollback/20261101_11_email_change_and_author_updates.sql
begin;

-- 1. University email only, also when the email is changed later.
-- The insert trigger alone let a user sign up with @astanait.edu.kz and then switch
-- to another address through the Auth API (updateUser({ email })).
-- "when" skips updates that keep the same email, so sign-ins and other row updates are unaffected.
create trigger university_email_only_on_change
  before update of email on auth.users
  for each row
  when (new.email is distinct from old.email)
  execute function public.enforce_university_email();

-- 2. The project author changes only the status of an application, not the candidate's note
-- or other fields. The page only ever updates status. Signed-out visitors (anon) never
-- update applications (every policy is "to authenticated"), so they lose the right entirely.
revoke update on public.applications from anon, authenticated;
grant update (status) on public.applications to authenticated;

-- 3. "Team assembled" notifies each candidate once per project, even if the author
-- reopens the project and marks it assembled again.
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
    where a.project_id = new.id
      and not exists (
        select 1 from notifications n
        where n.user_id = a.candidate_id and n.project_id = new.id and n.kind = 'assembled'
      );
  end if;
  return null;
end;
$$;

commit;
