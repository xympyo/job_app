# Product Audit

Audit date: 2026-09-14. Scope: production `https://pyoloker.vercel.app/`, source, migrations, and documented workflows. No product code or schema changes were made for this audit.

The production alias was verified serving the current import-capable bundle (`index-BHDA4wNa.js`) from the deployment recorded during the import investigation. The realistic seven-job research batch had already passed production preview and confirm on a disposable account. The owner session was restored after one accidental application creation during inspection; the exact row was removed and the owner had no application, event, or question rows afterward.

## Executive Summary

There are no confirmed P0 security or data-loss defects. Row-level ownership controls, composite owner foreign keys, safe external-link handling, untrusted text rendering, optimistic concurrency checks, and CSV formula escaping are strong foundations.

The most important problems are process clarity and state integrity. The Attention page routes every item to History, application stages can describe impossible sequences, and a vacancy can display `Verified open` while simultaneously displaying `Unverified`. Import validation is technically correct but still exposes raw schema paths for malformed batches. These defects make a tired user unsure what to do and make the stored record easier to contradict.

Counts below are findings, not proposed fixes: **0 P0, 4 P1, 12 P2, 7 P3**.

## P0 Findings

None confirmed.

## P1 Findings

### AUD-001 — Attention links active work to the wrong destination

- **Severity:** P1
- **Category:** UX / Process
- **Screen/area:** Attention
- **Exact problem:** Every attention item links to `/history/:job_id`, including deadlines, next actions, planned interviews, unfinished questions, and Ready to Apply work. Active application work therefore opens a historical view instead of the action context.
- **Evidence:** `src/App.jsx` constructs the Attention link with `to={\`/history/${item.job_id}\`}` for every item; `attentionItems()` emits several active item types in `src/lib/domain.js`.
- **Reproduction steps:** Create or open an application with a next action or unfinished question; open Attention; select the item; observe that the destination is History rather than Applications/Application workspace.
- **User impact:** A user can believe an item is only historical, miss the required action, and spend extra clicks finding the application.
- **Recommended fix:** Route each item type to the smallest useful action surface, or provide an explicit “Open application” destination while retaining history access.
- **Effort:** Small
- **Confidence:** Confirmed

### AUD-002 — Application stages and dates permit contradictory records

- **Severity:** P1
- **Category:** Data Integrity / Process
- **Screen/area:** Application update
- **Exact problem:** The UI and database allow `Rejected`, `Offer`, interviews, or other later stages before `Applied`; `applied_at` is independently editable and is not cleared when a user moves away from Applied. Stage history records every arbitrary transition.
- **Evidence:** `ApplicationForm` exposes all `STAGES` for every application. `saveApplication()` accepts any transition and independently persists `applied_at`. The migration has no stage-order or `applied_at` consistency check; the only rejection check requires a rejection stage.
- **Reproduction steps:** Prepare an application; set stage to `Rejected` or `HR Interview` without setting Applied; save. Alternatively set an applied date, change the stage back to Ready to Apply, and save.
- **User impact:** History, dashboard counts, reporting, and personal recollection can disagree. A tired user can accidentally create a record that says both “not applied” and “Applied [date]”.
- **Recommended fix:** Define permitted transition guardrails and make date/stage changes explicit, with a clear escape hatch for exceptional records.
- **Effort:** Medium
- **Confidence:** Confirmed

### AUD-003 — Posting status and freshness contradict one another

