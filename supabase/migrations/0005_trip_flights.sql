-- Multi-leg flights per trip (e.g. GVA→AUH, AUH→ISB out; ISB→AUH, AUH→GVA
-- back). Airline and route are resolved client-side at entry time and stored
-- denormalized so the list renders offline.

create table public.trip_flights (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  position int not null default 0,
  flight_number text not null,
  flight_date date,
  airline text,
  origin_iata text,
  origin_city text,
  dest_iata text,
  dest_city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trip_flights_trip_idx on public.trip_flights (trip_id, position);

alter table public.trip_flights enable row level security;

create policy "Users read own trip flights"
  on public.trip_flights for select
  using (auth.uid() = user_id);

create policy "Users insert own trip flights"
  on public.trip_flights for insert
  with check (auth.uid() = user_id);

create policy "Users update own trip flights"
  on public.trip_flights for update
  using (auth.uid() = user_id);

create policy "Users delete own trip flights"
  on public.trip_flights for delete
  using (auth.uid() = user_id);

create trigger trip_flights_touch_updated_at
  before update on public.trip_flights
  for each row execute function public.touch_updated_at();
