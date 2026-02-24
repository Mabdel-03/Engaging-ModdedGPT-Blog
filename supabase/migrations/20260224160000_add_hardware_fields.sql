-- Add hardware metadata for leaderboard runs.
-- Used for submission metadata and hardware-based filtering.

alter table public.runs add column if not exists gpu_type text;
alter table public.runs add column if not exists gpu_count integer;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'runs_gpu_count_check'
      and conrelid = 'public.runs'::regclass
  ) then
    alter table public.runs
      add constraint runs_gpu_count_check
      check (gpu_count is null or gpu_count > 0);
  end if;
end $$;

create index if not exists runs_gpu_type_idx on public.runs (gpu_type);
create index if not exists runs_gpu_count_idx on public.runs (gpu_count);
