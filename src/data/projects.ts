import type { Bindings } from '../bindings.js'

const GITHUB_ORG = 'daydream-software'
const REPOS_CACHE_KEY = 'github-repos-cache'
const REPOS_CACHE_TTL_MS = 60 * 60 * 1000 // 1h — keeps repeated refreshes off the GitHub rate limit
const CURATION_PREFIX = 'curation:'
const MAX_PAGES = 5 // 500 repos of headroom past GitHub's 100-per-page default

/** Read-only, straight from the GitHub API — never hand-entered. */
export interface RepoInfo {
  slug: string
  name: string
  description: string
  repoUrl: string
  homepage?: string
  language?: string
  stars: number
  pushedAt: string
}

/** The only thing project-flint actually owns: which repos to show and how
 * to group them. One KV key per repo slug (`curation:<slug>`) rather than a
 * single shared blob, so saving one repo's curation can never clobber a
 * concurrent save to a different repo — each write is independent. This
 * also means a slug is only ever used as a KV key *string*, never as a JS
 * object property, so a repo literally named `__proto__` can't trigger
 * prototype-pollution the way a plain-object map would. */
export interface CurationEntry {
  featured: boolean
  category: string
  order: number
}

export type Project = RepoInfo & CurationEntry

const DEFAULT_CURATION: CurationEntry = { featured: false, category: '', order: 0 }

interface GitHubRepo {
  name: string
  description: string | null
  html_url: string
  homepage: string | null
  language: string | null
  stargazers_count: number
  archived: boolean
  fork: boolean
  pushed_at: string
}

function githubHeaders(env: Bindings): HeadersInit {
  const headers: Record<string, string> = { 'User-Agent': 'project-flint', Accept: 'application/vnd.github+json' }
  // Optional Worker secret (wrangler secret put GITHUB_TOKEN) — raises the
  // rate limit from 60/hr shared across Cloudflare's whole egress IP pool
  // to 5000/hr on this token alone. Works fine unset (falls back to
  // unauthenticated), just tighter on headroom.
  if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`
  return headers
}

// The GitHub "Website" field is free text set by anyone with admin on that
// repo — it is NOT guaranteed safe despite living in RepoInfo alongside
// data that genuinely is repo-owner-controlled-only. HTML-attribute
// escaping (which Hono JSX applies) doesn't neutralize a javascript: URI
// inside a validly-quoted href, so the scheme has to be checked here, once,
// at the boundary where this untrusted data enters the app.
function safeHomepage(url: string | null): string | undefined {
  if (!url) return undefined
  try {
    const protocol = new URL(url).protocol
    return protocol === 'http:' || protocol === 'https:' ? url : undefined
  } catch {
    return undefined
  }
}

async function fetchAllGithubRepos(env: Bindings): Promise<RepoInfo[]> {
  const pages: GitHubRepo[] = []
  for (let page = 1; page <= MAX_PAGES; page++) {
    const res = await fetch(
      `https://api.github.com/orgs/${GITHUB_ORG}/repos?type=public&per_page=100&sort=pushed&page=${page}`,
      { headers: githubHeaders(env) },
    )
    if (!res.ok) throw new Error(`GitHub API returned ${res.status}`)
    const pageData = (await res.json()) as GitHubRepo[]
    pages.push(...pageData)
    if (pageData.length < 100) break // last page
  }
  return pages
    .filter((r) => !r.archived && !r.fork)
    .map((r) => ({
      slug: r.name,
      name: r.name,
      description: r.description ?? '',
      repoUrl: r.html_url,
      homepage: safeHomepage(r.homepage),
      language: r.language ?? undefined,
      stars: r.stargazers_count,
      pushedAt: r.pushed_at,
    }))
}

async function readCachedRepos(env: Bindings): Promise<{ fetchedAt: number; repos: RepoInfo[] } | null> {
  try {
    return await env.FLINT_KV.get<{ fetchedAt: number; repos: RepoInfo[] }>(REPOS_CACHE_KEY, 'json')
  } catch {
    return null // corrupted cache entry — treat as a miss, not a crash
  }
}

