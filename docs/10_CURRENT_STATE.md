# Current State

Last Updated: 2026-09-14

## Current Phase
V1 implemented and locally verified. Production account connection / smoke test pending.

## Completed
- Full handover archived; canonical profile, architecture, workflows and decisions.
- React/Vite/JavaScript/Tailwind v4 app; responsive routing and explicit local persistence.
- Dashboard, Inbox, Applications, Attention, History, companies and three CV variants.
- Job/source CRUD; fit, recommendations, search/filtering, freshness and manual verification.
- Application snapshots, stages/history, outcomes, CV used, notes, next actions and contacts.
- Questions with draft/final answers/limits; assessment/interview/conversation records.
- Research import, preview/deduplication choices, research history, JSON/CSV export.
- Supabase email/password integration, protected routes, atomic RPC and owned RLS schema.
- Eight tables in SQL migration; PostgreSQL ownership/FK/rollback/history tests.
- 27 app/domain/Auth/build-security tests; 10 SQL integration groups; lint/build pass; audit clean.
- Desktop/tablet/phone checks (320–1440px); checked Axe views pass; screenshots/QA record.
- README local/Supabase/Vercel instructions. Existing CVs referenced, not uploaded/published.

## In Progress
Public Supabase settings verified; private keys removed from Vercel and local VITE names.
Frontend configuration uses an explicit public allowlist with bundle leak detection.
Vercel job-app deploys from GitHub master. Production is Ready and returns HTTP 200;
published entry assets were checked for supplied private credentials (none found).

## Next
Connect Supabase, apply migration, provision owner/disable public signups, configure public
URL/key, deploy to Vercel and smoke-test real sign-in/persistence from desktop and phone.

## Blockers
Supabase project/public configuration and Vercel access not supplied. No real cloud account
or deployment verification claimed. Local app runs at http://127.0.0.1:5173.

## Important Recent Decisions
No vacancy automation. Markdown profile is canonical. Local and cloud data are separate.
Production without Supabase fails closed. CV PDFs stay at D:\Moshe\CV_Revised; upload and
full-backup restore UI deferred. See 12_QA.md for evidence and limits.
