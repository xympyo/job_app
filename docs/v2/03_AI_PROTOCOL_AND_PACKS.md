# Universal AI Protocol and Career Packs

## 1. The three-layer protocol

Every handoff is assembled from three independent layers so that the user can reuse an AI without copying the whole workspace every time.

### Layer A — Universal AI Protocol

Stable, provider-neutral operating rules:

- Act as a career collaborator, not an employer representative or autonomous agent.
- Use only supplied facts for claims about the person, employer, job, and application.
- Separate `FACT`, `INFERENCE`, `UNKNOWN`, and `SUGGESTION`.
- Do not invent dates, tools, responsibilities, outcomes, salary, eligibility, or employer facts.
- Treat final-year/student status and experience labels as timing-sensitive.
- State when a source may be stale and do not imply that “open” is proven by a search snippet.
- Return proposals in the requested schema; never claim that anything was submitted or saved.
- Ask for missing material facts rather than filling them with plausible language.
- Keep private data to the minimum requested task and do not repeat sensitive values unnecessarily.

This layer is intentionally short enough to be included in every task pack and useful outside PyoLoker.

### Layer B — User Profile

The user-approved, versioned career context:

- identity and preferred name;
- location, work mode, relocation, work authorisation, and timing constraints;
- education and graduation timing;
- experience, projects, leadership, skills, languages, and evidence;
- target role families and preferences;
- compensation preferences when the user chooses to share them;
- CV/document variants and what each is designed to emphasise;
- explicit claims to avoid or explain;
- canonical structured career facts and user-authored freeform notes, with source map, revision number, and hash; generated Markdown is a projection/export.

The profile is not a free-form “write the best answer about me” prompt. It contains enough evidence to ground a task and enough provenance to expose uncertainty.

### Layer C — Task Context

The minimum current records needed for one task, for example one job, one application question, one interview stage, or one progress review. It includes the user’s request and the requested output shape, but excludes unrelated jobs, private documents, and old application history unless they are materially relevant.

## 2. Portable Career Pack

### Full Career Pack

The full pack is a user-approved export for a substantial session with an AI. It is self-contained and readable in a text editor. A downloadable package should contain:

```text
career-pack/
  README.md                 what this pack is, created date, revision, redactions
  protocol.md               Universal AI Protocol
  profile.md                generated Markdown projection/export
  profile.json              structured projection + source map
  preferences.json          product/account sharing preferences only; career preferences come from the profile revision
  cv-index.json             metadata and selected-variant guidance, no binary by default
  tasks/                    optional task contexts chosen by the user
  sources.json              source IDs/URLs and verification metadata when allowed
  manifest.json              version, hashes, inclusion/redaction manifest
```

“Copy full context” should produce the same logical content as the download, formatted for a clipboard-friendly interaction. Packs are transient by default; Copy never creates a permanent full-payload record. The user can preview the text before copying and can choose a privacy-minimal variant.

### What full does not mean

Full means “all selected career context,” not “all database rows.” It excludes by default:

- passwords, access tokens, Supabase identifiers that are not needed, internal owner IDs, and private account metadata;
- private document binaries and raw extracted text unless explicitly selected;
- unrelated employers, application answers, personal contacts, or notes;
- stale or terminal records unless the user selects history for a specific task.

## 3. Task-specific packs

Task packs are the default handoff because they reduce leakage and cognitive load. Each preview must show included sections and an exclusion count.

### Task pack matrix

| Task | Required context | Optional context | Exclude by default | Expected output |
| --- | --- | --- | --- | --- |
| Research opportunities | target profile summary, role/location preferences, timing, competition/eligibility rules, freshness rules, requested market | current job IDs to avoid duplicates, compensation preference | application answers, private files, unrelated history | candidate opportunities with sources, open-status evidence, gaps, and a reviewable import envelope |
| Triage current jobs | selected jobs, sources, posting/verification dates, requirements, profile summary, CV routing rules | current workload/deadlines, prior decisions | full application answers, unrelated documents | ranked queue, fit reasoning, competition tier, confidence, recommendation |
| Analyse one job | one job and sources, relevant profile evidence, timing, CV variants | one or two comparable jobs | unrelated companies, whole application history | fact/inference/gap analysis and recommended action |
| Prepare application | one job, one application, selected CV metadata/text if user allows, relevant evidence, exact question | one accepted prior answer, user tone preference | unrelated employers, private notes, unused documents | draft answer(s), missing facts, final-review checklist; never submission |
| Interview preparation | one application/stage, job responsibilities, relevant experience/project evidence, user questions | prior application draft, interviewer-provided material | unrelated job history, unnecessary PII | rehearsal plan, STAR evidence map, questions, gaps to clarify |
| Progress review | active applications, next actions, deadlines, recent events, outcome summary | selected history and workload preference | raw profile/documents, stale research batch | blockers, three next actions, process improvement suggestions |
| Profile onboarding | user-provided resume/Markdown, education/work inputs, desired roles, timing | optional AI-assisted extraction | anything not explicitly supplied | proposed structured profile with source map and questions; never silent publication |
| Document/CV routing | job responsibilities, profile evidence, CV variant metadata | selected CV text | other private files and application history | recommended variant with rationale and gaps |

