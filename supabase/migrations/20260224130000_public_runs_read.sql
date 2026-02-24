-- Make leaderboard runs publicly readable (viewable without sign-in).
-- Submission permissions remain unchanged and still require authenticated users.

drop policy if exists runs_read_all on public.runs;
drop policy if exists runs_read_approved_or_admin on public.runs;
drop policy if exists runs_read_public on public.runs;

create policy runs_read_public
on public.runs
for select
to anon, authenticated
using (true);
