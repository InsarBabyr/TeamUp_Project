-- Q3. In which skill areas do projects need more people than students offer?
-- Per skill category: open projects that REQUIRE a skill from it, and students who list a skill from it.
with demand as (
  select c.id, count(distinct ps.project_id) as projects_needing
  from project_skills ps
  join projects p          on p.id = ps.project_id
  join skills s            on s.id = ps.skill_id
  join skill_categories c  on c.id = s.category_id
  where p.status = 'open' and ps.is_required
  group by c.id
), supply as (
  select c.id, count(distinct us.user_id) as students_with
  from user_skills us
  join skills s            on s.id = us.skill_id
  join skill_categories c  on c.id = s.category_id
  group by c.id
)
select c.name                            as category,
       coalesce(d.projects_needing, 0)   as projects_needing,
       coalesce(s.students_with, 0)      as students_with,
       round(coalesce(s.students_with, 0)::numeric / nullif(d.projects_needing, 0), 2) as students_per_project
from skill_categories c
left join demand d on d.id = c.id
left join supply s on s.id = c.id
order by c.sort_order;
