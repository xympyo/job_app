# Failure modes, risks, open decisions, and final design audit

## 1. Failure-mode catalogue

| Failure mode | User impact | Detection | Required response |
| --- | --- | --- | --- |
| New user receives Moshe’s CVs, facts, or paths | Severe privacy/trust failure | Synthetic new-user fixture and account-isolation test | Stop rollout; delete/reseed only the affected empty workspace; never patch by display name |
| AI pack references `docs/README.md` or a local file | User gets unusable or misleading output | Pack lint checks for repository paths, Windows paths, hidden-doc instructions | Reject pack generation and show the missing context source |
| Pack includes more personal data than preview says | Privacy breach | Manifest-vs-payload comparison and red-team fixtures | Block copy/download; record a non-content error; fix assembler before rollout |
| AI result claims a job is open from an old snippet | User wastes application effort | Source date and freshness check; stale source label | Keep employer fact separate from AI inference; require current verification |
| Profile Markdown and structured fields conflict | Wrong CV/answer guidance | Source-map conflict detector and review diff | Keep both revisions; ask the user to resolve; do not overwrite |
| AI result was based on an older job/application revision | Stale answer or analysis | Revision hashes and `context_export_id` | Mark stale; allow view, require re-review before acceptance |
| Plain-text AI answer is accepted as a final answer | Loss of user control or false claim | Targeted write-back allow-list | Save as scratch/draft only; require explicit target acceptance |
| Imported JSON contains dangerous HTML/URL/file payload | XSS, phishing, or unsafe external navigation | Strict schema, safe text rendering, HTTP(S) URL validation | Quarantine and explain the rejected field; never execute/fetch it |
| Supabase RLS misses a new table/object | Cross-user data leak | Automated owner/cross-user tests and manual policy review | Block release until policies and composite ownership checks pass |
| Private CV binary becomes public | Sensitive document exposure | Storage policy tests, signed URL inspection, object-key checks | Revoke access, rotate links, remove public object, investigate incident |
| User deletes account but packs/documents remain | Privacy and compliance failure | Deletion reconciliation job/report | Make deletion transaction/reconciliation visible and retryable |
| Clipboard permission fails | User believes context was copied when it was not | Explicit success/error handling | Keep text preview and download/manual-select fallback |
| Mobile sticky controls cover content or focus | User cannot finish task safely | 320/390 viewport tests, keyboard/zoom checks | Adjust safe areas/scroll padding; do not hide actions behind hover |
| Home and Attention show competing next actions | Procrastination and ambiguity | Scenario tests with deadlines, ready applications, and stale jobs | Home summarises; Attention owns action detail |
| Migration loses application snapshot/history | Irrecoverable workflow loss | Count/hash/snapshot comparison and fixture rollback | Stop migration; restore from snapshot; investigate before retry |
| New profile asks for too much before any value | Onboarding abandonment | Funnel/drop-off and usability tests without content logging | Offer manual/skip/unknown paths; allow first task with a partial profile |
| User assumes “BYO-AI” means PyoLoker verifies the external AI | Misplaced trust | Copy review and onboarding comprehension test | State that external provider privacy/accuracy is user responsibility |

## 2. Risk register

| Risk | Likelihood | Severity | Mitigation / owner decision |
| --- | --- | --- | --- |
| The structured projection becomes an accidental second profile | Medium | High | Keep structured facts canonical, label Markdown as projection, preserve source maps, and require revision review |
| Pack minimisation is too complicated for ordinary users | Medium | High | Three presets, plain language, visible preview, usability tests |
| Stored AI artifacts retain more sensitive text than users expect | Medium | High | Scratch by default; retain only explicit saves/accepted provenance with redaction and delete/export |
| Supabase Storage/bucket rules are under-tested | Medium | High | Gate 2 security test plan and private-bucket fixture |
| Public beta support needs to inspect failures but cannot see content | Medium | Medium | Content-minimised diagnostics, user-provided export IDs, local reproduction |
| Profile onboarding asks for a perfect career story | Medium | Medium | Minimum viable profile, unknown values, progressive completion |
| V1 compatibility adds too much migration complexity | Medium | Medium | Separate compatibility adapter; keep V1 operational core intact |
| External AI formats vary and refuse the requested envelope | High | Medium | Plain-text scratch path; structured import optional; no provider lock-in |
| User expects the app to know current job market without research | Medium | Medium | Clearly label manual research/import and freshness fields; no autonomous crawler |

