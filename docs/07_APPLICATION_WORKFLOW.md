# Application workflow

PyoLoker separates vacancy review from application execution. Moshe applies on the
employer's external site; PyoLoker records what happened and helps carry the work forward.

## Opportunity review states

Jobs use `review_status`:

- `Found` — discovered, not yet evaluated.
- `Reviewing` — currently being evaluated or has a material unresolved question.
- `Saved` — kept in the shortlist for later.
- `Ready to Apply` — Moshe decided the opportunity is worth applying to; this does not
  mean an application was submitted or even prepared.
- `Skipped` — intentionally not pursuing; retained for history.
- `Expired` / `Closed` — the tracked opportunity is no longer actionable.

Card quick actions update this job decision without creating an application.

## Application stages

Creating an application workspace captures the current job, company, sources and selected
CV as immutable snapshots, then starts at `Preparing`. Stages are:

`Preparing`, `Applied`, `Assessment / OA`, `HR Interview`, `User / Hiring Manager Interview`,
`Technical / Case Interview`, `Final Interview`, `Offer`, `Withdrawn`, `Rejected`,
`Expired`, `Closed`, `Offer Declined`, `Offer Accepted`.

The application table allows one record per job in V1. Transitions are flexible because
real hiring processes vary, but every stage after Preparing requires `applied_at`. Moving
from a submitted/later stage back to Preparing requires explicit confirmation and clears
the applied date. If Applied is selected without a date, the app uses today's local date;
an existing or manually entered date is preserved thereafter.

`Applied` means submitted externally. `Preparing` means not submitted. A vacancy's
`Closed`/`Expired` posting state is not the same as an application's `Closed`/`Expired`
outcome, and neither is the same as `Rejected` or `Skipped`.

## History and outcomes

Each stage change appends `{status, at}` to `stage_history`. Rejection records a stage:
CV screening, initial application, online assessment, HR interview, hiring manager
interview, technical interview, case study, final interview or unknown, plus optional
reason/feedback. Offer details, recruiter notes and next actions are stored on the
application. Terminal outcomes remain in History and are not deleted through the cloud
mutation path.

The original `job_snapshot` never changes when the live vacancy is edited or its source
disappears. Changing the selected CV records a new CV snapshot. This is why historical
applications can be interpreted accurately later.

## Questions and events

Application questions store question text/type, employer-required flag, character limit,
independent draft answer, independent final/submitted answer, reasoning notes and
Draft/Ready/Completed status. A required Completed question needs a final answer; a
non-Draft final answer must fit the character limit. The final answer is never silently
copied from a draft.

Application events cover assessments, interviews and recruiter contacts. They store kind,
title, scheduled timestamp, Planned/Completed/Cancelled status and notes. They are manual
records; PyoLoker does not send messages or schedule external actions.

## Attention and queues

Attention is derived from current records: deadlines, Ready to Apply decisions, next
actions, planned events and unfinished questions. Terminal records and skipped/closed/
expired opportunities are excluded. Open the linked job/application workspace and use
the reason to decide the next action. Applications defaults to records with application
workspaces; History is the durable record of terminal and past activity.

## Practical sequence

`Review → Save or Ready to Apply → Prepare application → record questions/answers and
next action → submit externally → mark Applied → record assessments/interviews/outcome`.

Do not require a cover letter unless the employer asks or there is a strong strategic
reason. Preserve drafts, final answers, snapshots and stage history. Export a backup
before material migration or changing between local and cloud workspaces.
