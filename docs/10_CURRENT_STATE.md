# Current State

Last Updated: 2026-09-15

## Current Phase
V1 workflow is implemented and production-accepted; the documentation operating system
is now the maintenance and research handover layer.

## Completed
- Overview has direct Add vacancy/import actions, operational counts and next steps.
- Inbox cards support Review, Save, Ready to Apply, Skip and Open source.
- Job details expose fit reasoning, CV, vacancy text, sources, date found and deadline.
- Applications preserve CV selection, applied date, flexible stages, next actions,
  separate draft/final answers, rejection stage, outcomes and original snapshots.
- Application workspaces now begin at Preparing; Ready to Apply remains a vacancy
  decision. Submitted stages require an applied date, and returning to Preparing is
  explicitly confirmed.
- Ready to Apply appears in Attention without duplicate job/application reminders.
- Research import validates, previews, supports correction and resolves duplicates.
- Eleven role families available. Owner retains Master, Analyst and Management/Product.
- Live desktop 1440x1000 and phone 390x844 scenario passed creation through submission,
  questions, HR Interview, phone editing, refresh/relogin and rejection. Import passed.
- All eight populated tables passed live isolation/anonymous checks; foreign ownership,
  stale writes and partial transactions were rejected. QA accounts/data removed.
- npm run check: 50 tests, lint and production build pass. SQL integration: 10 groups pass.
- Research import now accepts the descriptive source labels used by curated batches.
- Public production URL: https://pyoloker.vercel.app/ through Vercel.
- Authentication remains intact: verified signup, password login, resend/recovery.

## Next
Use Add vacancy or Import research, review in Jobs, then prepare and record applications.
Latest read-only owner snapshot: three CVs, 27 jobs, eight application records (seven
active: two Preparing and five Applied; one terminal Closed), with current application,
question and event counts governed by the live workspace. The dated 20-job research batch
is still a manual-review artifact and has not been imported. Keep regular exports.

## Data reconciliation note — 2026-09-15

The original bootstrap request mentioned an approximate 47-job / 11-application state,
while the latest repository-recorded read-only snapshot is 27 jobs / 8 applications.
No local data export is present to resolve that difference, so it is not treated as a
fact or used to mutate records. Before future triage, load the live/local workspace and
report its counts; separately reconcile newer closure evidence against owner posting
status and application history under `06_RESEARCH_RULES.md`.

## Accepted Limits
Custom SMTP deferred; default email limits accepted for private use. Physical phone
hardware and exhaustive browser/accessibility combinations were not tested. Private CV
uploads and full-backup restore UI remain deferred. CV files are at D:/Moshe/CV_Revised.

## Operational Notes
No scraping, automated applying or messaging. Markdown profile remains canonical.
Local mode is separate from cloud Auth. Credentials stay in ignored local private files;
frontend configuration exposes only public URL/anon key. Initial migration was applied
directly through Management API; reconcile CLI history before db push. Migration
`202609140002_application_preparing.sql` was applied through the Management API and
must not be re-run. Read current .env directly for administration; inherited tokens can
be stale.
See 12_QA.md and 13_WORKFLOW_GAP_ANALYSIS.md for evidence and scope.

## Import failure investigation — 2026-09-14
The reported production error was the pre-2417762 source enum rejecting
`University career center` and `Official recruiter posting` before preview. The exact
seven-job batch was then parsed locally and on production, reached Review 7 opportunities,
and confirmed successfully in a disposable account. Production created seven jobs, seven
sources and one research run. The current production JavaScript asset is byte-identical
to the local build from 2417762; no second code defect was found in the batch. The owner
workspace currently contains seven imported jobs and remains free of application,
question and event rows; remediation QA did not modify owner records.

## Controlled remediation — 2026-09-14

- Implemented approved audit fixes AUD-001, AUD-002, AUD-003, AUD-004, AUD-005,
  AUD-006, AUD-007, AUD-009, AUD-010, AUD-012, AUD-013, AUD-014, AUD-018, AUD-019,
  AUD-020, AUD-022 and AUD-023.
- Added the application-state migration `202609140002_application_preparing.sql`.
- Local verification: 42 Vitest tests, lint, production build and 10 PostgreSQL/RLS
  integration checks pass.
- Production schema migration applied successfully. Live acceptance completed on
  pyoloker.vercel.app after deployment job-375tw13uv-moshe-dayans-projects.vercel.app
  (Vercel production commit a5154b5537e9c2d17ca163e38b722c51f484df33).

## Controlled remediation acceptance — 2026-09-14

