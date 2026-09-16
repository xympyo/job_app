# V2 data model, interchange, and round-trip contract

This document remains the V2 interchange and future-extension model. Gate 2A now adds only
the profile/revision foundation described below; document, pack-retention and AI-artifact
tables remain later-gate concepts. The eight V1 operational tables are intact.

## 1. Existing V1 tables to preserve

`cv_versions`, `companies`, `research_runs`, `jobs`, `job_sources`, `applications`, `application_questions`, and `application_events` remain the operational core. Their owner keys, composite owner-aware foreign keys, snapshots, lifecycle semantics, triage fields, and RLS policies are preserved.

The V1 research import and triage interchange formats remain readable. V2 adapters may add fields, but must not reinterpret a V1 UUID, job, application snapshot, or stage event.

## 2. Small V2 extension

### `career_profiles`

One row per user. This is account-scoped product configuration, not a second identity provider.

| Field | Meaning |
| --- | --- |
| `id`, `user_id` | Stable profile identity and owner; one active profile per user in beta |
| `display_name` | Not duplicated on the profile row in Gate 2A; identity/display name is canonical revision data |
| `onboarding_status` | `not_started`, `draft`, `ready`, `migrating`, `blocked` |
| `current_revision_id` | Pointer to the published canonical profile revision |
| `preferences_json` | Product/account preferences only (for example privacy defaults); career reasoning facts/preferences live in the versioned profile revision |
| `created_at`, `updated_at` | Audit timestamps |

### `career_profile_revisions`

Immutable revisions of user-authored profile content and its reviewed machine-readable projection.

| Field | Meaning |
| --- | --- |
| `id`, `profile_id`, `revision_number` | Stable revision and monotonic version within a profile |
| `status` | `draft`, `published`, `archived`; only one current published revision |
| `markdown_body` | Later source/projection material; Gate 2A keeps only bounded `freeform_notes` as canonical user-authored text |
| `structured_json` | Reviewed projection used for UI, pack assembly, and routing |
| `source_map_json` | Pointers such as Markdown heading/line, document ID, or user-entered field for each structured claim |
| `schema_version` | Projection schema version, independent of app version |
| `created_by` | `user`, `import`, or `assistant_proposal`; proposals are never published automatically |
| `created_at`, `published_at` | Revision history and publication evidence |

The Markdown body is preserved source/import or freeform user content. Structured career facts are canonical for factual data; generated Markdown is a projection/export. Imported Markdown/resume material proposes claims with provenance for user acceptance; there is no required permanent two-way synchronization.

### `career_documents`

Metadata and private-storage references only; binaries are not stored in Git or in ordinary row JSON.

| Field | Meaning |
| --- | --- |
| `id`, `user_id` | Owned document identity |
| `kind` | `cv`, `resume`, `cover_letter`, `portfolio`, `transcript`, `certificate`, `other` |
| `variant_key` | User-defined route such as `analyst`; nullable |
| `storage_key` | Private object-storage key, never a public URL |
| `file_name`, `mime_type`, `byte_size`, `sha256` | Safe display and integrity metadata |
| `profile_revision_id` | Profile revision the document was attached to, nullable |
| `visibility` | `private`, `pack_allowed`, `task_only` |
| `extraction_status` | `not_requested`, `pending`, `ready`, `failed`; extracted text remains protected |
| `created_at`, `updated_at`, `deleted_at` | Lifecycle and recoverability metadata |

### `context_exports` (later persistence gate)

Immutable records of what a user intentionally copied or downloaded.

| Field | Meaning |
| --- | --- |
| `id`, `user_id` | Export identity and ownership |
| `pack_kind` | `career_full`, `task`, `record_review`, `profile_only` |
| `protocol_version`, `schema_version` | Protocol and envelope compatibility |
| `profile_revision_id`, `subject_type`, `subject_id` | Profile and optional job/application subject |
| `manifest_json` | Field-level inclusion list, redaction choices, source IDs, and revision hashes |
| `content_hash` | Integrity/duplicate detection hash of the exported text/JSON bundle |
| `created_at`, `expires_at` | Export history and optional retention policy |

Gate 1 does not create this table. Packs are generated transiently by default. A later gate may retain only the manifest/hash and included-record references for stale detection/provenance; a full payload is retained only when the user explicitly saves it, with private deletion/export controls.

### `ai_artifacts` (later persistence gate)

Reviewable outputs returned by an external AI or authored by the user. Gate 1 does not create this table; plain text remains transient scratch until explicitly saved or accepted.

| Field | Meaning |
| --- | --- |
| `id`, `user_id` | Owned result identity |
| `task_type`, `subject_type`, `subject_id` | What the result attempts to help with |
| `context_export_id` | Exact input pack used |
| `input_revision_manifest_json` | Profile/job/application/document revisions at handoff |
| `content_json`, `content_markdown` | Proposed result; one or both, validated as untrusted input |
| `status` | `received`, `reviewing`, `accepted`, `rejected`, `stale` |
| `accepted_target` | Explicit target such as `application.question.draft`, never an arbitrary table path |
| `created_at`, `reviewed_at` | Audit trail |

