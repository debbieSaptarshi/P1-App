-- Shared, service-role-only cache for generated circular food-plate thumbnails.
-- Cache hits skip the image API so the same meal/portion is generated once.
create table public.food_plate_cache (
  cache_key text primary key check (char_length(cache_key) between 16 and 128),
  media_type text not null check (media_type in ('image/jpeg', 'image/png', 'image/webp')),
  image_b64 text not null check (char_length(image_b64) between 32 and 400000),
  model text not null,
  created_at timestamptz not null default now()
);

revoke all on public.food_plate_cache from public, anon, authenticated;
grant all on public.food_plate_cache to service_role;
