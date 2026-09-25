-- Households, members, proxy logging, WhatsApp identities, nutritionist
-- assignments, and canonical food events. Writes go through the API
-- (service_role). JWT clients have no direct table access.
create table public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  invite_code text not null unique check (invite_code ~ '^[A-Z0-9]{6,12}$'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  display_name text not null check (char_length(display_name) between 1 and 80),
  relationship text not null default 'self'
    check (relationship in ('self','spouse','parent','child','sibling','other')),
  age_band text check (age_band in ('child','teen','adult','older_adult')),
  is_self boolean not null default false,
  created_at timestamptz not null default now()
);
create index members_household on public.members(household_id);
create unique index members_auth_user on public.members(auth_user_id) where auth_user_id is not null;
create unique index members_household_self on public.members(household_id) where is_self;

create table public.household_memberships (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','member')),
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);
create index memberships_user on public.household_memberships(user_id);

create table public.proxy_permissions (
  household_id uuid not null references public.households(id) on delete cascade,
  actor_member_id uuid not null references public.members(id) on delete cascade,
  subject_member_id uuid not null references public.members(id) on delete cascade,
  granted boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (actor_member_id, subject_member_id),
  check (actor_member_id <> subject_member_id)
);
create index proxy_subject on public.proxy_permissions(subject_member_id);

create table public.whatsapp_identities (
  id uuid primary key default gen_random_uuid(),
  wa_id text not null unique check (wa_id ~ '^[0-9]{8,15}$'),
  phone_e164 text not null check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  member_id uuid not null references public.members(id) on delete cascade,
  default_subject_member_id uuid references public.members(id) on delete set null,
  created_at timestamptz not null default now()
);
create index whatsapp_member on public.whatsapp_identities(member_id);

create table public.nutritionist_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  invite_code text not null unique check (invite_code ~ '^[A-Z0-9]{6,12}$'),
  created_at timestamptz not null default now()
);

create table public.nutritionist_assignments (
  nutritionist_user_id uuid not null references public.nutritionist_profiles(user_id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  consented_at timestamptz not null default now(),
  primary key (nutritionist_user_id, household_id)
);
create index assignments_household on public.nutritionist_assignments(household_id);
create index assignments_nutritionist on public.nutritionist_assignments(nutritionist_user_id);

create table public.member_profiles (
  member_id uuid primary key references public.members(id) on delete cascade,
  gender text check (gender in ('male','female','other','prefer_not_to_say')),
  date_of_birth date,
  height_cm numeric check (height_cm is null or (height_cm >= 0 and height_cm <= 300)),
  weight_kg numeric check (weight_kg is null or (weight_kg >= 0 and weight_kg <= 700)),
  target_weight_kg numeric check (target_weight_kg is null or (target_weight_kg >= 0 and target_weight_kg <= 700)),
  workout_frequency text,
  goals text[] not null default '{}',
  diet_pattern text,
  allergies text[] not null default '{}',
  who_for text check (who_for in ('self','family','caregiver')),
  proxy_consent boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.food_events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  subject_member_id uuid not null references public.members(id) on delete cascade,
  logged_by_member_id uuid not null references public.members(id) on delete restrict,
  channel text not null check (channel in ('app','whatsapp','nutritionist')),
  captured_at timestamptz not null default now(),
  local_date date not null,
  meal_slot text check (meal_slot in ('breakfast','lunch','dinner','snack')),
  caption text check (caption is null or char_length(caption) <= 2000),
  context text check (context is null or context in ('home','restaurant','unknown')),
  media_path text,
  media_type text,
  review_status text not null default 'received'
    check (review_status in ('received','needs_subject','reviewed','flagged')),
  signals jsonb,
  created_at timestamptz not null default now()
);
create index food_events_day on public.food_events(household_id, local_date desc, captured_at desc);
create index food_events_subject on public.food_events(subject_member_id, captured_at desc);
create index food_events_review on public.food_events(review_status, captured_at desc);

create table public.food_event_notes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  food_event_id uuid references public.food_events(id) on delete cascade,
  local_date date,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 3000),
  created_at timestamptz not null default now(),
  check (food_event_id is not null or local_date is not null)
);
create index food_event_notes_household on public.food_event_notes(household_id, created_at desc);

create table public.whatsapp_pending (
  id uuid primary key default gen_random_uuid(),
  wa_id text not null,
  member_id uuid not null references public.members(id) on delete cascade,
  media_id text,
  caption text,
  media_path text,
  media_type text,
  created_at timestamptz not null default now()
);
create index whatsapp_pending_wa on public.whatsapp_pending(wa_id, created_at desc);

create table public.whatsapp_messages (
  wa_message_id text primary key check (char_length(wa_message_id) between 1 and 128),
  food_event_id uuid references public.food_events(id) on delete set null,
  pending_id uuid references public.whatsapp_pending(id) on delete set null,
  created_at timestamptz not null default now()
);

do $$ declare t text; begin
  foreach t in array array[
    'households','members','household_memberships','proxy_permissions','whatsapp_identities',
    'nutritionist_profiles','nutritionist_assignments','member_profiles','food_events',
    'food_event_notes','whatsapp_pending','whatsapp_messages'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from public, anon, authenticated', t);
    execute format('grant all on public.%I to service_role', t);
  end loop;
end $$;