- **Severity:** P1
- **Category:** UX / Data Integrity
- **Screen/area:** Inbox cards and job detail
- **Exact problem:** Imported jobs with `posting_status: "Verified open"` but no `last_verified_at` display `Unverified` on cards and detail while also displaying `Verified open` in the posting-status control.
- **Evidence:** Production research jobs visibly showed `Verified open` in detail, `Last verified: Not yet verified`, and `Unverified` badges in both list and detail. `freshness()` returns `Unverified` whenever `last_verified_at` is empty, regardless of `posting_status`.
- **Reproduction steps:** Import a job with `posting_status` set to Verified open and omit `last_verified_at`; open Inbox and the job detail.
- **User impact:** The user cannot tell whether the role was verified, when it was verified, or whether the two labels mean different things. This is especially risky when deciding whether to apply before a deadline.
- **Recommended fix:** Separate “employer posting state” from “our verification freshness” with explanatory labels and consistent display semantics.
- **Effort:** Medium
- **Confidence:** Confirmed

### AUD-004 — Import errors expose implementation paths instead of repair guidance

- **Severity:** P1
- **Category:** UX / Process
- **Screen/area:** Research import validation
- **Exact problem:** Schema failures are shown as raw Zod paths such as `jobs.4.sources.0.source_type: Invalid option...`. The message identifies an internal array index and enum, but not the company/title, accepted correction, or whether the rest of the batch is safe to retry.
- **Evidence:** `src/pages/Research.jsx` calls `errorMessage(e)` directly for parse/preview errors. The previous production failure displayed exactly this class of message.
- **Reproduction steps:** Paste a realistic batch with one unsupported nested source label, malformed URL, or invalid enum; choose Validate & preview.
- **User impact:** A normal user must understand schema internals or ask ChatGPT to rewrite the entire batch. Large imports become fragile and error-prone.
- **Recommended fix:** Map validation issues to job number plus company/title and provide a plain-language accepted value and correction hint, while preserving technical details for diagnostics.
- **Effort:** Medium
- **Confidence:** Confirmed

## P2 Findings

### AUD-005 — Inbox presents duplicate Add vacancy actions

- **Severity:** P2
- **Category:** UX
- **Screen/area:** Empty Inbox
- **Exact problem:** Empty Inbox has a header `Add vacancy` button and a second `Add your first vacancy` button for the same action.
- **Evidence:** Production empty-state DOM contained both actions.
- **Reproduction steps:** Use an account with no jobs; open Inbox.
- **User impact:** Adds visual noise and makes the empty state feel like a campaign rather than a single obvious next step.
- **Recommended fix:** Keep one primary action and use the other space to explain Import research or the distinction between manual entry and import.
- **Effort:** Small
- **Confidence:** Confirmed

### AUD-006 — Ready to Apply is duplicated across job review and application concepts

- **Severity:** P2
- **Category:** UX / Process
- **Screen/area:** Inbox, Applications, Dashboard
- **Exact problem:** A job can have review status `Ready to Apply`, then create an application whose initial stage is also `Ready to Apply`; the same phrase appears as a quick action, a filter value, a dashboard metric, and an application stage.
- **Evidence:** `filterJobs()` moves Ready to Apply jobs into Applications even without an application; `createApplication()` initializes the application to the same status.
- **Reproduction steps:** Click Ready to Apply on a job; inspect Applications before and after Prepare application.
- **User impact:** It is unclear whether the user has made a decision, created a tracking record, or is ready to submit externally.
- **Recommended fix:** Distinguish shortlist decision from application workspace state in language and transitions.
- **Effort:** Medium
- **Confidence:** Confirmed

### AUD-007 — Assessment, employer facts, and user notes are not separated strongly enough

- **Severity:** P2
- **Category:** UX / Process
- **Screen/area:** Job detail
- **Exact problem:** Fit score, “What aligns”, “Gaps to consider”, research notes, requirements, and source evidence are shown on one long page. The fit section is labelled, but the page does not consistently identify which statements are employer facts, research inference, or Moshe’s own notes.
- **Evidence:** Production detail interleaved the research fit assessment with vacancy facts and source notes; `Your notes` appears much later.
- **Reproduction steps:** Open an imported role and read from top to bottom without prior product knowledge.
- **User impact:** A user can repeat an inferred fit claim as if the employer stated it, or overlook a factual requirement beneath persuasive analysis.
- **Recommended fix:** Use explicit Fact / Research assessment / Your notes groupings and show the decision recommendation earlier.
- **Effort:** Medium
- **Confidence:** Strong evidence

