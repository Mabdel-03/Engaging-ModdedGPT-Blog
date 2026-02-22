# Engaging-ModdedGPT-Blog

Minimal Jekyll blog for MIT researchers onboarding to NanoGPT and modded-nanogpt speedrun workflows on the Engaging cluster.

## What this repo contains

- Home page with challenge context and guide order
- Guide 1: baseline NanoGPT onboarding on Engaging
- Guide 2: modded-nanogpt speedrun onboarding on Engaging
- MIT leaderboard page with Supabase Google OAuth auth
- Lightweight custom layout and CSS (no heavy theme dependency)

## Local preview

### 1) Install Ruby + Bundler

You need Ruby and Bundler available on your machine.

Check:

```bash
ruby --version
bundle --version
```

If Bundler is missing:

```bash
gem install bundler
```

### 2) Install dependencies

From this repository root:

```bash
bundle install
```

### 3) Run the site locally

```bash
bundle exec jekyll serve
```

Open:

```text
http://127.0.0.1:4000/Engaging-ModdedGPT-Blog/
```

Because `_config.yml` sets:

- `url: https://mabdel-03.github.io`
- `baseurl: /Engaging-ModdedGPT-Blog`

### 4) Build static output

```bash
bundle exec jekyll build
```

Generated files are written to `_site/`.

## Deploy on GitHub Pages

1. Push this repository to GitHub.
2. In the GitHub repo, open **Settings -> Pages**.
3. Set source to **Deploy from a branch**.
4. Select branch: **main** and folder: **/(root)**.
5. Save and wait for Pages to publish.

Site URL should be:

```text
https://mabdel-03.github.io/Engaging-ModdedGPT-Blog/
```

## Editing content

- Home page: `index.md`
- Baseline guide: `_posts/2026-02-15-modded-nanogpt-on-engaging.md`
- Modded guide: `_posts/2026-02-16-modded-nanogpt-on-engaging.md`
- Leaderboard page: `leaderboard.md`
- Layouts: `_layouts/`
- Styles: `assets/css/main.css`
- Leaderboard client logic: `assets/js/leaderboard.js`
- Supabase SQL schema/policies: `supabase/schema.sql`

## Leaderboard setup (Supabase)

### 1) Create Supabase project

Create a new Supabase project for the leaderboard backend.

### 2) Apply schema and policies

In Supabase SQL Editor, run:

```sql
-- from this repo:
-- supabase/schema.sql
```

This creates:

- `profiles`, `runs`, and `admin_users` tables
- Provider-agnostic auth fields (`account_email`, `display_name`)
- Approval workflow fields (`role`, `approval_status`, `approved_at`, `approved_by`)
- RLS policies for admin-moderated submissions
- Public read access for leaderboard display
- Simple public record fields (`record time`, `description`, `date`, `log`, `contributors`)

If you already applied an older version of this schema, rerun `supabase/schema.sql` to apply backward-compatible `alter table ... add column if not exists` updates.

### 3) Configure Google OAuth

In Supabase Auth settings:

- Enable Google provider.
- Set Google OAuth Client ID and Client Secret.
- Add site URL and redirect URL(s), for example:
  - `http://127.0.0.1:4000/Engaging-ModdedGPT-Blog/leaderboard/`
  - `https://mabdel-03.github.io/Engaging-ModdedGPT-Blog/leaderboard/`
- In your Google Cloud OAuth app, also add those same URLs to authorized redirect URIs/origins as required.

### 4) Add keys to Jekyll config

Set values in `_config.yml`:

```yml
supabase_url: "https://YOUR_PROJECT.supabase.co"
supabase_anon_key: "YOUR_SUPABASE_ANON_KEY"
```

Then rebuild/restart Jekyll.

### 5) Sign-in flow

Users click **Sign In with Google**, complete the OAuth flow, and return to the leaderboard page. First-time users are created as `pending`, and cannot submit until approved by an admin.

### 6) Bootstrap admin account (required once)

In Supabase SQL Editor, run:

```sql
insert into public.admin_users(email)
values ('your_email@example.com')
on conflict (email) do nothing;
```

Then sign in with that exact Google email on the leaderboard page. The account is auto-marked as admin and can approve/reject users from the **Admin: Account Approvals** section.

## Notes

- If you rename the repository, update `baseurl` in `_config.yml`.
- If you use a custom domain later, also update `url` in `_config.yml`.
