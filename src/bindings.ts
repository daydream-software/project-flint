export interface Bindings {
  FLINT_KV: KVNamespace
  ASSETS: Fetcher
  /** Zero Trust team domain, e.g. "daydream-software.cloudflareaccess.com". */
  ACCESS_TEAM_DOMAIN?: string
  /** The /dashboard Access application's Audience (AUD) tag. */
  ACCESS_AUD?: string
  /** Optional GitHub PAT (no scopes needed, public data only) — raises the
   * API rate limit from 60/hr shared across Cloudflare's egress IPs to
   * 5000/hr on this token. Set via `wrangler secret put GITHUB_TOKEN`,
   * never in wrangler.jsonc `vars` — this one IS a credential. */
  GITHUB_TOKEN?: string
}
