# 04 — Shared backend

One Supabase project (7Labs · `adaptive-food-coach`), one Express API (`artifacts/api-server`), one contracts package (`lib/backend-contracts`). Practice adds tables and routes; it does not fork the stack. This document inventories what exists, names the gaps, and specifies the additions with enough precision to write the migration and the routes.

## Principles (unchanged from the current backend)

- Writes go through the API with the service role. JWT clients get no table grants except the narrow reads already in place.
- Every care route checks assignment (`isNutritionistFor`) or household membership (`requireHouseholdAccess`). Practice adds scope checks on top (consent) and role checks (practice team).
- Zod contracts are shared. Enums added for Practice (ack tags, message kinds, analytes, target kinds) live in `lib/backend-contracts` and are imported by both apps.
- No request-body logging; health data reads are audit-logged.

## What exists today

| Table / RPC | Purpose | Practice uses it for |
| --- | --- | --- |
| `households`, `members`, `household_memberships` | Family unit, people (with or without an auth user), app accounts in a household | Client roster, household timeline |
| `proxy_permissions` | Who may log for whom | "by Priya" attribution, WhatsApp subject resolution |
| `whatsapp_identities`, `whatsapp_pending`, `whatsapp_messages` | Number → member, "who ate this" pending state, idempotency | Needs-you queue, outbound routing |
| `nutritionist_profiles`, `nutritionist_assignments` | Nutritionist identity + invite code; household assignment with `consented_at` | Gate and roster |
| `member_profiles` | Gender, DOB, height, weight, goals, diet, allergies, who_for, proxy consent | Member header, Plan defaults |
| `food_events` | Canonical meal stream (channel app/whatsapp/nutritionist, context, media, `review_status`, `signals`) | The queue |
| `food_event_notes` | Free-text notes by day or meal (any household-access user) | Superseded by `care_notes` + `care_feedback` (kept for migration) |
| `campus_outlets`, `campus_dishes` | Catalog for grounded estimates | "What the model saw" |
| `app_records`, `account_revisions`, `sync_mutations` | Client's private synced store (profile, food_entries, weights, preferences…) | Not read by Practice. See "Canonical meal record" |
| `ai_requests`, `reserve_ai_request` | Idempotent AI calls with quota | New tasks `digest`, `lab_ocr` |
| Storage `meal-media` | WhatsApp media | Signed URLs for review |

Routes that exist: `/v1/care/*` (household bootstrap/join/proxy/food-events for clients), `/v1/nutritionist/*` (me, households, day view, notes, food-events, invite rotation), `/whatsapp` webhook, `/v1/ai/*`.

## Gaps and decisions

### 1. Canonical meal record

