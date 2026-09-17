# Job research, verification and reconciliation

Research is manually requested and performed outside PyoLoker. There is no autonomous
scraping, crawler, scheduled agent, auto-apply or recruiter messaging. Research produces
evidence and optionally a reviewed import; it does not silently mutate owner/application
state.

## Search scope

Prioritize Jakarta, Cikarang/Bekasi and Jabodetabek, then exceptional Indonesia-wide
roles. Search responsibilities and role families, not just titles: Business/IT/Systems
Analysis, ERP/implementation/functional consulting, Technology Consulting, Digital
Transformation, Process Improvement, Operational Excellence, Continuous Improvement,
Business Process, PMO/Project Analysis, Corporate/Business Planning, Product/Business
Operations, business-oriented Data Analyst and aligned graduate/management programs.
Use Indonesian terms where useful.

## Source hierarchy

Prefer official employer careers, then official employer/recruiter postings, then major
platforms such as LinkedIn, JobStreet, Indeed, Glints, Kalibrr, Dealls and Prosple,
university portals and other credible indexed sources. A search-result snippet is a lead,
not proof of open status.

For each actionable role, open the actual posting or application destination. On a second
pass actively try to disprove availability: deadline passed, no longer accepting, dead
link, removed employer page, stale aggregator, misleading employment status or duplicate
repost. Record the URL and verification timestamp when known. Missing facts remain null,
blank or Unknown.

## One vacancy, many sources

The same requisition on an employer site, LinkedIn and JobStreet is one `jobs` record with
multiple `job_sources`. The importer currently uses these deterministic signals:

1. canonical source/application URL after removing hash and common tracking parameters;
2. same company plus matching external/requisition ID; or
3. same normalized company, sorted token-normalized title and compatible non-empty location.

Company display normalization removes a leading PT/CV for presentation, but the stored
legal name is preserved. The current matcher is intentionally conservative and exact for
title/location tokens; close variants can be missed or need manual review. Do not claim
semantic deduplication that the code does not implement. If uncertain, flag the match and
let the user choose skip, merge sources or keep separate.

## Vacancy status and freshness

These are separate concepts:

- `posting_status`: employer vacancy finding — Unknown, Verified open, Possibly open,
  Closed or Expired.
- `last_verified_at`: when the evidence was checked.
- freshness: derived from verification age — Unverified when no timestamp, Fresh through
  7 days, Recent through 14, Aging through 30, Possibly stale after that; explicit Closed,
  Expired or a passed deadline takes precedence.
- `review_status`: Moshe's decision about the opportunity — Found, Reviewing, Saved,
  Ready to Apply, Skipped, Expired or Closed.
- application status: Moshe's submission/progress history, independent of vacancy status.

“Closed” in posting status means the vacancy is no longer available; an application
record's Closed means the tracked application/workspace is closed. A source's
`verified_at` is source-level evidence; a job's `last_verified_at` is the job-level
displayed verification. Neither keeps a vacancy open forever.

## Reconciliation policy

When new research finds a previously “Verified open” owner job closed, preserve both facts:
the newer dated research evidence says Closed, while the owner job may still say Verified
open until manual confirmation or an explicitly authorized update. Newer credible evidence
wins for the agent's recommendation; it does not silently overwrite owner state. Report
the conflict, link the evidence and request/perform the explicit reconciliation the user
chooses. Never rewrite an application snapshot because a live source disappeared.

Do not confuse a closed vacancy with rejected, withdrawn or skipped application state.
An owner may have applied before a vacancy closed; that historical application remains
queryable and its snapshot remains unchanged.

## Import rules

The only supported research artifact is version 1 in `docs/research-import.example.json`,
validated by `src/lib/import.js`. It is strict, bounded and previewed before commit. See
`04_DATABASE.md` for fields, limits and duplicate choices. Import creates/updates only
the selected research-run, company, job and source records; it does not apply, message,
or change application state. Triage has a separate existing-job-only contract.