### AUD-008 — Duplicate matching is brittle for realistic role variants

- **Severity:** P2
- **Category:** Data Integrity
- **Screen/area:** Research import duplicate preview
- **Exact problem:** Duplicate detection compares exact normalized title token sets and exact normalized locations. `Business Analyst` vs `IT Business Analyst`, different location punctuation, and reposts with changed titles can be missed; genuinely different roles with token permutations can be overmatched.
- **Evidence:** `normalizeTitle()` sorts tokens and `findDuplicates()` uses exact title/location comparisons. No employer posting identifier or semantic similarity is used.
- **Reproduction steps:** Preview batches containing the role/location variants above and inspect duplicate decisions.
- **User impact:** Duplicate records make the shortlist noisy; false merges can destroy source separation or hide genuinely different openings.
- **Recommended fix:** Add conservative, explainable signals such as canonical URL/external ID and explicit similarity bands before any merge is offered.
- **Effort:** Medium
- **Confidence:** Confirmed

### AUD-009 — Question validation fails at save time with little inline guidance

- **Severity:** P2
- **Category:** UX / Accessibility
- **Screen/area:** Application questions
- **Exact problem:** Required Completed questions without a final answer and final answers over a character limit are allowed in the form until the save reaches schema/database validation. Draft over-limit behavior is intentionally allowed, but the UI does not explain this distinction before submission.
- **Evidence:** `QuestionForm` has no inline requirement/limit checks; constraints live in `questionSchema` and the migration.
- **Reproduction steps:** Add a required question, set status Completed with no final answer; or set a limit and enter an over-limit final answer; save.
- **User impact:** The user loses time, sees a generic save error, and may not know whether the draft or final answer is the offending field.
- **Recommended fix:** Show live final-answer limit and required-state feedback before submit, while keeping drafts flexible.
- **Effort:** Small
- **Confidence:** Confirmed

### AUD-010 — Research preview is difficult to audit at batch size

- **Severity:** P2
- **Category:** UX / Process
- **Screen/area:** Research import preview
- **Exact problem:** A seven-job preview shows repeated long fit paragraphs and hides the complete payload behind per-row `<details>`. There is no compact batch summary of invalid/duplicate/new counts or a clear “all new jobs will import” explanation.
- **Evidence:** `Research.jsx` renders one full row per job and only duplicate rows receive a decision selector; confirm has one global action.
- **Reproduction steps:** Preview the realistic seven-job payload, then imagine 20–30 rows on a phone.
- **User impact:** Review becomes slow and omission-prone; a user can confirm a batch without noticing one questionable row.
- **Recommended fix:** Add a compact summary and a deliberate row-level review mode for large batches.
- **Effort:** Medium
- **Confidence:** Strong evidence

### AUD-011 — Source provenance is normalized without retaining the original descriptive label

- **Severity:** P2
- **Category:** Data Integrity / Documentation
- **Screen/area:** Research import and Sources & evidence
- **Exact problem:** `University career center` and `Official recruiter posting` are mapped to canonical enum values. The source name and URL remain, but the original source-type wording is not retained, reducing auditability of the research artifact.
- **Evidence:** `normalizeSourceType()` maps descriptive labels before strict parsing; the database stores only the canonical enum.
- **Reproduction steps:** Import a batch containing descriptive source types; inspect the saved source row.
- **User impact:** Later review cannot distinguish the researcher’s original classification from the application’s normalized classification.
- **Recommended fix:** Preserve original label as optional provenance metadata if auditability becomes important.
- **Effort:** Medium
- **Confidence:** Confirmed

### AUD-012 — Dashboard zero counts read as “00” and do not always produce a next action

