-- At most 20 applications per candidate per day, checked by the database
-- (the page has its own rate limit, but that one can be bypassed by calling the API directly).
create or replace function public.limit_applications_per_day()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (select count(*) from applications
      where candidate_id = new.candidate_id
        and created_at > now() - interval '1 day') >= 20 then
    raise exception 'Daily application limit reached (20). Try again tomorrow.';
  end if;
  return new;
end $$;
revoke execute on function public.limit_applications_per_day() from public, anon, authenticated;

create trigger applications_daily_limit
  before insert on public.applications
  for each row execute function public.limit_applications_per_day();
