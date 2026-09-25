# 03 — The mirror: what changes in the client app

Practice only works if every action the nutritionist takes lands somewhere specific in `artifacts/adaptive-food-coach` (and, for clients who never open the app, in WhatsApp). This document is the contract between the two apps. The backend tables named here are specified in `04-backend.md`.

## Landing map

| Nutritionist action (Practice) | Where the client sees it | Channel | Reply path | Data |
| --- | --- | --- | --- | --- |
| Ack tag on a meal | Badge on the meal card in Log and on Today's "Last meal" carousel; full line in meal detail ("Ananya · More protein next time") | In-app; one batched push per window | Tap badge → "Thanks" / "Tell me more" (opens a reply field) | `care_feedback` |
| Comment on a meal | Under the meal in detail view; preview on the card | In-app push (batched); WhatsApp text if the member has a linked number and no app session in 7 days | Reply field on the meal | `care_feedback.body` |
| Ask (structured question) | Inline question card on the meal with one-tap answers; Today shows "1 question from Ananya" until answered | In-app push (realtime); WhatsApp interactive buttons | Tap an answer; the answer updates the meal's context/oil/portion and clears the card | `care_questions`, `care_question_answers` → `food_events` correction |
| Correct items or portion | Meal detail shows "Reviewed by Ananya" with the corrected items; estimate range updates | In-app, silent | None needed | `food_events.signals`, `review_status=reviewed` |
| Swap | Plan tab → "From Ananya" section (card with why, photo, when to use); Today's next-meal suggestion for the stated slot for N days | In-app push; WhatsApp text with image | "I tried it" / "Not for me" buttons | `care_messages(kind=swap)`, `care_message_replies` |
| Weekly review + focus | Today's programme focus card becomes "This week with Ananya: …" with a progress tracker; Progress → "Last week" summary shows her note and the facts she chose to share | In-app push Monday morning; WhatsApp 3-line summary | Reply field on the summary | `weekly_reviews`, `member_focus` |
| Nudge (quiet client) | Today shows "Ananya checked in" with her message and a one-tap "Log now" | WhatsApp template (outside 24 h window) and push | Reply field; logging a meal marks the nudge resolved | `care_messages(kind=nudge)` |
| Event note (wedding, travel, fasting) | Today shows a card the day before with her picks; quiet thresholds relax; camera hint changes ("Buffet? Send a photo and ask me") | In-app | "Help me choose" → question to Practice | `member_events`, `care_messages(kind=event_note)` |
| Targets and rules (Plan) | Camera screen shows the member's rules under the shutter ("Dinner before 20:00 · Protein at every meal"); Today's remaining cards reflect nutritionist-set goals; profile nutrient goals become read-only with "Set by Ananya · ask to change" | In-app | "Ask to change" opens a message | `member_targets`, `enrollments` |
| Programme assignment | Home layout and programme (PCOS/Diabetes/…) follow the enrolment; the Programmes tab shows "Your programme with Ananya · Day 23 of 90" | In-app | None | `enrollments.program_id` |
| Lab report confirmed | Progress → Labs section: plain-language table with reference ranges and before/after deltas | In-app push | "Ask about this" | `lab_reports`, `lab_values` |
| Milestone created | Milestones → new badge ("HbA1c 5.9 → 5.5"); shareable card | In-app push | Share | `milestones` |
| Household message | Each member sees it on Today as "To your household from Ananya" | In-app; WhatsApp to each linked number | Reply | `care_messages(kind=household)` |
| Broadcast (cohort) | Same as household message, rendered per person with variables | In-app; WhatsApp template | Reply | `care_messages(kind=broadcast)` |
| Log a meal for a client | Appears on the member's day with "Logged by Ananya"; the client can edit or remove it | In-app, silent | Edit / remove | `food_events(channel=nutritionist)` |
| Private note | Never visible | — | — | `care_notes(private=true)` |
| Consent request (new scope) | "Your nutritionist" screen shows a pending request with Allow / Not now | In-app push | Allow / Not now | `care_consents(status=requested)` |
| Enrolment ending / renewal | Today card at 14 and 3 days: "Your programme with Ananya ends on 12 Dec" with Renew / Talk to Ananya | In-app | Renew → intent recorded for Practice | `enrollments` |

## New client-side surfaces

These are the additions to `adaptive-food-coach`. Everything else is a change to an existing component.

### "Your nutritionist" (Profile → new row)

