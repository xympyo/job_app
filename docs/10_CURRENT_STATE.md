# Current State

Last Updated: 2026-09-14

## Current Phase
First usable career workflow implemented and verified against production Supabase.

## Completed
- Overview has direct Add vacancy/import actions, operational counts and next steps.
- Inbox cards support Review, Save, Ready to Apply, Skip and Open source.
- Job details expose fit reasoning, CV, vacancy text, sources, date found and deadline.
- Applications preserve CV selection, applied date, flexible stages, next actions,
  separate draft/final answers, rejection stage, outcomes and original snapshots.
- Ready to Apply appears in Attention without duplicate job/application reminders.
- Research import validates, previews, supports correction and resolves duplicates.
- Eleven role families available. Owner retains Master, Analyst and Management/Product.
- Live desktop 1440x1000 and phone 390x844 scenario passed creation through submission,
  questions, HR Interview, phone editing, refresh/relogin and rejection. Import passed.
- All eight populated tables passed live isolation/anonymous checks; foreign ownership,
  stale writes and partial transactions were rejected. QA accounts/data removed.
- npm run check: 38 tests, lint and production build pass. SQL integration: 10 groups pass.
- Research import now accepts the descriptive source labels used by curated batches.
- GitHub master deploys to https://job-app-nine-lake.vercel.app through Vercel.
- Authentication remains intact: verified signup, password login, resend/recovery.

## Next
Use Add vacancy or Import research, review in Inbox, then prepare and record applications.
Owner workspace is clean: three CV rows and zero rows in the seven other domain tables.
Keep regular exports. No remaining blocker for this milestone.

## Accepted Limits
Custom SMTP deferred; default email limits accepted for private use. Physical phone
hardware and exhaustive browser/accessibility combinations were not tested. Private CV
uploads and full-backup restore UI remain deferred. CV files are at D:/Moshe/CV_Revised.

## Operational Notes
No scraping, automated applying or messaging. Markdown profile remains canonical.
Local mode is separate from cloud Auth. Credentials stay in ignored local private files;
frontend configuration exposes only public URL/anon key. Initial migration was applied
directly through Management API; reconcile CLI history before db push. No new migration
was needed. Read current .env directly for administration; inherited tokens can be stale.
See 12_QA.md and 13_WORKFLOW_GAP_ANALYSIS.md for evidence and scope.

## Import failure investigation — 2026-09-14
The reported production error was the pre-2417762 source enum rejecting
`University career center` and `Official recruiter posting` before preview. The exact
seven-job batch was then parsed locally and on production, reached Review 7 opportunities,
and confirmed successfully in a disposable account. Production created seven jobs, seven
sources and one research run. The current production JavaScript asset is byte-identical
to the local build from 2417762; no second code defect was found in the batch. The owner
workspace remains empty except for three CV rows after QA cleanup.
