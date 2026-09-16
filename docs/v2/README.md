# PyoLoker V2 planning package

Status: Gate 2B manual career-profile UX implemented locally 2026-09-16, building on the Gate 2A persistent foundation. Migrations, profile enablement and tests remain local-only; no production onboarding or owner-data mutation is included.

## Purpose

PyoLoker V1 is a strong private, Moshe-centered Career Command Center. V2 should generalize the product into a multi-user, BYO-AI Career Operating System without turning the product into an autonomous researcher, an auto-apply agent, or an AI vendor.

The proposed product loop remains:

> Find → Evaluate → Apply → Progress

The proposed V2 adds a portable context loop around that workflow:

> Maintain trusted profile → choose a task → review the minimum context → ask any AI → bring back a reviewable result → accept explicitly

The central design constraint is ownership. PyoLoker owns durable career facts, opportunity records, application history, documents, and user decisions. An external AI receives a user-approved, versioned context pack and returns advice or draft work. It does not become the source of truth, gain direct write access, or silently update the workspace.

## Package map

| Document | Planning deliverables covered |
| --- | --- |
| [01_PRODUCT_AND_ARCHITECTURE.md](01_PRODUCT_AND_ARCHITECTURE.md) | Product model, current architecture findings, Moshe assumptions, source-of-truth model, information architecture, product principles |
| [02_DATA_MODEL_AND_INTERCHANGE.md](02_DATA_MODEL_AND_INTERCHANGE.md) | Small V2 data extension, common interchange envelope, versioning, round-trip semantics, backwards compatibility |
| [03_AI_PROTOCOL_AND_PACKS.md](03_AI_PROTOCOL_AND_PACKS.md) | Universal AI Protocol, User Profile layer, Task Context layer, Career Pack, task-pack matrix, reusable Ask your AI primitive, stale-output rules |
| [04_ONBOARDING_AND_JOURNEYS.md](04_ONBOARDING_AND_JOURNEYS.md) | AI-assisted/manual onboarding, initialization, Moshe/new-user/career-changer/mobile journeys, onboarding decisions |
| [05_GUIDE_UX_AND_DESIGN_SYSTEM.md](05_GUIDE_UX_AND_DESIGN_SYSTEM.md) | `/guide` screenshot audit, IA recommendation, Home vs Attention, V2 guide proposal, design primitives and responsive behavior |
| [06_SECURITY_PRIVACY_AND_DOCUMENTS.md](06_SECURITY_PRIVACY_AND_DOCUMENTS.md) | Account model, privacy/security, private document strategy, freeform Markdown projections, public-readiness controls |
| [07_MIGRATION_SCOPE_AND_GATES.md](07_MIGRATION_SCOPE_AND_GATES.md) | V1→V2 migration map, Moshe migration, new-user initialization, compatibility, phased implementation gates, beta/public/deferred scope |
| [08_FAILURES_RISKS_AND_OPEN_DECISIONS.md](08_FAILURES_RISKS_AND_OPEN_DECISIONS.md) | Failure modes, risk register, locked Gate 0 decisions, final design audit |

## Decisions made by this plan

1. Moshe is user #1 and a migration fixture, not a code path. The application must identify the current user before loading profile, documents, jobs, or seeds.
2. The existing eight V1 tables remain the durable opportunity/application core. V2 adds a small profile, document, pack, and AI-artifact layer instead of replacing the working job/application model.
3. Structured career facts are canonical for factual data; user-authored freeform career notes are canonical as freeform content. Generated Markdown is a projection/export, and imported Markdown/resume material produces reviewed claims with provenance.
4. A Career Pack is self-contained. It must not require an AI to read `docs/README.md`, access a local drive, know the repository, or infer Moshe-specific facts from application code.
5. Every persistent structured AI result states which profile revision, job/application revision, and task pack it used. Results become stale when those inputs change; plain-text scratch is not retained by default.
6. “Ask your AI” is one reusable handoff primitive with task-specific context minimization. It is not seven unrelated prompt boxes and it does not require a native AI integration for beta.
7. V2 will preserve explicit human review for imports, profile changes, application answers, and any write-back. No scraping, auto-apply, recruiter messaging, scheduled agents, or paid LLM integration is in scope.

## Non-goals and safety boundary

