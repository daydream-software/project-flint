import type { Context } from 'hono'
import { getCookie } from 'hono/cookie'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { Bindings } from './bindings.js'

let jwks: ReturnType<typeof createRemoteJWKSet> | undefined

/**
 * Checks the same Cloudflare Access session that already gates
 * `/dashboard/*` at the edge — this is cosmetic only (deciding whether to
 * show the Dashboard nav link on the public page), never a security
 * boundary. Access itself is what actually protects the route; this can
 * only fail closed (hide the link), never grant access to anything.
 *
 * Requires the /dashboard Access application's "Cookie Path Attribute"
 * setting to stay OFF (the default). CF_Authorization is domain-scoped by
 * default, so it reaches "/" even though only /dashboard* is protected —
 * but enabling that setting scopes the cookie to /dashboard only, and the
 * browser would then never send it here, permanently hiding the link even
 * when actually logged in. If the link mysteriously never shows up despite
 * ACCESS_TEAM_DOMAIN/ACCESS_AUD being set correctly, check that setting.
 */
export async function isAccessAuthenticated(c: Context<{ Bindings: Bindings }>): Promise<boolean> {
  const env = c.env
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) return false
  const token = getCookie(c, 'CF_Authorization')
  if (!token) return false

  try {
    jwks ??= createRemoteJWKSet(new URL(`https://${env.ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`))
    await jwtVerify(token, jwks, {
      issuer: `https://${env.ACCESS_TEAM_DOMAIN}`,
      audience: env.ACCESS_AUD,
    })
    return true
  } catch (err) {
    // Fails closed either way (link stays hidden) — logged so a real but
    // unexpectedly-rejected session is debuggable via `wrangler tail`
    // instead of silently indistinguishable from "not logged in".
    console.error('isAccessAuthenticated: JWT verification failed', err)
    return false
  }
}
