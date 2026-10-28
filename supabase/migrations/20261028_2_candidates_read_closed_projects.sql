-- A candidate keeps seeing a project they applied to after the author closes it.
create schema if not exists private;
grant usage on schema private to authenticated;

-- security definer: reads applications without RLS, so the projects policy does not recurse into applications -> projects
create or replace function private.has_applied(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from applications where project_id = pid and candidate_id = auth.uid());
$$;

revoke execute on function private.has_applied(uuid) from public, anon;
grant execute on function private.has_applied(uuid) to authenticated;

drop policy "projects read" on public.projects;
create policy "projects read" on public.projects
  for select to authenticated
  using (status = 'open' or author_id = auth.uid() or private.has_applied(id));
