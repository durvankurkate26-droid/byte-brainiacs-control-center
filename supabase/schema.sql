-- ============================================================
-- Byte Brainiacs — Attendance Prototype
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Table
create table if not exists public.teams (
  team_id        text primary key,                 -- e.g. 'BB001'
  team_name      text not null,
  participant_1  text not null,
  participant_2  text,
  participant_3  text,
  attendance     boolean not null default false,
  checkin_time   timestamptz,
  created_at     timestamptz not null default now()
);

-- Helpful index for the team list page (sort/filter by attendance)
create index if not exists idx_teams_attendance on public.teams (attendance);

-- 2. Row Level Security
-- Enabled so the table isn't wide open by default, but with a
-- permissive policy suitable for a hackathon prototype using the
-- anon/public key from the browser. Tighten this before any
-- real-world or production use (see note at bottom).
alter table public.teams enable row level security;

drop policy if exists "Public read access" on public.teams;
create policy "Public read access"
  on public.teams
  for select
  to anon
  using (true);

drop policy if exists "Public update for check-in" on public.teams;
create policy "Public update for check-in"
  on public.teams
  for update
  to anon
  using (true)
  with check (true);

-- Note: INSERT/DELETE are intentionally NOT granted to anon.
-- Seed data and team management should go through the SQL editor
-- or a service-role key on a trusted backend, not the public client.

-- ============================================================
-- PARTICIPANTS — master participant import (Sprint 1)
-- The uploaded CSV is imported into this table via the service-role
-- import route (app/api/import-participants). Future modules (QR,
-- email, attendance, reports) read from here instead of parsing the
-- CSV in-memory each time.
-- ============================================================

create table if not exists public.participants (
  id                 uuid primary key default gen_random_uuid(),
  team_number        text not null,
  participant_name   text not null,
  participant_email  text unique,          -- unique conflict target for upsert; nullable
  participant_phone  text,
  college            text,
  registration_type  text,                 -- extra columns carried over from the CSV
  course             text,
  registered_at      text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- Helpful index for grouping/filtering participants by team.
create index if not exists idx_participants_team_number
  on public.participants (team_number);

-- Row Level Security: public read so future client modules can list
-- participants with the anon key. Writes are performed ONLY through the
-- service-role import route, so no anon INSERT/UPDATE/DELETE policy exists.
alter table public.participants enable row level security;

drop policy if exists "Public read access participants" on public.participants;
create policy "Public read access participants"
  on public.participants
  for select
  to anon
  using (true);

-- Note: rows whose CSV email is blank are stored with participant_email = NULL.
-- Postgres treats NULLs as distinct in a unique index, so such rows are NOT
-- de-duplicated on re-import (each import inserts a fresh row). The import
-- route reports these as an "invalid email" count. Acceptable for the
-- prototype; email-bearing rows upsert cleanly and re-import is idempotent.

-- ============================================================
-- PRODUCTION NOTE (read before going beyond a hackathon demo):
-- The "Public update for check-in" policy lets anyone with the
-- anon key flip ANY row's attendance, not just the scanned one.
-- For a real deployment, replace it with a Postgres function
-- (security definer) that takes a team_id, checks attendance = false,
-- and updates atomically — then grant EXECUTE on that function to
-- anon instead of UPDATE on the table. Happy to add that if you want
-- to harden this past prototype stage.
-- ============================================================