### Minimisation controls

The user chooses one of:

- **Private minimum:** no name, contact details, document content, or stable IDs unless required by the task.
- **Working context:** display name, relevant profile facts, job/application context, and selected evidence.
- **Full career context:** the full approved Career Pack, still excluding secret/account material and unselected binaries.

The UI must make the choice visible before copy/download. It should use a “Show what will be shared” disclosure rather than a hidden checkbox.

## 4. One reusable “Ask your AI” primitive

The future primitive is a component/service with the same interaction everywhere:

1. User chooses a task or opens a task already attached to a job/application.
2. PyoLoker explains the task and recommends a pack size.
3. User reviews included sections, sensitive fields, source dates, and exclusions.
4. User edits the request and chooses `Copy`, `Download`, or `Copy JSON`.
5. User takes the pack to any AI.
6. User pastes or uploads the result back through `Review AI result` when a supported envelope is available.
7. PyoLoker validates, displays facts/inferences/unknowns, marks stale references, and offers explicit target acceptance.

The component’s output should be understandable even if the user never imports the AI result. It must say “Copied to clipboard” only after a successful browser operation and provide a visible download fallback when clipboard access is denied.

### Provider-neutral language

The current V1 page says “Astra” and assumes the AI is working in the repository. V2 should say “your AI” or let the user set a display label. Provider-specific instructions can be an optional preference, never a dependency. No API key is stored or requested for the beta handoff.

## 5. Output protocol for AI results

An AI result should be requested in two parts:

```text
Human-readable answer
Structured proposal envelope (if the user wants to bring it back)
```

The structured part should include:

- `format`, `format_version`, `kind: "ai_result"`;
- `based_on.context_export_id` and revision hashes when available;
- `facts_used`, `assumptions`, `unknowns`, and `risks`;
- `proposals` with a named, allow-listed target;
- `questions_for_user`;
- `confidence` as calibrated explanation, not a fake probability;
- `created_at` and `model_label` only if the user provides them.

The app must treat a pasted plain-text answer as a normal untrusted draft. It can remain transient or be explicitly saved as scratch; it can never write canonical data directly. Structured write-back requires the strict envelope, source context, preview, and explicit review.

## 6. Freshness and truth controls

- Every export shows `as of` dates for profile, job source, and application status.
- Open-status claims must retain the source and verification method; an AI cannot convert an old listing into “open.”
- Every proposed application answer shows the source evidence it used.
- “No evidence supplied” is a valid output and should be preferable to an invented accomplishment.
- When a fact is changed in the profile, affected packs and artifacts are labelled stale. The user can regenerate them; the app does not silently rewrite previous AI outputs.
- Accepted drafts create a normal application event or profile revision so history remains intact.


## 7. Retention and provenance

Pack payloads and external-AI responses are not retained by default. When later persistence is needed for stale detection or structured write-back, retain only pack ID, task, revision/hash manifest, included-record references, generated time, and redaction/inclusion manifest. A full payload or AI response is retained only when the user explicitly saves it, imports it, or accepts it into a named target; accepted content records its source context and normal domain history. 

## Gate 2C correction status — 2026-09-16

Gate 2C adds a local, review-first source import and external-AI-assisted profile proposal flow. Supported source inputs are pasted text/Markdown and `.txt`/`.md` files. Source material is transient browser state; no document table, storage bucket, filesystem path, or AI artifact is created by this gate. PDF/DOCX extraction remains deferred.

The `build_profile` task reuses the Gate 1 compiler and includes a portable profile policy plus a complete `pyoloker.profile-proposal` 1.0 output contract. Profile proposals are strict, versioned envelopes with allow-listed targets and `add`/`change`/`remove` operations. Imports are parsed and reviewed without mutation; accepted items are written only to the current draft with `accepted_ai_proposal` provenance. Publishing remains a separate explicit action. Stale source revision/hash context is surfaced and requires explicit acknowledgement. Plain text and source material remain untrusted data and are rendered with an explicit boundary.

Gate 2C profile packs default to the private-minimum preset, expose a selectable privacy preset and preview, and redact obvious contact/secret patterns from transient source text before handoff. Deterministic local extraction is deliberately conservative; it produces the same reviewable proposal shape as an AI result and never publishes by itself. Conflicting current values remain visible for user review.

## Preference resolution rule — 2026-09-16

Preferences are user-specific and mutable. Packs and task policies must not infer
employment type, location, work mode, relocation, timing, compensation or other
constraints from unrelated facts. Unknown remains unknown. If a missing preference is
material to the current task, the user's AI should ask one concise targeted question;
otherwise it should continue. An opportunity-specific answer remains scoped to that
opportunity unless the user explicitly confirms it as a general preference.
