# Database

PostgreSQL via Supabase, schema in supabase/migrations. UUID primary keys, timestamptz
audit fields, user_id ownership referencing auth.users. RLS on every exposed table.
Composite (user_id, id) foreign keys prevent linking another user's records even when
a client knows their IDs. Index ownership and common filters. Authenticated role only.

## Entities

- companies: reusable normalized identity, website/careers, industry/size/HQ and notes.
- cv_versions: Master, Analyst, Management/Product; description, targets, file reference.
- jobs: company, role/location/mode/seniority, vacancy text, salary, dates, verification,
  review state, explainable fit, strengths/gaps/red flags, CV, research/user notes.
- job_sources: many per job, source/application URLs, type, requisition ID, verification.
- applications: one per job in V1; flexible stage, applied date, CV used, immutable vacancy
  snapshot, stage history, next action/date, cover letter, recruiter, outcome and notes.
- application_questions: question/type/required/limit, draft/final, reasoning and status.
- application_events: assessments/interviews/contact records with schedule, status and notes.
- research_runs: goal, query, timestamps, counts, notes; jobs can reference their origin run.

Lists and evidence are JSONB where relational decomposition adds no value. Application
snapshots and stage histories are JSONB. Company/CV deletion is restricted while referenced;
job deletion is restricted with applications; source/question/event children cascade.
No database candidate profile in V1; canonical Markdown avoids competing sources of truth.

Atomic save/import uses a security-invoker RPC transaction over normalized tables, with
RLS enforced. Optimistic updated_at checks reject stale writes. No service-role key in UI.
Local adapter uses the same entities and validation with versioned browser storage.
Local storage is a development/offline workspace, not protected multi-device storage.
