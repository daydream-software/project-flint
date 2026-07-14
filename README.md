# Project Flint

The **daydreamsoftware.ca** site: a small Cloudflare Worker that lists Daydream
Software's public GitHub projects and lets us **curate** which ones show up on the
landing page. Repo data (name, description, language, stars) comes straight from the
GitHub API — the only thing this app owns is which repos are **featured**, what
**category** they're grouped under, and in what **order**.

> Pillars: **read-only from GitHub** (no hand-entered project data) · a small
> **Access-gated dashboard** to curate, not a CMS · plain server-rendered HTML, no
> client framework · static assets served straight off the edge.

## Stack

TypeScript · [Hono](https://hono.dev) (routing + JSX rendering) · Cloudflare Workers ·
Workers KV (curation storage + a GitHub-response cache) · Cloudflare Access (dashboard
auth, enforced at the edge — see below).

## Develop

```bash
npm install
npm run dev        # wrangler dev
npm run typecheck   # tsc --noEmit
npm run deploy      # wrangler deploy (normally handled by Workers Builds instead — see below)
```

## Configuration

This is built for the `daydream-software` GitHub org, hardcoded as `GITHUB_ORG` in
[`src/data/projects.ts`](src/data/projects.ts). To point this at a different org, change
that one constant — everything else (repo list, curation, caching) follows from it.

## How it works

`src/index.tsx` mounts two route groups: [`public.tsx`](src/routes/public.tsx) (the
landing page, `/`) and [`dashboard.tsx`](src/routes/dashboard.tsx) (`/dashboard`).
[`data/projects.ts`](src/data/projects.ts) fetches the org's repos from the GitHub API,
caches the response in `FLINT_KV` for an hour, and merges in a per-repo curation entry
(`featured` / `category` / `order`) stored under its own KV key — one write per repo,
so saving one never clobbers another. Featured repos render on the landing page; the
dashboard lists every public repo and lets you toggle curation with a plain HTML form
(progressively enhanced by `public/dashboard.js`).

`/dashboard/*` is gated by **Cloudflare Access** at the edge, configured outside this
repo in the Zero Trust dashboard — there's no auth middleware in the app itself.
[`access.ts`](src/access.ts) only re-checks the same Access session to decide whether
to *show* the Dashboard nav link on the public page; that check is cosmetic and fails
closed, never a security boundary.

## Deploy

Deploys via **Workers Builds** — pushing to `main` triggers a git-connected build on
Cloudflare, no GitHub Actions involved.

### One-time setup checklist

- **Git & GitHub** — create the repo under your org, push to it.
- **Cloudflare KV** — `wrangler kv namespace create FLINT_KV`, paste the returned id
  into `wrangler.jsonc`.
- **Workers Builds** — Cloudflare dashboard → Workers & Pages → Create → Connect to
  Git → pick this repo. No build step (plain Worker), entry point `src/index.tsx`, so
  the defaults work as-is.
- **Custom domain** — add your domain (and `www.` if used) as a Custom Domain on the
  Worker.
- **Cloudflare Access (dashboard auth)** — Zero Trust dashboard → Access →
  Applications → add one for `<your-domain>/dashboard*`, policy restricted to
  yourself. Leave **"Cookie Path Attribute" OFF** (enabling it breaks the Dashboard
  nav-link visibility check — see [`src/access.ts`](src/access.ts)). Grab the team
  domain and the application's AUD tag from its Overview page and fill
  `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD` into `wrangler.jsonc` (non-secret identifiers,
  fine to commit).
- **Optional: raise the GitHub rate limit** — create a scopeless GitHub PAT (public
  data only) and `wrangler secret put GITHUB_TOKEN`. Without it the site runs fine on
  the unauthenticated 60 req/hr limit, which the 1h cache keeps comfortable margin
  under; the token just adds headroom (5000 req/hr) as the org grows. Never put this
  one in `wrangler.jsonc` — it's a real credential.
- **Go live** — push to `main`, confirm the landing page renders, log into
  `/dashboard` via Access and feature a repo, then confirm in a private window that
  `/dashboard` prompts a login and the Dashboard nav link stays hidden when logged
  out.

---

Licensed under MIT — see [`LICENSE`](LICENSE). Third-party assets are noted in
[`THIRD-PARTY-NOTICES.md`](THIRD-PARTY-NOTICES.md).
