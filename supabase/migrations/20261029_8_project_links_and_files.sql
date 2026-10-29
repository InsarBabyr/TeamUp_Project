-- Links and attached files on a project.

-- Links: up to 5 {label, url} pairs, http(s) only
create or replace function private.valid_links(l jsonb)
returns boolean
language sql
immutable
set search_path = public
as $$
  select jsonb_typeof(l) = 'array'
     and jsonb_array_length(l) <= 5
     and not exists (
       select 1 from jsonb_array_elements(l) e
       where jsonb_typeof(e) <> 'object'
          or coalesce(e->>'url', '') !~* '^https?://[^\s]+$'
          or char_length(e->>'url') > 300
          or char_length(coalesce(e->>'label', '')) > 40
     );
$$;
grant execute on function private.valid_links(jsonb) to authenticated;

alter table public.projects add column links jsonb not null default '[]'::jsonb
  constraint projects_links_check check (private.valid_links(links));

-- Files: a private bucket, 3 MB per file, documents and images only.
-- Stored as <project id>/<file name>; the limits are enforced by Storage itself.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-files', 'project-files', false, 3145728, array[
  'application/pdf',
  'image/png', 'image/jpeg', 'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
]);

-- Anyone who can see the project (projects RLS applies inside the check) can read its files
create policy "project files read" on storage.objects for select to authenticated using (
  bucket_id = 'project-files'
  and exists (select 1 from public.projects p where p.id::text = (storage.foldername(name))[1])
);

-- security definer: counts a project's files without going through the objects policies,
-- which would otherwise refer back to themselves (infinite recursion)
create or replace function private.project_file_count(folder text)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*) from storage.objects
  where bucket_id = 'project-files' and (storage.foldername(name))[1] = folder;
$$;
revoke execute on function private.project_file_count(text) from public, anon;
grant execute on function private.project_file_count(text) to authenticated;

-- Only the author uploads, at most 3 files per project
create policy "project files upload" on storage.objects for insert to authenticated with check (
  bucket_id = 'project-files'
  and exists (select 1 from public.projects p where p.id::text = (storage.foldername(name))[1] and p.author_id = auth.uid())
  and private.project_file_count((storage.foldername(name))[1]) < 3
);

-- Only the author deletes
create policy "project files delete" on storage.objects for delete to authenticated using (
  bucket_id = 'project-files'
  and exists (select 1 from public.projects p where p.id::text = (storage.foldername(name))[1] and p.author_id = auth.uid())
);
