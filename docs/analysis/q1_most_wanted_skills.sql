-- Q1. Which skills do open projects need most?
-- One row per skill: how many open projects list it (required or nice to have), and how many as required.
select s.name                                   as skill,
       count(*)                                 as projects,
       count(*) filter (where ps.is_required)   as required,
       count(*) filter (where not ps.is_required) as nice_to_have
from project_skills ps
join projects p on p.id = ps.project_id
join skills   s on s.id = ps.skill_id
where p.status = 'open'
group by s.name
order by projects desc, skill
limit 10;
