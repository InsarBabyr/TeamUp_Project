-- Q2. How do applications end, by project type?
-- Counts per status, and the share accepted among applications that already got a decision.
select p.project_type,
       count(*)                                              as applications,
       count(*) filter (where a.status = 'new')              as new,
       count(*) filter (where a.status = 'on_trial')         as on_trial,
       count(*) filter (where a.status = 'accepted')         as accepted,
       count(*) filter (where a.status = 'rejected')         as rejected,
       round(100.0 * count(*) filter (where a.status = 'accepted')
             / nullif(count(*) filter (where a.status in ('accepted', 'rejected')), 0), 1)
                                                             as accepted_pct_of_decided
from applications a
join projects p on p.id = a.project_id
group by p.project_type
order by applications desc;
