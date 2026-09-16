# V1→V2 migration, compatibility, and implementation gates

This document describes a future sequence. It does not authorize or perform a migration.

## 1. Migration principles

- Preserve V1 operational records and IDs.
- Copy before transforming; never use a destructive in-place rewrite as the first attempt.
- Generate a migration report with counts, skipped rows, conflicts, source paths, and unresolved profile claims.
- Do not publish a profile revision until the user reviews the generated projection.
- Keep V1 routes/imports readable during the compatibility window.
- Make rollback a product operation, not an assumption that a SQL transaction can undo a user-visible decision.

## 2. V1→V2 mapping

| V1 source | V2 destination/relationship | Preservation rule |
| --- | --- | --- |
| Auth user / `LOCAL_USER` | Cloud account or explicit local workspace | Cloud user is authoritative; local identity never becomes a public user without an explicit user-led export/import |
| `cv_versions` | `cv_versions` remains the canonical semantic CV-variant entity; `career_documents` stores optional private file versions attached to a variant | Preserve CV ID, label, recommendation, and historical relationships unchanged. Legacy local paths become missing-file metadata until explicit upload. |
| `companies` | `companies` unchanged | Preserve owner ID and timestamps |
| `jobs` | `jobs` unchanged | Preserve factual fields, triage, fit, freshness, sources, and review state |
| `job_sources` | `job_sources` unchanged | Preserve all sources and verification notes |
| `research_runs` | `research_runs` unchanged | Preserve run/import provenance |
| `applications` | `applications` unchanged | Preserve job snapshot, status, selected CV reference, answer snapshots, and outcome |
| `application_questions` | `application_questions` unchanged | Preserve draft/final separation and question snapshots |
| `application_events` | `application_events` unchanged | Preserve stage history and timestamps |
| `docs/02_USER_PROFILE.md` / supplied Markdown | profile source material and proposed structured claims | Preserve source text; accept canonical facts only after provenance review |
| role/CV guidance documents | `structured_json`/preferences proposal | Do not turn policy or assistant guidance into personal facts |
| research/triage JSON exports | V2 envelope adapter or V1 import route | Preserve format version and exact UUID behavior |

### Moshe migration flow

1. Take a read-only snapshot of the existing cloud/local workspace.
2. Verify the authenticated owner and record counts.
3. Create `career_profiles` with `onboarding_status: migrating`.
4. Preserve supplied Markdown as source/freeform material and propose structured claims with provenance; publish canonical structured facts only after review.
5. Convert the three CV records to document metadata. Local paths are marked `legacy_local_path`; no file is copied without user action.
6. Derive a structured profile proposal from explicit current facts only: President University/Informatics, timing, Mattel internship, Homize, leadership, and documented skills/evidence.
7. Preview differences, missing files, ambiguous claims, and any data that could not be mapped.
8. User publishes the first V2 profile revision.
9. Run read-only integrity checks: every job/application/source/event remains owned, counts match, snapshots match, and no terminal history disappeared.
10. Mark migration complete and retain a migration report linked to the account.

### New user initialization

New users receive:

- an empty profile draft;
- no CV records unless they supply/import them;
- no companies/jobs/applications/events;
- generic role/location/timing questions;
- a choice of manual, Markdown import, or AI-assisted onboarding.

The initialization code must not import from `CV_SEEDS`, Moshe’s Windows paths, the local user UUID, or any fixed career facts.

## 3. Backwards compatibility map

| Existing behavior | V2 compatibility plan |
| --- | --- |
| `/inbox` and `/applications` redirects | Keep redirects through beta; show the new destination in the page title/breadcrumb |
| V1 research import JSON | Parse unchanged; wrap/adapt into V2 only after validation |
| V1 triage results | Keep exact UUID and “existing jobs only” semantics |
| Local browser storage | Continue in explicit local mode; offer export/import before any account migration |
| `Ready to Apply` historical records | Preserve the documented V1 stage mapping to `Preparing` where already migrated; do not silently rewrite user history |
| Empty/null fields | Render as unknown/not provided, never as Moshe defaults |
| Existing CV recommendations | Preserve as editable advice; do not recalculate on migration without showing the change |
| Existing source/freshness fields | Keep source status, last verification, and review state distinct |

## 4. Phased implementation gates

### Gate 0 — Product contract

Exit criteria:

- open decisions in `08_FAILURES_RISKS_AND_OPEN_DECISIONS.md` are resolved;
- envelope, profile authority, task packs, and stale rules are approved;
- security classification and document strategy are approved;
- no V1 implementation is changed merely to “make room.”

### Gate 1 — Read-only profile and pack prototype

Scope: generate a pack from fixtures/local memory without DB writes or persistence tables (`context_exports` and `ai_artifacts` are deferred).

Current prototype: `src/v2/protocol.js`, `fixtures.js`, `tasks.js`, and `compiler.js` provide
the provider-neutral protocol, Moshe/synthetic fixtures, centralized task registry, privacy
selection, Markdown/JSON renderers, manifests, deterministic hashes, metrics, and linting.
`npm run v2:gate1` generates transient samples for manual inspection.

