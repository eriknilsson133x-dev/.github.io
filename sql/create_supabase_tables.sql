-- sql/create_supabase_tables.sql
-- Run this in the Supabase SQL editor to create required tables

create table if not exists workouts (
  id text primary key,
  data jsonb,
  updated bigint,
  created_at timestamptz default now()
);

create table if not exists backups (
  id uuid default gen_random_uuid() primary key,
  user_id text,
  data jsonb,
  created_at timestamptz default now()
);

-- Optional: add RLS policies if you enable Auth and per-user data
-- See Supabase docs for row-level security and policies

create table if not exists plans (
  id text primary key,
  data jsonb,
  updated bigint,
  created_at timestamptz default now()
);

create table if not exists logs (
  id text primary key,
  data jsonb,
  updated bigint,
  created_at timestamptz default now()
);

-- Dev: example permissive RLS policies (INSECURE - use only for quick testing)
-- Run these only if you understand the security implications.
alter table workouts enable row level security;
alter table plans enable row level security;
alter table logs enable row level security;

create policy "Allow public read" on workouts for select using (true);
create policy "Allow public write" on workouts for insert using (true) with check (true);

create policy "Allow public read" on plans for select using (true);
create policy "Allow public write" on plans for insert using (true) with check (true);

create policy "Allow public read" on logs for select using (true);
create policy "Allow public write" on logs for insert using (true) with check (true);
