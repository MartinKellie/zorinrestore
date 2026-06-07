-- supabase/migrations/0001_foundation.sql
-- Phase 1: Foundation schema
-- Project: https://hzcxwonllrwrtruuagqc.supabase.co
-- IMPORTANT: This project was created post-2026-05-30.
-- Every table requires explicit GRANT — they are NOT auto-exposed to the API.

-- ============================================================
-- MACHINES
-- ============================================================
create table public.machines (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  label           text not null,
  hostname        text,
  os_name         text,
  os_version      text,
  kernel_version  text,
  architecture    text,
  scanner_version text,
  python_version  text,
  last_scan_at    timestamptz,
  created_at      timestamptz default now() not null,
  constraint machines_user_id_unique unique (user_id)  -- one machine per user in MVP
);

alter table public.machines enable row level security;

create policy "Owner can read own machines"
  on public.machines for select
  using (auth.uid() = user_id);

create policy "Owner can insert own machines"
  on public.machines for insert
  with check (auth.uid() = user_id);

create policy "Owner can update own machines"
  on public.machines for update
  using (auth.uid() = user_id);

-- GRANT required — post-2026-05-30 Supabase project
grant select, insert, update, delete on public.machines to authenticated;

-- ============================================================
-- SCAN RUNS (FK anchor for scan_items — enables Phase 2 history)
-- ============================================================
create table public.scan_runs (
  id              uuid primary key default gen_random_uuid(),
  machine_id      uuid references public.machines(id) on delete cascade not null,
  scanned_at      timestamptz default now() not null,
  scanner_version text,
  item_count      integer default 0
);

alter table public.scan_runs enable row level security;

create policy "Owner can read own scan runs"
  on public.scan_runs for select
  using (exists (
    select 1 from public.machines m
    where m.id = scan_runs.machine_id and m.user_id = auth.uid()
  ));

create policy "Service role inserts scan runs"
  on public.scan_runs for insert
  with check (true);

grant select, insert, update, delete on public.scan_runs to authenticated;

-- ============================================================
-- SCAN ITEMS
-- ============================================================
create table public.scan_items (
  id            uuid primary key default gen_random_uuid(),
  scan_run_id   uuid references public.scan_runs(id) on delete cascade not null,
  category      text not null,
  tool_name     text not null,
  version       text,
  install_path  text,
  importance    text default 'medium',
  confidence    text default 'high',
  needs_review  boolean default false,
  metadata      jsonb,
  ai_notes      text,
  general_note  text,
  restore_note  text,
  updated_at    timestamptz default now()
);

create unique index scan_items_tool_uidx
  on public.scan_items (scan_run_id, category, tool_name);

create index scan_items_metadata_gin
  on public.scan_items using gin (metadata);

alter table public.scan_items enable row level security;

create policy "Owner can read own scan items"
  on public.scan_items for select
  using (exists (
    select 1 from public.scan_runs sr
    join public.machines m on m.id = sr.machine_id
    where sr.id = scan_items.scan_run_id and m.user_id = auth.uid()
  ));

create policy "Owner can update own scan items"
  on public.scan_items for update
  using (exists (
    select 1 from public.scan_runs sr
    join public.machines m on m.id = sr.machine_id
    where sr.id = scan_items.scan_run_id and m.user_id = auth.uid()
  ));

create policy "Service role inserts scan items"
  on public.scan_items for insert
  with check (true);

grant select, insert, update, delete on public.scan_items to authenticated;

-- ============================================================
-- SCANNER TOKENS
-- ============================================================
create table public.scanner_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  token_hash  text unique not null,
  label       text,
  created_at  timestamptz default now() not null,
  last_used   timestamptz,
  revoked     boolean default false not null
);

alter table public.scanner_tokens enable row level security;

create policy "Owner can view own tokens"
  on public.scanner_tokens for select
  using (auth.uid() = user_id);

-- Only SELECT to authenticated — insert/update/delete via service_role Server Actions
grant select on public.scanner_tokens to authenticated;

-- ============================================================
-- SCAN CONFIG (one row per machine)
-- ============================================================
create table public.scan_config (
  id                 uuid primary key default gen_random_uuid(),
  machine_id         uuid references public.machines(id) on delete cascade not null,
  approved_folders   text[] default '{}',
  approved_commands  jsonb default '[]'
);

alter table public.scan_config enable row level security;

create policy "Owner can read own scan config"
  on public.scan_config for select
  using (exists (
    select 1 from public.machines m
    where m.id = scan_config.machine_id and m.user_id = auth.uid()
  ));

create policy "Owner can update own scan config"
  on public.scan_config for update
  using (exists (
    select 1 from public.machines m
    where m.id = scan_config.machine_id and m.user_id = auth.uid()
  ));

create policy "Service role manages scan config"
  on public.scan_config for insert
  with check (true);

grant select, insert, update, delete on public.scan_config to authenticated;
