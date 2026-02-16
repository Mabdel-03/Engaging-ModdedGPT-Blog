# Engaging-ModdedGPT-Blog

Minimal Jekyll blog for MIT researchers onboarding to the modded-nanogpt challenge on the Engaging cluster.

## What this repo contains

- A clean, minimalist Jekyll site
- A primary guide post: `modded-nanogpt-on-engaging`
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
- Main post: `_posts/2026-02-15-modded-nanogpt-on-engaging.md`
- Layouts: `_layouts/`
- Styles: `assets/css/main.css`

## Notes

- If you rename the repository, update `baseurl` in `_config.yml`.
- If you use a custom domain later, also update `url` in `_config.yml`.
