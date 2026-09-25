# 05 — Roadmap, first slice, metrics, risks, open questions

## Phases

Each phase ends with something the nutritionist uses for real. Nothing ships to her without the client-side landing surface for it.

### Phase 0 — Decisions and scaffolding (1 week)

- Validate the eight decisions in the "Questions to settle" section below with the nutritionist in one 45-minute session using the scenario doc, not screens.
- Scaffold `artifacts/nutritionist-app` as an Expo Router app (web enabled), reuse the client's auth screens and `services/supabase.ts`, add the `(setup)` flow for the nutritionist profile.
- Migrations 01 and 02 (`practice_core`, `care_messaging`) with backfill. Contracts enums added.
- Exit: she can sign in on her phone and on the web, see the same roster the Vite dashboard shows today, and the old dashboard still works.

### Phase 1 — The queue (4–5 weeks) · pilot with 10 households

Practice:
- Today: Needs you, New meals (grouped, collapsed, time budget), Quiet (24/48/72 h ladder with one template each), zero state.
- Meal review sheet: photo, details, model line, ack chips (member-specific set from programme defaults), comment (text + voice), Ask (context/oil/portion/subject), Flag, Move, corrections; auto-advance and undo.
- Clients: roster with state chip, consistency dots, filters; Household with day timeline, proxy matrix, numbers, invite + QR + share link; Member → Day and Notes (private).
- New household flow (steps 1, 2, 5, 6; programme defaults applied silently).
- Practice → Profile, Review windows, Notifications (batched vs realtime).
- Offline queue for acks and comments.