Exit criteria:

- Moshe and a synthetic new-user fixture produce different packs;
- no repository path or hidden documentation is required;
- minimisation manifest matches the visible preview;
- pack opens in a plain text editor;
- V1 tests remain green; no production data touched.

### Gate 2 — Profile revisions and onboarding

Scope: new profile tables, manual/Markdown onboarding, reviewed projection.

Gate 2A (the persistent foundation) was implemented locally first. It added no onboarding UI and
did not migrate Moshe. The migration creates `career_profiles` and
`career_profile_revisions`, with owner RLS, immutable published history, one-draft
semantics, provenance, deterministic content hashes and atomic domain RPCs. The pure
adapter from a published revision to the Gate 1 compiler is covered by unit tests.

Exit criteria:

- RLS/cross-user tests pass;
- publishing is explicit and revisioned;
- profile conflicts and unsupported claims are visible;
- export/delete and local/cloud boundaries work;
- mobile and keyboard paths cover the full first profile.

### Gate 3 — Moshe migration and compatibility

Scope: shadow migration, report, user-approved publish, V1 import compatibility.

Exit criteria:

- dry run count and snapshot checks match;
- missing local CV binaries are clearly reported;
- old application history is unchanged;
- rollback/retry is documented and tested on fixtures;
- user approval is recorded.

### Gate 4 — Reviewable AI artifacts

Scope: validate result envelopes, stale detection, proposal review, named-target acceptance.

Exit criteria:

- plain text remains scratch/untrusted;
- structured proposals cannot target arbitrary tables/columns;
- source evidence is shown for accepted drafts;
- stale results require re-review;
- rejected/discarded artifacts are retained or deleted according to the user’s policy.

### Gate 5 — Public beta readiness

Scope: invited multi-user beta.

Exit criteria:

- auth, RLS, storage, imports, rate limits, privacy notice, account deletion/export, and incident response are tested;
- telemetry is content-minimised;
- support can diagnose pack/import failures without reading private content by default;
- no autonomous action is introduced to close a schedule gap.

## 5. Scope boundaries

### Beta scope

- Cloud multi-user accounts with clear local mode.
- Manual and Markdown profile onboarding.
- Optional AI-assisted profile proposal through copy/download and paste-back review.
- Portable Career Pack and task-specific packs.
- Existing V1 jobs/applications/history preserved.
- One Ask your AI primitive for research, triage, application prep, interview, and progress.
- Explicit import/review/accept flows and stale markers.
- Private document metadata plus the chosen safe storage path.

### Public scope after beta evidence

- Polished responsive onboarding and Career area for profile, CV variants, documents, and pack tools.
- Reliable private document upload/delete/export.
- Better pack templates and user-configurable preferences.
- Guided migration for existing V1/local users.
- Accessible review flows and support diagnostics.

### Deferred

- Native AI provider integrations or API-key storage.
- Automated scraping, vacancy harvesting, or background monitoring.
- Auto-apply, recruiter messaging, or scheduled agents.
- Paid LLM integrations or model billing.
- Automatic CV rewriting or mass personalisation.
- Team/shared workspaces and recruiter collaboration.
- Full offline sync/conflict resolution.
- Job marketplace or social features.

## Gate 2B status — 2026-09-16

Gate 2B manual onboarding is implemented locally and validated through focused React tests, lint and the production build. It adds no migration and performs no cloud or owner-data writes. The V2 profile repository is selected separately from the V1 repository; configured cloud workspaces keep the profile UI unavailable until a later authorized enablement step. The final sentence records the historical Gate 2B boundary; Gate 2C is recorded below and does not change it.

## Gate 2C status — 2026-09-16

Gate 2C is implemented locally as a reviewed source-import and external-AI profile-proposal flow. It adds no migrations, no persistence tables, no provider integration, and no cloud or owner-data writes. The Gate 1 compiler now supports a self-contained `build_profile` task with portable policy and a strict proposal contract. Gate 3 Moshe migration remains deferred.

## Gate 3A status — 2026-09-16

Gate 3A prepares a generic, read-only shadow migration for Moshe from current documented
V1 evidence. `src/v2/shadow-migration.js` normalizes a source-bounded candidate through
the Gate 2A profile schema, assigns deterministic item IDs, attaches provenance, reports
unresolved and excluded claims, checks compatibility when an authorized V1 snapshot is
supplied, and adapts the candidate through the existing Career Pack compiler. The
Moshe mapping is isolated to `src/v2/migration-fixtures.js`; runtime behavior has no
Moshe-specific branch.

The generator writes local review artifacts under `output/v2-gate3a-shadow/` and performs
no database calls, migrations, profile creation, CV/document upload, job/application
recreation, or owner-data mutation. No authorized live owner export was available, so
current V1 IDs/counts remain unresolved. Status is **shadow migration prepared / awaiting
owner review**; Gate 3B is not started.
