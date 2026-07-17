-- Local departure/arrival times for flight legs ("HH:MM", local to each
-- airport). Used with bundled airport UTC offsets to compute layover / stay
-- durations across timezones.

alter table public.trip_flights
  add column if not exists dep_time text,
  add column if not exists arr_time text;