- Who: name, credentials, photo, bio, review windows ("Reviews at 08:00 and 21:00 — expect replies then").
- Programme: name, Day X of 90, start and end dates.
- What is shared: toggles for Meals, Profile and measurements, Labs, Messages. Changing a toggle takes effect immediately and is confirmed with the consequence ("Ananya will stop seeing your meals from now. Past feedback stays on your meals.").
- Who logs for whom in your household (read-only summary; edit goes to the existing proxy editor).
- Access log: "Ananya viewed your labs · 12 Sep 21:14" (from `care_audit`, last 90 days, exportable).
- End programme (confirm; sets enrolment to ended, visibility closes after a 14-day grace window that the client can shorten to immediate).

### Meal card feedback

- Small badge (initial + tag label) on the card; tapping opens meal detail scrolled to the feedback thread.
- In detail: a thread of nutritionist feedback (tag, comment, corrections, questions), each with a reply field. The client's reply goes to Practice as a comment on the same meal.
- Tone rule: feedback renders in a neutral surface, never red. The tag label is the nutritionist's next-step phrasing.

### Inline question card

- On a meal: "Ananya asks: Where was this?" with buttons Home / Restaurant / Mess / Canteen / Delivery. Answering updates context and triggers the same follow-up the WhatsApp bot uses (oil buttons) when relevant.
- On Today: a compact "1 question from Ananya" row that deep-links to the meal.

### Programme focus card (existing `ProgramFocusCard`)

- When an enrolment exists and a `member_focus` row is active for the current week, the card renders the nutritionist's statement with a progress tracker (days or count) computed from the rollup. Falls back to the programme's static focus copy otherwise.
- Tapping shows last week's summary and her note.

### Plan tab additions

- "From Ananya" section above generated meal ideas: swap cards with tried/not-for-me buttons and the dates she suggested them for.
- Upcoming events she added, with her picks.

### Progress additions

- "Last week" summary card when a weekly review exists.
- Labs section (only if the client has a confirmed report): table with reference-range shading, plain-language one-liner per analyte written by the nutritionist or from a fixed glossary, and before/after deltas. No diagnosis language.

### Camera / log hints

- Under the shutter and on the review screen: the member's visible rules (up to three) from `member_targets` with `show_to_client=true`. When logging for another member, the rules shown are that member's.

### Onboarding changes

- If the app is opened from an invite deep link (`?h=CODE&n=CODE`), onboarding pre-fills household, members, WhatsApp numbers, programme, and nutritionist; it skips steps already answered by the nutritionist and shows a single confirmation ("Ananya set this up for you. Check it's right.").
- The consent step names the nutritionist and lists scopes with defaults she chose; the client can untick any.
- `step-nutritionist` stays for organic sign-ups without a link.

### Notification preferences

- A new group "From your nutritionist": realtime for questions, batched for feedback (default at the nutritionist's review windows plus 30 minutes), weekly summary on Monday morning.

## WhatsApp mirror

The bot (`artifacts/api-server/src/routes/whatsapp.ts`) already handles inbound photos, "who was this for", place, and oil. Practice adds outbound in the nutritionist's name:

- Acks and comments: "Ananya: Nice, less oil 👍" on the meal thread, sent at the end of the review window as one message per member ("Ananya reviewed 3 meals: breakfast — Good plate; lunch — More protein next time; …").
- Questions: interactive buttons, same as the bot's existing context/oil prompts; the answer is written to the meal.
- Swaps: text plus an image if the swap has one, ending with "Reply TRIED or NOT when you've had it."
- Weekly summary: three lines and the focus, sent Monday at the client's morning window.
- Nudges and broadcasts: **must** use approved WhatsApp message templates when the member has not messaged in the last 24 hours (Meta's customer-service window). The backend tracks `last_inbound_at` per `wa_id` and routes automatically; Practice shows "Sent as template" when that happens.
- Opt-out: "STOP" from a number pauses outbound to that number and surfaces in Practice as a consent change.

## Client-side principles

1. Feedback should feel like a person who looked, not a system that scored. One name, one face, the nutritionist's own words.
2. The client always knows when to expect a reply (review windows are shown) so silence between windows is not read as neglect.
3. Nothing the nutritionist sends is a dead end; every surface has a reply path that returns to the same place in Practice.
4. Consent is a first-class screen, not a settings footnote, and the access log makes it real.
5. For proxy-logged members who never open the app, the logger's app carries their rules and their feedback in a clearly separated section, so the daughter-in-law is not confused about whose plate is being discussed.
