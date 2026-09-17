# PyoLoker documentation

If you are an AI agent working on job research, triage, application preparation,
PyoLoker data, or career workflows, read this document first.

PyoLoker is Moshe Dayan's private Career Command Center. Its operating loop is:

**Find → Evaluate → Apply → Progress**

The application stores current facts and history. These documents explain how an agent
should interpret those facts and operate safely. Do not copy a changing vacancy list or
current application queue into policy documentation.

## Source-of-truth order

1. Current records in PyoLoker (load the workspace or use an exported backup).
2. `10_CURRENT_STATE.md` for the latest repository and known workspace summary.
3. `02_USER_PROFILE.md` for canonical candidate facts.
4. `09_DECISIONS.md` for durable product and career-search rules.
5. The actual code, especially `src/lib/constants.js`, `src/lib/schema.js`,
   `src/lib/domain.js`, `src/lib/import.js`, `src/lib/triage.js`, and the SQL migrations,
   for the enforced contract.
6. Dated reports under `output/` for temporary research evidence only.

If a dated report conflicts with a current record, report the discrepancy. If a document
conflicts with code or the migration, document the difference and follow the enforced
contract for data operations. Do not silently invent a third interpretation.

## Read by workflow

### Job research

Read `02_USER_PROFILE.md`, `CV_STRATEGY.md`, `06_RESEARCH_RULES.md`, `04_DATABASE.md`,
and `AGENT_RUNBOOK.md`. Research is manually requested, evidence-based and read-only by
default. Produce a version-1 research import only when the user asks for one.

### Triage

Read `02_USER_PROFILE.md`, `CV_STRATEGY.md`, `05_JOB_SCORING.md`, `TRIAGE.md`,
`06_RESEARCH_RULES.md`, and `AGENT_RUNBOOK.md`. Load current jobs and applications,
exclude work that is already applied or terminal unless explicitly asked to audit it,
and return a short execution queue with reasons.

### Application preparation

Read `02_USER_PROFILE.md`, `CV_STRATEGY.md`, `07_APPLICATION_WORKFLOW.md`,
`04_DATABASE.md`, and the selected job/application record. Treat the user as the final
decision-maker. Preserve snapshots, drafts, final answers and stage history.

### System development

Read `00_HANDOVER.md`, `01_PRODUCT.md`, `08_ARCHITECTURE.md`, `04_DATABASE.md`,
`AGENTS.md`, and the relevant source/tests. Run the checks required by `AGENTS.md`.
Do not broaden the product into scraping, auto-application, messaging or scheduled agents.

### “What should I apply to today?”

Read `10_CURRENT_STATE.md`, then load the current workspace and apply `TRIAGE.md` and
`07_APPLICATION_WORKFLOW.md`. Prioritize the existing P0 queue and deadlines. Do not
start fresh market research unless the user asks for it.

## Documents that define the operating system

- `00_HANDOVER.md` — original product scope and non-negotiable boundaries.
- `01_PRODUCT.md` — product purpose and user-facing workspace model.
- `02_USER_PROFILE.md` — canonical, evidence-bounded candidate profile.
- `03_UX_WORKFLOWS.md` — implemented navigation and user flows.
- `04_DATABASE.md` — actual tables, fields, ownership, snapshots and import contract.
- `05_JOB_SCORING.md` — fit dimensions, evidence standards and recommendation vocabulary.
- `06_RESEARCH_RULES.md` — discovery, verification, duplicate and reconciliation rules.
- `07_APPLICATION_WORKFLOW.md` — actual application statuses, transitions and history.
- `08_ARCHITECTURE.md` — runtime, adapters, security and code boundaries.
- `09_DECISIONS.md` — append-oriented durable decisions.
- `10_CURRENT_STATE.md` — concise operational handover and latest milestones.
- `CV_STRATEGY.md` — deterministic content-based routing across the three CV records.
- `TRIAGE.md` — P0/P1/P2/DROP execution policy and its PyoLoker mapping.
- `AGENT_RUNBOOK.md` — repeatable instructions for future Astra/Codex sessions.
- `v2/README.md` — planning-only V2 multi-user/BYO-AI architecture, UX audit, migration
  map, interchange contract, security plan and implementation gates. It does not describe
  implemented behavior and must not be treated as a migration authorization.

`11_IMPLEMENTATION_PLAN.md`, `12_QA.md`, `13_WORKFLOW_GAP_ANALYSIS.md` and
`14_PRODUCT_AUDIT.md` are supporting history and evidence. They are useful when changing
the system, but they do not replace the current rules above.

## Operating guardrails

- Unknown facts remain unknown, null or blank. Never fill gaps with plausible guesses.
- Employer posting state, verification freshness and user application state are different.
- One vacancy may have many sources; do not create one job per portal repost.
- Research and triage may prepare files, but owner/application data changes require an
  explicit import confirmation or an explicitly authorized mutation.
- Never submit applications, send messages, scrape portals or create background jobs.
- Preserve application snapshots and stage history even when a source later closes.
- Use safe text rendering and HTTP(S)-only external links.
