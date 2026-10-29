-- Success criterion 3 (Stage 1): "Data protection: the rules block actions that are not allowed".
-- Run the whole file in Supabase -> SQL Editor. It acts as real users picked from the database,
-- tries the 6 forbidden actions from Stage 1 and 6 normal ones, and shows PASS / FAIL for each.
-- Nothing is saved: every attempt is undone right after it runs; only its outcome is kept in a
-- temporary table, shown at the end.

drop table if exists pg_temp.res;
create temp table res (n text, action text, expected text, outcome text, verdict text);
grant all on res to authenticated, anon;

-- attempt(): runs one statement as the current role, records what happened, then undoes it
--   kind 'rows'   = UPDATE/DELETE: RLS hides rows, so a blocked change shows as 0 rows changed
--   kind 'read'   = SELECT count(*): a blocked read shows as 0 rows visible
--   kind 'insert' = INSERT: a blocked insert raises an error
create or replace function pg_temp.attempt(p_n text, p_action text, p_expected text, p_kind text, p_sql text)
returns void language plpgsql as $$
declare n int; ok boolean; outcome text;
begin
  begin
    if p_kind = 'read' then execute p_sql into n; else execute p_sql; get diagnostics n = row_count; end if;
    ok := n > 0;
    outcome := case p_kind when 'read' then n || ' rows visible' when 'insert' then 'saved' else n || ' rows changed' end;
    raise exception using errcode = 'P0U01';             -- undo the attempt
  exception
    when sqlstate 'P0U01' then null;
    when others then ok := false; outcome := 'error ' || sqlstate || ': ' || left(sqlerrm, 90);
  end;
  insert into res values (p_n, p_action, p_expected, outcome,
    case when (p_expected = 'denied') <> ok then 'PASS' else 'FAIL' end);
end $$;

-- Test users, picked from the data:
--   A = author of an open project P;  B = candidate with a pending application on P, never accepted
--   by A or A by B (so B must not see A's Telegram), and A has a Telegram saved
--   C = a third user;  Q = an open project of someone else that C has not applied to
--   X, Y = author and candidate of an accepted application, X has a Telegram saved
select set_config('t.a', p.author_id::text, false), set_config('t.p', p.id::text, false),
       set_config('t.b', a.candidate_id::text, false), set_config('t.app', a.id::text, false)
from projects p join applications a on a.project_id = p.id
where p.status = 'open' and a.status in ('new', 'on_trial')
  and exists (select 1 from contacts c where c.user_id = p.author_id)
  and not exists (select 1 from applications a2 join projects p2 on p2.id = a2.project_id
                  where a2.status = 'accepted'
                    and ((p2.author_id = p.author_id and a2.candidate_id = a.candidate_id)
                      or (p2.author_id = a.candidate_id and a2.candidate_id = p.author_id)))
limit 1;
select set_config('t.c', u.id::text, false) from profiles u
where u.id not in (current_setting('t.a')::uuid, current_setting('t.b')::uuid) limit 1;
select set_config('t.q', q.id::text, false) from projects q
where q.status = 'open' and q.author_id <> current_setting('t.c')::uuid
  and not exists (select 1 from applications a where a.project_id = q.id and a.candidate_id = current_setting('t.c')::uuid)
limit 1;
select set_config('t.x', p.author_id::text, false), set_config('t.y', a.candidate_id::text, false)
from applications a join projects p on p.id = a.project_id
where a.status = 'accepted' and exists (select 1 from contacts c where c.user_id = p.author_id)
limit 1;

-- ===== the 6 forbidden actions =====

-- as B
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.b'), 'role', 'authenticated')::text, false);
set role authenticated;
select pg_temp.attempt('1', 'Edit another user''s project', 'denied', 'rows',
  $q$update projects set title = title || ' (hacked)' where id = current_setting('t.p')::uuid$q$);
select pg_temp.attempt('4', 'Read contacts before acceptance', 'denied', 'read',
  $q$select count(*) from contacts where user_id = current_setting('t.a')::uuid$q$);
reset role;

-- as A
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.a'), 'role', 'authenticated')::text, false);
set role authenticated;
select pg_temp.attempt('2', 'Apply to your own project', 'denied', 'insert',
  $q$insert into applications (project_id, candidate_id, note) values (current_setting('t.p')::uuid, auth.uid(), 'own project')$q$);
reset role;

-- as C
select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.c'), 'role', 'authenticated')::text, false);
set role authenticated;
select pg_temp.attempt('3', 'Change the status of someone else''s application', 'denied', 'rows',
  $q$update applications set status = 'accepted' where id = current_setting('t.app')::uuid$q$);
select pg_temp.attempt('5', 'Edit another user''s profile', 'denied', 'rows',
  $q$update profiles set display_name = 'Hacked' where id = current_setting('t.b')::uuid$q$);
reset role;

-- not signed in: Supabase gives an unconfirmed user no session, so such requests reach the
-- database as the anonymous role
select set_config('request.jwt.claims', '{"role": "anon"}', false);
set role anon;
select pg_temp.attempt('6b', 'Read data without a confirmed sign-in', 'denied', 'read',
  $q$select count(*) from projects$q$);
select pg_temp.attempt('6c', 'Write data without a confirmed sign-in', 'denied', 'insert',
  $q$insert into applications (project_id, candidate_id, note) values (current_setting('t.q')::uuid, gen_random_uuid(), 'anonymous')$q$);
reset role;

-- sign-up itself (the trigger on auth.users)
select pg_temp.attempt('6a', 'Sign up with a non-university e-mail', 'denied', 'insert',
  $q$insert into auth.users (id, email) values (gen_random_uuid(), 'someone@gmail.com')$q$);

-- ===== the normal actions still work =====

select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.a'), 'role', 'authenticated')::text, false);
set role authenticated;
select pg_temp.attempt('N1', 'Author edits own project', 'allowed', 'rows',
  $q$update projects set title = title where id = current_setting('t.p')::uuid$q$);
select pg_temp.attempt('N2', 'Author changes an application status on own project', 'allowed', 'rows',
  $q$update applications set status = 'on_trial' where id = current_setting('t.app')::uuid$q$);
reset role;

select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.c'), 'role', 'authenticated')::text, false);
set role authenticated;
select pg_temp.attempt('N3', 'Apply to someone else''s open project', 'allowed', 'insert',
  $q$insert into applications (project_id, candidate_id, note) values (current_setting('t.q')::uuid, auth.uid(), 'normal application')$q$);
reset role;

select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.y'), 'role', 'authenticated')::text, false);
set role authenticated;
select pg_temp.attempt('N4', 'Accepted candidate reads the author''s Telegram', 'allowed', 'read',
  $q$select count(*) from contacts where user_id = current_setting('t.x')::uuid$q$);
reset role;

select set_config('request.jwt.claims', json_build_object('sub', current_setting('t.b'), 'role', 'authenticated')::text, false);
set role authenticated;
select pg_temp.attempt('N5', 'User edits own profile', 'allowed', 'rows',
  $q$update profiles set availability = availability where id = auth.uid()$q$);
reset role;

select pg_temp.attempt('N6', 'Sign up with a university e-mail', 'allowed', 'insert',
  $q$insert into auth.users (id, email) values (gen_random_uuid(), 'test.check@astanait.edu.kz')$q$);

-- ===== result =====
select n as "#", action, expected, outcome, verdict
from res
order by (n like 'N%'), n;
