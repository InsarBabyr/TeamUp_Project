-- Stream changes of applications to signed-in clients (new applications, status changes, withdrawals).
-- Realtime applies the table's RLS, so each user only receives rows they can read.
alter publication supabase_realtime add table public.applications;
