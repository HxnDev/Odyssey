-- Manual ordering of trips inside a group. Null = not manually ordered yet
-- (falls back to start_date, then created_at).
alter table public.trips
  add column if not exists sort_order integer;
