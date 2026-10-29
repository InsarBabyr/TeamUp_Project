-- C++ in the skill catalogue: requirement R6 is checked by filtering projects by "Python" and "C++".
insert into public.skills (name, category_id)
select 'C++', id from public.skill_categories where name = 'Software Development'
on conflict (name) do nothing;

-- Most wanted skills: how many open projects need each skill (analysis question 1,
-- shown on the Find page). security_invoker keeps the projects RLS in force for the reader.
create view public.skill_demand with (security_invoker = true) as
select s.name as skill,
       count(*) as projects,
       count(*) filter (where ps.is_required) as required
from public.project_skills ps
join public.projects p on p.id = ps.project_id
join public.skills s on s.id = ps.skill_id
where p.status = 'open'
group by s.name;

revoke all on public.skill_demand from anon;
grant select on public.skill_demand to authenticated;
