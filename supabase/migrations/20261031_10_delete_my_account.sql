-- Delete my account (Profile page, promised in the privacy notice).
-- Removing the user from auth.users removes everything linked to them through
-- "on delete cascade": profile, contacts, skills, their projects (with the applications
-- other students sent to them) and their own applications, and notifications.
-- Project files cannot be deleted from SQL (Supabase allows only the Storage API),
-- so the page removes them first and the function refuses while any are left.
-- security definer: a user has no rights on auth.users; the function deletes only the caller.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if exists (
    select 1 from storage.objects o
    join projects p on p.id::text = (storage.foldername(o.name))[1]
    where o.bucket_id = 'project-files' and p.author_id = uid
  ) then
    raise exception 'Remove the files of your projects first' using errcode = '55000';
  end if;

  delete from auth.users where id = uid;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
