-- Trigger functions are not meant to be called through the API (/rest/v1/rpc/...).
revoke execute on function public.enforce_university_email() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable()          from public, anon, authenticated;
revoke execute on function public.lock_application_fields()  from public, anon, authenticated;
revoke execute on function public.limit_projects_per_day()   from public, anon, authenticated;

-- Pin search_path so a table of the same name in another schema cannot be swapped in.
alter function public.lock_application_fields() set search_path = public;
alter function public.limit_projects_per_day()  set search_path = public;
