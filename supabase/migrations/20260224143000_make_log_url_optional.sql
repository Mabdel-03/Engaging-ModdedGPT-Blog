-- Log URL is no longer required for submissions.
-- Users paste SLURM .out content and training time is parsed automatically.

alter table public.runs
  alter column run_log_url drop not null;
