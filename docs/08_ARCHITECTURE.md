# Architecture

React + Vite + JavaScript, Tailwind CSS v4 Vite plugin, React Router, Supabase JS SDK.
Vercel static SPA hosting with route fallback. No background workers or application server.
src/lib owns constants, validation, import/deduplication, domain commands and data adapters.
React context owns auth, load/save/error state. Components/pages render text safely.

Local development works without credentials using explicit browser-local mode. Hosted
production fails closed without Supabase config. No silent fallback from cloud errors
to local storage. Cloud session is verified via Auth; RLS remains the authorization boundary.
Email/password sign-in and verified email signup. New accounts begin with an empty, owned
workspace; email confirmation is required before sign-in. Supabase Auth enforces the
12-character minimum and verification link expiry. Custom SMTP is deferred for this
private-use milestone; the accepted default provider is rate-limited and recipient-restricted.
Auth changes clear data immediately. Never reuse another account's in-memory data.

Supabase mutations use an atomic RPC with ownership checks and optimistic concurrency.
Reads load normalized tables; writes send only changed rows, never replace the database.
Local mutations clone/validate/persist atomically and surface quota/parse failures.
Exports contain user data; no credentials. CV PDFs stay outside repository and public assets.

Dependencies locked in package-lock.json. Vitest + Testing Library test business and UI
flows, SQL integration tests exercise migrations/RLS, browser QA checks responsive app.
See README for connection/deployment and 10_CURRENT_STATE.md for actual verification.

Overview creation reuses JobForm; card review actions reuse the owned mutation path.
Attention derives Ready to Apply reminders from existing rows, with no scheduler or new
tables. Source links remain HTTP(S), and imported content is rendered as text. The first
usable workflow required no authentication refactor or database migration.

References: [Tailwind Vite](https://tailwindcss.com/docs/installation/using-vite),
[Supabase React](https://supabase.com/docs/guides/getting-started/tutorials/with-react),
[Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