- **Severity:** P2
- **Category:** UX
- **Screen/area:** Overview
- **Exact problem:** Empty dashboard statistic cards visibly render `00`. Empty “Your next steps” and “Recently updated” areas provide little guidance after the initial welcome panel.
- **Evidence:** Production first-login dashboard showed four `00` cards and empty panels.
- **Reproduction steps:** Sign in with a new account and inspect Overview at desktop width.
- **User impact:** Zero can look like a formatting bug, and the page loses usefulness once the welcome panel is understood.
- **Recommended fix:** Render a single readable zero and make every empty panel point to one concrete action or disappear.
- **Effort:** Small
- **Confidence:** Confirmed

### AUD-013 — Company display can repeat legal-prefix text

- **Severity:** P2
- **Category:** UX / Data Quality
- **Screen/area:** Inbox cards
- **Exact problem:** Production list text showed `PT PT. Mowilex`: the company mark renders `PT` and the company name begins with `PT.`.
- **Evidence:** Live accessibility tree for the imported Mowilex role contained `PT PT. Mowilex`.
- **Reproduction steps:** Import or open a company whose legal name starts with `PT.`; inspect the card.
- **User impact:** The repeated prefix looks like corrupted data and makes scanning company names harder.
- **Recommended fix:** Normalize display-only legal prefixes without changing the stored legal name.
- **Effort:** Small
- **Confidence:** Confirmed

### AUD-014 — Delete affordances do not reflect cloud deletion policy

- **Severity:** P2
- **Category:** UX / Data Integrity
- **Screen/area:** Job detail and library
- **Exact problem:** Job/CV deletion is exposed through UI actions, but cloud policy intentionally rejects deletion of records with application history and revokes application/research-run deletes. The user may only discover the policy after an error.
- **Evidence:** `deleteRow()` gives a helpful local error for jobs with applications, while the migration revokes deletes for `applications` and `research_runs`; there is no matching capability explanation near all delete affordances.
- **Reproduction steps:** Attempt to delete a vacancy with application history or a protected cloud record.
- **User impact:** The action looks available but fails late, encouraging retries and uncertainty about whether data was removed.
- **Recommended fix:** Label archive/deactivate behavior before presenting a destructive control.
- **Effort:** Small
- **Confidence:** Strong evidence

### AUD-015 — Attention, Applications, and History overlap without a clear mental model

- **Severity:** P2
- **Category:** UX / Information Architecture
- **Screen/area:** Navigation
- **Exact problem:** Overview, Inbox, Applications, Attention, and History all expose overlapping slices of the same job/application records; the distinction is not explained in navigation labels.
- **Evidence:** Ready jobs appear under Applications before an application exists; active attention links to History; History retains all outcomes.
- **Reproduction steps:** Move a job from Found to Ready to Apply, create an application, add a next action, and follow the same record through each destination.
- **User impact:** The user can reasonably ask which page is the source of truth and where an action should be performed.
- **Recommended fix:** Reduce destinations or add concise purpose statements and context-aware links.
- **Effort:** Large
- **Confidence:** Strong evidence

### AUD-016 — Full workspace is loaded into memory and filtered with repeated linear scans

- **Severity:** P2
- **Category:** Performance / Architecture
- **Screen/area:** Repository and workspace lists
- **Exact problem:** Cloud load fetches all eight tables, while `filterJobs()` repeatedly scans companies, sources, and applications for each job. This is reasonable for small personal data but has no visible scale guardrail for 200+ jobs and dozens of application records.
- **Evidence:** `createCloudRepository.load()` loads every table; `filterJobs()` performs per-job `.find()`/`.filter()` calls.
- **Reproduction steps:** Populate 200 jobs with sources and applications, then search/filter on a phone or low-power laptop.
- **User impact:** Search and navigation may become sluggish as the workspace grows.
- **Recommended fix:** Measure with realistic volumes first; then add indexed selectors or server-side pagination only if the measured threshold is meaningful.
- **Effort:** Medium
- **Confidence:** Suspected

