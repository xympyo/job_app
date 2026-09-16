# Decisions (append-oriented)

## 2026-09-14 — Scope authority
Decision: Implement the supplied V1 faithfully. **Does this directly help Find → Evaluate
→ Apply → Progress? If not, defer it.** Rationale: support the job search, not software for
its own sake. Implication: no scraping, automation or speculative product additions.

## 2026-09-14 — Foundation and local mode
Decision: React/Vite/JavaScript/Tailwind v4; explicit browser-local adapter alongside
Supabase. Rationale: useful without production credentials. Implication: local data does
not synchronize and must be exported/backed up; hosted production requires Auth config.

## 2026-09-14 — Practical relational model
Decision: eight owned tables; snapshots, history and small lists use JSONB. One application
per job in V1. Rationale: simple persistent workflow with safe history. Implication:
reapplications are distinct vacancy records; ownership-aware foreign keys and atomic RPC.

## 2026-09-14 — Candidate and CV authority
Decision: Markdown is canonical. Three CV entities reference existing local PDFs without
publishing binaries. Rationale: avoid public personal documents and profile divergence.
Implication: desktop path references cannot open on a phone; private file storage is deferred.
Actual folder discovered: D:\Moshe\CV_Revised (requested D:\Moshe\CV\_Revised is absent).

## 2026-09-14 — Duplicate and freshness conventions
Decision: deterministic URL/requisition/title-token hints and explicit preview choices.
Rationale: titles vary; uncertainty must remain visible. Implication: no automatic destructive
merges. Freshness buckets use 7/14/30-day verification age, never invent a deadline.

## 2026-09-14 — Private deployment
Decision: no public signup UI; disable signup in Supabase and provision owner manually.
Rationale: single-user private application. Implication: actual cloud sign-in and hosted
deployment require Moshe's project access; no service-role credential requested.

## 2026-09-14 — Verification and release boundary
Decision: validate locally with domain/UI tests, mocked Supabase Auth, real embedded PostgreSQL RLS tests and browser responsive/accessibility checks. Rationale: production accounts are not connected. Implication: V1 implementation is locally verified, but actual Supabase/PostgREST and Vercel smoke tests remain mandatory after connection. No claim of completed production deployment.

## 2026-09-14 — Ready opportunities and initialization
Decision: Ready to Apply jobs appear under Applications even before creating their application workspace. Rationale: preparation belongs in Applications, and dashboard counts must lead to the matching work. Implication: the original snapshot is captured on explicit Prepare application. Concurrent first-login CV seeding handles unique-slug conflicts by reading the winning seed.

## 2026-09-14 — Public configuration boundary
Decision: expose only the Supabase URL and public anon key through explicit Vite definitions; reject privileged public keys and scan bundles for configured private credentials. Rationale: private credentials were supplied under VITE names. Implication: private keys have been renamed locally and removed from Vercel; project management requires a separate owning-account access token kept locally.

## 2026-09-14 — Production activation
Decision: apply the existing initial SQL through the owning-account Management API, disable public signup, set the production Auth URL and provision the owner with a generated password kept in an ignored local file. Rationale: the user authorized autonomous cloud completion and supplied working project access. Implication: no invitation emails were sent, initial migration is already applied (direct SQL, not CLI history), and future migrations must not recreate these tables. Supersedes the earlier manual-provisioning boundary. Two disposable QA accounts and all their rows were removed after live verification; only owner and three CV rows remain.

## 2026-09-14 — Verified account signup
Decision: enable email/password signup with mandatory email verification, a 12-character minimum and one-hour confirmation links. Rationale: the user requested account creation for other users while keeping each workspace private. Implication: signup starts an empty user-owned workspace; unverified users cannot sign in. The default Supabase email service is rate-limited and recipient-restricted, so custom SMTP is required for unrestricted production delivery. Confirmation links support both Supabase's default fragment redirect and a future token-hash template.

## 2026-09-14 — First usable workflow acceptance

Decision: preserve working authentication and the existing schema; defer custom SMTP as
explicitly accepted by Moshe. Prioritize direct vacancy creation/import, card review
actions, date-found/deadline context and Ready to Apply attention reminders.
Rationale: these close practical Find → Evaluate → Apply → Progress gaps without adding
speculative product work. Remove the redundant empty-dashboard promotional panel so
the actionable start and operational lists lead the page.
Implications: no migration, automation or new service is needed. Owner CV records remain
personal; new accounts stay empty. Use disposable accounts for production QA and delete
their data afterward. Browser viewport testing is not a claim of physical-phone testing.

## 2026-09-14 — Separate opportunity decision from application stage

Decision: `Ready to Apply` remains a job/opportunity decision; application workspaces use
`Preparing` before external submission. Submitted and later stages require `applied_at`,
and moving back to Preparing requires explicit confirmation and clears the date.
Rationale: one label must not represent both “I chose this role” and “I submitted an
application,” while still allowing users to record skipped hiring stages. Implication:
the new migration converts legacy application `Ready to Apply` rows to `Preparing` and
retains their stage-history timeline.
## 2026-09-15 — Bulk triage interchange

Bulk triage is a strict, user-confirmed export/import contract keyed by stable job UUID.
It reuses existing job decision and assessment fields, performs one atomic workspace
mutation, and excludes factual vacancy and application-history fields. This keeps the
AI-assisted workflow human-controlled without adding an LLM dependency or automation.

## 2026-09-15 — Application list and applied date

