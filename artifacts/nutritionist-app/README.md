# Practice — the nutritionist side of Adaptive Food Coach

Working title: **Practice**. A partner app for the nutritionist who runs the programme that Adaptive Food Coach clients are enrolled in. The client app (and the WhatsApp bot) is the intake layer; Practice is the control panel that turns a stream of meal photos from 10–50 households into a short, prioritised list of things worth a human's attention, and makes each response cheaper and more useful than an emoji.

This folder is the plan. No code yet. It is written so that the first implementation slice can start from `docs/05-roadmap-metrics.md` without re-deciding anything.

## Why this app, and why now

From the product research and nutritionist interviews (Jul–Sep 2026, see Granola notes):

- The nutritionist today runs a **WhatsApp accountability model** for about **10 households** of working parents. Clients photograph meals before work; she replies with an emoji; she judges portion and quality intuitively. She does not count calories.
- Programmes are **3 months**, with intake labs (HbA1c for 25+, triglycerides, liver, kidney, lipids; fasting insulin for PCOS/T2D) repeated at the end. Vitamin D and B12 are routinely recommended.
- Groups are **families of 2–3**, never multi-family, because of privacy.
- The bottleneck to growing from 10 to **50+** households is manual photo review and follow-up, not client demand.
- Photo calories are unreliable (oil, gravy, hidden ingredients). The product promise is **decision support and habit change**, not precision.

The client app already models this: households, members, proxy logging, WhatsApp identities, nutritionist invite codes, and a canonical `food_events` stream all exist in `supabase/migrations/202609202100_care.sql` and `artifacts/api-server/src/lib/care.ts`. What is missing is the nutritionist's side of the loop: reviewing, replying, following up, planning, and measuring — and the client-side surfaces where those replies land.

## Where this sits in the repo

| Artifact | Role | Relationship to Practice |
| --- | --- | --- |
| `artifacts/adaptive-food-coach` | Client + family app (Expo) | Intake. Every Practice action lands in a specific, predictable place here (see `docs/03-client-app-mirror.md`). |
| `artifacts/api-server` + `supabase/` | One Express API, one Supabase project (7Labs) | Shared backend. All care writes go through the API with the service role. Practice adds routes under `/v1/nutritionist` and a handful under `/v1/care` for the client (see `docs/04-backend.md`). |
| `lib/backend-contracts` | Zod contracts shared by API and apps | Practice consumes the same package; new enums (ack tags, message kinds, lab analytes) are added here once and used by both apps. |
| `artifacts/nutritionist-dashboard` | Stopgap Vite web triage (Triage / Clients / Household day) | Superseded by Practice's web target. Kept until Phase 1 ships, then retired (see `docs/05-roadmap-metrics.md`). |
| `lib/campus-food` | Catalog-grounded estimates for the campus cohort | Practice shows "what the model saw" from these results and lets the nutritionist correct them; corrections feed back as ground truth. |

## Reading order

1. `docs/01-scenarios.md` — who the nutritionist is, the rhythms of her week, and thirteen real situations with "how it works today" vs "with Practice". This is where the product decisions come from.
2. `docs/02-ux-screens.md` — information architecture, navigation, and a screen-by-screen spec with states, interactions, microcopy, and the visual system adapted from the client app.
3. `docs/03-client-app-mirror.md` — the contract between the two apps: every nutritionist action and exactly where the client sees it (app, WhatsApp, or both).
4. `docs/04-backend.md` — what exists, what is missing, new tables, routes, consent, notifications, realtime, and the migration order.
5. `docs/05-roadmap-metrics.md` — phases, the first slice, how success is measured, risks, and the questions to validate with the nutritionist before building.

## Guiding decisions

These are settled unless the pilot contradicts them.

1. **Nutritionist-first.** The client app is intake; Practice is where judgement happens. Anything that saves the nutritionist a minute per client per week beats a new client feature.
2. **Attention is the scarce resource.** Every screen answers two questions: what needs me right now, and what is the cheapest good response. The default screen is a queue, not a dashboard.
3. **Structured acknowledgements, not emoji.** Each one-tap reply ("Good plate", "More protein next time", "Watch the oil") is a tag. Tags teach the client on the meal card, feed the weekly pattern view, and become ground truth for the model.
4. **Household is the unit of care; member is the unit of coaching.** One invite, one timeline, one review — but targets, programme, and focus are per person. An older adult logged by proxy has different rules from the working parent who logs for him.
5. **Silence is a state, not an absence.** A client who has not logged in 36 hours appears in the queue with a suggested action, not as a missing row.
6. **No calorie promise.** Ranges exist and are one tap away; they are never the headline. Portion, oil, context, timing, and consistency are the signals the nutritionist actually uses.
7. **Predictable landing.** Every action shows the nutritionist where the client will see it. Nothing she sends disappears into a chat log.
8. **Consent-scoped and auditable.** She sees only assigned households, only the scopes granted (meals, labs, profile, messages), and every view of health data is logged. Clients can see what she sees and revoke it.
9. **Voice-first input.** She reviews on her phone between things. Comments and notes are dictated and transcribed (the `/ai/transcribe` route already exists).
10. **WhatsApp stays.** Clients who never open the app still get her replies through the bot. The 24-hour customer-service window and template rules shape what can be sent when (see backend doc).

## Stack decision

Practice is an **Expo Router app in this monorepo** (`artifacts/nutritionist-app`), same toolchain as the client app, with **web output enabled**. Phones get the queue-first layout; tablets and desktop browsers get a two-pane layout (queue left, detail right) with keyboard shortcuts for desk review sessions. This gives one codebase for the mobile review windows and the Sunday desk session, and lets the Vite dashboard be retired rather than maintained in parallel.

Auth is the same Supabase project. A nutritionist is a normal `auth.users` row with a `nutritionist_profiles` record; the app gates on that record, and the API already enforces assignment on every `/v1/nutritionist` route.

## What this plan deliberately excludes

- Multi-family groups or any peer-to-peer community between households (privacy; the nutritionist declined this).
- Medication advice, CGM as a default feature (only high-risk diabetic clients, nutritionist-initiated), or claims about clinical outcomes.
- A marketplace of nutritionists, discovery, or ratings. Clients arrive with an invite code from someone they already know.
- Automatic calorie scoring as the response to a photo. The model identifies items and portion; the nutritionist and the client confirm.
- Voice-call automation for missed logs (deferred in the research; WhatsApp first).
