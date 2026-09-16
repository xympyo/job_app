# Account, privacy, security, and document strategy

V2 should be public-ready only when the system can explain where a user’s profile, jobs, application records, documents, packs, and AI artifacts live; who can read them; how a user exports/deletes them; and what manual AI handoff actually shares.

## 1. Account and ownership model

- Supabase Auth remains the identity boundary for cloud workspaces.
- Every new table has `user_id`, RLS, owner-aware foreign keys, and tests for cross-user reads and writes.
- The client uses only the public anon key. Service-role/secret keys remain server-only and are never bundled or placed in user packs.
- A profile is loaded only after the authenticated user is known. No profile is selected by email, display name, browser state, or a URL parameter.
- Local mode remains explicit: browser storage, local-only identity, no cloud synchronisation, and a clear label. It must not pretend to be a public account or be silently merged into a signed-in account.
- Sign-out clears in-memory profile/pack state. Local data is retained only under the clearly labelled local workspace until the user exports or clears it.

## 2. Data classification

| Class | Examples | Default treatment |
| --- | --- | --- |
| Account secret | Password, reset token, service key, session token | Never in packs, logs, database exports, or AI text |
| Private document | CV binary, transcript, certificate, portfolio file | Private storage; metadata only in packs unless explicitly selected |
| Personal career data | Name, email, education, work history, salary preference, application answers | User-controlled; minimise per task; show before sharing |
| Employer/source data | Job description, source URL, freshness, company facts | Include only for the relevant task; retain provenance and date |
| Derived assistant content | Summary, fit analysis, draft, interview notes | Untrusted derived artifact; revision-linked and reviewable |
| Product telemetry | Error, event, timing | Minimise; never log raw document/answer content by default |

## 3. Private document strategy

### Cloud

Use a private Supabase Storage bucket or equivalent private object store. The database stores metadata, ownership, object key, size, MIME type, hash, variant, and lifecycle status—not a public URL or binary blob.

Required future controls:

- allow-list supported MIME types and extensions;
- enforce a documented file-size limit;
- validate content type server-side rather than trusting the browser;
- generate short-lived signed URLs only after an owner check;
- prevent object-key guessing and path traversal;
- scan/inspect uploads according to the hosting provider’s capability before making them available;
- retain a hash so duplicate files can be identified without reading them into a pack;
- support user deletion and account deletion with an explicit recovery window, if offered;
- do not expose storage keys in an AI prompt by default.

### Local mode

V1 local mode stores domain data in browser storage. V2 must make a deliberate decision before supporting local binaries: either keep document uploads metadata-only with an external user-selected file path, or use browser-managed storage with clear size and deletion semantics. A Windows filesystem path is not portable and must never be presented to an external AI as if it were a usable file.

### Packs and documents

The default pack includes document metadata and routing guidance, not CV binaries. A user may explicitly attach a document excerpt or file through their chosen AI, but PyoLoker should make the disclosure visible and should not upload that file to an AI provider itself in the manual-handoff beta.

## 4. Markdown and freeform projections

Structured career facts are canonical for factual data. User-authored freeform career notes are canonical as freeform content. Generated Markdown is a labelled projection/export; imported Markdown or resumes are preserved as source material and produce proposed claims for user review:

```text
canonical structured career facts + user-authored freeform notes
        ↓ generated projection with source map
PROFILE.md / Career Pack Markdown and structured exports
```

Rules:

- Original imported/source Markdown is preserved verbatim per revision; intentional freeform notes remain freeform content.
- A generated projection is labelled as a projection and has a source map.
- Editing structured facts creates a new profile revision; editing freeform notes updates that freeform content. Imported Markdown/resume changes create proposed structured claims with provenance.
- AI-generated prose is a proposal until the user accepts it into a designated field or revision.
- Export offers the generated Markdown projection together with canonical structured data and retained freeform notes; it is never treated as a second authority.

## 5. Pack privacy controls

Before copy/download, show:

- profile revision and `as of` date;
- job/application/source records included;
- document names included or excluded;
- sensitive fields included, masked, or omitted;
- terminal/old records excluded by default;
- exact pack size: private minimum, working context, or full career context;
- whether the pack is stored for re-download or generated transiently.

The user should be able to deselect a field or section. The app should remember a preference only when the user explicitly saves it, and the next export must still show the current manifest.

## 6. Public-readiness checklist

Before public beta:

- RLS tests cover every new table, storage object, RPC branch, and owner-aware join.
- Auth flows cover signup, email verification, login, logout, reset, expired links, and session expiry.
- Rate limits and abuse controls protect signup, auth, import, upload, export, and any future server-side extraction.
- CSP, secure headers, HTTPS-only production URLs, safe link validation, and no exposed secrets are verified.
- Import validators reject unknown dangerous structures, executable content, unexpected URLs, and oversized payloads.
- Public privacy notice explains manual AI handoff and that the user chooses what to paste/upload to an external provider.
- User export, account deletion, local clear, document deletion, and pack retention are tested.
- Error logs and analytics do not capture full profile Markdown, application answers, documents, or access tokens.
- Backup/restore, migration rollback, and incident response ownership are documented.
- Accessibility and mobile tests include pack preview, file controls, stale review, and keyboard navigation.

## 7. What is explicitly deferred

Native AI API calls, storing provider credentials, automatic document uploads to a model, background extraction, and model billing are deferred. BYO-AI means the user remains in control of the external conversation during beta.

## Gate 2C security and privacy boundary — 2026-09-16

Source import is transient and bounded to 200 KB. Only text/Markdown is accepted in this gate; binary document extraction is deferred. Imported text and Markdown are treated as adversarial user data and are rendered as quoted content, never protocol instructions or HTML. The Profile Builder Pack shows included/excluded sections before copy/download and excludes contact details, account identifiers, secrets, document binaries, and unrelated records. Proposal JSON is strict and versioned; unknown keys, unsupported targets, duplicate proposal IDs, missing evidence, and invalid operations are rejected before any draft mutation. Accepted proposals carry source references in the profile source map. No profile is published automatically.
