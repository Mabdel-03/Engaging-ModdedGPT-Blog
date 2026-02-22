-- MIT NanoGPT leaderboard schema (Supabase Postgres)
-- Run this in Supabase SQL Editor.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  kerberos text not null unique check (kerberos ~ '^[a-z0-9][a-z0-9._-]{1,31}$'),
  mit_email text not null unique check (lower(mit_email) ~ '^[^@]+@(mit\.edu|virginia\.edu)$'),
  created_at timestamptz not null default now()
);

create table if not exists public.runs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kerberos text not null check (kerberos ~ '^[a-z0-9][a-z0-9._-]{1,31}$'),
  mit_email text not null check (lower(mit_email) ~ '^[^@]+@(mit\.edu|virginia\.edu)$'),
  track text not null check (track = 'modded-nanogpt'),
  time_to_3_28_sec numeric(12, 2) not null check (time_to_3_28_sec > 0),
  run_description text not null,
  run_log_url text not null,
  contributors text,
  created_at timestamptz not null default now()
);

create index if not exists runs_created_at_idx on public.runs (created_at desc);
create index if not exists runs_rank_idx on public.runs (time_to_3_28_sec asc);
create index if not exists runs_track_idx on public.runs (track);

-- Backward-compatible upgrades for existing deployments.
alter table public.runs add column if not exists track text;
alter table public.runs add column if not exists time_to_3_28_sec numeric(12, 2);
alter table public.runs add column if not exists run_description text;
alter table public.runs add column if not exists run_log_url text;
alter table public.runs add column if not exists contributors text;

-- Remove legacy columns no longer used by the simplified leaderboard form.
alter table public.runs drop column if exists gpu_type cascade;
alter table public.runs drop column if exists gpu_count cascade;
alter table public.runs drop column if exists best_val_loss cascade;
alter table public.runs drop column if exists mean_val_loss cascade;
alter table public.runs drop column if exists p_value_328 cascade;
alter table public.runs drop column if exists tokens_per_sec cascade;
alter table public.runs drop column if exists repo_commit cascade;
alter table public.runs drop column if exists extra_log_url cascade;
alter table public.runs drop column if exists config_url cascade;
alter table public.runs drop column if exists timing_method cascade;
alter table public.runs drop column if exists ml_change cascade;
alter table public.runs drop column if exists systems_only cascade;
alter table public.runs drop column if exists same_hardware_baseline cascade;
alter table public.runs drop column if exists timing_rules_compliant cascade;
alter table public.runs drop column if exists evidence_run_count cascade;
alter table public.runs drop column if exists torch_version cascade;
alter table public.runs drop column if exists cuda_version cascade;
alter table public.runs drop column if exists verification_status cascade;
alter table public.runs drop column if exists verification_notes cascade;
alter table public.runs drop column if exists run_notes cascade;

-- Enforce required fields from the current form where existing data permits it.
do $$
begin
  if not exists (select 1 from public.runs where track is null) then
    alter table public.runs alter column track set not null;
  end if;
  if not exists (select 1 from public.runs where time_to_3_28_sec is null) then
    alter table public.runs alter column time_to_3_28_sec set not null;
  end if;
  if not exists (select 1 from public.runs where run_description is null) then
    alter table public.runs alter column run_description set not null;
  end if;
  if not exists (select 1 from public.runs where run_log_url is null) then
    alter table public.runs alter column run_log_url set not null;
  end if;
end $$;

alter table public.runs drop constraint if exists runs_track_check;
alter table public.runs drop constraint if exists runs_verification_status_check;
alter table public.profiles drop constraint if exists profiles_mit_email_check;
alter table public.runs drop constraint if exists runs_mit_email_check;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'runs_track_check_ext'
      and conrelid = 'public.runs'::regclass
  ) then
    alter table public.runs
      add constraint runs_track_check_ext
      check (track = 'modded-nanogpt');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_email_domain_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_email_domain_check
      check (lower(mit_email) ~ '^[^@]+@(mit\.edu|virginia\.edu)$');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'runs_email_domain_check'
      and conrelid = 'public.runs'::regclass
  ) then
    alter table public.runs
      add constraint runs_email_domain_check
      check (lower(mit_email) ~ '^[^@]+@(mit\.edu|virginia\.edu)$');
  end if;
end $$;

create or replace function public.current_auth_email()
returns text
language sql
stable
as $$
  select lower(coalesce((auth.jwt() ->> 'email'), ''));
$$;

alter table public.profiles enable row level security;
alter table public.runs enable row level security;

drop policy if exists profiles_read_all on public.profiles;
create policy profiles_read_all
on public.profiles
for select
to public
using (true);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (
  user_id = auth.uid()
  and current_auth_email() ~ '^[^@]+@(mit\.edu|virginia\.edu)$'
  and kerberos = split_part(current_auth_email(), '@', 1)
  and mit_email = current_auth_email()
);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and current_auth_email() ~ '^[^@]+@(mit\.edu|virginia\.edu)$'
  and kerberos = split_part(current_auth_email(), '@', 1)
  and mit_email = current_auth_email()
);

drop policy if exists runs_read_all on public.runs;
create policy runs_read_all
on public.runs
for select
to public
using (true);

drop policy if exists runs_insert_own_mit on public.runs;
create policy runs_insert_own_mit
on public.runs
for insert
to authenticated
with check (
  user_id = auth.uid()
  and current_auth_email() ~ '^[^@]+@(mit\.edu|virginia\.edu)$'
  and kerberos = split_part(current_auth_email(), '@', 1)
  and mit_email = current_auth_email()
);

drop policy if exists runs_update_own on public.runs;
create policy runs_update_own
on public.runs
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists runs_delete_own on public.runs;
create policy runs_delete_own
on public.runs
for delete
to authenticated
using (user_id = auth.uid());
