# UX workflows

Desktop uses a calm sidebar, scannable list and selected detail. Mobile uses cards and
separate detail navigation; primary destinations are Jobs and Attention.
Dashboard counts are actionable: review queue, preparation, active applications, due items.

1. Add a company/title/source manually, optionally fill detailed research and fit.
2. Jobs → inspect fit, gaps, freshness, deadline and CV → save, skip or ready.
3. Prepare application → questions, CV, cover letter, next action → explicitly mark Applied.
4. Record any stage; preserve stage history. Rejection also records where it occurred.
5. Capture assessments/interviews with scheduled time, notes and completion status.
6. Import JSON → validate → preview → resolve each duplicate (skip, merge sources or keep)
   → explicitly confirm. Research import never submits an application.
7. Export full portable JSON or job/application/question CSVs.

All mutable analysis is editable. Unknown dates remain unknown. Empty states offer the
next useful action. Failed saves remain visible and keep form input. Destructive deletion
requires confirmation; applied jobs cannot be deleted. Safe links open separately.
Use semantic controls, labels, keyboard focus, accessible dialogs, 44px tap targets,
readable contrast, and no injected HTML. Draft and submitted answers are visually distinct.
# Bulk triage workflow

From Research, use **Export for triage** to download active jobs with stable `job_id`
values. Give that file to ChatGPT and receive a version 1 `triage-results.json` file.
Use **Import triage results**, review the old and new decision for every existing job,
then confirm once. The importer updates existing jobs only and never creates jobs or
changes applications, questions, events or history.

## Navigation mental model

Jobs is the vacancy browser and lifecycle workspace. It shows opportunities from review
through application while the underlying job and application records remain separate.
Attention contains actionable reminders. History is the historical record. Overview cards
link directly to relevant Jobs or Attention views; triage shortcuts open Jobs with a
URL-backed decision filter selected.
## Jobs workspace

Overview shortcuts open `/jobs` with URL-backed lifecycle or triage filters. Jobs shows
unapplied opportunities and application-backed records together; an application status
is the primary lifecycle label once a workspace exists. `/inbox` redirects to Jobs and
`/applications` redirects to Jobs with active application filtering for old bookmarks.


## Start Here guide

`/guide` is the human-facing Help/Playbook for Find → Evaluate → Apply → Progress. It
derives one recommended next step from current workspace state and links to the existing
Jobs, Research, Attention and History actions. When outside help is useful, it refers to
the user's AI in provider-neutral language; AI remains optional.

## First-run and guidance rules

`/guide` is Help/Playbook for Find → Evaluate → Apply → Progress. Home provides a
Getting Started checklist for genuinely new accounts and one recommended next action.
The checklist is based on canonical profile, job, review and application state, collapses
when complete, and can be reopened from Help. Contextual explanations clarify that Ready
to Apply is a decision, Preparing is an unsent workspace, and Applied means the user
submitted externally. PyoLoker can prepare context for the user's AI, but AI is optional
and provider-neutral.

The pure guidance engine prioritizes dated operational work, active application blockers,
Ready-to-Apply preparation, unreviewed opportunities, missing profile setup, and finding
the first opportunity. It does not create state or infer facts. Tutorial seen/dismissed
flags are scoped to the authenticated user in browser storage and survive an ordinary
logout/login on the same browser. Logout clears only in-memory/session state; a different
user loads a separate namespaced state. These flags are convenience state rather than
workflow truth.
