-- TeamUp database schema: the full current state of the Supabase project, for restoring it
-- into a new, empty Supabase project. It already includes everything in migrations/, so run
-- this file on its own (SQL Editor → New query → Run), not together with the migrations.
--
-- Not in this file (they live in the dashboard): Auth settings, SMTP and email templates.
-- See "Supabase settings the app relies on" in README.md.
-- Exported 2026-10-28.

begin;

create schema if not exists private;
grant usage on schema private to authenticated;

-- ============================================================
-- Tables
-- ============================================================

create table public.programs (
  code text primary key check (code ~ '^[A-Za-z]{2,5}$'),
  name text not null unique,
  area text not null
);

create table public.skill_categories (
  id         integer generated always as identity primary key,
  name       text not null unique,
  sort_order integer not null
);

create table public.skills (
  id          integer generated always as identity primary key,
  name        text not null unique,
  category_id integer not null references public.skill_categories(id)
);

create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  study_group  text,  -- no longer used by the app; replaced by program_code + group_number
  availability text not null default 'this_week' check (availability in ('today', 'this_week', 'later')),
  created_at   timestamptz not null default now(),
  last_name    text constraint profiles_last_name_len check (last_name is null or char_length(last_name) between 1 and 60),
  program_code text references public.programs(code),
  group_number text constraint profiles_group_number_format check (group_number is null or group_number ~ '^[0-9]{4}$'),
  constraint profiles_group_complete check ((program_code is null) = (group_number is null))
);

create table public.contacts (
  user_id  uuid primary key references public.profiles(id) on delete cascade,
  telegram text not null check (telegram ~ '^@[A-Za-z0-9_]{5,32}$')
);

create table public.user_skills (
  user_id       uuid not null references public.profiles(id) on delete cascade,
  skill_id      integer not null references public.skills(id),
  level         text not null check (level in ('learning', 'study_tasks', 'real_project')),
  link_url      text check (link_url is null or link_url ~* '^https?://'),
  evidence_note text,
  primary key (user_id, skill_id)
);

create table public.projects (
  id                uuid primary key default gen_random_uuid(),
  author_id         uuid not null references public.profiles(id) on delete cascade,
  title             text not null check (char_length(title) between 3 and 120),
  project_type      text not null check (project_type in ('thesis', 'research', 'hackathon', 'startup', 'coursework')),
  description       text,
  urgent            boolean not null default false,
  beginner_friendly boolean not null default false,
  spots_needed      integer not null default 1 check (spots_needed between 1 and 10),
  status            text not null default 'open' check (status in ('open', 'closed')),
  created_at        timestamptz not null default now(),
  trial_format      text not null default 'Quick chat' check (trial_format in ('No trial', 'Quick chat', 'Small task')),
  trial_task        text check (trial_task is null or char_length(trial_task) <= 300),
  trial_due         date
);

create table public.project_skills (
  project_id  uuid not null references public.projects(id) on delete cascade,
  skill_id    integer not null references public.skills(id),
  is_required boolean not null default true,
  primary key (project_id, skill_id)
);

create table public.applications (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  note         text,
  status       text not null default 'new' check (status in ('new', 'on_trial', 'accepted', 'rejected')),
  created_at   timestamptz not null default now(),
  unique (project_id, candidate_id)
);

create table public.notifications (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  kind          text not null check (kind in ('new_application', 'status', 'withdrawn')),
  project_id    uuid references public.projects(id) on delete cascade,
  project_title text,
  actor_name    text,
  status        text,
  read_at       timestamptz,
  created_at    timestamptz not null default now()
);
create index notifications_user_created on public.notifications (user_id, created_at desc);

-- ============================================================
-- Functions
-- ============================================================

-- Only university addresses can register (trigger on auth.users)
create or replace function public.enforce_university_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is null or new.email !~* '^[^@]+@astanait\.edu\.kz$' then
    raise exception 'Only @astanait.edu.kz e-mail addresses are allowed';
  end if;
  return new;
end $$;