async function fetchGitHubRepos(env: Bindings): Promise<RepoInfo[]> {
  const cached = await readCachedRepos(env)
  if (cached && Date.now() - cached.fetchedAt < REPOS_CACHE_TTL_MS) {
    return cached.repos
  }

  let repos: RepoInfo[]
  try {
    repos = await fetchAllGithubRepos(env)
  } catch {
    // GitHub is down, rate-limited, or returned something unexpected —
    // serve stale data (if any) rather than crashing the whole site.
    return cached?.repos ?? []
  }

  await env.FLINT_KV.put(REPOS_CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), repos }))
  await reconcileCuration(env, new Set(repos.map((r) => r.slug)))
  return repos
}

/** Drops curation entries whose slug no longer matches a live repo
 * (renamed, deleted, made private, archived, or forked away) — otherwise
 * they'd linger in KV forever and could silently reattach to an unrelated
 * repo that later reuses the same slug. Only runs right after a fresh
 * GitHub fetch, since that's the only point with an authoritative live
 * list (never during a stale-cache fallback). */
async function reconcileCuration(env: Bindings, liveSlugs: Set<string>): Promise<void> {
  const list = await env.FLINT_KV.list({ prefix: CURATION_PREFIX })
  const stale = list.keys.filter((k) => !liveSlugs.has(k.name.slice(CURATION_PREFIX.length)))
  await Promise.all(stale.map((k) => env.FLINT_KV.delete(k.name)))
}

async function getCuration(env: Bindings): Promise<Record<string, CurationEntry>> {
  const list = await env.FLINT_KV.list({ prefix: CURATION_PREFIX })
  const entries = await Promise.all(
    list.keys.map(async (k): Promise<[string, CurationEntry] | null> => {
      try {
        const value = await env.FLINT_KV.get<CurationEntry>(k.name, 'json')
        return value ? [k.name.slice(CURATION_PREFIX.length), value] : null
      } catch {
        return null // corrupted entry — skip it rather than crash the page
      }
    }),
  )
  return Object.fromEntries(entries.filter((e): e is [string, CurationEntry] => e !== null))
}

export async function setCuration(env: Bindings, slug: string, entry: CurationEntry): Promise<void> {
  await env.FLINT_KV.put(CURATION_PREFIX + slug, JSON.stringify(entry))
}

function merge(repos: RepoInfo[], curation: Record<string, CurationEntry>): Project[] {
  // DEFAULT_CURATION spreads first so a partial curation entry (missing a
  // field, e.g. from a future schema change) still gets sane defaults for
  // whatever it doesn't specify, instead of `undefined` leaking through.
  return repos.map((repo) => ({ ...repo, ...DEFAULT_CURATION, ...curation[repo.slug] }))
}

/** For /dashboard — every public repo, curated or not. Most recently
 * pushed-to first, since that's what you're most likely curating right now. */
export async function listAllRepos(env: Bindings): Promise<Project[]> {
  const [repos, curation] = await Promise.all([fetchGitHubRepos(env), getCuration(env)])
  return merge(repos, curation).sort((a, b) => (b.pushedAt ?? '').localeCompare(a.pushedAt ?? ''))
}

/** For the landing page — only what's been explicitly featured. */
export async function listFeaturedProjects(env: Bindings): Promise<Project[]> {
  const all = await listAllRepos(env)
  return all.filter((p) => p.featured).sort((a, b) => a.order - b.order)
}

/** For /dashboard: fetches curation once and derives both the row list
 * (featured-first, then recency) and the category list from it, instead of
 * two independent KV reads of the same data. */
export async function loadDashboardData(env: Bindings): Promise<{ projects: Project[]; categories: string[] }> {
  const [repos, curation] = await Promise.all([fetchGitHubRepos(env), getCuration(env)])
  const projects = merge(repos, curation)
    .sort((a, b) => (b.pushedAt ?? '').localeCompare(a.pushedAt ?? ''))
    .sort((a, b) => Number(b.featured) - Number(a.featured))
  const categories = [
    ...new Set(
      Object.values(curation)
        .map((c) => c.category)
        .filter(Boolean),
    ),
  ].sort()
  return { projects, categories }
}
