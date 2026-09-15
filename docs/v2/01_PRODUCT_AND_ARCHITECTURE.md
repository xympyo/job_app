# V2 product model and architecture

## 1. Product model

PyoLoker V2 is a private career operating system for one person at a time. It helps a user maintain a trusted career profile, collect and evaluate opportunities, prepare applications, and track progress. It deliberately uses external AI as a user-controlled collaborator rather than embedding an always-on agent.

### The product boundary

| PyoLoker owns | An external AI may help with | Neither should do silently |
| --- | --- | --- |
| Canonical profile facts and evidence | Summarising, comparing, drafting, rehearsing, and suggesting | Inventing experience, changing facts, or sending an application |
| Job, source, freshness, and triage records | Fit analysis and prioritisation from supplied context | Treating a stale listing as current |
| Application snapshots, questions, drafts, final answers, events, and outcomes | Drafting answers grounded in supplied evidence | Replacing final answers or history without approval |
| CV/document metadata and private storage references | Recommending a variant or extracting a structured view | Exposing a private file by default |
| User decisions and explicit imports | Returning a machine-readable proposal | Writing directly to PyoLoker or contacting employers |

This preserves the V1 Find → Evaluate → Apply → Progress loop while adding a controlled context handoff. A user can use ChatGPT, Claude, Gemini, a local model, or no AI at all. The beta experience needs only copy/download and review/import primitives.

### Core entities and identity

Every durable entity is owned by the authenticated user. The runtime relationship is:

```text
authenticated user
  └── career profile (revisions and projections)
       ├── private documents / CV variants
       ├── companies → jobs → sources
       ├── applications → questions → events
       ├── research runs / imports
       └── versioned context exports → derived AI artifacts
```

The same user can have many profile revisions, CV variants, jobs, and applications. A Career Pack can reference those entities by stable IDs and revision hashes, but an AI result cannot become authoritative merely because it contains a matching ID.

## 2. What the current repository actually is

The audit found a solid V1 core rather than a blank slate:

- React, Vite, JavaScript, Tailwind v4, Supabase Auth/PostgreSQL, and Vercel are the documented stack.
- The current database model has eight owned tables: `cv_versions`, `companies`, `research_runs`, `jobs`, `job_sources`, `applications`, `application_questions`, and `application_events`.
- RLS and composite owner-aware foreign keys are already central to the schema. The security-invoker `apply_changes(jsonb)` RPC is the controlled cloud mutation path.
- The current repository has a local browser mode and a cloud mode. Local mode is intentionally local; it is not an alternate public account system.
- The app already preserves application snapshots, question drafts/final answers, stage history, CV selection, and outcomes.
- The existing candidate profile and CV strategy are deliberately truthful: Mattel is an internship, Homize is freelance/project work, and leadership evidence is distinct.
- Navigation currently centers on Overview, Jobs, Start Here, Attention, History, Research import, Companies, and Career toolkit.
- The current `/guide` provides a recommended next step, four workflow cards, seven copyable prompts, and useful links.

These strengths should be extended, not discarded. V2 should not replace the job/application tables with an AI-shaped data model.

## 3. Current architectural findings and V2 gaps

| Finding in V1 | Why it matters for V2 | Planned response |
| --- | --- | --- |
| `CV_SEEDS` contains Moshe labels and local Windows paths | A new account could receive Moshe-shaped records or unusable paths | Move seeds behind explicit user initialization; new accounts start with an empty profile and an onboarding choice |
| `seedCVs()` is invoked as a generic workspace initialization helper | “First workspace” and “Moshe migration” are currently too close conceptually | Introduce a user-owned initialization state and an explicit import/migration package |
| No profile, profile revision, preference, or evidence tables exist | Multi-user onboarding has nowhere durable to store canonical profile context | Add a small versioned profile layer; structured career facts and user-authored freeform notes are canonical; Markdown is a projection/export |
| Prompts say `Read docs/README.md` and refer to Astra, Moshe, Mattel, Homize, and repository workflows | Public users cannot provide a local repository to an arbitrary AI | Generate self-contained protocol/profile/task packs with no hidden dependency |
| Current prompts are seven separate copy blocks | The handoff is hard to discover, hard to minimise, and easy to make stale | One reusable “Ask your AI” primitive with task selection and a context preview |
| `cv_versions` stores metadata, but private document storage is not a V2 product concept | Users need safe upload, export, and deletion semantics | Add document metadata and private object-storage strategy; no public file links |
| Cloud loading currently reads the eight V1 tables for the user | The V1 pattern is understandable but does not yet include profile/pack revision checks | Add bounded, owned reads and revision-aware exports before adding richer AI artifacts |
| Attention is a derived queue; Home also contains next steps and counts | Duplicate surfaces can create competing “next actions” | Home is orientation; Attention is the actionable queue. One item has one canonical home |
| Local mode stores data in browser storage with a fixed local identity | Useful for personal development but not a multi-user account guarantee | Preserve it as an explicit local mode; add export/import and clear identity labeling |
| Production-readiness notes and current workspace counts can drift | Planning can overstate safety | Add a release evidence checklist and record tested claims with dates |

