# TeamUp

**Find your team at AITU.** TeamUp helps Astana IT University students find teammates for a thesis, research, hackathon, startup or coursework by what people can actually do, not by who they happen to know.

An author posts a project with the skills it needs. Other students apply from their profile, the author can give a small trial task, and contacts (Telegram) open only after the author accepts the candidate.

> Prototype. All data in the database is synthetic test data.

## Features

- **University accounts only.** Registration accepts `@astanait.edu.kz` addresses, and the email is confirmed with a 6-digit code.
- **Projects.** Post a project with a type, description, required and nice-to-have skills, urgency, "beginners welcome", the number of people needed and a trial format. Edit everything about it after publishing (title, description, skills, terms), mark it **Team assembled** when the team is complete (everyone who applied is notified), or close or reopen it at any time.
- **Materials.** Up to 5 links (GitHub, Figma, Google Docs…) and 3 files (PDF, images, Word, PowerPoint, 3 MB each; photos are compressed in the browser) per project, shown on the project page to everyone who can see the project. Files live in a private Storage bucket and are downloaded through links that expire after an hour.
- **Search.** Fuzzy search by title, description and skill, plus filters by type, skills, "beginners welcome" and "urgent", plus "Fits me" (you have a required skill) and "Hide applied".
- **Fits you.** Skills from your profile are marked on every project, cards say how many of the required skills you have, and Find shows the best match first (or the newest, if you switch).
- **Applications.** Apply with a skill, your level, a link to your work and a short note. Withdraw an application while it is under review or on trial.
- **Trials.** Authors move candidates through *Under review → On trial → Accepted / Rejected* and can set a trial task with a deadline.
- **Private contacts.** A Telegram handle is visible only between an author and a candidate they accepted, enforced by the database.
- **Live notifications.** Authors see new applications and candidates see status changes without reloading, with an optional sound (switched on or off in the notifications panel).
- **Profile.** Name, programme and group, Telegram, availability and skills with levels and links. **Delete my account** removes the account and everything linked to it.
- **Password reset** with a code sent by email.
- **How-to guide on the home page.** An animated walkthrough with four tabs (create a project, fill in your profile, apply, pick your team): a mock screen shows each step while the explanation is highlighted next to it. Built in HTML/CSS, so it is sharp on any screen, follows the dark theme and weighs a few KB. It plays only while on screen, pauses on hover or focus, steps can be clicked, and with *reduce motion* it does not play by itself.
- **Privacy notice** (`privacy.html`): what the site stores, who can see it, which services process it and how to delete an account. Linked from the footer and the sign-up form.
- **Two layouts.** A desktop version (`index.html`) and a mobile version (`mobile.html`). Phones are redirected to the mobile one automatically.

## Tech stack

| Part | Technology |
|---|---|
| Frontend | Plain HTML, CSS and JavaScript, no framework and no build step |
| Backend | [Supabase](https://supabase.com): PostgreSQL, Auth, Realtime |
| Security | Row Level Security (RLS) policies on every table |
| Email | Supabase Auth over [Resend](https://resend.com) SMTP, sent from `no-reply@teamupaitu.com` |
| Files | Supabase Storage (private bucket `project-files`) |
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
privacy.html      privacy notice (static page)
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
| `notifications` | The bell: new applications, status changes, withdrawals and assembled teams, written by triggers |

Rules enforced by the database, not only by the page:

- Only `@astanait.edu.kz` addresses can register (trigger `enforce_university_email` on `auth.users`).
- You cannot apply to your own project or to a closed one, and only once per project.
- Only the project author can change an application's status. Its project and candidate cannot be changed (trigger `lock_application_fields`).
- At most 10 new projects and 20 applications per user per day (triggers `limit_projects_per_day`, `limit_applications_per_day`).
- A user can delete only their own account (function `delete_my_account`, migration 10); everything linked to it goes with it through `on delete cascade`. Project files are removed first through the Storage API, and the function refuses while any are left.
- Applying is one transaction (function `apply_to_project`): the skill, contact, availability and application are saved together or not at all.

### Schema and migrations

- **`supabase/schema.sql`** is the full current database: tables, constraints, functions, triggers, RLS policies, Realtime and the catalogue data (skill categories, skills, study programmes). No user data. To restore the database into a new, empty Supabase project, run this file alone in **SQL Editor**, then set up the dashboard settings listed below.
- **`supabase/migrations/`** is the history of changes made after the initial setup, numbered in the order they were applied. `schema.sql` already includes them. Run a *new* migration in **SQL Editor** on the live project, and update `schema.sql` to match.

`.gitignore` ignores `*.sql` files (database dumps can contain test data) except the migrations folder.

## Supabase settings the app relies on

These live in the Supabase dashboard, not in the code:

- **Authentication → Sign In / Providers → Email:** *Confirm email* is on.
- **Authentication → Emails → SMTP Settings:** custom SMTP through Resend (`smtp.resend.com`, port 465, user `resend`, a Resend API key with sending access as the password), sender `no-reply@teamupaitu.com`. Without custom SMTP Supabase only emails the project's own team members.
- **Domain `teamupaitu.com`** (registered at Namecheap, DNS on Cloudflare) exists only for email. Its DNS holds the Resend records (`send`, `rsend`, `resend._domainkey` for SPF and DKIM) and a DMARC record (`_dmarc`). University mail runs on Microsoft 365, which held back codes sent from a Gmail address; mail signed for our own domain reaches the inbox.
- **Authentication → Emails → Templates:** *Confirm signup* and *Reset Password* contain `{{ .Token }}` (a code, not a link). University mail runs on Microsoft 365, whose Safe Links opens links in emails first and can use up a one-time link before the student clicks it.
- **Realtime:** the `notifications` table is in the `supabase_realtime` publication (migration 5).
- **Storage:** the `project-files` bucket (3 MB per file, documents and images only) and its policies are created by migration 8; the free plan has 1 GB. Usage: **Storage → Usage**.
- **Authentication → Attack Protection → CAPTCHA:** Cloudflare Turnstile with its secret key. The matching public site key is `TURNSTILE_SITEKEY` at the top of `core.js`; both must be set together, or every sign-in fails. The Turnstile widget's hostnames must include every address the site is opened from (for example `localhost`).
