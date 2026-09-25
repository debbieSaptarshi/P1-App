# 01 — People, rhythms, and real situations

The plan is derived from situations, not features. Each scenario below states how the work happens today (WhatsApp + memory + Google Sheets), how it happens with Practice, what the client sees, and what data it touches. Screens are specified in `02-ux-screens.md`; data in `04-backend.md`.

## People

**Ananya — the nutritionist (primary user).** Independent, Mumbai. Around ten households, mostly working parents in their 30s–40s, a few older parents logged by their children, and one campus cohort of hostel students. Three-month programmes. She reviews photos twice a day: over her own breakfast (07:30–08:30) and after dinner (21:00–22:00). Between those windows she is in consultations or with her own family, and WhatsApp pings are an interruption she resents but answers. She does intake blood work and repeats it at 90 days, and she copies lab PDFs into a spreadsheet by hand. She does not count calories and does not want to start. She wants to reach 50 households without hiring, or with one junior dietitian.

Her scarce resource is attention. Her second scarcest is the emotional energy of being the person who has to notice that someone has gone quiet.

**Meera — assistant dietitian (Phase 4).** Does first-pass acknowledgements and flags anything ambiguous for Ananya. Must not see labs or notes unless granted.

Client-side people, used in scenarios:

- **Priya, 38.** PCOS. Logs breakfast and packed lunch before 09:00, dinner often after 21:30. Logs for her father-in-law from the same WhatsApp number. Wants to feel supported, not graded.
- **Rajesh, 67.** Priya's father-in-law. Type 2 diabetes, HbA1c 7.1. Does not use apps. His meals are proxy-logged. Calorie numbers are irrelevant to him; protein, timing, and softness of food are what matter.
- **Aman, 34.** Software engineer, travels two weeks a month, eats out three times a week. Arrived from a calorie-counting app and asks for numbers. Needs to be weaned onto portion, oil, and consistency.
- **Karan, 20.** Hostel student on the campus pilot. Eats at the mess and canteens. Catalog-grounded estimates exist for his food; the question is oil and portion, not identity.

## Rhythms

The nutritionist's job has four cadences. The app's information architecture mirrors them rather than a feature list.

| Cadence | What happens | Where it lives in Practice |
| --- | --- | --- |
| Twice daily | Review new meals, answer questions, notice silence | **Today** tab (the queue) |
| Weekly (Sun/Mon) | Per-household review, one focus for next week, message to client | **Reviews due** section of Today + review composer |
| Monthly | Check-in call, adjust targets, mid-programme labs if needed | Member → Plan, Notes, Schedule call |
| Quarterly | Intake and 90-day labs, programme end, renewal or graduation | Member → Labs; Household → Programme timeline |

## Scenarios

### 1. The morning window

