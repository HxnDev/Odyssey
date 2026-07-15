-- Odyssey — Phase 1+2 schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).

-- ============ Enums ============

create type public.country_status as enum ('visited', 'lived', 'wishlist', 'transit');

-- ============ Profiles ============

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  home_country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- ============ Settings ============

create table public.settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  theme text not null default 'system' check (theme in ('system', 'light', 'dark')),
  map_theme text not null default 'auto' check (map_theme in ('auto', 'light', 'dark')),
  units text not null default 'metric' check (units in ('metric', 'imperial')),
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

create policy "Users manage own settings"
  on public.settings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-create profile + settings on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'display_name');
  insert into public.settings (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ Country visits ============

create table public.country_visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  country_iso text not null check (char_length(country_iso) = 2),
  status public.country_status not null,
  favorite boolean not null default false,
  first_visit_date date,
  last_visit_date date,
  total_days integer check (total_days is null or total_days >= 0),
  visit_count integer not null default 1 check (visit_count > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, country_iso)
);

create index country_visits_user_idx on public.country_visits (user_id);

alter table public.country_visits enable row level security;

create policy "Users manage own country visits"
  on public.country_visits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Keep updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger touch_profiles before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger touch_settings before update on public.settings
  for each row execute function public.touch_updated_at();
create trigger touch_country_visits before update on public.country_visits
  for each row execute function public.touch_updated_at();

-- ============ Account deletion ============

-- Lets a signed-in user delete their own auth user; all app data cascades.
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_own_account() from anon, public;
grant execute on function public.delete_own_account() to authenticated;