## 4. Generalising Moshe-specific assumptions

The following are migration inputs, not V2 defaults:

| Current Moshe assumption | General V2 representation | Rule |
| --- | --- | --- |
| Name “Moshe Dayan” | `profile.identity.display_name`, owned by the current user | Never hard-code display name in UI, prompts, seed data, or routes |
| President University / Informatics / GPA 3.80 / Dec 2026 | Education entries and graduation timing in the user profile | Empty until supplied; a user may have several degrees or no degree |
| Mattel Process Engineering Intern | Experience entry with employer, kind, dates, evidence, and status | Preserve internship/freelance/volunteer distinctions; do not flatten into “years of experience” |
| Homize and PUMA/HIMA | Experience/leadership/project records with user-provided names | No new user inherits companies, amounts, or outcomes |
| Three named CV variants | User-defined document variants, with optional starter labels | Starter labels are suggestions; contents and names belong to the user |
| Jakarta / Cikarang / Jabodetabek priority | Location preferences and commuting/relocation constraints | No assumption that Indonesia or Jakarta applies to other users |
| `LOCAL_USER` UUID | Explicit local workspace identity with a local-only flag | It must never be treated as a cloud account or copied into a new account |
| Career prompts mentioning Astra | User-selected AI handoff; provider-neutral language | The protocol must work when the user has no AI subscription |
| `D:\Moshe\CV_Revised\...` | Private document object metadata and user-visible “missing file” state | A filesystem path is never portable data |

## 5. Source-of-truth model

The source-of-truth design is intentionally asymmetric: the app owns facts and decisions; AI owns no durable fact unless the user accepts it.

### Authority layers

1. **Account and ownership:** Supabase Auth identity, RLS owner, local-mode boundary, and account settings.
2. **Canonical profile:** structured career facts with evidence/source pointers, plus user-authored freeform career notes. A revision is immutable after publication; edits create a new revision. Generated Markdown is a labelled projection/export, not an independent authority.
3. **Operational records:** companies, jobs, sources, research runs, applications, questions, events, CV metadata, and outcomes. These remain the V1 authority for workflow state.
4. **Private documents:** uploaded files and their metadata. A document can support a profile claim but does not silently rewrite it.
5. **Projections:** structured search fields, CV routing labels, summaries, and Markdown views derived from canonical content. Every projection records its source revision and generation status.
6. **Context exports:** user-approved snapshots generated for a handoff. In beta they are transient by default; only the manifest needed for stale detection/provenance is retained unless the user explicitly saves the pack.
7. **AI artifacts:** untrusted scratch/drafts by default. A structured result is retained only when explicitly saved, imported, or accepted, with source context and input revisions; accepted content becomes a normal domain revision/event.

### Relationship rules that prevent duplicate truth

- A company/job/application has one canonical record. A source URL is a source, not a second job.
- A profile revision has canonical structured facts and freeform notes. A generated Markdown projection and Career Pack contain copies with a revision/hash, not editable shadow profiles.
- `cv_versions` is the canonical semantic CV-variant entity. `career_documents` are private file/document versions attached to a variant; an AI copy is not a second CV record.
- An AI draft is not an application answer until the user accepts it into the application’s draft or final field.
- An imported pack is previewed as a diff. It never overwrites a newer profile revision or application history automatically.
- When two facts conflict, the UI shows the conflict and asks the user to choose; it never resolves by recency of AI output alone.

## 6. Proposed information architecture

### Primary navigation

```text
Home                 orientation and one recommended next move
Jobs                 all tracked opportunities across their lifecycle
Attention             only actionable blockers, deadlines, and follow-ups
Career                profile, CV variants, documents, and pack tools
History               completed/terminal work and change history
Settings              account, privacy, export, local/cloud status
```

Research import, companies, and other utilities remain secondary/contextual tools rather than competing primary destinations. The backend keeps jobs and applications separate while Jobs presents one user-facing workspace.

### Home versus Attention

| Surface | Job to be done | Allowed content | Explicitly not allowed |
| --- | --- | --- | --- |
| Home | Re-orient the user in under one minute | One recommended next move, compact counts, recent change, quick start | A second full task queue, all deadlines, duplicated job lists |
| Attention | Help the user clear work | Deadline, missing answer, stale verification, follow-up, blocked import, each with owner/action/status | General analytics, full history, speculative recommendations |

Every Attention item links to the underlying job/application/profile revision and can be dismissed, snoozed, or resolved with an explicit event. Home may summarise “3 items need attention” but must not render a second copy of the queue.

### Product principles

- **Trusted before clever:** facts and provenance appear before AI suggestions.
- **One next move:** every empty state and task view offers one clear next action.
- **Minimum necessary context:** share less by default; show exactly what will be shared.
- **Portable by construction:** copy/download works without a repository, hidden documentation, or vendor account.
- **Human-controlled writes:** every mutation is visible, reversible where possible, and attributed.
- **Progress over prestige:** ranking follows user fit, timing, evidence, effort, and realistic competition—not brand name.
- **No silent loss:** imports, migrations, version changes, and document replacement preserve the prior state or offer a recoverable archive.
