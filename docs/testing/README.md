# Security test: forbidden actions (success criterion 3)

Stage 1 criterion: *"Data protection: the rules block actions that are not allowed. Run a list of
6 forbidden actions … All 6 forbidden actions are denied, and the normal actions still work."*

## How to run

1. Supabase → **SQL Editor** → **New query**.
2. Paste the whole of [`forbidden_actions.sql`](forbidden_actions.sql) and press **Run**.
3. The result is a table with a **PASS / FAIL** verdict for every action.

The script picks real users from the database (an author, a candidate with a pending application,
an unrelated user, and an accepted author–candidate pair), acts as each of them the way a request
from the site does (`role authenticated` with their user id, or `role anon` when not signed in), and
**undoes every attempt right after it runs** — it changes nothing, so it is safe to run on the
defense.

## Result on 29 Oct 2026 (live database): 14 of 14 PASS

| # | Action | Expected | Outcome |
|---|---|---|---|
| 1 | Edit another user's project | denied | 0 rows changed (RLS hides the row) |
| 2 | Apply to your own project | denied | error 42501: row-level security |
| 3 | Change the status of someone else's application | denied | 0 rows changed |
| 4 | Read contacts before acceptance | denied | 0 rows visible |
| 5 | Edit another user's profile | denied | 0 rows changed |
| 6a | Sign up with a non-university e-mail | denied | error P0001: Only @astanait.edu.kz e-mail addresses are allowed |
| 6b | Read data without a confirmed sign-in | denied | 0 rows visible |
| 6c | Write data without a confirmed sign-in | denied | error 42501: row-level security |
| N1 | Author edits own project | allowed | 1 row changed |
| N2 | Author changes an application status on own project | allowed | 1 row changed |
| N3 | Apply to someone else's open project | allowed | saved |
| N4 | Accepted candidate reads the author's Telegram | allowed | 1 row visible |
| N5 | User edits own profile | allowed | 1 row changed |
| N6 | Sign up with a university e-mail | allowed | saved |

Why 6b/6c use the anonymous role: with *Confirm email* on, Supabase gives an unconfirmed user no
session, so every request they could send reaches the database exactly like an anonymous one.
