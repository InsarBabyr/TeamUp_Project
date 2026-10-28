# Notes for Claude

- Every database change goes into a new numbered file in `supabase/migrations/` (next number after the last one), **and** `supabase/schema.sql` is updated in the same commit so it always matches the live database.
- The owner runs SQL by hand in Supabase → SQL Editor; give them the SQL and verify afterwards with read-only queries.
- Logic, data and actions live in `core.js`, shared by both pages. `app.js` (desktop) and `mobile.js` (mobile) hold only the header and views; `render()` and `init()` are called from them.
- Emails (sign-up confirmation, password reset) use 6-digit codes, not links: university mail is Microsoft 365, whose Safe Links can use up one-time links.
