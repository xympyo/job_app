# PyoLoker V2 Product Contract

**Status:** Gate 0 locked contract, planning only (2026-09-16). This document authorizes no V2 code, migration, persistence table, production-data change, or owner-data mutation.

## 1. Product purpose

PyoLoker is a private career operating system that supports **Find → Evaluate → Apply → Progress**. External AI is an optional, user-controlled collaborator. PyoLoker remains useful without AI.

## 2. Product boundaries

PyoLoker owns career facts, evidence, opportunities, applications, documents, decisions, and history. AI may summarize, compare, research, triage, draft, and rehearse from supplied context. Nothing may silently invent facts, change canonical data, submit an application, scrape vacancies, message recruiters, run in the background, or require a paid/provider integration.

## 3. Source-of-truth hierarchy

Structured career facts are canonical for factual data. User-authored freeform career notes are canonical only as freeform content. Generated `PROFILE.md`/Markdown is a labelled projection/export. Imported Markdown, resumes, documents, or biographies are preserved as source material and produce proposed structured claims with visible provenance; the user reviews, edits, and accepts them. Permanent two-way synchronization between generated Markdown and structured facts is not required. Operational job/application tables remain authoritative for workflow history and state.

Evidence may come from direct user entry, approved source material, accepted extraction, an accepted AI proposal whose evidence is visible, or explicit confirmation. Model confidence is never evidence.

## 4. User and profile model

There is one active career profile per user in beta. It contains versioned canonical facts, evidence/provenance, target roles, locations, work modes, relocation/work-authorisation/timing constraints, and user-authored freeform notes. Career preferences that affect reasoning live in the versioned profile; `career_profiles.preferences_json` is only for product/account preferences such as privacy defaults and UI settings. Multiple personas are deferred.

New users start empty: no Moshe facts, CVs, paths, jobs, applications, achievements, or seeded records. Manual onboarding, source import, and optional AI-assisted proposals are all first-class.

## 5. CV and document model

`cv_versions` remains the canonical semantic CV-variant entity: user-defined name, positioning, target roles, active state, recommendation relationship, and optional notes. `career_documents` represents zero or more private file/document versions attached to a variant. Preserve `recommended_cv_id`, application `cv_version_id`, snapshots, historical relationships, and Moshe’s existing three variants unchanged. Legacy local paths are missing-file metadata until the user explicitly uploads files. New users receive no Moshe CV records.

## 6. AI Protocol and Career Packs

Every handoff is provider-neutral and self-contained: Universal AI Protocol, approved profile facts/notes, minimum task context, requested output shape, as-of dates, provenance, and redaction manifest. The default label is **your AI**; provider names are examples only and no provider configuration is required for beta. Packs must work without repository access, local paths, hidden documentation, or Moshe-specific code.

Packs are transient by default. Retain only metadata needed for stale/revision detection or structured provenance: pack ID, task, revision/hash manifest, included-record references, generated time, and inclusion/redaction manifest. A full pack is retained only when the user explicitly saves it. Copying never creates a permanent full payload.

## 7. Sharing and privacy defaults

Use private minimum by default. Do not include email, phone, exact home address, account IDs, unnecessary stable database IDs, recruiter personal information, secrets, or unselected document binaries. A preferred/display name may be included when useful. Contact details require explicit selection. Private documents target private Supabase Storage with owner-only access, signed short-lived URLs, MIME/content and size validation, deletion/export, and cross-user isolation proven in a later implementation gate. No public document URLs.

## 8. AI round-trip rules

There are two paths:

- **Strict structured envelope:** versioned, schema-validated, allow-listed targets, source context, preview, and explicit acceptance before write-back. Use for job research/triage, profile/onboarding proposals, and other clear multi-field persistence workflows.
- **Plain text:** untrusted scratch/draft only. It never writes directly to canonical data or history and is retained only if the user explicitly saves it.

Accepted structured proposals create normal domain revisions/events and preserve prior values. Persistent proposals identify their pack/context and input revisions; stale results require re-review. Interview coaching and general career conversation remain ordinary human-readable exchange unless a concrete persistence use case appears.

## 9. Information architecture

Primary navigation is:

**Home · Jobs · Attention · Career · History · Settings**

Jobs is the single user-facing workspace for opportunities across review, triage, preparation, application, and progress. The backend may keep jobs and applications separate. Research import, companies, and other utilities are contextual/secondary. `/inbox` and `/applications` remain compatibility redirects where practical; they must not create competing primary destinations.

## 10. Home and Attention

Home provides orientation and one recommended next move, with compact summaries. Attention is the canonical actionable queue. Home may link to or summarize Attention but must not duplicate its full queue.

## 11. Guide/help role

`/guide` is secondary Help/Playbook/first-run orientation. Normal operation uses contextual guidance in Home, Jobs, application workspaces, and Career (for example, “Ask your AI”). The expected loop never requires Guide → action → Guide repetition, and V2 must not reproduce the current prompt wall.

## 12. New-user initialization

After account creation, a user chooses guided manual setup, source/Markdown/resume import, or optional AI-assisted onboarding. Imported material is reviewed into canonical facts; unknown and “prefer not to share” remain valid. No fixed candidate facts or filesystem paths are initialized.

## 13. Moshe migration invariants

Moshe is User #1, not a permanent code branch. Existing jobs, sources, research runs, applications, questions, events, snapshots, outcomes, and CV variants remain authoritative with IDs and history intact. Migration is read-only first, owner-verified, reviewed, reversible, and publishes a V2 profile only from accepted canonical Moshe facts. No duplicate CV variants, job/application recreation, or history reset.

## 14. Backwards compatibility

V1 research import and triage formats remain readable. Existing UUIDs and null/blank semantics are preserved. Local mode remains explicitly local; cloud transfer is explicit export/import with review and never automatic merge or silent account binding. Existing routes and workflow history remain usable during the compatibility window.

## 15. Implementation gates

- **Gate 0:** this product contract and detailed planning package reconciled; no implementation.
- **Gate 1:** read-only profile/pack compiler from fixtures/local memory; no DB writes and no `context_exports` or `ai_artifacts` tables.
- **Gate 2:** versioned profile/onboarding persistence with RLS, provenance, review, and local/cloud boundaries.
- **Gate 3:** shadow Moshe migration and compatibility validation; user approval before publish.
- **Gate 4:** strict AI result validation, stale detection, proposal review, and named-target acceptance; persist only explicit saves/accepted provenance.
- **Gate 5:** invited beta readiness, including auth/RLS/private storage/privacy/deletion/export and support controls.

## 16. Explicit non-goals

No autonomous research, scraping, vacancy harvesting, background monitoring, auto-apply, recruiter messaging, scheduled agents, native/provider AI integration, paid LLM dependency, automatic CV rewriting, team workspaces, social/job-marketplace features, generic workflow engine, or premature permanent pack/artifact storage.