## P3 Findings

### AUD-017 — Date found is hidden in an initially closed advanced section

- **Severity:** P3
- **Category:** UX
- **Screen/area:** Add/edit vacancy
- **Exact problem:** Date found and publication details are inside a closed `<details>` section when adding a vacancy.
- **Evidence:** `JobForm` renders the section closed for new records.
- **Reproduction steps:** Open Add vacancy and inspect the initial form.
- **User impact:** Users may omit useful freshness context even though it affects later evaluation.
- **Recommended fix:** Keep the default form focused, but explain why the advanced section matters when freshness is important.
- **Effort:** Small
- **Confidence:** Confirmed

### AUD-018 — Status vocabulary is compact but unexplained

- **Severity:** P3
- **Category:** UX
- **Screen/area:** Inbox filters and detail
- **Exact problem:** Terms such as Found, Reviewing, Saved, Ready to Apply, Possibly open, and Unverified require product memory; the UI offers no inline definitions.
- **Evidence:** Status selects expose the enum directly and cards show short badges only.
- **Reproduction steps:** Open a fresh account and use Inbox filters without reading documentation.
- **User impact:** Users can choose a status inconsistently or mistake freshness for employer availability.
- **Recommended fix:** Add short descriptions or tooltips where a term first appears.
- **Effort:** Small
- **Confidence:** Strong evidence

### AUD-019 — Large detail pages make the primary decision compete with research prose

- **Severity:** P3
- **Category:** UX
- **Screen/area:** Job detail
- **Exact problem:** The “Should I apply?” decision is represented by fit score and prose, but source, requirements, notes, and empty sections require substantial scrolling.
- **Evidence:** Live detail view presents fit, multiple lists, metadata, role sections, sources, and notes in one column.
- **Reproduction steps:** Open an imported role on a 390px-wide viewport and find the first point where Apply/Save can be decided.
- **User impact:** A tired user may read persuasive assessment before checking a hard requirement or deadline.
- **Recommended fix:** Keep a compact decision summary sticky or above the long factual sections.
- **Effort:** Medium
- **Confidence:** Strong evidence

### AUD-020 — Empty decorative panels consume scarce first-use space

- **Severity:** P3
- **Category:** Removal Candidate / UX
- **Screen/area:** Empty Inbox and dashboard
- **Exact problem:** Decorative copy such as “A considered next step.” adds atmosphere but no action or explanation in an empty workspace.
- **Evidence:** Empty Inbox rendered a decorative panel below the primary empty state; dashboard includes non-actionable empty panels.
- **Reproduction steps:** Open Inbox and Overview with no user records.
- **User impact:** The app feels more editorial than operational and pushes useful guidance lower.
- **Recommended fix:** Remove or replace with one concrete instruction.
- **Effort:** Small
- **Confidence:** Confirmed

### AUD-021 — Mobile navigation is compact but hides five destinations behind More/menu behavior

- **Severity:** P3
- **Category:** Accessibility / Mobile UX
- **Screen/area:** Mobile navigation
- **Exact problem:** The fixed bottom bar exposes only a subset of destinations; Research, Companies, and Career Toolkit require the menu/sidebar path.
- **Evidence:** CSS defines a four-item mobile bottom navigation and a separate mobile menu/sidebar.
- **Reproduction steps:** Use a 390px viewport and attempt to reach Research or Career Toolkit from a job detail screen.
- **User impact:** Resource pages are less discoverable on the primary phone surface.
- **Recommended fix:** Keep the bar focused, but make the More affordance explicit and preserve current route context when the menu closes.
- **Effort:** Small
- **Confidence:** Strong evidence

### AUD-022 — Automated accessibility coverage is not part of the shipped QA gate

