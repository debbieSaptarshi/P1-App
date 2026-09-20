# Changelog

All notable Adaptive Food Coach backend, app, and Supabase work. Dates are in UTC.

## Unreleased — 2026-09-20

Turned the simulator sample app into a signed-in product: Supabase Auth, a private per-user store, community APIs, and AI features. Connected that stack to a new **7Labs** hosted project.

### Supabase (7Labs)

- Created hosted project **adaptive-food-coach** (`nhdjdifnylqxkrcdskny`) in org **7Labs**, region `ap-south-1`.
- Applied `supabase/migrations/202609200001_backend.sql`:
  - Private records: `account_revisions`, `app_records`, `sync_mutations`, `ai_requests`
  - Community: groups, members, posts, likes, comments, challenges, reports, blocks
  - RPCs used only by the API: `account_snapshot`, `apply_record_changes`, `reserve_ai_request`, `community_snapshot`
  - RLS on every table; `anon` has no grants; JWT users can only **read** their own records/revisions/AI rows
  - Seed groups: Everyday nutrition, Move together
- Verified Auth is healthy and anon REST cannot read `app_records`.
- Scoped Cursor MCP at `.cursor/mcp.json` (`supabase-7labs`) to this project (enabled in Cursor).
- Local env templates: `artifacts/adaptive-food-coach/.env.example`, `artifacts/api-server/.env.example`. Gitignored `.env` files hold the hosted URL and anon key.
- Added `scripts/setup-backend.mjs` and root scripts: `pnpm backend:setup`, `backend:test`, `backend:dev`, `app:dev`.

**Still needed:** paste the **service role** key (or run setup with `SUPABASE_ACCESS_TOKEN`). Optional OpenAI key for AI. See `docs/BACKEND.md`.

### API (`artifacts/api-server`)

- JWT `requireAuth` on `/api/v1`; service-role client for writes.
- Account: snapshot, revisioned sync, export, delete (cascades via Auth), barcode lookup (Open Food Facts).
- Community: membership, posts, likes, comments, reports, blocks; counts come from SQL, not client counters.
- AI: analyze food/label/text, coach, meal plan, exercise parse, transcription. Idempotent reservations + 24h quota in SQL.
- Guards: CORS allowlist, per-IP and per-user rate limits, 13 MB JSON cap, no request-body logging.
- Shared Zod contracts in `lib/backend-contracts` (also used by Expo).
- 18 tests (`database`, `http`, `ai`, `sync`) covering RLS, sync conflicts, impersonation, and validation.

### Adaptive Food Coach app

- **AuthGate** routes signed-out users to sign-in, unfinished onboarding to welcome, and signed-in users to tabs. Demo mode is opt-in (`EXPO_PUBLIC_DEMO_MODE=true`).
- Store v2 syncs collections through `CloudSync` (offline queue, conflict “keep local / use cloud”).
- Auth screens call Supabase (sign-in, register, OTP, forgot password, **update password**).
- Scan/log: camera, barcode, label, voice, then **review** before writing a log. Results are estimates; user confirms nutrition.
- **Coach** screen: ask coach, meal ideas, or log-by-text. Add menu includes this route.
- **Privacy**: AI consent toggle, JSON export, account deletion.
- Subscription screen states this release is free with a daily AI fair-use limit.
- Voice input (up to 60s) via `expo-audio` + `/ai/transcribe`.
- Camera, mic, photos, notifications, location (runs) permissions in `app.json`.
- Sessions stored in SecureStore on native (chunked) and AsyncStorage on web.

### Other

- Ignore `.env`, `.supabase/`, and `.pnpm-store/` at the repo root.
- Extra Datta Kitchen storyboard comic frames under `artifacts/datta-kitchen-storyboard/downloads-comics/`.

## 2026-09-19 — `aaff6f5`

- Datta Kitchen storyboard panels and assembled slides for review.

## 2026-09 — simulator product (`40f1d09` and earlier)

- Adaptive Food Coach screens wired to a local store and Expo Camera (logging, groups, scan).
- Auth + 10-step onboarding, profile/community, progress/milestones, log/scan/exercise stacks.
- Tab bar Add menu navigating into those screens.
- Shared design primitives, types, and seed data for the Figma light-mode sample.
