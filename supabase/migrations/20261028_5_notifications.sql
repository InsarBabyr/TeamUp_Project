-- Notification history for the bell in the header.
-- Rows are written only by the triggers below; users can read their own and mark them read.

create table public.notifications (
  id             bigint generated always as identity primary key,
  user_id        uuid not null references auth.users(id) on delete cascade,
  kind           text not null check (kind in ('new_application', 'status', 'withdrawn')),
  project_id     uuid references public.projects(id) on delete cascade,
  project_title  text,
  actor_name     text,
  status         text,
  read_at        timestamptz,
  created_at     timestamptz not null default now()
);
create index notifications_user_created on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;
create policy "notifications read own" on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy "notifications mark read" on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- clients may only change read_at; inserts come from the triggers
revoke insert, update, delete on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

-- security definer: writes a row for another user, which RLS would not allow the caller to do
create or replace function private.notify_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  a      applications;
  p      projects;
  who    text;
  target uuid;
  k      text;
begin
  a := case when tg_op = 'DELETE' then old else new end;
  select * into p from projects where id = a.project_id;
  if not found then
    return null;  -- the project itself is being deleted
  end if;

  if tg_op = 'INSERT' then
    target := p.author_id; k := 'new_application';
  elsif tg_op = 'UPDATE' then
    if new.status is not distinct from old.status then return null; end if;
    target := a.candidate_id; k := 'status';
  else
    if auth.uid() is distinct from old.candidate_id then return null; end if;  -- only a withdrawal by the candidate
    target := p.author_id; k := 'withdrawn';
  end if;

  select trim(display_name || ' ' || coalesce(last_name, '')) into who from profiles where id = a.candidate_id;

  insert into notifications (user_id, kind, project_id, project_title, actor_name, status)
  values (target, k, p.id, p.title, who, a.status);

  -- keep 60 days of history
  delete from notifications where user_id = target and created_at < now() - interval '60 days';
  return null;
end;
$$;
revoke execute on function private.notify_application() from public, anon, authenticated;

create trigger applications_notify
  after insert or update of status or delete on public.applications
  for each row execute function private.notify_application();

-- live updates now come from notifications; applications no longer needs to be streamed
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime drop table public.applications;
