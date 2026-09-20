# Adaptive Food Coach backend

Status as of 20 Sep 2026: hosted schema is live; Expo can talk to Auth with the anon key. Run `pnpm backend:setup` to write env files and verify the stack. The API still needs the **service role** key before sync/AI/community writes work. Full product changelog: [`CHANGELOG.md`](../CHANGELOG.md).

The Expo app and API talk to the **adaptive-food-coach** Supabase project in the **7Labs** org (`ap-south-1`).

| | |
| --- | --- |
| Project | [adaptive-food-coach](https://supabase.com/dashboard/project/nhdjdifnylqxkrcdskny) |
| API URL | `https://nhdjdifnylqxkrcdskny.supabase.co` |
| Schema | `supabase/migrations/202609200001_backend.sql` |

## One-command setup

```bash
pnpm backend:setup
```

That writes both `.env` files and checks Supabase Auth. To finish automatically, either:

```bash
# Option A — personal access token (also sets auth redirect URLs)
SUPABASE_ACCESS_TOKEN=sbp_... pnpm backend:setup

# Option B — paste the service role JWT directly
SUPABASE_SERVICE_ROLE_KEY=eyJ... pnpm backend:setup
```

Get the service role key from [API settings](https://supabase.com/dashboard/project/nhdjdifnylqxkrcdskny/settings/api). Never put it in the Expo app. Optional: `OPENAI_API_KEY=sk-... pnpm backend:setup` for AI features.

Restart Expo after changing env files.

## Auth URLs

In [URL configuration](https://supabase.com/dashboard/project/nhdjdifnylqxkrcdskny/auth/url-configuration):

- Site URL: `http://localhost:8081`
- Redirect URLs: `http://localhost:8081/**`, `adaptive-food-coach://**`

Email confirmations stay on. Use the in-app OTP / update-password screens after signup or reset.

## Run

```bash
pnpm backend:test
pnpm backend:dev    # API on http://localhost:3001
pnpm app:dev        # Expo on http://localhost:8081
```

Writes go through the API (`service_role`). JWT clients can only read their own `app_records`, `account_revisions`, and `ai_requests`.
