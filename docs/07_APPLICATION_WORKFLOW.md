# Application workflow

Discovery states: Found, Reviewing, Saved, Ready to Apply, Skipped, Expired, Closed.
Preparing an application creates a durable vacancy snapshot and optional CV selection.
Stages: Ready to Apply, Applied, Assessment / OA, HR Interview, User / Hiring Manager
Interview, Technical / Case Interview, Final Interview, Offer, Withdrawn, Rejected,
Expired, Closed, Offer Declined, Offer Accepted. Any transition is permitted; companies
need not follow every stage. Applied date is recorded when first explicitly marked Applied
and may be manually corrected. Stage changes have timestamped history.

Rejection stage: CV screening, initial application, online assessment, HR interview,
hiring manager interview, technical interview, case study, final interview, unknown.
Record reasons and offer details without needlessly sensitive data. Keep historical rows.

Questions are first class: text, type, required flag, character limit, draft answer,
final answer, reasoning notes, status, timestamps. Types are modest, not a rigid ontology.
Completed required questions require a final answer. Enforce character limit; drafts can
be over limit while being edited but completion cannot. Final answer never auto-copies draft.

Events cover assessments, interviews and recruiter interactions (no automation). Track
schedule, status and notes. Attention includes due dates, next actions, scheduled events
and unfinished questions. Ready to Apply vacancies/applications also appear once in
Attention until submitted or moved out of that state. User explicitly applies on the
external company website.

## First use
From Overview, Add vacancy opens the form directly; Import research opens validation
and preview. Inbox cards support Review, Save, Ready to Apply, Skip and Open source.
Ready opportunities move to Applications; Prepare application creates the historical
snapshot. Update records CV used, applied date, stage and next action. Add question
keeps working and submitted answers separate. History retains every outcome.

Live desktop/phone acceptance on 2026-09-14 covered this sequence through HR Interview,
phone next-action editing, sign-out/sign-in and rejection at HR interview. Import was
corrected before confirmation and skipped a duplicate. Offer/withdrawal persistence was
also verified through the same domain/repository commands against production Supabase.