- **Severity:** P3
- **Category:** Accessibility / Process
- **Screen/area:** QA process
- **Exact problem:** `axe-core` is installed, but the documented QA run records manual browser checks and console checks rather than an automated accessibility result.
- **Evidence:** `package.json` includes axe-core; `docs/12_QA.md` reports no exhaustive accessibility coverage.
- **Reproduction steps:** Run the documented QA gate and inspect whether an accessibility scan is produced.
- **User impact:** Regressions in labels, focus, contrast, and modal semantics can pass the normal check unnoticed.
- **Recommended fix:** Add a repeatable scan to QA when the product stabilizes; do not treat it as a substitute for manual review.
- **Effort:** Small
- **Confidence:** Confirmed

### AUD-023 — Mobile review needs more direct evidence at the narrowest target width

- **Severity:** P3
- **Category:** Mobile UX / QA
- **Screen/area:** 320px layouts
- **Exact problem:** Existing documentation records 390px phone and desktop/tablet checks, but not a repeatable 320px audit for the long import preview, dialogs, and application forms.
- **Evidence:** `docs/12_QA.md` explicitly records 390px and says physical devices/other browsers are outside scope; this audit could not use a viewport override through the connected Opera tab.
- **Reproduction steps:** Repeat sign-in, import preview, question modal, and stage update at 320px width.
- **User impact:** Narrow Android devices may expose wrapping, modal-height, or tap-target defects not visible at 390px.
- **Recommended fix:** Add 320px to the responsive acceptance matrix.
- **Effort:** Small
- **Confidence:** Strong evidence

## Removal Candidates

- **AUD-R01 — Decorative empty-state panel.** Remove “A considered next step.” and similar atmosphere-only blocks; the empty-state action and explanation are sufficient.
- **AUD-R02 — One of the duplicate Inbox add actions.** Keep the header action or the empty-state action, then use the space to explain manual vacancy versus research import.
- **AUD-R03 — Potential standalone Attention page.** If context-aware links and dashboard surfacing become reliable, consolidate Attention into a prioritized dashboard view. Do not remove until the action-routing problem is solved.
- **AUD-R04 — Separate Companies destination for the initial product.** If company records are only useful as job metadata, move company details into job/application views and retain a searchable company view only when real usage demonstrates need.
- **AUD-R05 — Redundant “Opportunity” tab label on job detail.** The page already has a job detail context; keep tabs only if the distinction between opportunity facts and application workspace remains materially useful.

## Workflow Simplification Opportunities

1. Make one explicit decision path: **Review → Save/Ready to apply → Prepare application → Applied**. Explain that Ready to Apply is a shortlist decision and the application workspace is a separate tracking record.
2. Make Attention an action queue. Each row should open the exact action and show the reason it is urgent.
3. Put a compact factual gate at the top of job detail: deadline, verification freshness, hard requirements, fit recommendation, and recommended CV. Keep research assessment and user notes visibly separate below it.
4. Make import preview batch-oriented: show counts, identify the exact failing row, and make duplicate decisions explainable before a single confirm action.

## Mobile Findings

The CSS has thoughtful breakpoints, 44px controls, 16px form inputs, a fixed bottom navigation, a single-column detail mode below 950px, and a 92dvh modal cap below 700px. Existing 390px screenshots in `output/playwright/` show no horizontal overflow. The largest remaining mobile risk is vertical cost: job detail, import preview, and question/application modals are long, and the required action can be far below the factual or research content. The 320px target is not covered by the documented repeatable matrix.

## Security/Data Findings

- No P0 security issue was found. All eight tables have RLS and owner-scoped policies; composite owner foreign keys prevent cross-user references.
- Anonymous table reads are revoked. The prior live QA run confirmed a second account could not read or write another owner’s rows.
- External links are constrained to HTTP(S) and opened safely; imported text is rendered as text/JSON rather than HTML.
- CSV export prefixes formula-like cells, reducing spreadsheet formula injection risk.
- The main integrity weakness is contradictory application state (AUD-002), not cross-user access.
- Cloud deletion policy is intentionally conservative, but the UI does not always explain it before an attempted delete (AUD-014).

