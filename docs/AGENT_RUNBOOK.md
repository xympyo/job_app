# Agent runbook

This is the operating procedure for a future Astra/Codex/AI session. Keep the requested
workflow narrow, use current records as facts, and return an actionable result.

## Before any workflow

1. Read `docs/README.md` and the workflow-specific documents it names.
2. Read `docs/10_CURRENT_STATE.md` for the latest repository/data summary.
3. Inspect the actual workspace/export. Do not treat old reports or this runbook as the
   current job list.
4. Separate employer facts, research inference and Moshe's own notes.
5. If an unresolved issue would materially change the action, identify it explicitly;
   otherwise proceed with the best supported interpretation.

## “Research new jobs”

1. Search responsibilities, not only titles, across Jakarta, Cikarang/Bekasi,
   Jabodetabek and exceptional Indonesia-wide opportunities. Use Indonesian terms where
   useful.
2. Cover Analyst/Systems, Transformation, ERP/Implementation, Process Improvement,
   Operational Excellence, PMO/Project, Corporate/Business Planning, Product/Business
   Operations, business-oriented Data Analyst and genuinely aligned graduate programs.
3. Prefer official employer careers and employer/recruiter postings, then LinkedIn,
   JobStreet, Indeed, Glints, Kalibrr, Dealls, Prosple, university portals and other
   credible sources.
4. Open the actual posting/apply destination. A search snippet is discovery evidence, not
   proof of open status. Make a second pass designed to disprove availability: expired,
   closed, dead link, removed employer page, stale aggregator or duplicate repost.
5. Deduplicate against current jobs using canonical URLs/requisition IDs first, then the
   implemented company + normalized title + compatible location signal. When uncertain,
   flag a possible duplicate rather than merging or creating a second record silently.
6. Assess eligibility, fit, CV route, Reach/Target/Safer and P0/P1/P2/DROP with reasons.
   Do not inflate facts or convert internship/freelance work into employment.
7. Return a concise report. If an import is requested, generate exactly the documented
   version-1 research JSON and recommend human preview before confirmation.
8. Do not mutate owner/application records during web research. A discovered closure may
   be reported as newer evidence while the owner job remains unchanged until authorized.

## “Triage my current unapplied jobs”

1. Load jobs, companies, sources, applications and CV records.
2. Exclude jobs with an application record and jobs already terminal/skipped from the
   default execution queue. Include them only for an explicit audit or reconciliation.
3. Recheck freshness/open status for actionable or aging roles. Treat newer, credible
   evidence as the current research finding, but do not silently overwrite owner state.
4. Apply eligibility and content-based CV routing from `TRIAGE.md` and `CV_STRATEGY.md`.
5. Rank into P0/P1/P2/DROP and return a small queue with company, role, location, status,
   deadline, CV, reason, blocker/uncertainty and next action.
6. If the user asks to persist the decisions, use the app's Export for triage / Import
   triage results contract. Match exact UUIDs, show the preview, and confirm only after
   review. That workflow updates assessment/decision fields only; it does not create
   jobs, applications, questions, events or history.

## “What should I apply to today?”

1. Use existing P0/P1 candidates and current application state; do not research a new
   market batch.
2. Remove closed/expired/withdrawn/rejected/accepted records and already-submitted work
   unless the user asks for follow-up actions.
3. Check deadlines, verification age, application effort and whether the selected CV is
   ready. Resolve only a material Apply/Skip blocker.
4. Return up to three concrete applications, ordered by action value, with a one-line
   reason and the next click/action. Say when a final posting check is still required.

## “Create a PyoLoker-compatible research import”

Use `docs/research-import.example.json` and `src/lib/import.js` as the contract. Output:

```json
{
  "version": 1,
  "research_run": { "goal": "...", "query_summary": "...", "notes": "..." },
  "jobs": [
    {
      "company": "...",
      "title": "...",
      "sources": []
    }
  ]
}
```

Company and title are required. Unknown optional fields may be omitted/null and are
normalized to defaults. Use full HTTP(S) URLs only, ISO dates/timestamps, supported
work/posting/source values, arrays of plain strings and no HTML/scripts. Use only the
documented fields; unknown keys fail strict validation. Include a fit reason whenever a
numeric fit score is present. Keep the batch below 200 jobs and 2 MB.

## “Why was this job ranked P1 instead of P0?”

Compare the same evidence under the triage dimensions: screening plausibility, substantive
fit, eligibility, freshness/deadline, location, career quality, friction, competition
and unusual evidence. State the decisive trade-off, for example “strong Analyst fit but
no verified open status and no deadline, so it is Apply this week after recheck rather
than Apply next.” Do not appeal to prestige or an unexplained score.

## Mutation rules

Research is read-only by default. Triage persistence is human-confirmed through the strict
existing-job import. Application actions are explicit user actions and must preserve the
job/CV snapshot, drafts/final answers and stage history. Coding changes require the scope
in `00_HANDOVER.md` and `AGENTS.md`; run `npm run check` and relevant tests before delivery.

## Bootstrap prompt test

The repository now contains enough policy and contracts for a new session to execute:

- “Read PyoLoker's docs and research a fresh batch of realistic jobs for me.”
- “Read PyoLoker's docs and triage my current unapplied jobs.”
- “Read PyoLoker's docs. What are the next three applications I should submit?”
- “Read PyoLoker's docs and create a PyoLoker-compatible research import.”
- “Read PyoLoker's docs and tell me why this job was ranked P1 instead of P0.”

Those prompts still require current records and, for web research, internet access. They
should not require Moshe to paste the career policy again.