Applications defaults to active pipeline work; terminal outcomes remain historical and
filterable. The Applied transition owns the convenience default of today when no date
was entered, while preserving any existing or manually edited applied date thereafter.
The Applications workspace is sourced only from jobs with an application record; a
Ready to Apply decision alone does not create or imply an application workspace.
## 2026-09-15 — Consolidated Jobs workspace

Inbox and Applications are consolidated in the user-facing navigation as Jobs while the
jobs and applications tables remain separate. Application status dominates display state;
terminal records are excluded from the default Jobs view and remain filterable/available
in History. Legacy routes redirect without changing stored records.

## 2026-09-15 — Diversified live research batch

Decision: Use a conservative, multi-source manual research pass with explicit final-pass
open-status evidence, eligibility confidence and competition tiers; exclude uncertain or
conflicting vacancies from the actionable set and preserve them only in the research report.
Rationale: the prior batch over-weighted prestige funnels and included false-open listings,
which reduced application efficiency. Implication: this batch contains 20 verified records
with a 20% Reach / 55% Target / 25% Safer balance, remains a review import, and must be
rechecked before applying because vacancy state is time-sensitive.

## 2026-09-15 — Repository documentation as the career operating system

Decision: `docs/README.md` is the AI-agent entry point, while the profile, CV strategy,
data model, research, triage and application documents are the progressive-disclosure
operating layer. Existing audit/QA documents remain supporting history.
Rationale: repeated prompts were recreating policy and producing inconsistent triage;
the repository already contains the facts and enforced contracts needed to operate it.
Implications: future sessions should read the relevant workflow docs before acting, use
current PyoLoker records as facts, preserve dated research as temporary evidence, and
append policy changes here rather than duplicating them in reports.

## 2026-09-15 — Start Here guide

Add a concise in-app guide at `/guide` so Moshe can operate the documented career
workflow without opening repository Markdown. Keep prompts short and repository-aware;
the Markdown operating system remains authoritative. Derive the recommended next step
from existing workspace state and do not add tutorial persistence or automation.

## 2026-09-15 — V2 planning boundary and BYO-AI architecture

Create a planning-only V2 package under `docs/v2/` for a future multi-user, BYO-AI
Career Operating System. Keep the current eight-table job/application core, make
Moshe an explicit migration fixture rather than a code-level default, preserve
user-authored Markdown as the canonical profile narrative, and introduce portable,
versioned Career Packs with task-specific minimization and stale-output review.

Rationale: the current `/guide` is useful for a repository-aware Moshe workflow but is
not portable to a new user or an arbitrary external AI; current CV seed constants and
local paths are also incompatible with public multi-user initialization. Implications:
this pass must not implement V2, create migrations, mutate production/owner data, or
refactor V1 opportunistically. Future implementation is gated by the package’s open
decisions, RLS/storage tests, migration dry run, new-user isolation fixture, and
manual/AI-assisted onboarding review.

## 2026-09-16 — V2 Gate 1 read-only Career Pack compiler

Implement the first V2 gate as a framework-independent compiler over non-production fixtures only.
Structured career facts and freeform notes follow the locked V2 contract; generated Markdown is a
projection. Support provider-neutral, self-contained Markdown and JSON packs, privacy presets,
manifests, deterministic output and linting without database writes or persistence tables. Rationale:
prove the portable AI-context abstraction before profile persistence or onboarding. No external AI
call or result write-back exists in this gate.

## 2026-09-16 — Gate 1 correction pass

Correct the read-only fixtures and compiler to keep expected December 2026 graduation separate
from availability, leave unsupported work-authorisation unknown, place factual task context only
under Relevant context, derive manifests from assembled payload sections, and include centralized
portable task policy plus complete structured contracts only for research and triage. Semantic
Markdown renderers and explicit user-data boundaries improve review without changing V1 data or
starting Gate 2.

## 2026-09-16 — Gate 2A persistent career-profile foundation

Decision: add a minimal user-owned `career_profiles` / `career_profile_revisions` layer
with one editable draft, explicit atomic publication, immutable published history,
validated provenance and deterministic content hashes. Keep Gate 1's compiler pure and
adapt published revisions into it through a domain adapter.
Rationale: profile facts need durable ownership and revision semantics before onboarding
or migration can be designed safely. Structured facts remain canonical; freeform notes
remain separate user-authored content; generated Markdown remains a projection.
Implications: the migration is local-only and unapplied to production; Moshe remains a
fixture; no onboarding UI, document storage, context/artifact persistence or AI
write-back is included. The local profile adapter is in-memory/provider-independent for
Gate 2A validation, while existing V1 local storage remains unchanged.

## 2026-09-16 — V2 Gate 2B manual onboarding UX

Decision: add a local-only guided Career profile editor with optional setup, private autosaved drafts, explicit publish, copied drafts for edits, discard confirmation and read-only revision history. Require only one target direction plus one evidence entry to publish; do not require GPA, degree, work authorisation or other inferred facts.

Rationale: a first-class manual path is needed before any AI or migration workflow, and the profile contract requires user review and explicit publication. Implications: the editor uses a separate versioned local-storage boundary and no production migration, cloud profile enablement, document storage, AI onboarding or Career Pack UI is included in Gate 2B.

## 2026-09-16 — Gate 2C source import and AI profile proposals

Gate 2C keeps structured profile facts canonical and treats pasted/Markdown source and external-AI output as transient untrusted material. The new `build_profile` Career Pack is self-contained and portable. Strict proposal envelopes use allow-listed targets and explicit add/change/remove operations; accepted items update only a draft and carry `accepted_ai_proposal` provenance. Stale source context requires explicit acknowledgement. No migrations, storage tables, provider APIs, production data, or owner records were changed.
