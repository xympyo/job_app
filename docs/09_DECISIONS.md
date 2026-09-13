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