The complete disposable-account journey passed in production: import and preview,
Ready to Apply, preparation, missing-applied-date guardrail, Applied/HR Interview,
question validation and completion, Attention deep-link routing, explicit return to
Preparing, rejection details and History retention. Invalid imports produced
job-specific repair guidance. The same deployment was verified at 390px and 320px
without horizontal overflow. QA users and rows were deleted afterward; owner data
remained unchanged.

## Bulk triage — 2026-09-15

Implemented a versioned Export for triage / Import triage results workflow. Preview
shows decision counts and old-to-new states; confirmation updates existing jobs only.
No database migration was required because the existing atomic apply_changes RPC and
RLS ownership model are sufficient. Manual Inbox multi-select was deferred to avoid
adding mobile complexity alongside the focused triage workflow.

## Overview and Inbox routing — 2026-09-15

Overview status cards and triage shortcuts now deep-link to Inbox filters. Inbox keeps
triage, status and search parameters in the URL so refresh and browser navigation retain
the selected view. Explicit status filters can include Ready to Apply and Skipped rows;
the default Inbox remains focused on unclassified opportunities.

## Application list/date usability — 2026-09-15

The default Applications view now shows active application workspaces only; terminal
outcomes remain available through an explicit status filter and History. Selecting or
saving Applied with no date records today automatically, while later stages preserve
the existing applied date.
Applications are backed strictly by application records; Ready to Apply vacancies without
an application workspace remain in Inbox until preparation begins.

## Production application snapshot — 2026-09-15
Read-only verification found 27 jobs and 8 application records for the owner: 7 active
records (2 Preparing, 5 Applied) and 1 terminal Closed record. The default Applications
view renders 7 rows; the Closed status filter retrieves the one terminal row.
## Jobs navigation — 2026-09-15

Primary navigation is Overview, Jobs, Attention, Companies and History. Jobs combines
opportunities and application-backed records using lifecycle filters; Inbox and
Applications remain compatibility redirects.

## Live job-market research batch — 2026-09-15

Completed a read-only, multi-source research pass: approximately 82 vacancy candidates
were inspected and 20 survived final open-status verification, conservative eligibility
screening and duplicate review. The manual-review artifacts are
`output/research-report-2026-09-15.md` and `output/research-import-2026-09-15.json`.
No owner records, applications, CV files or production data were changed. One existing
BCA Digital Business Analyst source was confirmed closed; HashMicro was excluded from
the import as an existing workspace duplicate. Recheck aging listings immediately before
application because portal status can change.

## Documentation bootstrap — 2026-09-15

Added the agent entry point `docs/README.md`, `AGENT_RUNBOOK.md`, `CV_STRATEGY.md` and
`TRIAGE.md`; refactored the canonical profile and expanded the actual data/import,
research and application contracts. Root `README.md` and `AGENTS.md` now point agents to
progressive disclosure. No code, owner records, production data, applications or CV files
were changed by this milestone.

## Start Here guide — 2026-09-15

Added `/guide` with deterministic next-step guidance, four workflow cards, seven
copy-ready Astra prompts and direct links to existing research, Jobs, Attention and
History actions. It performs no mutations simply by being viewed.

## V2 planning audit — 2026-09-15

Created the planning-only package in `docs/v2/`. It covers the multi-user product
model, current architecture findings, Moshe-to-user generalisation, source-of-truth
and interchange design, portable Career Packs, task minimisation, onboarding journeys,
private-document/security strategy, `/guide` visual audit, migration/compatibility map,
failure modes, open decisions and implementation gates. Local `/guide` screenshots are
in `output/playwright/guide-audit-*.png` for the audit record. No V2 code, migrations,
owner records, CV files or production data were changed.

## V2 Gate 1 — 2026-09-16

Implemented a read-only, framework-independent Career Pack compiler in `src/v2/`.
It supports Moshe and synthetic-user fixtures, seven task types, three privacy presets,
stable Markdown/JSON output, manifests, metrics, self-containment linting and adversarial
freeform-note coverage. Full `npm run check` passes 62 tests. `npm run v2:gate1` writes non-production review samples to
`output/v2-gate1-samples/`. No database tables, migrations, Supabase writes, owner records,
CV files or production behavior changed. Gate 2 profile persistence and AI result write-back
remain unimplemented.

## V2 Gate 1 correction pass — 2026-09-16

Corrected Moshe timing to expected graduation only, with pre-graduation availability left for
employer-specific eligibility review and work authorisation unspecified. Removed duplicated task
context, made manifests derive from actual payload sections, enforced task inputs, added modular
portable policies and task-specific structured contracts for research/triage, and improved semantic
Markdown/user-text boundaries. Regenerated six review samples. No database or production behavior
changed.