Two systems hold meals: `food_events` (care stream, household-scoped) and `food_entries` inside `app_records` (client's private store with nutrition). Practice reads only `food_events`. Decision:

- Today the client store (`hooks/useAppStore.ts` → `logFood` / `logFoods`) already calls `createCareFoodEvent`, but it fires **one event per food item** carrying only `foodName`, `mealSlot`, and `localDate` — no photo, no context, no estimate, no link back to the entry. Practice would see "Roti", "Dal", "Rice" as three meals with no picture.
- Change the client to write **one `food_event` per confirmed meal** (all items of one review-screen confirm), with `mediaPath` (upload the photo to `meal-media` first, same bucket the WhatsApp bot uses), `context`, and the confirmed estimate in `signals`: `{ items:[{name, catalogId?, portionGrams?, oilTsp?, entryId}], kcalLow, kcalHigh, protein, fiber, contextGuess, missingInputs, analysisId }`.
- Add `food_events.entry_ref text[]` (the `food_entries.id`s in the client store) so a later client-side edit or delete updates the same event, and `food_events.corrected_by uuid` / `corrected_at` for nutritionist corrections. Extend `createFoodEventSchema` accordingly.
- `app_records` stays private. Nothing in Practice queries it.

### 2. Feedback, questions, messages, notes

Replace the single `food_event_notes` with typed tables so each thing renders in the right place (see `03-client-app-mirror.md`).

```sql
create type public.ack_tag as enum (
  'good_plate','more_protein','watch_oil','smaller_portion','add_fibre','nice_swap',
  'late_meal','swap_the_sweet','good_timing','protein_present','too_late'
);

create table public.care_feedback (
  id uuid primary key default gen_random_uuid(),
  food_event_id uuid not null references public.food_events(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete set null,
  tag public.ack_tag,
  body text check (body is null or char_length(body) <= 2000),
  include_estimate boolean not null default false,
  created_at timestamptz not null default now(),
  check (tag is not null or body is not null)
);
create index care_feedback_member on public.care_feedback(member_id, created_at desc);
create index care_feedback_event on public.care_feedback(food_event_id);

create table public.care_questions (
  id uuid primary key default gen_random_uuid(),
  food_event_id uuid references public.food_events(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  author_user_id uuid not null references auth.users(id) on delete set null,
  kind text not null check (kind in ('context','oil','portion','subject','items','free')),
  prompt text not null check (char_length(prompt) between 1 and 500),
  options jsonb not null default '[]',
  answered_at timestamptz,
  answer jsonb,
  answered_via text check (answered_via in ('app','whatsapp')),
  created_at timestamptz not null default now()
);
create index care_questions_open on public.care_questions(member_id) where answered_at is null;

create table public.care_messages (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  member_id uuid references public.members(id) on delete cascade,        -- null = household-wide
  author_user_id uuid not null references auth.users(id) on delete set null,
  kind text not null check (kind in ('comment','swap','nudge','focus','digest','event_note','household','broadcast','system')),
  body text not null check (char_length(body) between 1 and 4000),
  ref_kind text check (ref_kind in ('swap','focus','weekly_review','member_event','lab_report')),
  ref_id uuid,
  visible_from timestamptz not null default now(),   -- for pre-emptive event notes
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index care_messages_member on public.care_messages(member_id, created_at desc);
create index care_messages_household on public.care_messages(household_id, created_at desc);

create table public.care_message_replies (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.care_messages(id) on delete cascade,
  author_user_id uuid references auth.users(id) on delete set null,   -- null for WhatsApp-only members
  author_member_id uuid references public.members(id) on delete set null,
  body text,
  choice text check (choice in ('tried','not_for_me','thanks','tell_me_more')),
  created_at timestamptz not null default now()
);

create table public.care_notes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  food_event_id uuid references public.food_events(id) on delete set null,
  local_date date,
  author_user_id uuid not null references auth.users(id) on delete set null,
  kind text not null default 'private' check (kind in ('private','consult','intake')),
  body text not null check (char_length(body) between 1 and 6000),
  duration_min integer check (duration_min is null or duration_min between 0 and 600),
  created_at timestamptz not null default now()
);
```

Migration: copy `food_event_notes` rows into `care_notes(kind='private')`; keep the old table read-only for one release, then drop.

### 3. Enrolment, programme, targets, focus, events

```sql
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  nutritionist_user_id uuid not null references public.nutritionist_profiles(user_id) on delete cascade,
  program_id text not null check (program_id in ('general','pcos','diabetes','thyroid','gut')),
  starts_on date not null,
  ends_on date not null,
  status text not null default 'waiting' check (status in ('waiting','active','grace','ended','renewed')),
  cadence text not null default 'standard' check (cadence in ('standard','maintenance')),
  created_at timestamptz not null default now()
);
create index enrollments_member on public.enrollments(member_id, status);
create index enrollments_nutritionist on public.enrollments(nutritionist_user_id, status);

create table public.member_targets (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  kind text not null check (kind in ('macro','timing','presence','avoid','custom')),
  label text not null check (char_length(label) between 1 and 160),   -- "Dinner before 20:00"
  spec jsonb not null default '{}',   -- {"nutrient":"protein","min":70} | {"slot":"dinner","before":"20:00"} | {"nutrient":"protein","everyMeal":true}
  show_to_client boolean not null default true,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);
create index member_targets_member on public.member_targets(member_id, sort);

create table public.member_focus (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  week_start date not null,
  statement text not null check (char_length(statement) between 1 and 200),
  target_kind text not null check (target_kind in ('days_of_7','before_time','count_per_day','yes_no')),
  target_spec jsonb not null default '{}',
  progress jsonb not null default '{}',    -- computed by rollup: {"done":2,"of":4}
  outcome text check (outcome in ('met','partial','missed','skipped')),
  template_id uuid,
  created_at timestamptz not null default now(),
  unique (member_id, week_start)
);

create table public.member_events (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  kind text not null check (kind in ('travel','wedding','festival','fasting','illness','other')),
  starts_on date not null,
  ends_on date not null,
  note_to_client text check (note_to_client is null or char_length(note_to_client) <= 1000),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
```

### 4. Weekly reviews

```sql
create table public.weekly_reviews (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  week_start date not null,
  facts jsonb not null,                -- rollup sentences with counts and event ids
  went_well text,
  focus_id uuid references public.member_focus(id) on delete set null,
  message_id uuid references public.care_messages(id) on delete set null,
  drafted_by uuid references auth.users(id) on delete set null,
  sent_by uuid references auth.users(id) on delete set null,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (member_id, week_start)
);
```

### 5. Labs and milestones

```sql
create type public.lab_analyte as enum (
  'hba1c','fasting_glucose','fasting_insulin','triglycerides','total_cholesterol','ldl','hdl',
  'alt','ast','creatinine','egfr','tsh','ft4','vitamin_d','vitamin_b12','ferritin','haemoglobin','crp','uric_acid'
);

create table public.lab_reports (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  taken_on date not null,
  stage text not null check (stage in ('intake','mid','final','other')),
  media_path text,                      -- storage bucket lab-media (private)
  status text not null default 'uploaded' check (status in ('uploaded','ocr_pending','needs_confirmation','confirmed')),
  uploaded_by uuid references auth.users(id) on delete set null,
  confirmed_by uuid references auth.users(id) on delete set null,
  confirmed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.lab_values (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.lab_reports(id) on delete cascade,
  analyte public.lab_analyte not null,
  value numeric not null,
  unit text not null,
  ref_low numeric, ref_high numeric,
  source text not null default 'ocr' check (source in ('ocr','manual')),
  unique (report_id, analyte)
);

create table public.lab_panels (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.nutritionist_profiles(user_id) on delete cascade,
  name text not null,
  analytes public.lab_analyte[] not null,
  rule jsonb not null default '{}'      -- {"minAge":25} | {"programs":["pcos","diabetes"]}
);

create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  kind text not null check (kind in ('lab_delta','consistency','focus_streak','programme_complete','custom')),
  title text not null,
  detail jsonb not null default '{}',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
```

### 6. Library

```sql
create table public.swaps (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.nutritionist_profiles(user_id) on delete cascade,
  practice_id uuid,
  name text not null, why text, when_to_use text[] not null default '{}',
  programs text[] not null default '{}', diet text check (diet in ('veg','egg','nonveg','jain','any')),
  prep_min integer, media_path text, source_food_event_id uuid references public.food_events(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.nutritionist_templates (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.nutritionist_profiles(user_id) on delete cascade,
  practice_id uuid,
  kind text not null check (kind in ('ack_label','nudge','focus','digest_intro','digest_outro','event_note','broadcast')),
  key text,                              -- ack_tag value for ack_label; ladder step for nudge
  body text not null,
  target_kind text, target_spec jsonb,   -- for focus templates
  trigger jsonb,                         -- pattern that ranks this focus, e.g. {"pattern":"late_dinner","min":3}
  created_at timestamptz not null default now()
);

create table public.program_defaults (
  owner_user_id uuid not null references public.nutritionist_profiles(user_id) on delete cascade,
  program_id text not null,
  targets jsonb not null default '[]', dos text[] not null default '{}', donts text[] not null default '{}',
  ack_tags public.ack_tag[] not null default '{}', lab_panel_id uuid references public.lab_panels(id),
  consent_scopes text[] not null default '{meals,profile,messages}',
  primary key (owner_user_id, program_id)
);
```

Seed a starter set per nutritionist on profile creation from `constants/programs.ts` (dos/don'ts, macro splits) so the Library is not empty on day one.

### 7. Practice, team, cohorts

```sql
create table public.practices (
  id uuid primary key default gen_random_uuid(),
  name text not null, owner_user_id uuid not null references auth.users(id) on delete cascade,
  review_windows jsonb not null default '[{"start":"07:30","end":"08:30"},{"start":"21:00","end":"22:00"}]',
  quiet_hours jsonb not null default '{"start":"22:30","end":"07:00"}',
  timezone text not null default 'Asia/Kolkata',
  created_at timestamptz not null default now()
);
create table public.practice_members (
  practice_id uuid not null references public.practices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','dietitian','assistant')),
  can_view_notes boolean not null default false,
  can_view_labs boolean not null default false,
  primary key (practice_id, user_id)
);
alter table public.nutritionist_profiles add column practice_id uuid references public.practices(id);
alter table public.nutritionist_assignments add column practice_id uuid references public.practices(id);

create table public.cohorts (
  id uuid primary key default gen_random_uuid(),
  practice_id uuid not null references public.practices(id) on delete cascade,
  name text not null
);
create table public.cohort_members (
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  primary key (cohort_id, household_id)
);
```

Access rule: a user may act on a household if they are a `practice_members` row of the practice that holds the `nutritionist_assignments` row, subject to role scopes. `isNutritionistFor` is extended to this rule.

### 8. Consent and audit

```sql
create table public.care_consents (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  practice_id uuid not null references public.practices(id) on delete cascade,
  scope text not null check (scope in ('meals','profile','labs','messages')),
  status text not null check (status in ('granted','requested','revoked')),
  granted_by uuid references auth.users(id) on delete set null,   -- the client, or the caregiver with proxy consent
  granted_at timestamptz, revoked_at timestamptz,
  unique (member_id, practice_id, scope)
);

create table public.care_audit (
  id bigint generated always as identity primary key,
  actor_user_id uuid not null,
  practice_id uuid,
  member_id uuid,
  household_id uuid,
  action text not null,                  -- 'view_day','view_week','view_labs','view_notes','export','send_message'…
  ref jsonb,
  at timestamptz not null default now()
);
create index care_audit_member on public.care_audit(member_id, at desc);
```

Every `/v1/nutritionist` read of member data inserts one audit row (fire-and-forget, batched per request). The client reads its own audit through `/v1/care/audit`.

Revocation: the API filters on `care_consents` for every read; no cache. Ending an enrolment flips to `grace` (14 days) via a nightly job, then `ended`; the client can end immediately.

### 9. Rollups and member state

Practice's queue and pattern sentences must not be computed per request from raw events at 50 households. Add a nightly rollup plus a same-day incremental update.

```sql
create table public.member_daily_rollups (
  member_id uuid not null references public.members(id) on delete cascade,
  local_date date not null,
  meals integer not null default 0,
  slots text[] not null default '{}',
  first_log_at timestamptz, last_log_at timestamptz,
  late_dinner boolean not null default false,        -- dinner captured after member's timing target or 21:30
  restaurant integer not null default 0,
  extra_oil integer not null default 0,
  ack_counts jsonb not null default '{}',            -- {"more_protein":1,"good_plate":2}
  declared_event text,                               -- from member_events
  primary key (member_id, local_date)
);

create view public.member_state as
select m.id as member_id, m.household_id,
  max(f.captured_at) as last_log_at,
  extract(epoch from now() - max(f.captured_at))/3600 as hours_quiet,
  (select count(*) from public.member_daily_rollups r where r.member_id = m.id and r.local_date >= current_date - 6 and r.meals >= 2) as consistent_days_7,
  exists (select 1 from public.member_events e where e.member_id = m.id and current_date between e.starts_on and e.ends_on) as in_declared_event,
  exists (select 1 from public.care_questions q where q.member_id = m.id and q.answered_at is null) as has_open_question
from public.members m left join public.food_events f on f.subject_member_id = m.id
group by m.id, m.household_id;
```

- A trigger on `food_events` and `care_feedback` upserts today's rollup row for the subject member.
- `pg_cron` at 00:30 IST recomputes yesterday for all active members (idempotent), computes `member_focus.progress`, and moves enrolments through `grace`/`ended`.
- Quiet thresholds: 24 h base; 48 h when `in_declared_event`; Sundays add 12 h. Configurable per practice later.

### 10. Notifications and WhatsApp outbound

```sql
create table public.push_tokens (
  user_id uuid not null references auth.users(id) on delete cascade,
  app text not null check (app in ('client','practice')),
  token text not null, platform text not null check (platform in ('ios','android','web')),
  updated_at timestamptz not null default now(),
  primary key (user_id, token)
);

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid references auth.users(id) on delete cascade,
  recipient_wa_id text,
  channel text not null check (channel in ('expo','whatsapp')),
  kind text not null,                          -- mirrors care_messages.kind or 'feedback_batch', 'question', 'review_due'…
  payload jsonb not null,
  send_after timestamptz not null default now(),
  batch_key text,                              -- e.g. 'feedback:<member_id>:<window>' collapses many acks into one push
  status text not null default 'queued' check (status in ('queued','sent','failed','skipped')),
  attempts integer not null default 0, last_error text,
  created_at timestamptz not null default now()
);
create index outbox_due on public.notification_outbox(status, send_after);

create table public.whatsapp_conversations (
  wa_id text primary key,
  last_inbound_at timestamptz,
  last_outbound_at timestamptz,
  opted_out boolean not null default false
);
```

- A worker (API process on an interval in MVP; Supabase Edge Function on cron later) drains the outbox. Rows sharing a `batch_key` collapse into one push/WhatsApp message.
- WhatsApp routing: if `now() - last_inbound_at < 24h` send free-form text; otherwise send an approved **template** (nudge, weekly summary, question). Practice UI shows which one was used. Inbound webhook updates `last_inbound_at` (it already receives statuses; start recording them to `notification_outbox.status`).
- Quiet hours and review windows come from `practices`. Client-side notification preferences come from the existing `preferences` record in `app_records`.

### 11. Media

- `meal-media` stays private. Add `GET /v1/media/sign?path=…` that returns a 10-minute signed URL after the same access check as the meal itself. The current dashboard's `mediaPath.startsWith('http')` check goes away.
- New bucket `lab-media`, private, same signing route, `labs` scope required.

### 12. Realtime

MVP: the Practice app polls `GET /v1/nutritionist/queue` every 30 s while Today is visible; the payload is small (ids, timestamps, statuses) and the server uses `member_state` and indexed `food_events` queries.

Phase 2: enable Supabase Realtime on `food_events` and `care_questions` with narrow SELECT policies so the app can subscribe directly, keeping writes API-only:

```sql
create policy nutritionist_reads_events on public.food_events for select to authenticated using (
  exists (
    select 1 from public.nutritionist_assignments a
    join public.practice_members pm on pm.practice_id = a.practice_id and pm.user_id = auth.uid()
    join public.care_consents c on c.member_id = food_events.subject_member_id and c.practice_id = a.practice_id
      and c.scope = 'meals' and c.status = 'granted'
    where a.household_id = food_events.household_id
  )
);
```

The policy exists only for change notifications; the app still fetches detail through the API so audit logging stays complete.

### 13. AI tasks

Extend `aiTasks` with `digest` and `lab_ocr`; add `nutritionist` to the quota key so a practice gets a higher `AI_DAILY_LIMIT`.

- `digest`: input = facts (from `weekly_reviews.facts`), member programme, focus candidates, nutritionist templates and 3 sample past messages; output = `{ wentWell, focusSuggestions[3], message }` validated by a zod schema. Never given raw photos or names beyond first name.
- `lab_ocr`: input = image/PDF pages; output = `{ values:[{analyte, value, unit, refLow, refHigh, confidence}], unparsed:[lines] }`. Always followed by human confirmation; nothing is written to `lab_values` until confirmed.
- Pattern sentences are **not** AI; they are SQL over `member_daily_rollups` with fixed thresholds, so they are explainable and consistent.

### 14. Roles in the JWT

On nutritionist profile creation, set `auth.users.raw_app_meta_data.role = 'nutritionist'` via the API so Practice can gate the shell instantly on sign-in without a round trip. Authorisation still happens per route against the tables. A user with both a household membership and a nutritionist profile is allowed (a dietitian coaching her own family) but the two apps stay separate.

## API surface

New or changed routes. All under `/api/v1`, all behind `requireAuth`; nutritionist routes also behind `requireNutritionist` (profile exists) and per-household access + consent scope.

### Nutritionist (`/v1/nutritionist`)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/queue` | Today payload: needs_you, new_meals (grouped), quiet, reviews_due, labs_to_confirm, time_budget |
| GET | `/households` | Roster with `member_state`, enrolment day, state chip, consistency dots |
| POST | `/households` | Create household with members, numbers, proxies, programmes, targets, panel, consent defaults; returns codes and share link |
| GET | `/households/:id` | Household detail, timeline for a date range |
| GET | `/members/:id/day?date=` · `/week?start=` · `/labs` · `/plan` · `/notes` | Member tabs (each audit-logged; labs/notes scope-checked) |
| POST | `/food-events/:id/feedback` | Ack tag and/or comment (+ include_estimate) |
| POST | `/food-events/:id/questions` | Structured question |
| PATCH | `/food-events/:id` | Corrections: items, portion, oil, context, subject, slot; sets `reviewed` |
| POST | `/food-events/:id/flag` · `/unflag` | Weekly-review flag |
| POST | `/members/:id/messages` | Swap / nudge / event_note / comment; server picks channel and template |
| POST | `/households/:id/messages` | Household-wide message |
| POST | `/broadcasts` | Cohort broadcast with per-recipient rendering |
| PUT | `/members/:id/targets` · `/members/:id/enrollment` | Plan edits |
| POST | `/members/:id/events` | Travel/festival/fasting… |
| GET/POST | `/reviews?week=` · `/reviews/:memberId/draft` · `/reviews/:memberId/send` | Weekly review composer |
| POST | `/members/:id/labs` → `/labs/:id/ocr` → `/labs/:id/confirm` | Lab report lifecycle |
| POST | `/members/:id/milestones` | Create milestone |
| GET | `/members/:id/summary.pdf` | Programme or physician summary |
| CRUD | `/library/(swaps|templates|programs|panels)` | Library |
| CRUD | `/practice` · `/practice/members` · `/practice/cohorts` | Team and cohorts |
| GET | `/practice/analytics?from=&to=` | Practice metrics |
| GET | `/media/sign?path=` | Signed URL (shared with client routes) |

### Client (`/v1/care`)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/inbox` | Feedback, questions, messages, focus, review summary for the signed-in member and any members they log for |
| POST | `/questions/:id/answer` | Answer a structured question (updates the meal) |
| POST | `/messages/:id/replies` | Reply / tried / not_for_me / thanks |
| GET | `/nutritionist` | "Your nutritionist" payload: profile, windows, enrolment, consents, audit (90 d) |
| PUT | `/consents` | Grant/revoke scopes for self or for members the caller has proxy consent for |
| POST | `/enrollment/end` · `/enrollment/renew-intent` | Client-initiated end / renew |
| GET | `/labs` | Confirmed reports and values for self |
| POST | `/push-tokens` | Register Expo token (app = client) |

### WhatsApp

- Outbound goes through `notification_outbox`; `sendWhatsapp` gains template support and delivery-status recording.
- Inbound webhook: record `last_inbound_at`; parse `TRIED` / `NOT` / `STOP` replies; route free-text replies to the most recent open question or message for that number.

## Contracts (`lib/backend-contracts`)

Add and export: `ackTagSchema`, `messageKindSchema`, `questionKindSchema`, `targetKindSchema`, `labAnalyteSchema`, `enrollmentStatusSchema`, `consentScopeSchema`, plus request/response schemas for the routes above. Extend `foodEventSignalsSchema` to type the `signals` payload. Both apps import these; the Practice app must not define its own copies.

## Security summary

- Service role for all writes; JWT reads limited to the client's own `app_records` and the narrow Realtime policies above.
- Assignment + practice role + consent scope on every nutritionist read; audit row per read of member data.
- Rate limits: `/v1/nutritionist` at 240/min per user (queue polling), messaging routes at 60/min, AI at practice quota.
- Deletion: client account deletion cascades through `members` → feedback, questions, messages, labs, rollups, consents; `care_notes` authored by the nutritionist are retained with `member_id` nulled after 30 days. Nutritionist deletion reassigns households to the practice owner or ends enrolments with client notice.
- Export: client export (`/account/export`) now includes care data; practice export is per household and consent-filtered.
- Storage: both buckets private; signed URLs only; no public paths.

## Migration order

1. `202609xx01_practice_core.sql` — enums, `practices`, `practice_members`, `care_consents`, `care_audit`, alter `nutritionist_profiles`/`assignments`, `food_events` columns. Backfill: one practice per existing nutritionist profile; consents granted for `meals`, `profile`, `messages` for existing assignments (mirrors today's behaviour).
2. `…02_care_messaging.sql` — `care_feedback`, `care_questions`, `care_messages`, `care_message_replies`, `care_notes`; copy `food_event_notes`.
3. `…03_programme.sql` — `enrollments`, `member_targets`, `member_focus`, `member_events`, `weekly_reviews`. Backfill enrolments from `member_profiles` + client `preferences.programId` where present (via API job, not SQL).
4. `…04_rollups.sql` — `member_daily_rollups`, `member_state`, triggers, `pg_cron` schedule. Backfill 90 days.
5. `…05_notifications.sql` — `push_tokens`, `notification_outbox`, `whatsapp_conversations`.
6. `…06_labs_library.sql` — labs, milestones, swaps, templates, program defaults, panels; seed defaults per nutritionist.
7. `…07_realtime_policies.sql` — Phase 2 only.

Each migration adds the RLS `enable`/`revoke`/`grant service_role` block used by `202609202100_care.sql`.
