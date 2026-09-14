# UX workflows

Desktop uses a calm sidebar, scannable list and selected detail. Mobile uses cards and
separate detail navigation; primary destinations are Inbox, Applications and Attention.
Dashboard counts are actionable: review queue, preparation, active applications, due items.

1. Add a company/title/source manually, optionally fill detailed research and fit.
2. Inbox → inspect fit, gaps, freshness, deadline and CV → save, skip or ready.
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
