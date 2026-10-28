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

revoke execute on function public.apply_to_project(uuid, int, text, text, text, text, text) from public, anon;
grant execute on function public.apply_to_project(uuid, int, text, text, text, text, text) to authenticated;