The app computes staleness by comparing source revisions/hashes, not by trusting a timestamp supplied by an AI. Accepted results still create the normal domain mutation/event and preserve the prior value.

## 3. Proposed common interchange envelope

All V2 packs and AI-return imports use one envelope. The exact validation schema belongs in a future implementation decision, but the contract should look like this:

```json
{
  "format": "pyoloker.career-interchange",
  "format_version": "2.0",
  "kind": "career_pack",
  "created_at": "2026-09-15T00:00:00Z",
  "source": {
    "product": "PyoLoker",
    "product_version": "v2-beta",
    "pack_id": "export-id",
    "protocol_version": "1.0",
    "timezone": "Asia/Jakarta"
  },
  "subject": {
    "profile_revision": "profile-revision-id",
    "profile_revision_hash": "sha256:...",
    "task": {
      "type": "application_prepare",
      "subject_type": "job",
      "subject_id": "job-id"
    }
  },
  "instructions": {
    "role": "career collaborator",
    "do_not_invent": true,
    "separate_facts_from_inference": true,
    "return_proposals_only": true
  },
  "profile": {
    "markdown": "user-approved narrative",
    "structured": {},
    "source_map": {}
  },
  "context": {
    "opportunity": null,
    "application": null,
    "documents": [],
    "history": [],
    "user_request": ""
  },
  "redactions": [],
  "integrity": { "content_hash": "sha256:..." },
  "extensions": {}
}
```

### Envelope rules

- `format` and `format_version` are required and exact.
- `kind` is an allow-list, not a free-form instruction. Examples: `career_pack`, `task_context`, `ai_result`, `triage_result`.
- IDs are opaque and may be omitted from a user-shared pack if the user selects a privacy-minimal mode. Internal round-trip imports require them.
- `created_at`, revision hashes, and `source.product` are facts about the export, not employer facts.
- `extensions` is namespaced and ignored safely by older readers. Unknown top-level keys are rejected or preserved in a quarantine area; they are never executed.
- URLs are accepted only as `https://` or `http://` links in factual source fields. The importer must never fetch a URL as part of parsing.
- Markdown and text are rendered safely. HTML, script content, and executable attachments are not interpreted.
- An AI result must name its `context_export_id` or be treated as an ungrounded draft requiring extra review.

## 4. Round-trip and stale-output semantics

```text
canonical records (revision A)
        │ user selects task + redactions
        ▼
immutable context export E (hash, manifest, revision A)
        │ copy/download to any AI
        ▼
AI result R (references E, proposed fields only)
        │ paste/import, strict validation, preview
        ▼
review → accept into a named target OR reject
        │
canonical records (revision B) + event + prior value preserved
```

If the profile, job, application question, selected CV, or relevant document changes after E was created, R is marked `stale`. A stale result can still be viewed or copied, but acceptance requires an explicit re-review and may be disabled for high-risk targets such as final application answers.

## 5. Backwards compatibility

1. Keep V1 research import version 1 and triage results readable.
2. Add an adapter that wraps a V1 import into a V2 envelope with `kind: "research_import"` and `source.legacy_format_version: 1`.
3. Preserve V1 UUIDs for jobs/applications when importing into the same workspace; never generate a replacement that loses deduplication.
4. Treat missing V2 profile/pack fields as absent, not as Moshe defaults.
5. Keep old routes (`/inbox`, `/applications`) as compatibility redirects until usage evidence supports removal.
6. On export, offer both a V2 full envelope and the documented V1 research/triage format where the selected workflow needs it.
7. Test old records with blank/null values, old application stage history, terminal applications, and old snapshots before any rollout.

## 6. User-facing import behavior

Every import shows: format/version, source, created date, owner/subject, included fields, redactions, conflicts, stale references, and proposed changes. The user chooses field-by-field or batch acceptance. The import screen never says “synced” when it only generated a proposal.

## Gate 2A persistence boundary

Gate 2A implements only `career_profiles` and `career_profile_revisions`. A profile is
owned by one authenticated user and contains product/account preferences only; career
reasoning preferences live in the revision's canonical structured data. A revision stores
`schema_version`, `structured_json`, `freeform_notes`, `source_map_json`, `created_by`,
`content_hash`, status and audit timestamps. Collection entries use stable opaque `id`
values and preserve experience type. Structured facts and freeform notes are validated
separately; generated Markdown is still a projection.

Published revisions are immutable and remain in history. There is at most one draft per
profile. Draft creation optionally copies the current published revision, saving is
optimistic-concurrency aware, and publication atomically changes the profile's
`current_revision_id` and onboarding status. Direct client edits cannot rewrite a
published revision or point a profile at another owner's revision. The migration is not
applied to production by Gate 2A.

The migration is additive and has no automatic down migration. Recovery is by restoring
the database backup or removing only the new profile rows through an explicit account
deletion workflow; existing V1 tables are never rewritten.