-- At most 10 new projects per author per day
create or replace function public.limit_projects_per_day()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (select count(*) from projects
      where author_id = new.author_id
        and created_at > now() - interval '1 day') >= 10 then
    raise exception 'Daily project limit reached';
  end if;
  return new;
end $$;

-- An application cannot be moved to another project or candidate
create or replace function public.lock_application_fields()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.project_id <> old.project_id or new.candidate_id <> old.candidate_id then
    raise exception 'project_id and candidate_id cannot be changed';
  end if;
  return new;
end $$;

-- Apply to a project in one transaction: skill, contact, availability and the application
-- are saved together or not at all. SECURITY INVOKER keeps every RLS policy in force.
create or replace function public.apply_to_project(
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

-- security definer: writes a notification for another user, which RLS would not allow the caller to do
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

-- Turns on RLS for every new table in public (event trigger below)
create or replace function public.rls_auto_enable()
returns event_trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  cmd record;
  tbl name;
begin
  for cmd in
    select *
    from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      and object_type in ('table', 'partitioned table')
  loop
    if cmd.schema_name is not null and cmd.schema_name in ('public') then
      begin
        select c.relname into tbl from pg_catalog.pg_class c where c.oid = cmd.objid;
        execute format('alter table if exists %I.%I enable row level security', cmd.schema_name, tbl);
        raise log 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      exception
        when others then
          raise log 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      end;
    else
      raise log 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
    end if;
  end loop;
end;
$$;

-- Trigger functions are not meant to be called through the API (/rest/v1/rpc/...)
revoke execute on function public.enforce_university_email() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable()          from public, anon, authenticated;
revoke execute on function public.lock_application_fields()  from public, anon, authenticated;
revoke execute on function public.limit_projects_per_day()   from public, anon, authenticated;
revoke execute on function private.notify_application()      from public, anon, authenticated;
revoke execute on function public.apply_to_project(uuid, int, text, text, text, text, text) from public, anon;
grant  execute on function public.apply_to_project(uuid, int, text, text, text, text, text) to authenticated;
revoke execute on function private.has_applied(uuid) from public, anon;
grant  execute on function private.has_applied(uuid) to authenticated;

-- ============================================================
-- Triggers
-- ============================================================

create trigger university_email_only
  before insert on auth.users
  for each row execute function public.enforce_university_email();

create trigger projects_daily_limit
  before insert on public.projects
  for each row execute function public.limit_projects_per_day();

create trigger lock_application_fields
  before update on public.applications
  for each row execute function public.lock_application_fields();

create trigger applications_notify
  after insert or update of status or delete on public.applications
  for each row execute function private.notify_application();

create event trigger ensure_rls
  on ddl_command_end
  when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  execute function public.rls_auto_enable();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.programs         enable row level security;
alter table public.skill_categories enable row level security;
alter table public.skills           enable row level security;
alter table public.profiles         enable row level security;
alter table public.contacts         enable row level security;
alter table public.user_skills      enable row level security;
alter table public.projects         enable row level security;
alter table public.project_skills   enable row level security;
alter table public.applications     enable row level security;
alter table public.notifications    enable row level security;

-- Catalogues: readable by every signed-in user
create policy "programs read"         on public.programs         for select to authenticated using (true);
create policy "skill_categories read" on public.skill_categories for select to authenticated using (true);
create policy "skills read"           on public.skills           for select to authenticated using (true);

-- Profiles: everyone signed in can read, each user writes only their own
create policy "profiles read"   on public.profiles for select to authenticated using (true);
create policy "profiles insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Contacts: your own, plus the other side of an accepted application
create policy "contacts own" on public.contacts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "contacts after acceptance" on public.contacts for select to authenticated using (
  exists (
    select 1 from applications a join projects p on p.id = a.project_id
    where a.status = 'accepted'
      and ((a.candidate_id = auth.uid() and p.author_id = contacts.user_id)
        or (p.author_id = auth.uid() and a.candidate_id = contacts.user_id))
  )
);

-- User skills: everyone signed in can read, each user writes only their own
create policy "user_skills read"  on public.user_skills for select to authenticated using (true);
create policy "user_skills write" on public.user_skills for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Projects: open ones, your own, and ones you applied to (even after they close)
create policy "projects read" on public.projects for select to authenticated
  using (status = 'open' or author_id = auth.uid() or private.has_applied(id));
create policy "projects insert" on public.projects for insert to authenticated with check (author_id = auth.uid());
create policy "projects update" on public.projects for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "projects delete" on public.projects for delete to authenticated using (author_id = auth.uid());

-- Project skills: everyone signed in can read, only the project author writes
create policy "project_skills read" on public.project_skills for select to authenticated using (true);
create policy "project_skills write" on public.project_skills for all to authenticated
  using (exists (select 1 from projects p where p.id = project_skills.project_id and p.author_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = project_skills.project_id and p.author_id = auth.uid()));

-- Applications: the candidate and the project author see them; only to open projects of others;
-- only the author changes the status; only the candidate withdraws
create policy "applications read" on public.applications for select to authenticated using (
  candidate_id = auth.uid()
  or exists (select 1 from projects p where p.id = applications.project_id and p.author_id = auth.uid())
);
create policy "applications insert" on public.applications for insert to authenticated with check (
  candidate_id = auth.uid()
  and exists (select 1 from projects p where p.id = applications.project_id and p.status = 'open' and p.author_id <> auth.uid())
);
create policy "applications update by author" on public.applications for update to authenticated
  using (exists (select 1 from projects p where p.id = applications.project_id and p.author_id = auth.uid()))
  with check (exists (select 1 from projects p where p.id = applications.project_id and p.author_id = auth.uid()));
create policy "applications withdraw" on public.applications for delete to authenticated using (candidate_id = auth.uid());

-- Notifications: read your own and mark them read; rows come only from the trigger
create policy "notifications read own" on public.notifications for select to authenticated using (user_id = auth.uid());
create policy "notifications mark read" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke insert, update, delete on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

-- ============================================================
-- Realtime
-- ============================================================

alter publication supabase_realtime add table public.notifications;

-- ============================================================
-- Catalogue data (not user data)
-- ============================================================

insert into public.skill_categories (id, name, sort_order) overriding system value values
  (1, 'Software Development', 1),
  (2, 'Databases & DevOps', 2),
  (3, 'Data Science & AI', 3),
  (4, 'Design & Media', 4),
  (5, 'Cybersecurity & Networks', 5),
  (6, 'GameDev & Hardware', 6),
  (7, 'Business & Management', 7),
  (8, 'Research & Academic', 8),
  (9, 'Web3 & Blockchain', 9);

insert into public.skills (id, name, category_id) overriding system value values
  (1, 'Python', 1),
  (2, 'SQL', 2),
  (3, 'Figma', 4),
  (4, 'React', 1),
  (5, 'JavaScript', 1),
  (6, 'Business Analysis', 7),
  (7, 'Power BI / Tableau', 3),
  (8, 'Excel', 3),
  (9, 'User Research', 4),
  (10, 'Surveys / Questionnaire Design', 8),
  (11, 'SPSS', 3),
  (12, 'Graphic Design', 4),
  (13, 'Java', 1),
  (14, 'Data Analysis', 3),
  (15, 'Docker', 2),
  (16, 'HTML/CSS', 1),
  (18, 'TypeScript', 1),
  (20, 'Vue', 1),
  (21, 'Next.js', 1),
  (22, 'Tailwind CSS', 1),
  (23, 'Node.js', 1),
  (26, 'C#', 1),
  (27, 'Go', 1),
  (28, 'PHP', 1),
  (29, 'REST API', 1),
  (30, 'GraphQL', 1),
  (31, 'Flutter', 1),
  (32, 'React Native', 1),
  (33, 'Android (Kotlin)', 1),
  (34, 'iOS (Swift)', 1),
  (35, 'Software Architecture', 1),
  (36, 'Algorithms', 1),
  (37, 'Unit Testing', 1),
  (38, 'QA', 1),
  (40, 'PostgreSQL', 2),
  (41, 'MySQL', 2),
  (42, 'MongoDB', 2),
  (43, 'Firebase / Supabase', 2),
  (44, 'Git/GitHub', 2),
  (46, 'Kubernetes', 2),
  (47, 'CI/CD', 2),
  (48, 'Linux', 2),
  (49, 'AWS / Google Cloud', 2),
  (53, 'Pandas', 3),
  (55, 'Machine Learning', 3),
  (56, 'Deep Learning', 3),
  (57, 'NLP', 3),
  (58, 'Computer Vision', 3),
  (59, 'PyTorch / TensorFlow', 3),
  (60, 'Prompt Engineering', 3),
  (62, 'UI/UX Design', 4),
  (65, 'Adobe Photoshop / Illustrator', 4),
  (66, '3D Modelling', 4),
  (67, 'Video Editing', 4),
  (68, 'Motion Design', 4),
  (69, 'Copywriting', 4),
  (70, 'SMM', 4),
  (71, 'Presentation Design', 4),
  (72, 'Penetration Testing', 5),
  (73, 'Web Security', 5),
  (74, 'Cryptography', 5),
  (75, 'Ethical Hacking', 5),
  (76, 'Computer Networks', 5),
  (77, 'Cisco Networking', 5),
  (78, 'IoT Sensors', 5),
  (79, 'Unity', 6),
  (80, 'Unreal Engine', 6),
  (81, 'Game Design', 6),
  (82, 'AR/VR Development', 6),
  (83, 'Arduino / Raspberry Pi', 6),
  (84, 'Embedded Systems', 6),
  (85, 'Circuit Design', 6),
  (86, 'Robotics', 6),
  (87, 'Project Management', 7),
  (88, 'Product Management', 7),
  (90, 'Startup Pitching', 7),
  (91, 'Financial Modelling', 7),
  (92, 'Digital Marketing', 7),
  (93, 'Market Research', 7),
  (94, 'Academic Writing', 8),
  (95, 'Literature Review', 8),
  (97, 'Data Collection', 8),
  (98, 'LaTeX', 8),
  (99, 'Quantitative Research', 8),
  (100, 'Qualitative Research', 8),
  (101, 'Mathematical Modelling', 8),
  (102, 'Blockchain Basics', 9),
  (103, 'Smart Contracts (Solidity)', 9),
  (104, 'Web3 Development', 9);

-- continue the id counters after the inserted rows
select setval(pg_get_serial_sequence('public.skill_categories', 'id'), (select max(id) from public.skill_categories));
select setval(pg_get_serial_sequence('public.skills', 'id'), (select max(id) from public.skills));

insert into public.programs (code, name, area) values
  ('CSB', 'Cybersecurity', 'Cybersecurity'),
  ('SST', 'Smart Security Technologies', 'Cybersecurity'),
  ('DTNP', 'Digital Tech in Nuclear', 'Engineering & IoT'),
  ('EE', 'Electronic Engineering', 'Engineering & IoT'),
  ('IIoT', 'Industrial IoT', 'Engineering & IoT'),
  ('ST', 'Smart Technologies', 'Engineering & IoT'),
  ('BDA', 'Big Data Analysis', 'Information Technologies'),
  ('CS', 'Computer Science', 'Information Technologies'),
  ('MCS', 'Math & Comp. Science', 'Information Technologies'),
  ('MT', 'Media Technologies', 'Information Technologies'),
  ('SE', 'Software Engineering', 'Information Technologies'),
  ('BDH', 'Big Data in Healthcare', 'Interdisciplinary'),
  ('DJ', 'Digital Journalism', 'Interdisciplinary'),
  ('AIB', 'AI Business', 'Management & Business'),
  ('DPA', 'Digital Public Admin', 'Management & Business'),
  ('ITE', 'IT Entrepreneurship', 'Management & Business'),
  ('ITM', 'IT Management', 'Management & Business');

commit;