## Accessibility Findings

The app has a skip link, labelled form controls, named icon buttons, visible semantic headings, 44px mobile controls, and explicit draft/final labels. Remaining issues are mostly process coverage: raw validation errors are not field-associated (AUD-004/AUD-009), unfamiliar status vocabulary lacks definitions (AUD-018), and no automated axe result is part of the QA gate (AUD-022). Manual keyboard/focus and 390px checks were previously recorded; 320px and a non-Chromium accessibility pass remain unverified.

## Technical Debt Worth Fixing

- Centralize status semantics and transition rules so UI, domain logic, and database constraints agree (AUD-002, AUD-006).
- Centralize user-facing validation translation for import and forms (AUD-004, AUD-009).
- Separate verification freshness from employer posting state in the domain model/display (AUD-003).
- Add measured scale tests before optimizing repeated in-memory scans (AUD-016).
- Add an accessibility scan and 320px acceptance path to QA (AUD-022, AUD-023).

## Technical Debt Safe to Ignore

- The app’s personal-scale full-workspace load is acceptable until measured volume demonstrates a problem.
- A standalone local-mode repository is intentionally retained for development and does not need cloud parity beyond documented limits.
- Editorial typography and muted visual polish are lower priority than routing and state integrity.
- The existing strict import schema should remain strict; the problem is error translation and provenance, not global loosening.

## Documentation Drift

- `docs/09_DECISIONS.md` still describes a private deployment with signup disabled, while production signup is enabled and confirmed.
- `docs/10_CURRENT_STATE.md` and older QA text name `job-app-nine-lake.vercel.app` as the active public deployment, while the user-facing production alias used in this audit is `pyoloker.vercel.app`; the canonical alias is protected in some contexts.
- `docs/12_QA.md` says the owner has three CV rows and zero other domain rows, but the current owner workspace visibly contains seven imported jobs. That statement was accurate at an earlier milestone and is now stale.
- Documentation says “all failed saves keep form input”; this is true in the mutation context, but raw schema/database messages still make recovery difficult for import and question validation.
- The documentation records 390px testing but not a repeatable 320px or automated accessibility result.

## Recommended Remediation Order

1. Fix active-action routing (AUD-001) and application state guardrails (AUD-002).
2. Resolve the posting-status/freshness language conflict (AUD-003).
3. Translate import and question validation into repairable, user-facing errors (AUD-004, AUD-009).
4. Simplify Inbox and the Ready-to-Apply model (AUD-005, AUD-006, AUD-015).
5. Improve factual-versus-assessment hierarchy and large-batch preview (AUD-007, AUD-010).
6. Add 320px and automated accessibility coverage (AUD-022, AUD-023).
7. Reconcile documentation and deployment references, then measure scale before performance work (AUD-016).

## Remediation Status — 2026-09-14

Approved in-scope work is implemented for AUD-001, AUD-002, AUD-003, AUD-004, AUD-005,
AUD-006, AUD-007, AUD-009, AUD-010, AUD-012, AUD-013, AUD-014, AUD-018, AUD-019,
AUD-020, AUD-022 and AUD-023. Deferred findings remain intentionally unchanged:
AUD-008, AUD-011, AUD-015, AUD-016, AUD-017 and AUD-021.

The application-state migration is `supabase/migrations/202609140002_application_preparing.sql`.
Local checks pass (42 tests, lint, build and 10 database/RLS checks). Production
acceptance is complete at `https://pyoloker.vercel.app/` from deployment
`job-375tw13uv-moshe-dayans-projects.vercel.app` (commit
`a5154b5537e9c2d17ca163e38b722c51f484df33`); the exact journey, responsive checks and
cleanup are recorded in `docs/12_QA.md`.