Client app:
- One `food_event` per confirmed meal with photo upload, context, and `signals` (replaces today's per-item, text-only `createCareFoodEvent` calls in `useAppStore.ts`) — without this the queue has no pictures.
- Meal card badge and feedback thread with reply; inline question card; "1 question from Ananya" row; "Your nutritionist" screen with consents and access log; invite deep link pre-fill in onboarding; notification group.

Backend:
- Routes for queue, feedback, questions, corrections, messages (nudge, comment), households, member day, media signing; `member_daily_rollups` + `member_state`; `notification_outbox` with Expo push and WhatsApp text/template routing; audit rows.

Exit criteria (measured over the last two pilot weeks):
- ≥ 90 % of meals acknowledged within the review window that follows them.
- Nutritionist minutes per household per week ≤ 60 % of the pre-pilot baseline (measure the baseline first: one week of timing her WhatsApp routine).
- Every quiet member received a nudge within 12 h of threshold; ≥ 50 % logged again within 48 h.
- Zero mis-attributed meals left unresolved for more than a day.
- Vite dashboard retired.

### Phase 2 — Reviews, plan, library (4 weeks) · 20 households

Practice:
- Weekly review composer with facts, went-well, one focus, drafted message, preview-as-client, progress across households.
- Member → Week (patterns, focus progress, shared measurements) and Plan (programme, targets by kind, dos/don'ts, swaps sent, events).
- Library: Swaps (incl. save-from-meal), Nudges, Focus templates, Programme defaults. Seeded on first run.
- Compose (+) sheet. Wide two-pane layout and keyboard shortcuts.

Client app:
- Programme focus card driven by `member_focus` with tracker; Progress "Last week" summary; Plan "From Ananya" swaps with tried/not; camera hints from `member_targets`; event cards; nutrient goals read-only under enrolment.

Backend:
- Migration 03; `digest` AI task; weekly review routes; targets/enrolment routes; broadcast; Realtime policies (migration 07) if polling proves noisy.

Exit: 12 households reviewed in ≤ 60 minutes on a Sunday, every review with exactly one focus, ≥ 70 % of clients open the Monday summary within 24 h.

### Phase 3 — Labs, programme lifecycle (3–4 weeks)

- Member → Labs with upload, OCR confirmation, before/after, milestones, physician summary PDF; Lab panels in Library; intake checklist on Household.
- Enrolment lifecycle: waiting → active → grace → ended/renewed; Ending-soon chip and cards; programme summary export.
- Client: Progress → Labs, Milestones badge, ending/renewal cards.
- Backend: migration 06, `lab_ocr` task, `lab-media` bucket, nightly enrolment transitions.

Exit: intake and 90-day labs for every active member entered in ≤ 2 minutes each with zero spreadsheet use; first renewal completed in-app.

### Phase 4 — Scale (4 weeks) · 50 households

- Team roles (assistant with scope limits and attribution), cohorts, broadcasts with templates, analytics page, per-cohort notification overrides, practice export.
- Quiet thresholds and ladder configurable per practice; festival calendar for India pre-loaded as suggested events.
- Optional: wearable/CGM import for nutritionist-flagged high-risk members only (design spike, not committed).

Exit: one assistant clears the morning queue for 50 households in ≤ 40 minutes with the owner handling only flags; analytics page used to decide the next batch.

## The first slice (what to build in week one of Phase 1)

One vertical loop, end to end, on real data from the existing pilot households:

1. `GET /v1/nutritionist/queue` returning grouped new meals and quiet members from `food_events` + `member_state`.
2. Today screen with meal cards and swipe-to-ack.
3. Meal review sheet with ack chips and a comment field → `POST /food-events/:id/feedback`.
4. `notification_outbox` batching acks into one push per member per window; Expo push to the client app.
5. Client meal card badge + feedback thread.

If this loop is used twice a day for a week by the nutritionist without reverting to WhatsApp for acknowledgements, the rest of Phase 1 is justified.

## Metrics

Instrument from day one; the analytics page in Phase 4 is just a view over these.

**Nutritionist effort and coverage**
- Minutes per household per week (sum of active-screen time attributed to a household + send actions).
- Median seconds per meal action; ack latency (meal captured → first feedback) and % within the next window.
- Queue size at window start and at window end; % windows ending at zero.
- Reviews sent on time (by Monday 09:00) / reviews due.

**Client behaviour (the programme's real outcomes)**
- 7-day logging consistency: days with ≥ 2 meals / 7, per member and practice-wide distribution.
- Quiet incidents per member per month; recovery rate (log within 48 h of nudge).
- Question answer rate and time to answer (context/oil confirmations).
- Focus outcome distribution (met / partial / missed) week over week.
- Swap tried rate.
- Retention to day 30, 60, 90; renewal rate.

**Data quality**
- % meals with context and oil confirmed (by client or nutritionist).
- Correction rate on model items/portions (ground truth volume for `lib/campus-food`).
- Labs entered ≤ 10 days after programme start; 90-day repeat completed.

**Trust**
- Consent revocations and scope changes; access-log views by clients; complaints.

Weight loss is not a programme KPI. Lab deltas are reported per member, never aggregated into a marketing number without the nutritionist's sign-off.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| The nutritionist keeps using WhatsApp directly and Practice becomes a second inbox | Outbound acks and comments are delivered *to* WhatsApp from Practice, so clients see no difference; her personal number is never needed. Measure "acks sent from Practice / total acks" in the pilot. |
| Templates make her sound like a bot | Templates are hers, seeded once, and every send is editable; per-member recent-tags row prevents repetition. Clients see her name and photo. |
| WhatsApp template approval delays nudges and weekly summaries | Submit templates in Phase 0; fall back to in-app push + a free-form message inside the 24 h window when available. |
| Assistant sees more than the client agreed to | Role scopes at the API, audit rows on every read, attribution visible to clients. |
| Rollup sentences feel wrong ("late dinner" for a night-shift worker) | Thresholds per member from `member_targets` timing rules; events (travel, fasting) suppress; every sentence is tappable to the meals behind it so she can disagree and correct. |
| Older adults logged by proxy get inappropriate calorie framing | Per-member ack chip sets and targets by kind; estimates hidden unless "Show estimates" is on; client camera shows the member's rules. |
| Two meal systems drift (`food_events` vs `food_entries`) | `entry_ref` linkage, client writes `signals` on confirm, nutritionist corrections stored on the event; Practice never reads `app_records`. |
| Polling load at 50 households | Small queue payload, indexed queries, `member_state` view; Realtime policies ready in migration 07. |

## Questions to settle with the nutritionist before Phase 1

1. **Ack vocabulary.** Are the eleven proposed tags the right first set? Which three does she use most? What does she say for a "good" older-adult meal?
2. **Windows.** Two review windows a day, shown to clients — acceptable? What times?
3. **Silence ladder.** 24 / 48 / 72 hours, one message per day max, relaxed on weekends and declared events — does that match how she wants to be perceived?
4. **Estimates.** Hidden by default with "Show estimate" — or never shown for some programmes? For the campus cohort, does she want ranges visible?
5. **Weekly review.** Exactly one focus per member per week — will she accept the constraint? Sunday evening or Monday morning?
6. **Labs.** Which analytes and panels are standard for her intake, and does she want the physician summary at all?
7. **Assistant.** Will she have one in the next year, and what must the assistant never see?
8. **Pricing and renewal.** Programme fee and renewal mechanics are not captured in any notes. Practice needs to know whether payment happens in-app (Phase 4 or later) or stays outside.

## Fate of `artifacts/nutritionist-dashboard`

Keep it running through Phase 0 as the fallback. Its three pages (Triage, Clients, Household day) map directly to Today, Clients, and Household in Practice. When Phase 1 exit criteria are met, remove the package, its `dashboard:dev` root script, and its `.env.example`, and point any bookmarks to the Practice web build. Do not port its code; the data model it reads (`food_event_notes`, `mediaPath.startsWith('http')`) is replaced.

## Dependencies on the client app team

Phase 1 cannot ship without the client-side surfaces in `03-client-app-mirror.md` (meal badge, question card, "Your nutritionist", deep-link onboarding, notification group). Plan those in the same sprint, sharing the contracts package so neither side waits on the other's types.
