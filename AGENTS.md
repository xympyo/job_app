# Project instructions

Read every file in docs before modifying this project, especially 00_HANDOVER.md,
02_USER_PROFILE.md, 09_DECISIONS.md, and 10_CURRENT_STATE.md. The handover's product
scope is authoritative. Keep the current state concise and update it after milestones.
Append decisions with date, rationale, and implications; preserve previous decisions.

Build for Find → Evaluate → Apply → Progress. React, Vite, JavaScript, Tailwind v4,
Supabase Auth/PostgreSQL, Vercel. Never add autonomous scraping, vacancy harvesting,
auto-applying, messaging, scheduled agents, paid LLM integrations, or speculative features.
Browser-based testing of this app is permitted; the ban concerns vacancy automation.

Markdown profile is canonical. Preserve historical application snapshots, stages,
CV selection, draft versus final answers, and outcomes. Do not inflate candidate facts.
All data belongs to a user. Maintain RLS and ownership-aware foreign keys. Never
commit credentials or CV binaries. Local mode is explicitly local, never cloud auth.
Validate untrusted imports and use safe text rendering and HTTP(S) external links.

Run npm run check and relevant tests before delivery. Test desktop and phone layouts.
Do independent implementation and troubleshooting; ask only for actual missing account
access, material product decisions, or subjective feedback. No production connection
is required for local development. Document real limitations rather than claiming
untested production behavior.
