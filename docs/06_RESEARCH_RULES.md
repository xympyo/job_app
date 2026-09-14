# Research and import rules

Research is explicitly requested and performed outside this app. No background searches.
Prefer company careers → official recruiter posting → reputable platforms → secondary sources.
Imports may use descriptive provenance labels such as “Official recruiter posting” or
“University career center”; validation normalizes these to the stored Official posting or
Secondary categories while keeping the original source name and URL.
LinkedIn, Jobstreet, Glints, Kalibrr, Indeed, university career centers are discovery sources.
One vacancy can have many sources. Do not fabricate unknown requirements, dates or freshness.
Retain original URL, application URL, requisition ID, found/published/verified times, notes,
evidence, fit, gaps, flags and recommended CV. Missing values remain null/unknown.

Freshness derives from verification age (≤7 Fresh, ≤14 Recent, ≤30 Aging, older Possibly stale)
with deadline/posting Closed or Expired taking precedence. Unverified is explicit. Thresholds
are operational conventions, not proof. Manual states: Verified open, Possibly open, Closed,
Expired, Unknown. Only explicit verification updates last_verified_at.

Import contract and example are in docs/research-import.example.json and src/lib/import.js.
Strict schema, bounded arrays/strings, safe HTTP(S) URLs and ISO dates. Preview before writes.
Match normalized company plus token-normalized title/location, canonical URLs or requisition.
Uncertain matches require review. Default duplicate choice is skip; source merge retains
the existing vacancy and application. Keep separate requires explicit user choice.
Trace research runs without requiring them for manual entry. No scripts or HTML execution.
