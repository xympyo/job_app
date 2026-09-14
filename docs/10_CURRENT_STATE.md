# Current State

Last Updated: 2026-09-14

## Current Phase
First usable career workflow acceptance in progress. Core job/application features already
exist; practical entry/review/attention gaps identified in 13_WORKFLOW_GAP_ANALYSIS.md.

## Completed
- React/Vite/JavaScript/Tailwind app and canonical career documentation.
- Dashboard, Inbox, Applications, Attention, History, companies and three CV variants.
- Manual job/source CRUD, explainable fit, CV selection, search/filtering and verification.
- Application snapshots, stage history/outcomes, draft/final questions and interview records.
- Research import with preview/deduplication and JSON/CSV exports.
- Initial SQL migration applied to production through Management API on 2026-09-14.
- All eight tables have RLS; atomic RPC and ownership-aware foreign keys are active.
- Verified email signup enabled; Auth site URL is https://job-app-nine-lake.vercel.app.
- Auth requires 12-character passwords and one-hour confirmation links. New accounts load an empty workspace.
- Owner account provisioned; login stored only in ignored private/Your Career Workspace Login.txt.
- Owner workspace has three CV entries, zero vacancies and no QA records/accounts.
- Vercel production deploys from GitHub master; only public URL/anon key configured there.
- Private configuration excluded from frontend; build rejects configured private-key leaks.
- 27 automated app/security tests and production lint/build pass; 10 local SQL checks pass.
- Live Auth/RPC persistence, second-user isolation, anonymous denial and stale-write rejection pass.
- Hosted browser phone edit persists in a separate session; sign-out clears protected view.
- Desktop 1440px and phone 390px screenshots reviewed; no checked overflow or console errors.
- Signup and verification routes are live on the canonical Vercel domain; the former Vercel alias now serves directly as well.

## In Progress
Dashboard create/import entry, card review actions, date-found context and Ready to Apply
attention items; then full live desktop/phone application workflow verification.

## Next
Sign in and add real opportunities manually or through research import. Keep regular exports.

## Blockers
None for this milestone. Custom SMTP is explicitly deferred; existing mail limits are accepted.

## Important Recent Decisions
No vacancy automation. Markdown profile is canonical. Local and cloud data are separate.
CV PDFs remain outside the repository at D:\Moshe\CV_Revised; private uploads and full-backup
restore UI are deferred. Migration 202609140001 was applied directly; do not rerun it or use
an un-reconciled CLI db push. Future database edits require new migrations.
Local administration must read the current .env directly: inherited process variables can
contain older tokens and override Vite loadEnv. See 12_QA.md for verification boundaries.
