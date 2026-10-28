# TeamUp

**Find your team at AITU.** TeamUp helps Astana IT University students find teammates for a thesis, research, hackathon, startup or coursework by what people can actually do, not by who they happen to know.

An author posts a project with the skills it needs. Other students apply from their profile, the author can give a small trial task, and contacts (Telegram) open only after the author accepts the candidate.

> Prototype. All data in the database is synthetic test data.

## Features

- **University accounts only.** Registration accepts `@astanait.edu.kz` addresses, and the email is confirmed with a 6-digit code.
- **Projects.** Post a project with a type, description, required and nice-to-have skills, urgency, "beginners welcome", the number of people needed and a trial format. Close or reopen it at any time.
- **Search.** Fuzzy search by title, description and skill, plus filters by type, skills, "beginners welcome" and "urgent".
- **Applications.** Apply with a skill, your level, a link to your work and a short note. Withdraw an application while it is under review or on trial.
- **Trials.** Authors move candidates through *Under review → On trial → Accepted / Rejected* and can set a trial task with a deadline.
- **Private contacts.** A Telegram handle is visible only between an author and a candidate they accepted, enforced by the database.
- **Live notifications.** Authors see new applications and candidates see status changes without reloading, with an optional sound.
- **Profile.** Name, programme and group, Telegram, availability and skills with levels and links.
- **Password reset** with a code sent by email.
- **Two layouts.** A desktop version (`index.html`) and a mobile version (`mobile.html`). Phones are redirected to the mobile one automatically.

## Tech stack

| Part | Technology |
|---|---|
| Frontend | Plain HTML, CSS and JavaScript, no framework and no build step |
| Backend | [Supabase](https://supabase.com): PostgreSQL, Auth, Realtime |
| Security | Row Level Security (RLS) policies on every table |
| Email | Supabase Auth over Gmail SMTP |
| Bot protection | Cloudflare Turnstile (CAPTCHA) on sign-in, sign-up and emailed codes |
| Dev server | [live-server](https://www.npmjs.com/package/live-server) |

## Getting started

You need [Node.js](https://nodejs.org) (for the dev server) and Git.

```bash
git clone https://github.com/InsarBabyr/TeamUp_Project.git
cd TeamUp_Project
npm install
npm run dev
```

The site opens at `http://127.0.0.1:8080`.

- Add `?desktop` to the address to see the desktop layout on a narrow screen.
- Add `?heavy` to load the original, unoptimised images (used only to measure the image optimisation).

The app talks to the Supabase project set at the top of `app.js` and `mobile.js` (`SUPABASE_URL`, `SUPABASE_KEY`). The key is the *publishable* key, which is safe in the browser: what each user can read and write is decided by the RLS policies in the database, not by the key.

## Project structure

```
index.html        desktop page (redirects phones to mobile.html)
mobile.html       mobile page
core.js           shared by both pages: Supabase, state, sign-in, actions, data loading,
                  notifications, animations, and the views that look the same in both
app.js            desktop header and views
mobile.js         mobile header, bottom bar and views
style.css         desktop styles
mobile.css        mobile styles
assets/           logo, icons, illustrations (webp + svg), notification sound
assets/original/  unoptimised PNG originals, used only with ?heavy
supabase/schema.sql   full database schema, to restore it into a new project
supabase/migrations/  database changes, in the order they were applied
```

Both pages load `core.js` first and then their own file. Logic and data changes go into `core.js` once; `app.js` and `mobile.js` only decide how things look.

## Database

| Table | What it holds |
|---|---|
| `profiles` | Name, last name, programme and group, availability (one row per user) |
| `contacts` | Telegram handle, readable only by the owner and by the other side of an accepted application |
| `skills`, `skill_categories` | The skill catalogue |
| `programs` | AITU study programmes for the group field |
| `user_skills` | A user's skills with level, link to work and a note |
| `projects` | Posted projects |
| `project_skills` | Required and nice-to-have skills of a project |
| `applications` | Applications with status `new`, `on_trial`, `accepted` or `rejected` |

Rules enforced by the database, not only by the page:

- Only `@astanait.edu.kz` addresses can register (trigger `enforce_university_email` on `auth.users`).
- You cannot apply to your own project or to a closed one, and only once per project.
- Only the project author can change an application's status. Its project and candidate cannot be changed (trigger `lock_application_fields`).
- At most 10 new projects per user per day (trigger `limit_projects_per_day`).
- Applying is one transaction (function `apply_to_project`): the skill, contact, availability and application are saved together or not at all.

### Schema and migrations

- **`supabase/schema.sql`** is the full current database: tables, constraints, functions, triggers, RLS policies, Realtime and the catalogue data (skill categories, skills, study programmes). No user data. To restore the database into a new, empty Supabase project, run this file alone in **SQL Editor**, then set up the dashboard settings listed below.
- **`supabase/migrations/`** is the history of changes made after the initial setup, numbered in the order they were applied. `schema.sql` already includes them. Run a *new* migration in **SQL Editor** on the live project, and update `schema.sql` to match.

`.gitignore` ignores `*.sql` files (database dumps can contain test data) except the migrations folder.

## Supabase settings the app relies on

These live in the Supabase dashboard, not in the code:

- **Authentication → Sign In / Providers → Email:** *Confirm email* is on.
- **Authentication → Emails → SMTP Settings:** custom SMTP (Gmail with an app password). Without it Supabase only emails the project's own team members.
- **Authentication → Emails → Templates:** *Confirm signup* and *Reset Password* contain `{{ .Token }}` (a code, not a link). University mail runs on Microsoft 365, whose Safe Links opens links in emails first and can use up a one-time link before the student clicks it.
- **Realtime:** the `applications` table is in the `supabase_realtime` publication (migration 4).
- **Authentication → Attack Protection → CAPTCHA:** Cloudflare Turnstile with its secret key. The matching public site key is `TURNSTILE_SITEKEY` at the top of `core.js`; both must be set together, or every sign-in fails. The Turnstile widget's hostnames must include every address the site is opened from (for example `localhost`).