**Situation.** 07:40. Eleven photos arrived between 06:30 and 07:35 from six households. Priya sent three (her breakfast, her packed lunch, Rajesh's breakfast) with the caption "his poha, less oil today". Aman sent a hotel buffet plate with no caption. Karan sent a mess plate. Ananya has twenty minutes.

**Today.** She scrolls six WhatsApp chats, taps 👍 on most, types "good" on two, and means to come back to Aman's plate but forgets. Nothing is recorded anywhere.

**With Practice.** Today opens on **New meals**, grouped by household, newest first, with a time budget line ("11 meals · about 9 min"). Each card shows the photo, who ate it and who logged it ("Rajesh · logged by Priya"), the time and slot, context chips (Home / Restaurant / Mess, Oil), the caption, and one line of "what the model saw" (items from the catalog when available, no calories). She swipes right on Priya's breakfast — the default ack for that member this week is "Good plate", set from her recent replies. She taps Rajesh's poha, picks "Nice, less oil" from the ack chips, and it auto-advances. Aman's buffet plate has an "Oil? Context?" chip because nothing was confirmed; she taps **Ask → Where was this?** and moves on. Karan's plate is a catalog match at 2 roti + dal + rice; she taps "More protein next time" and the tag attaches to that meal. At 07:52 the queue is empty: "All caught up. Next window 21:00."

**Client sees.** Priya's meal card shows a small badge "Ananya · Good plate" and on Rajesh's day, "Ananya · Nice, less oil". Aman gets one WhatsApp message with three buttons (Home / Restaurant / Mess) and the same question inline on the meal in the app. Karan sees "More protein next time" on the meal and a "Try adding curd or paneer at lunch" hint the model draws from that tag and his programme.

**Data.** `food_events` read; `care_feedback` inserted per ack; `care_questions` inserted for Aman; `member_daily_rollups` updated; push notifications batched into one per client at the end of the window.

### 2. The silent client

**Situation.** Aman has not logged since Tuesday lunch. It is Thursday morning.

**Today.** Ananya may or may not notice. If she does, she writes "Hey Aman, everything ok?" and feels like she is nagging.

**With Practice.** Aman appears in the **Quiet** section of Today on Wednesday evening (24 h) with "Quiet since Tue 13:10 · travelling this week (from Plan)". The suggested action is a nudge template in her voice: "Travel week — even a photo of the airport sandwich helps me help you. No judgement." One tap sends it via WhatsApp and in-app. If he stays quiet through Friday (72 h), the suggestion escalates to "Offer a 10-minute call" with a scheduling link, and the household gets flagged for Sunday's review. The ladder is: app nudge from the coach at 24 h (automatic, generic), nutritionist nudge at 36–48 h (one tap, personal), call offer at 72 h, and never more than one message per day. Weekends and declared travel stretch the thresholds.

**Client sees.** A WhatsApp message from the programme number with Ananya's name, and the Today screen in the app shows "Ananya checked in" with a reply field.

**Data.** `member_state` view (last_log_at, quiet_days, thresholds adjusted by `member_events`); `care_messages(kind=nudge)`; `notification_outbox` with a WhatsApp template because Aman is outside the 24-hour customer-service window.

### 3. "I felt sluggish after roti"

**Situation.** Priya's lunch caption: "3 roti + aloo sabzi, felt really sluggish after". Ananya's instinct is to swap to a stuffed fulka with the sabzi inside and a katori of curd.

**Today.** She types the suggestion into WhatsApp. It scrolls away by dinner. She will suggest it again next month and not remember she already did.

**With Practice.** In the meal review sheet she taps **Swap**, and the Library opens filtered to Priya's programme (PCOS) and diet (vegetarian). "Stuffed fulka + sabzi + curd" is already saved from a previous client; she picks it, adds one dictated line ("Try this at lunch for the next 3 days and tell me if the 3 pm slump goes"), and sends. The swap is now attached to Priya's Plan with a "Tried?" state.

**Client sees.** The meal shows Ananya's comment. The Plan tab has a new card "From Ananya: Stuffed fulka + sabzi + curd" with why, a photo, and buttons "I tried it" / "Not for me". On Today, the next-meal suggestion for lunch is that swap for three days.

**Data.** `care_messages(kind=swap, ref=swaps.id)`; `swap_library`; client answer writes `care_message_replies`. Weekly review later shows "Swap tried 2/3 days".

### 4. Who ate this?

**Situation.** Priya's WhatsApp number is linked to both herself and Rajesh. She sends a photo of a plate with no caption.

**Today.** Ananya guesses from the food.

**With Practice.** The bot already asks "Who was this meal for?" with a list (existing behaviour in `whatsapp.ts`). If Priya does not answer within 30 minutes, the meal lands in Today under **Needs you** as "Needs a person — Priya's household". Ananya sees the two candidates with their last meals side by side and taps Rajesh. The bot's default subject for that number was Priya; over time the app learns the pattern (roti + sabzi at 08:00 is usually Rajesh) and proposes it, but the nutritionist confirms.

**Client sees.** Nothing intrusive. The meal appears on Rajesh's day.

**Data.** `food_events.review_status = needs_subject` → `received`; `whatsapp_pending` consumed.

### 5. The older adult has different rules

**Situation.** Rajesh's programme is diabetes. He eats early, avoids anything hard to chew, and the family cooks for him. Calorie left, carbs left, and macro rings mean nothing to him or to Priya-as-logger.

**With Practice.** In Rajesh's Plan, Ananya sets targets that are not macros: "dinner before 20:00", "protein at every meal (dal, curd, egg, paneer)", "no sugar in chai". His ack chips are configured to match: "Good timing", "Protein present", "Sweet — swap the chai". His week view shows meal timing and protein presence, not grams. On Priya's household timeline his row uses those markers.

**Client sees.** Priya's app, when logging for Rajesh, shows his three rules under the camera, not a calorie ring. If Rajesh ever opens the app himself, his Today is the large-type journal layout with the three rules and the last meal, nothing else.

**Data.** `member_targets` with `kind in ('macro','timing','presence','avoid')`; ack chip set per member derived from programme + targets.

### 6. A new household joins

**Situation.** A consultation call with a prospective family: Sunita (42, thyroid) and her husband Dev (45, general). They want to start Monday.

**Today.** Ananya adds them to a WhatsApp group, tells them what to photograph, asks them to get labs, and writes their details into a Google Sheet.

**With Practice.** During the call she taps **+ New household**: names, relationships, age bands, WhatsApp numbers, who logs for whom (default: both for both), programme per person (thyroid → default targets and dos/don'ts from the programme template; general for Dev), intake lab panel per person (Sunita: HbA1c, TSH, lipids, LFT, KFT, Vit D, B12; Dev: HbA1c, lipids). The app generates a household invite and shows a QR and a WhatsApp share link: "Join Ananya's programme — install the app or just save this number and send your first meal photo." The household appears in Clients as "Waiting for Sunita and Dev" until the first sign-in or first photo, then flips to Day 1 of 90. The intake checklist (consent recorded, labs due by Day 10, first call done) sits on the household page until complete.

**Client sees.** Sunita installs the app, the invite code pre-fills from the link, onboarding skips the questions Ananya already answered (programme, household members, WhatsApp) and asks only what is hers to answer (height, weight, allergies, consent). Dev does not install anything and just sends photos; his row still fills in.

**Data.** `households`, `members`, `household_memberships`, `whatsapp_identities`, `enrollments`, `member_targets`, `lab_panels`, `care_consents`; invite payload carries `nutritionistCode` + `householdCode`.

### 7. Sunday review

**Situation.** Sunday 20:30. Twelve households. Ananya wants each one to get something personal by Monday morning and wants to feel done in an hour.

**Today.** She scrolls each chat back seven days and writes a paragraph from memory. It takes two to three hours and she skips the quiet ones because there is nothing to say.

**With Practice.** Today shows "Reviews due: 12 · about 45 min". The **review composer** walks household by household, member by member. For Priya it shows the week's facts as chips: 18 of 21 meal slots logged, dinner after 21:30 on 4 of 7 days, restaurant twice, "More protein" tagged 3 times, swap tried 2 of 3 days, 2 photos with extra oil confirmed. "What went well" is pre-filled from positive tags. "One thing for next week" offers focus templates ranked by the patterns ("Dinner by 21:00 on 4 nights" is top). The message to Priya is drafted in Ananya's voice from her templates and the facts; she dictates two edits and taps **Preview as Priya** then **Send**. Rajesh takes forty seconds: timing was good all week, one focus ("keep dinner before 20:00, add curd at lunch"). For Aman, the quiet week is the subject: the draft says so gently and offers the call. Progress: "3 of 12 reviewed". She stops at 21:20 with all twelve done.

**Client sees.** Monday morning the Today screen's programme focus card reads "This week with Ananya: dinner by 21:00 on 4 nights" with a 0/4 tracker. Progress has a "Last week" summary with her note. WhatsApp gets a three-line version.

**Data.** `weekly_reviews` (facts jsonb, note, focus_id, sent_at), `member_focus` (week_start, statement, target, progress), AI task `digest` for the draft.

### 8. Labs at intake and at day 90

**Situation.** Sunita sends a photo of her lab report. Ninety days later she sends the repeat.

**Today.** Ananya reads the PDF, types values into a sheet, and later screenshots two rows to show progress.

**With Practice.** From the household page, **Add lab report** accepts a photo or PDF. OCR proposes analytes (HbA1c 5.9 %, TSH 4.8 mIU/L, LDL 138 mg/dL, Vit D 14 ng/mL, B12 210 pg/mL) with reference ranges; she confirms or corrects each value and tags the report "intake". At day 90 the repeat report shows a before/after table with deltas and the panel she ordered highlighted. One tap creates a **milestone** for Sunita ("HbA1c 5.9 → 5.5") that the client can share, and a one-page summary she can forward to Sunita's physician. Vitamin D and B12 supplementation reminders are a checklist item tied to those values.

**Client sees.** Progress gains a Labs section with the same before/after table in plain language and reference ranges. Milestones shows the badge. Nothing shows a diagnosis.

**Data.** `lab_reports`, `lab_values`, `lab_panels`, `milestones`; AI task `lab_ocr`; storage bucket `lab-media` (private, signed URLs).

### 9. Wedding, travel, festival

**Situation.** Priya mentions a family wedding this Saturday. Navratri starts in two weeks and half the households will fast.

**Today.** Nothing happens until the photos of the wedding buffet arrive.

**With Practice.** Ananya adds an **event** to Priya's Plan ("Wedding · Sat · buffet"). On Friday evening the client's Today shows "Wedding tomorrow — Ananya's picks: start with dal and paneer, one sweet you actually want, skip the fried starters." At the wedding Priya can send a buffet photo with "help me choose" and it enters **Needs you** as a question, not a meal. For Navratri, Ananya uses a **broadcast**: pick households, pick the festival template, personalise the greeting, send. Threshold for "quiet" relaxes during declared fasting days.

**Client sees.** A pre-emptive card, a fast reply when they ask, and no guilt-inducing silence-nudges on fasting days.

**Data.** `member_events(kind in ('travel','festival','fasting','wedding','illness'))` adjust `member_state` thresholds; `care_messages(kind=broadcast)` with per-recipient rendering.

### 10. The client who wants numbers

**Situation.** Aman asks, in a caption: "how many calories was that?"

**With Practice.** The meal review sheet shows the range the catalog and portion produce (e.g., 620–780 kcal) behind a **Show estimate** tap, with the assumptions listed (oil unknown, restaurant). Ananya can send the range with one line of framing from a template: "Roughly 650–750, but the number I care about is that there was no protein on the plate. Add one thing next time." The client app shows the estimate as a range with the same framing, never as a single number in a ring.

**Data.** `food_events.signals` (from `applyCatalogNutrition`), `care_feedback` with `include_estimate = true`.

### 11. Fifty households

**Situation.** Eighteen months in. Ananya has 48 households and Meera helps.

**With Practice.** Clients supports **cohorts** (Working parents, Seniors, Campus H14, PCOS Oct batch) as filters and as broadcast targets. The Library holds her swaps, nudge templates, focus templates, and per-programme defaults; nothing is retyped. Meera has the **assistant** role: she works the same Today queue, her acks are attributed to her, and anything she flags routes to Ananya. Meera cannot open Labs or private Notes. Practice → Analytics shows minutes per household per week (from action timestamps), median ack latency, percentage of meals acknowledged within the window, quiet-client count, and 7-day consistency across the practice. Ananya uses the analytics to decide whether to take the next batch.

**Data.** `practices`, `practice_members(role)`, `cohorts`, `cohort_members`, `care_audit`; analytics computed from `care_feedback`, `care_messages`, `member_daily_rollups`.

### 12. Consent, visibility, and leaving

**Situation.** Priya wants Ananya to see Rajesh's meals but not his labs (his doctor handles those). Later Aman finishes and wants his data gone from Ananya's view.

**With Practice.** Consent is per member and per scope: meals, profile (height/weight/goals), labs, messages. Defaults come from the invite; the client can change them in the app under "Your nutritionist", and Ananya sees a grey lock on scopes she lacks. When Aman revokes, his rows vanish from Practice the same minute, her private notes about him are retained for her records but detached from his identity after 30 days, and every historical view of his health data is in the audit log he can request. When an enrolment ends, visibility drops to a read-only 14-day grace window and then closes unless renewed.

**Client sees.** A "Your nutritionist" screen: who, credentials, review windows, what is shared (toggles), the audit log, and "End programme".

**Data.** `care_consents`, `care_audit`, `enrollments.status`.

### 13. Day 90

**Situation.** Priya's programme ends next week.

**With Practice.** Clients shows "Ending soon" fourteen days out. The household page assembles a **programme summary**: consistency over 13 weeks, the four focuses she worked on and how they went, lab before/after, weight if shared, the swaps that stuck. Ananya adds a closing note. Three outcomes: renew (new enrolment, same household, targets carried), graduate to maintenance (lighter review cadence, weekly check-in only), or end (visibility closes after grace). The summary doubles as the artefact Priya shares when she recommends Ananya to a friend, which is how the next household arrives.

**Data.** `enrollments`, `weekly_reviews`, `lab_values`, `milestones`; PDF export via the API.

## What we deliberately do not build

- A free-form chat firehose. Messages are typed (ack, comment, question, swap, nudge, focus, digest, broadcast) so they can be found, measured, and rendered in the right place.
- Multi-family groups, leaderboards across households, or anything one household can see about another.
- Automatic calorie totals as the reply to a photo.
- Medication guidance. Diabetes and thyroid programmes carry a fixed "talk to your doctor before changing medication" line on anything the nutritionist sends.
- CGM or wearable ingestion in the first three phases. When it comes, it is nutritionist-initiated for high-risk clients only.

## Principles this yields

1. Queue first, dashboard second. Numbers exist to prioritise, not to decorate.
2. The cheapest good response is one tap and still says something specific.
3. Silence, questions, and unresolved "who ate this" outrank new photos.
4. Per-member rules, per-household rhythm.
5. Show uncertainty as an action ("Oil?" → Ask), not a disclaimer.
6. Everything sent has a home in the client app and a reply path.
7. Templates hold her voice so she can scale without sounding like a bot.
8. Consent is visible from both sides and revocable in one tap.