- Do not implement this design as part of the planning pass.
- Do not apply V2 migrations to production without a separately authorized gate.
- Do not rewrite current components or “clean up” V1 opportunistically.
- Do not move private CV binaries into Git or public URLs.
- Do not let an external AI mutate owner records directly.
- Do not imply that an imported claim is true merely because an AI produced it.
- Do not make a new account look like Moshe, inherit Moshe's CV paths, or inherit Moshe's achievements.

## Required implementation posture later

The locked decisions are consolidated in [V2_PRODUCT_CONTRACT.md](V2_PRODUCT_CONTRACT.md). Gate 1 provides a read-only compiler under `src/v2/`, using only non-production fixtures and transient output. Gate 2A adds the persistent profile foundation described below. Future implementation should read the contract together with the relevant detailed document, then pass the remaining gates in [07_MIGRATION_SCOPE_AND_GATES.md](07_MIGRATION_SCOPE_AND_GATES.md).

## Gate 1 implementation note

The read-only prototype is intentionally independent of React and Supabase:

- `src/v2/protocol.js` — provider-neutral Universal AI Protocol;
- `src/v2/fixtures.js` — clearly labelled Moshe and synthetic finance fixtures;
- `src/v2/tasks.js` — centralized seven-task registry;
- `src/v2/compiler.js` — privacy selection, context minimisation, Markdown/JSON rendering,
  manifest/hash/size metrics, validation, and self-containment linting.

Run `npm run v2:gate1` to generate transient Markdown, JSON, and manifest samples under
`output/v2-gate1-samples/`. These fixtures are non-production and contain no account IDs,
secrets, real contact details, local CV paths, network calls, or database writes.

## Gate 2A implementation note

Gate 2A adds the persistent profile foundation without exposing a half-built production
profile UI. `supabase/migrations/202609160001_career_profile_foundation.sql` defines
user-owned profiles and immutable, versioned revisions with RLS and atomic create-draft,
save-draft, publish, and discard operations. `src/v2/profile.js` defines the versioned
structured schema, stable item IDs, provenance and deterministic content representation;
`src/v2/profile-domain.js` provides provider-independent domain semantics and
`profileRevisionToCompilerInput` adapts a published revision into the Gate 1 compiler.

At Gate 2A this foundation was an explicit in-memory/domain test adapter and the
production UI remained unchanged. Gate 2B now adds a separate local browser adapter
and manual `/career` editor for non-Moshe users; it still does not enable cloud profile
access or seed/migrate Moshe. Documents, Storage, AI result write-back,
context/artifact tables and production migration remain deferred.

## Gate 2B manual profile UX — 2026-09-16

Gate 2B adds a local-only, manual Career profile experience at `/career`. New users see a Home setup prompt and can either open the guided editor or choose “I’ll do this later.” The editor uses small sections for basics, career direction, education, experience, projects/leadership, skills/languages, preferences, additional context and review.

A profile may be published when it has at least one target direction and one evidence entry (education, experience, project or leadership). Optional fields such as GPA, work authorisation and relocation are never required or inferred. Repeated entries have stable IDs and an explicit experience type. Draft edits autosave locally with visible saving status; publishing is a separate explicit action. Editing a published profile creates a copied draft, and discard requires confirmation. Published revisions remain available as read-only history.

Gate 2B is intentionally a local implementation boundary. It does not add AI onboarding, Markdown/resume import, document storage, Career Pack UI, production migration, cloud profile enablement or Moshe profile migration. The V2 profile repository uses a separate versioned local-storage key and does not merge with V1 browser data.

## Gate 2C status — 2026-09-16

The local Career area now supports transient text/Markdown source review, portable Profile Builder Pack generation, strict proposal import, per-item review, stale acknowledgement, and selective acceptance into a draft. Canonical structured facts remain authoritative; imported material and AI output do not publish or mutate the current profile without explicit review. No database schema or production data changed.

## Gate 3A shadow migration — 2026-09-16

Gate 3A is a local read-only compatibility exercise. It produces a deterministic Moshe
profile candidate, provenance and ambiguity/exclusion report, CV-variant preservation
report, operational-history checks, and Career Pack samples without creating a profile
or writing any database. Run `npm run v2:gate3a`; artifacts are written to
`output/v2-gate3a-shadow/`. The result is **awaiting owner review**. Gate 3B must not
begin until Moshe approves the human review checklist.
