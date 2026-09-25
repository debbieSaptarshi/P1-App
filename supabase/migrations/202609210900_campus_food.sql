-- IIT Bombay campus food catalog (mess, canteens, nearby restaurants)
-- and extra meal contexts used in the hostel pilot.

alter table public.food_events drop constraint if exists food_events_context_check;
alter table public.food_events add constraint food_events_context_check
  check (context is null or context in ('home','restaurant','unknown','mess','canteen','hostel_room','delivery'));

create table public.campus_outlets (
  id text primary key check (char_length(id) between 1 and 80),
  name text not null check (char_length(name) between 1 and 120),
  kind text not null check (kind in ('mess','canteen','restaurant')),
  priority smallint not null check (priority in (1, 2, 3)),
  hostel_codes text[] not null default '{}',
  area text not null check (char_length(area) between 1 and 160),
  veg_only boolean not null default false,
  source_url text,
  notes text,
  updated_at timestamptz not null default now()
);

create table public.campus_dishes (
  id text primary key check (char_length(id) between 1 and 120),
  outlet_id text not null references public.campus_outlets(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 160),
  aliases text[] not null default '{}',
  meal_slots text[] not null default '{}',
  serving_size text not null,
  serving_grams numeric not null check (serving_grams > 0 and serving_grams <= 5000),
  calories numeric not null check (calories >= 0 and calories <= 100000),
  protein numeric not null check (protein >= 0 and protein <= 100000),
  carbs numeric not null check (carbs >= 0 and carbs <= 100000),
  fat numeric not null check (fat >= 0 and fat <= 100000),
  fiber numeric not null check (fiber >= 0 and fiber <= 100000),
  sodium numeric not null check (sodium >= 0 and sodium <= 100000),
  diet text not null check (diet in ('veg','egg','nonveg','jain')),
  oil_tsp numeric not null default 0 check (oil_tsp >= 0 and oil_tsp <= 20),
  price_inr numeric check (price_inr is null or (price_inr >= 0 and price_inr <= 10000)),
  weekday smallint check (weekday is null or (weekday >= 0 and weekday <= 6)),
  source text not null check (source in ('scraped','mess_menu','tender','field_typical')),
  source_url text
);
create index campus_dishes_outlet on public.campus_dishes(outlet_id);
create index campus_dishes_name on public.campus_dishes(lower(name));

alter table public.campus_outlets enable row level security;
alter table public.campus_dishes enable row level security;
revoke all on public.campus_outlets, public.campus_dishes from public, anon, authenticated;
grant all on public.campus_outlets, public.campus_dishes to service_role;
grant select on public.campus_outlets, public.campus_dishes to authenticated;
create policy campus_outlets_read on public.campus_outlets for select to authenticated using (true);
create policy campus_dishes_read on public.campus_dishes for select to authenticated using (true);
