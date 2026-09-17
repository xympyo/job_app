# Data model and import contract

The authoritative schema is the SQL in `supabase/migrations/`. The frontend mirrors it
with Zod schemas in `src/lib/schema.js`; constants in `src/lib/constants.js` define the
allowed status vocabularies. There are eight user-owned tables and no database candidate
profile in V1. Markdown profile knowledge remains canonical.

## Ownership and persistence

Every table has UUID `id`, `user_id`, `created_at` and `updated_at`. Supabase RLS permits
authenticated users to access only rows with their own `user_id`; anonymous table access
and RPC execution are denied. Composite `(user_id, id)` foreign keys prevent a client
from linking another user's row. `apply_changes(jsonb)` is a security-invoker, whitelisted
atomic batch RPC with optimistic `updated_at` checks. Applications and research runs are
not deletable through the cloud mutation path. Local mode uses version-1 browser storage
and is not cloud-synchronized or encrypted.

## Tables and relationships

### `cv_versions`

`name`, unique per-user `slug`, `description`, `target_roles` (JSON array), `active`,
`file_reference` and `notes`. New workspaces seed Master, Analyst and Management/Product.
PDFs are only referenced from outside this repository; they are not uploaded or published.

### `companies`

Reusable `name`, unique per-user `normalized_name`, `website`, `careers_url`, `industry`,
`size`, `headquarters` and `notes`. Adding a job creates or reuses a company by normalized
name. A company referenced by a job cannot be deleted.

### `research_runs`

`research_goal`, `query_summary`, `notes`, `started_at`, `completed_at`, `result_count`
and `created_jobs_count`. Jobs may reference the originating run through
`research_run_id`. A manual job does not need a run.

### `jobs`

The vacancy/opportunity record. It references `company_id`, optional `recommended_cv_id`
and optional `research_run_id`. Facts include `title`, `normalized_title`, location/city/
country, `work_mode`, `employment_type`, `role_family`, `seniority`, description,
responsibilities, requirements, preferred requirements, salary fields, `deadline`,
`published_at`, `found_at`, `last_verified_at`, `posting_status` and `source_confidence`.

Assessment fields are `fit_score` (nullable integer 0–100), `fit_label`, `fit_reason`,
`strengths`, `gaps`, `red_flags`, `recommendation`, `custom_tailoring`,
`research_notes` and user `notes`. Workflow fields are `review_status` and the optional
recommended CV foreign key. A fit score requires an explanation. Lists are JSON arrays.

### `job_sources`

Many-to-one child of `jobs`: `source_name`, `source_type`, `source_url`, `apply_url`,
`external_job_id`, `is_primary` and `verified_at`. One vacancy may have official,
recruiter and platform sources. Stored source types are `Official careers`, `Official
posting`, `Job platform`, `Secondary` and `Unknown`.

### `applications`

At most one per job in V1. References `job_id` and optional `cv_version_id`. Fields are
`status`, `applied_at`, `job_snapshot`, `cv_snapshot`, `stage_history`,
`cover_letter_used`, `next_action`, `next_action_at`, recruiter fields,
`rejection_stage`, `rejection_reason`, `offer_details` and `notes`.

The database trigger preserves `job_snapshot`, identity and ownership on update. A new
application captures the current vacancy, company and sources plus the selected CV. A CV
change updates the CV snapshot. `stage_history` is an ordered JSON array of `{status, at}`.

### `application_questions`

Child of an application: `question_text`, `question_type`, `required`, `character_limit`,
`draft_answer`, `final_answer`, `reasoning_notes` and `status`. Draft and final answers
are separate. Required Completed questions need a final answer; non-Draft final answers
must fit the character limit. Drafts may temporarily exceed the limit while being edited.

### `application_events`

Child of an application for assessments, interviews and recruiter contacts: `kind`,
`title`, `scheduled_at`, `status` and `notes`. Events are records, not automated reminders
or outbound messages.

## Meaning of important states

Job `posting_status` describes the employer vacancy finding: Unknown, Verified open,
Possibly open, Closed or Expired. `last_verified_at` describes when that evidence was
checked. `freshness()` derives Unverified, Fresh (≤7 days), Recent (≤14), Aging (≤30),
Possibly stale, Closed or Expired; a deadline or explicit closed/expired status takes
precedence. A Verified open value without a timestamp is therefore recorded evidence with
no timestamp—not proof of current freshness.

Job `review_status` describes Moshe's decision: Found, Reviewing, Saved, Ready to Apply,
Skipped, Expired or Closed. `Ready to Apply` is a shortlist decision. An application
workspace starts at `Preparing`, which means not submitted. Application statuses and
history are defined in `07_APPLICATION_WORKFLOW.md`.

## Research import (version 1)

Accepted shape is `{version: 1, research_run, jobs}`. `research_run.goal` is required;
query summary and notes are optional. Each job requires `company` and `title`; source
records use the stored source fields. Optional unknown values may be omitted or null and
are normalized to defaults. Full HTTP(S) URLs without embedded credentials and ISO dates/
timestamps are required where supplied. Numeric `fit_score` requires `fit_reason`.

The parser in `src/lib/import.js` rejects malformed JSON, unknown keys, unsupported enums,
invalid URLs/dates, oversized strings/arrays, more than 200 jobs or 2 MB. It normalizes
common source labels such as “Official recruiter posting” and “University career center”
to the compact stored categories. Preview parses and clones data without writing.

On confirmation, a research run is created, companies are reused/created, and selected
jobs/sources are written atomically. Duplicate choices are skip (default), merge sources
into an existing job, or keep as a separate vacancy. Merge does not overwrite the existing
job or its application. Import never creates an application, changes questions/events,
submits an application or runs a background search.

## Triage interchange

The app's Export for triage emits version 1 data with stable existing `job_id` values and
excludes jobs already Skipped/Expired/Closed. Import requires exact UUIDs, unique IDs,
supported decisions and the decision-to-status mapping documented in `TRIAGE.md`.
Preview shows old/new fields; confirmation updates existing jobs only. The whitelist is
review status, recommendation, fit fields, strengths/gaps/red flags, recommended CV,
research notes and an explicitly explained verification timestamp. It never creates jobs,
changes factual vacancy fields, sources, applications, snapshots, questions, events or
history.

## Export and preservation

Career Toolkit exports a full JSON backup containing all eight tables and JSON/CSV exports
for jobs, applications and application questions. CSV cells are escaped and formula-like
values are prefixed defensively. The full backup is portable data, not a research-import
payload; V1 has no full-backup restore UI. Preserve it privately before changing browser
origins or moving between local and cloud mode.

## Employer due-diligence storage boundary

The current `companies` table is an identity/reuse record, not an employer-review
database. Do not put a long audit dump in `companies.notes` or duplicate employer facts
into every job. The proposed normalized future shape is an owner-scoped one-to-one
`company_diligence` record plus owner-scoped `company_diligence_sources` children for
status, confidence, summary, signals, concerns, compensation/stability/career-value
signals, operational recommendation and dated evidence. Migration
`202609180001_company_diligence.sql` implements this as `company_diligence` plus
`company_diligence_sources`. Both tables have composite owner foreign keys, one current
record per user/company, RLS and HTTPS-only source URLs. The import writes only these
tables; V1 jobs, sources, applications, CVs and history remain unchanged.
