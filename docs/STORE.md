# Store launch runbook

Code in this repo is wired for App Store and Play Store binaries. Accounts, OAuth consoles, and the first EAS project still have to be created in the browser. Do those in parallel with preview builds.

**Locked identifiers** (do not rename after the first listing):

| | |
| --- | --- |
| Name | Adaptive Food Coach |
| Bundle / application ID | `com.sevenlabs.adaptivefoodcoach` |
| URL scheme | `adaptive-food-coach` |
| Category | Health & Fitness (not Medical) |
| Age | 18+ |
| IAP | none (free) |

Do **not** mention GLP-1, Ozempic, diagnosis, treatment, or prescriptions in store copy.

Legal pages are served by the API once it is on HTTPS:

- `https://<API_HOST>/legal/privacy`
- `https://<API_HOST>/legal/terms`
- `https://<API_HOST>/legal/delete-account`

## 1. You: accounts and domain

1. Point a real support mailbox (or alias) and set `EXPO_PUBLIC_SUPPORT_EMAIL` / `LEGAL_CONTACT_EMAIL` to it.
2. Enroll in the [Apple Developer Program](https://developer.apple.com/programs/) as **Individual** ($99/year). Wait for approval.
3. Enroll in [Google Play Console](https://play.google.com/console) ($25) and finish identity verification (often the slow step in India).
4. In Apple Developer: register App ID `com.sevenlabs.adaptivefoodcoach` with **Sign in with Apple**.
5. In App Store Connect: create the iOS app, Health & Fitness, encryption = no extra encryption beyond HTTPS/Keychain (`ITSAppUsesNonExemptEncryption` is already `false` in `app.json`).
6. In Play Console: create the Android app with application ID `com.sevenlabs.adaptivefoodcoach`, target audience 18+.

## 2. Production API

The Expo binary calls `EXPO_PUBLIC_API_URL` + `/api/v1/...`. Localhost is rejected in release builds.

1. Deploy `artifacts/api-server` with `NODE_ENV=production`, `PORT`, Supabase URL + secret key, `OPENAI_API_KEY`, and `LEGAL_CONTACT_EMAIL`.
2. Set `CORS_ORIGINS` to any web origins you still use. Native apps usually send no `Origin` and are allowed.
3. Confirm `GET /api/healthz` and `GET /legal/privacy` over **HTTPS**.
4. In Supabase Auth URL config:
   - Site URL: your production API or marketing origin (not `http://localhost:8081` as the only site URL).
   - Redirect allow list must include `adaptive-food-coach://**` (keep `exp://**` only if you still test in Expo Go).
5. Optional: create a Sentry project and set `EXPO_PUBLIC_SENTRY_DSN` later. JS exceptions currently go through `ErrorBoundary` → `captureException` (console). API process crashes are logged with pino (`unhandledRejection` / `uncaughtException`).

```bash
pnpm backend:dev   # local
pnpm --filter @workspace/api-server build
node --env-file-if-exists=artifacts/api-server/.env artifacts/api-server/dist/index.mjs
```

## 3. EAS project and secrets

From `artifacts/adaptive-food-coach`:

```bash
npx eas-cli login
npx eas-cli init
npx eas-cli credentials
```

Create production secrets (never commit `.env`):

```bash
npx eas-cli secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://nhdjdifnylqxkrcdskny.supabase.co" --scope project
npx eas-cli secret:create --name EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY --value "sb_publishable_..." --scope project
npx eas-cli secret:create --name EXPO_PUBLIC_API_URL --value "https://YOUR_API_HOST" --scope project
npx eas-cli secret:create --name EXPO_PUBLIC_SUPPORT_EMAIL --value "you@yourdomain" --scope project
npx eas-cli secret:create --name EXPO_PUBLIC_DEMO_MODE --value "false" --scope project
```

If you host legal pages on the API, you do not need separate privacy/terms URL secrets.

## 4. OAuth (Google + Apple)

Facebook Login is **off** in store builds (`EXPO_PUBLIC_ENABLE_FACEBOOK`). Do not start Meta app review for v1.

### Google

1. Cloud Console → OAuth client **Web** with redirect `https://nhdjdifnylqxkrcdskny.supabase.co/auth/v1/callback` (already documented in `docs/BACKEND.md`).
2. OAuth client **iOS** with bundle ID `com.sevenlabs.adaptivefoodcoach`.
3. OAuth client **Android** with package `com.sevenlabs.adaptivefoodcoach` and the SHA-1 from `npx eas-cli credentials -p android`.
4. Enable Google in Supabase with the **Web** client ID and secret.

### Apple

1. Enable Sign in with Apple on App ID `com.sevenlabs.adaptivefoodcoach` (not `com.anonymous.adaptivefoodcoach`).
2. Create a Services ID and `.p8` key if Android/web Apple sign-in is needed.
3. Supabase Apple client IDs: `com.sevenlabs.adaptivefoodcoach` and the Services ID. Keep `host.exp.Exponent` only for Expo Go.

Test social login on a **dev or preview build**, not Expo Go.

## 5. Preview builds and device QA

```bash
cd artifacts/adaptive-food-coach
npx eas-cli build --profile preview --platform ios
npx eas-cli build --profile preview --platform android
```

Install on a physical iPhone and Android. Do not submit from Expo Go.

Checklist:

- [ ] Email register / sign-in; Privacy Policy and Terms open
- [ ] Sign in with Apple (iPhone); Google on both
- [ ] Disclaimer + 18+ DOB gate
- [ ] Camera scan, photo library, voice log
- [ ] Run tracking (location while in use)
- [ ] Local reminders
- [ ] Export data and delete-account (use a throwaway account)
- [ ] Community report and block; email in the confirmation
- [ ] No “Connect your backend” / `.env` developer copy
- [ ] AI failure and offline banners
- [ ] HTTPS only (ATS)

Then internal tracks:

```bash
npx eas-cli build --profile production --platform all
npx eas-cli submit --profile production --platform ios     # TestFlight
npx eas-cli submit --profile production --platform android # Play internal, draft
```

Capture store screenshots from these builds (iPhone 6.7" and 6.1"; Play phone).

## 6. Store forms

**Support URL:** `https://<API_HOST>/legal/privacy` (or a real status/support page).  
**Privacy URL:** `https://<API_HOST>/legal/privacy`  
**Account deletion URL (Play):** `https://<API_HOST>/legal/delete-account`

### Apple Privacy Nutrition / Play Data Safety

Collected and linked to identity: name, email, user ID, photos, audio, physical health (weight/height/DOB/gender), precise location **while using the app** (runs only), product interaction.  
Photos/audio: sent to a third party (AI provider) for processing.  
Not collected: advertising ID, purchases, tracking.  
Tracking: no. Do not add App Tracking Transparency.

### Review notes

Demo account + password. Camera is meal/label scan. Location is run distance, not background. AI is a nutrition estimate, not medical advice. Account deletion: Profile → Privacy, export & account deletion. Community reports land in `content_reports` and must be reviewed (email `LEGAL_CONTACT_EMAIL`).

## 7. After first submit

Increment happens via EAS `production.autoIncrement` when `appVersionSource` is `remote`. Marketing version stays `1.0.0` in `app.json` until you ship a user-facing change.
