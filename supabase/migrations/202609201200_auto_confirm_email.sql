-- New email signups get a session immediately so the Expo app can continue
-- without a confirmation link. OTP verification remains available if confirmations
-- are turned back on in the Auth dashboard.
create or replace function public.auto_confirm_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_auto_confirm on auth.users;
create trigger on_auth_user_created_auto_confirm
  before insert on auth.users
  for each row
  execute function public.auto_confirm_auth_user();

revoke all on function public.auto_confirm_auth_user() from public, anon, authenticated;
