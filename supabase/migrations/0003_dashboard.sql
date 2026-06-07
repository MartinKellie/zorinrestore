-- supabase/migrations/0003_dashboard.sql
-- Phase 3: Dashboard schema extensions
-- Adds: has_secret_dep on scan_items, importance normalisation, secret_reminders table
-- Post-2026-05-30 project — explicit GRANTs included on new table

-- 1. Add has_secret_dep column to scan_items
alter table public.scan_items
  add column if not exists has_secret_dep boolean default false;

-- 2. Normalise importance — change default and backfill 'medium' rows
alter table public.scan_items
  alter column importance set default 'Useful';

update public.scan_items
  set importance = 'Useful'
  where importance = 'medium';

-- 3. Create secret_reminders table
create table public.secret_reminders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  name        text not null check (char_length(name) > 0),
  note        text,
  created_at  timestamptz default now() not null
);

alter table public.secret_reminders enable row level security;

create policy "Owner can read own secret reminders"
  on public.secret_reminders for select
  using (auth.uid() = user_id);

create policy "Owner can insert own secret reminders"
  on public.secret_reminders for insert
  with check (auth.uid() = user_id);

create policy "Owner can delete own secret reminders"
  on public.secret_reminders for delete
  using (auth.uid() = user_id);

-- Post-2026-05-30 project: explicit GRANT required (see CLAUDE.md)
grant select, insert, update, delete on public.secret_reminders to authenticated;
