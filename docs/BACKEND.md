# Adaptive Food Coach backend

Status as of 20 Sep 2026: hosted schema is live; Expo can talk to Auth with the anon key. Run `pnpm backend:setup` to write env files and verify the stack. The API still needs the **service role** key before sync/AI/community writes work. Full product changelog: [`CHANGELOG.md`](../CHANGELOG.md). Store submission (bundle IDs, EAS, legal URLs, TestFlight/Play): [`STORE.md`](STORE.md).

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

## Social login (Google and Apple)

Sign in and Register use the same Google and Apple buttons. Facebook Login is hidden in store builds. First time creates the account; next time signs the same identity in. New social users still go through onboarding.

The app is wired with PKCE (`signInWithOAuth` → in-app browser → `exchangeCodeForSession`). **Google will not complete until the provider is enabled** on the hosted project.

Callback URL to paste into Google (not the app scheme):

`https://nhdjdifnylqxkrcdskny.supabase.co/auth/v1/callback`

Confirm they are on with `pnpm backend:setup`. You want `✓ Google provider enabled`. Apple can be native on iOS even if the Supabase Apple provider is off.

Open [Auth providers](https://supabase.com/dashboard/project/nhdjdifnylqxkrcdskny/auth/providers).

Redirect allow list must include `adaptive-food-coach://**`. Keep `exp://**`, `exps://**`, and `http://localhost:8081/**` only for local/Expo Go testing. Test Google on a **dev/preview build** (`npx expo run:ios` / `eas build --profile preview`), not Expo Go — Expo Go cannot own the `adaptive-food-coach://` redirect.

### Google

1. In [Google Cloud Console](https://console.cloud.google.com/apis/credentials) create an OAuth client of type **Web application**.
2. Authorized redirect URI: the callback URL above.
3. Enable **Google** in Supabase and paste the client ID and secret.

### Facebook (not in v1 store builds)

Leave this off for the first App Store / Play submission. The Facebook button only appears if `EXPO_PUBLIC_ENABLE_FACEBOOK=true`. Meta app review adds weeks.

1. In [Meta for Developers](https://developers.facebook.com/apps) create an app and add **Facebook Login**.
2. Valid OAuth Redirect URI: the callback URL above.
3. Under Use Cases → Authentication, enable `email` and `public_profile`.
4. Enable **Facebook** in Supabase and paste the App ID and App Secret.
5. While the Facebook app is in Development mode, add your Facebook account as a tester.

### Apple

Native Sign in with Apple on iPhone (`expo-apple-authentication`). Android/web falls back to Apple OAuth.

1. In [Apple Developer](https://developer.apple.com/account/resources/identifiers/list) enable **Sign in with Apple** on App ID `com.sevenlabs.adaptivefoodcoach`.
2. Create a Services ID and a Sign in with Apple key. Note Team ID, Key ID, and the `.p8` file.
3. Enable **Apple** in Supabase. Client IDs (comma-separated):
   - `com.sevenlabs.adaptivefoodcoach` (dev/production build)
   - the Services ID first if you also want Apple on Android/web
   - `host.exp.Exponent` only if you still test in Expo Go
4. Test on a physical iPhone or a Simulator signed into an Apple ID.

Or pass credentials into setup instead of the dashboard:

```bash
SUPABASE_ACCESS_TOKEN=sbp_... \
GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... \
FACEBOOK_CLIENT_ID=... FACEBOOK_CLIENT_SECRET=... \
APPLE_CLIENT_ID="com.sevenlabs.adaptivefoodcoach" \
APPLE_SECRET=... \
pnpm backend:setup
```

## Auth URLs

In [URL configuration](https://supabase.com/dashboard/project/nhdjdifnylqxkrcdskny/auth/url-configuration):

- Site URL: `http://localhost:8081` for local work; production should use the HTTPS API or marketing origin. See [`STORE.md`](STORE.md).
- Redirect URLs: `http://localhost:8081/**`, `adaptive-food-coach://**`, `exp://**`, `exps://**`

Hosted Auth now **auto-confirms email signups**, so Create account returns a session and Sign in works immediately. Confirmation emails are still sent, but you do not need the link or a code to enter the app. Existing accounts (`debnathsaptarshi52@gmail.com` and `admin@admin.com`) are confirmed.

To require a 6-digit code again later, drop the `on_auth_user_created_auto_confirm` trigger and put `{{ .Token }}` in the [Confirm signup](https://supabase.com/dashboard/project/nhdjdifnylqxkrcdskny/auth/templates) template.

## Run

```bash
pnpm backend:test
pnpm backend:dev    # API on http://localhost:3001
pnpm app:dev        # Expo on http://localhost:8081
```

Writes go through the API (`service_role`). JWT clients can only read their own `app_records`, `account_revisions`, and `ai_requests`.

Food-plate thumbnails: `POST /api/v1/ai/food-plate` uses `gpt-image-1-mini` at **low** quality. Meal photos are a reference for an edit (same food and portion, circular saucer). Text-only logs generate from the description. Identical photo+portion hashes hit `food_plate_cache`.
