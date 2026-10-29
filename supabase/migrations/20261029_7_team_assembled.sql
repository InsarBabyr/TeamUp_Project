-- "Team assembled": a project can end as assembled (a success) as well as closed.
-- Like a closed project it leaves Find; everyone who applied to it gets a notification.

alter table public.projects drop constraint projects_status_check;
alter table public.projects add constraint projects_status_check check (status in ('open', 'closed', 'assembled'));

alter table public.notifications drop constraint notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind in ('new_application', 'status', 'withdrawn', 'assembled'));

-- security definer: writes notifications for other users, which RLS would not allow the author to do
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
revoke execute on function private.notify_assembled() from public, anon, authenticated;

create trigger projects_notify_assembled
  after update of status on public.projects
  for each row execute function private.notify_assembled();
