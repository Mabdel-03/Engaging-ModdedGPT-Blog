-- NanoGPT leaderboard schema (Supabase Postgres)
-- Google OAuth auth model, provider/domain agnostic.
-- Run this in Supabase SQL Editor.

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  account_email text unique,
  display_name text,
  role text not null default 'member' check (role in ('member', 'admin')),
  approval_status text not null default 'pending' check (approval_status in ('pending', 'approved', 'rejected')),
  approved_at timestamptz,
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_users (
  email text primary key,
  created_at timestamptz not null default now(),
  check (email = lower(email))
);

create table if not exists public.runs (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  account_email text,
  display_name text,
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
create index if not exists profiles_approval_status_idx on public.profiles (approval_status);

-- Backward-compatible upgrades for existing deployments.
alter table public.profiles add column if not exists account_email text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists role text;
alter table public.profiles add column if not exists approval_status text;
alter table public.profiles add column if not exists approved_at timestamptz;
alter table public.profiles add column if not exists approved_by uuid references auth.users(id) on delete set null;
alter table public.profiles alter column role set default 'member';
alter table public.profiles alter column approval_status set default 'pending';

alter table public.runs add column if not exists account_email text;
alter table public.runs add column if not exists display_name text;
alter table public.runs add column if not exists track text;
alter table public.runs add column if not exists time_to_3_28_sec numeric(12, 2);
alter table public.runs add column if not exists run_description text;
alter table public.runs add column if not exists run_log_url text;
alter table public.runs add column if not exists contributors text;

-- Normalize existing data into account_email before dropping old columns.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'mit_email'
  ) then
    update public.profiles
    set account_email = lower(mit_email)
    where account_email is null and mit_email is not null;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public' and table_name = 'runs' and column_name = 'mit_email'
  ) then
    update public.runs
    set account_email = lower(mit_email)
    where account_email is null and mit_email is not null;
  end if;
end $$;

-- Remove old auth-model fields and legacy telemetry columns.
alter table public.profiles drop column if exists kerberos cascade;
alter table public.profiles drop column if exists mit_email cascade;

alter table public.runs drop column if exists kerberos cascade;
alter table public.runs drop column if exists mit_email cascade;
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

-- Enforce required submission fields where existing data permits it.
do $$
begin
  update public.profiles
  set role = case when role is null then 'member' else role end;
  update public.profiles
  set approval_status = case when approval_status is null then 'pending' else approval_status end;

  if not exists (select 1 from public.profiles where role is null) then
    alter table public.profiles alter column role set not null;
  end if;
  if not exists (select 1 from public.profiles where approval_status is null) then
    alter table public.profiles alter column approval_status set not null;
  end if;

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

-- Cleanup old constraints and ensure track rule exists.
alter table public.runs drop constraint if exists runs_track_check;
alter table public.runs drop constraint if exists runs_track_check_ext;
alter table public.runs drop constraint if exists runs_verification_status_check;
alter table public.profiles drop constraint if exists profiles_mit_email_check;
alter table public.profiles drop constraint if exists profiles_email_domain_check;
alter table public.runs drop constraint if exists runs_mit_email_check;
alter table public.runs drop constraint if exists runs_email_domain_check;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles drop constraint if exists profiles_approval_status_check;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'runs_track_check'
      and conrelid = 'public.runs'::regclass
  ) then
    alter table public.runs
      add constraint runs_track_check
      check (track = 'modded-nanogpt');
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('member', 'admin'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_approval_status_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_approval_status_check
      check (approval_status in ('pending', 'approved', 'rejected'));
  end if;
end $$;

create or replace function public.current_auth_email()
returns text
language sql
stable
as $$
  select lower(coalesce((auth.jwt() ->> 'email'), ''));
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where email = public.current_auth_email()
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.runs enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists admin_users_select_self on public.admin_users;
create policy admin_users_select_self
on public.admin_users
for select
to authenticated
using (email = current_auth_email() or is_admin());

drop policy if exists admin_users_insert_admin on public.admin_users;
create policy admin_users_insert_admin
on public.admin_users
for insert
to authenticated
with check (is_admin());

drop policy if exists profiles_read_all on public.profiles;
drop policy if exists profiles_read_own_or_admin on public.profiles;
create policy profiles_read_own_or_admin
on public.profiles
for select
to authenticated
using (user_id = auth.uid() or is_admin());

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
on public.profiles
for insert
to authenticated
with check (
  user_id = auth.uid()
  and account_email is not null
  and lower(account_email) = current_auth_email()
  and (
    is_admin()
    or (
      role = 'member'
      and approval_status = 'pending'
      and approved_at is null
      and approved_by is null
    )
  )
);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using (user_id = auth.uid() and not is_admin())
with check (
  user_id = auth.uid()
  and account_email is not null
  and lower(account_email) = current_auth_email()
  and role = (
    select p.role
    from public.profiles p
    where p.user_id = auth.uid()
  )
  and approval_status = (
    select p.approval_status
    from public.profiles p
    where p.user_id = auth.uid()
  )
  and approved_at is not distinct from (
    select p.approved_at
    from public.profiles p
    where p.user_id = auth.uid()
  )
  and approved_by is not distinct from (
    select p.approved_by
    from public.profiles p
    where p.user_id = auth.uid()
  )
);

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin
on public.profiles
for update
to authenticated
using (is_admin())
with check (is_admin());

drop policy if exists runs_read_all on public.runs;
drop policy if exists runs_read_approved_or_admin on public.runs;
drop policy if exists runs_read_public on public.runs;
create policy runs_read_public
on public.runs
for select
to anon, authenticated
using (true);

drop policy if exists runs_insert_own_mit on public.runs;
drop policy if exists runs_insert_own on public.runs;
create policy runs_insert_own
on public.runs
for insert
to authenticated
with check (
  user_id = auth.uid()
  and account_email is not null
  and lower(account_email) = current_auth_email()
  and (
    is_admin()
    or exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.approval_status = 'approved'
    )
  )
);

drop policy if exists runs_update_own on public.runs;
create policy runs_update_own
on public.runs
for update
to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and account_email is not null
  and lower(account_email) = current_auth_email()
);

drop policy if exists runs_delete_own on public.runs;
create policy runs_delete_own
on public.runs
for delete
to authenticated
using (user_id = auth.uid());

-- Set your admin account email (run once with your actual MIT email):
-- insert into public.admin_users(email) values ('your_email@example.com')
-- on conflict (email) do nothing;