## 3. Gate 0 decisions (locked)

1. Structured career facts are canonical for factual data. User-authored freeform career notes remain canonical as freeform content. Generated Markdown is a projection/export. Imported Markdown/resume material is preserved and produces proposed structured claims with provenance for user acceptance; permanent two-way synchronization is not required.
2. `cv_versions` remains the canonical semantic CV-variant entity. `career_documents` represents optional private file/document versions attached to a variant. Existing CV IDs, recommendations, snapshots, and history survive unchanged.
3. Cloud documents target private Supabase Storage only after later gates prove owner-only access, signed short-lived URLs, validation, limits, deletion/export, and isolation.
4. Packs are transient by default. Retain only metadata needed for stale detection/provenance unless the user explicitly saves a full pack. AI responses are scratch by default and persist only when explicitly saved, imported, or accepted.
5. Use “your AI” as the provider-neutral product label. No provider configuration is needed for beta.
6. Use one active career profile per user in beta. Material career preferences live in versioned profile content; `career_profiles.preferences_json` is limited to product/account preferences.
7. Local-to-cloud transfer is explicit export/import with review; never automatic merge or silent binding.
8. Structured AI write-back requires a strict versioned envelope, allow-listed targets, preview, source context, and explicit acceptance. Plain text is untrusted scratch only.
9. Claims require visible evidence or explicit user confirmation; model confidence is never evidence.
10. Gate 1 is a read-only pack/compiler prototype and creates no `context_exports` or `ai_artifacts` persistence.

## 4. Final design audit

### Product clarity

- Does a new user understand that PyoLoker is a private career workspace, not an AI job board? **Yes in principle; onboarding copy must make the BYO-AI boundary explicit.**
- Can a user complete a workflow with no AI? **Yes; manual onboarding, job entry, application preparation, and progress remain first-class.**
- Can a user use any AI? **Yes; packs are provider-neutral and self-contained.**

### Trust and truth

- Is there one source of truth for profile facts? **Yes: canonical structured career facts, with user-authored freeform notes as freeform content and generated Markdown as projection/export.**
- Can a model silently change durable facts? **No by design; all proposals are reviewable and named-target.**
- Can stale context be detected? **Yes, if every export/artifact carries revision IDs/hashes; this is a Gate 4 requirement.**

### Multi-user safety

- Is Moshe user #1 without being a code exception? **Yes in the proposed model; V1 seed paths require an explicit migration boundary before implementation.**
- Are new users blank rather than Moshe-shaped? **Yes as a required fixture and gate.**
- Are private documents and packs scoped to the owner? **Yes as a requirement; not yet implemented in V1.**

### Usability

- Does normal operation require `/guide`? **No; Home, Jobs, Application, and Career provide contextual actions. `/guide` is secondary help/orientation.**
- Does it work as a public V2 guide? **No; repository/Astra/Moshe assumptions and lack of sharing preview must be removed.**
- Does Home duplicate Attention? **The current model risks overlap; V2 gives each a distinct job.**
- Does mobile remain viable? **The local audit found no horizontal overflow, but V2 must reduce long-form prompt density and test 320/390px with sticky controls and keyboard focus.**

### Scope discipline

- Does this design introduce scraping, auto-apply, messaging, scheduled agents, or paid LLMs? **No; all remain explicitly deferred/non-goals.**
- Does it require a native AI integration to deliver value? **No; manual copy/download is the beta path.**
- Does it preserve historical applications and outcomes? **Yes; V1 operational tables and snapshots remain authoritative.**

### Residual limitations

This is an architecture/UX audit, not a production security review, migration rehearsal, accessibility certification, or user study. The screenshots are local and the current app was inspected with local mode. The plan does not claim that Supabase Storage policies, public deployment controls, account deletion, or V2 schema behavior have been tested; those are explicit implementation gates.
