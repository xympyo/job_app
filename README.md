# Personal Career Command Center

A private workspace for Moshe Dayan: **Find → Evaluate → Apply → Progress**.
React, Vite, JavaScript, Tailwind CSS v4 and Supabase. No crawlers, background research,
automatic applications or messaging. Research happens only when manually requested.

## Start locally

Requires Node.js 22.18+ (or a compatible newer LTS) and npm.

```sh
npm ci
npm run dev
```

Open the local URL and choose **Open local workspace**. No Supabase credentials are
needed for development. Three CV records are initialized; vacancies start empty.
Data is stored in this browser for this origin. It persists across reloads and sign-out,
but is not encrypted, synchronized or shared with your phone. Export regular backups
from **Career toolkit**. Clearing browser storage removes local records.

The existing PDFs are referenced at `D:\Moshe\CV_Revised` (Master), its `Analyst`
subfolder, and its `Managerial` subfolder. All are the September 2026 versions, one page
each. They stay outside the repository and public web assets; no files are uploaded.

## What is implemented

- Responsive dashboard, Inbox, Applications, Attention and complete History.
- Manual job CRUD, reusable companies, multiple source/application links, verification.
- Explainable fit, strengths, gaps, red flags, CV recommendations and manual overrides.
- Search and filters across company/title/notes, stage, family, CV, location, source,
  fit, work mode, freshness and imminent deadlines.
- Application preparation, original vacancy/CV snapshots, flexible stages/history,
  rejection stage, offers, recruiter details, cover letters and next actions.
- Questions with independent draft/final answers and character limits.
- Assessment, interview and recruiter conversation records.
- Strict researched-job JSON import, preview, duplicate skip/source merge/keep choices,
  traceable research runs, JSON and CSV export.
- Supabase email/password session handling, route protection, owned data and RLS.
- Explicit loading, empty, validation, duplicate, connection and save-failure states.

## Connect Supabase

1. Create/select your Supabase project. Apply
   `supabase/migrations/202609140001_initial.sql` in its SQL editor, or use the Supabase
   CLI migrations workflow. The SQL is committed and repeatable on a fresh project.
   Do not rerun an already applied migration. Future schema changes need new migrations.
2. In Authentication settings, disable new user signups. Under Authentication → Users,
   create Moshe's email/password account (confirm the email as appropriate).
3. Copy `.env.example` to `.env.local`. Set `VITE_SUPABASE_URL` to the project URL and
   `VITE_SUPABASE_ANON_KEY` to its public/publishable key (legacy anon key also works).
   **Never use a service-role or secret key.** Vite public variables appear in the browser;
   RLS is what protects the database.
4. Restart the local app and sign in. Add a vacancy, refresh and verify it persists.
   CV rows initialize at first successful workspace load.
5. Set the Supabase Auth site URL to the final deployment URL and allow the development
   URL if needed. No Google OAuth, public registration or email automation is implemented.

Cloud mode never falls back to local storage on an error. Local records and cloud records
are separate; a researched-job import can move vacancies. Full JSON export preserves all
data for recovery, but there is no full-backup restore UI in V1. Preserve the exported
file before changing origins/storage or moving an established local history to cloud.

## Deploy to Vercel

This project is ready for Vercel's Vite preset: install `npm ci`, build `npm run build`,
output `dist`. `vercel.json` supplies SPA routing and security headers. Add the two
public Supabase variables in Vercel project settings **before building**, then deploy.
Use a private Git repository for this project: documentation contains personal career facts.
Do not publish this repository or the CV PDFs without Moshe's instruction.

A production build without both Supabase variables fails closed at the sign-in screen.
It does not expose a local-mode bypass. `npm run preview` therefore shows configuration
instructions when credentials are absent; use `npm run dev` for the local workspace.
The default CSP allows Supabase's standard `*.supabase.co` domain; custom Supabase
domains require updating `connect-src` in `vercel.json`.

Real hosted Auth, cross-device synchronization and deployment need Moshe's Supabase/
Vercel account connection. They are not claimed as verified until tested on that project.

## Research import

Download the JSON template in the app or use `docs/research-import.example.json`.
The template is explicitly fictional and should not be treated as a vacancy.
Contract: `{ "version": 1, "research_run": { "goal": "..." }, "jobs": [...] }`.
Company/title are required; optional unknown facts can be omitted, null or the documented
empty value. URLs must be full HTTP(S) URLs; dates use YYYY-MM-DD; verification times use
ISO 8601 with timezone. Each numeric fit score requires explanation. Recommended CV names:
Master, Analyst, Management/Product or Custom. Arrays contain plain strings. Strict schema
rejects unknown keys. Each batch is capped at 200 vacancies and 2 MB.

Preview never writes. Duplicate detection uses source/application URLs, company/requisition
IDs and normalized company/title/location. Skip is the duplicate default. Merge adds sources
only, preserving the existing vacancy and application. Within-batch duplicates are flagged;
skip or explicitly keep separate. Confirm import commits the batch atomically.

## Data and security

Eight normalized tables: `companies`, `cv_versions`, `jobs`, `job_sources`, `applications`,
`application_questions`, `application_events`, `research_runs`. All have per-user RLS.
Composite ownership foreign keys prevent cross-account references. The transactional
`apply_changes` RPC runs with caller privileges, checks a table whitelist and rejects
stale timestamps. Application vacancy snapshots and record ownership are immutable.
The frontend renders plain text, restricts external links, validates inputs and neutralizes
formula prefixes in CSV. Cloud access is enforced by PostgreSQL, not just hidden routes.

No credentials or PDFs are committed. Local browser data is intended for single-person
development/use on a trusted computer. Unknown facts are not silently enriched.

## Verification

```sh
npm run check       # lint, domain + UI tests, production build
npm run test:db     # execute migration and ownership/RLS tests in real embedded Postgres
npm audit
```

PGlite tests reproduce Supabase's auth.uid()/roles locally and run the actual migration.
They do not replace validation against a connected Supabase Auth/PostgREST service.
Browser QA artifacts and methodology: `docs/12_QA.md`, `output/playwright/`.

## Continue this project

Read every document in `docs`, especially `00_HANDOVER.md`, `02_USER_PROFILE.md`,
`09_DECISIONS.md` and `10_CURRENT_STATE.md`, before making changes. `AGENTS.md` gives
maintenance rules. Markdown candidate profile is canonical; the database has no competing
editable profile in V1. Append decisions; keep current state concise and honest.

Technical references: [Tailwind Vite setup](https://tailwindcss.com/docs/installation/using-vite),
[Supabase React/Auth](https://supabase.com/docs/guides/getting-started/tutorials/with-react),
[Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).
