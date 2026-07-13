import type { PropsWithChildren } from 'hono/jsx'
import { DaydreamMark, GitHubMark } from './Marks.js'
import { ThemeToggle } from './ThemeToggle.js'

const GITHUB_ORG_URL = 'https://github.com/daydream-software'

// Runs inline, before paint, so there's no flash of the wrong theme.
// Same pattern as docs.daydreamsoftware.ca: localStorage wins, else
// prefers-color-scheme, defaulting to dark.
const THEME_BOOTSTRAP = `
(function () {
  try {
    var stored = localStorage.getItem('flint-theme');
    var light = stored ? stored === 'light' : matchMedia('(prefers-color-scheme: light)').matches;
    if (light) document.documentElement.setAttribute('data-theme', 'light');
  } catch (e) {}
})();
`.trim()

interface LayoutProps {
  title: string
  description?: string
  activeNav?: 'home' | 'dashboard'
  /** Page-specific script src(s), loaded after theme.js. */
  scripts?: string[]
  /** Whether to show the Dashboard nav link — cosmetic only (see
   * src/access.ts), never a substitute for Cloudflare Access itself.
   * Defaults to true: a page only needs to pass this when it actually
   * checked Access status (currently just the public landing page) — the
   * dashboard page itself is trivially "authenticated" by having loaded. */
  showDashboardLink?: boolean
}

export function Layout({
  title,
  description,
  activeNav,
  scripts,
  showDashboardLink = true,
  children,
}: PropsWithChildren<LayoutProps>) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{title}</title>
        {description ? <meta name="description" content={description} /> : null}
        <meta property="og:title" content={title} />
        {description ? <meta property="og:description" content={description} /> : null}
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="theme-color" content="#020617" media="(prefers-color-scheme: dark)" />
        <meta name="theme-color" content="#fbfaff" media="(prefers-color-scheme: light)" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="preload" href="/fonts/Geist-Variable.woff2" as="font" type="font/woff2" crossorigin="anonymous" />
        <link rel="stylesheet" href="/styles/tokens.css" />
        <link rel="stylesheet" href="/styles/site.css" />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body>
        <header class="topbar">
          <div class="wrap bar">
            <a class="brand" href="/">
              <DaydreamMark class="mark" />
              <span>Daydream Software</span>
            </a>
            <nav class="nav">
              <a href="/" aria-current={activeNav === 'home' ? 'page' : undefined}>
                Projects
              </a>
              {showDashboardLink ? (
                <a href="/dashboard" aria-current={activeNav === 'dashboard' ? 'page' : undefined}>
                  Dashboard
                </a>
              ) : null}
              <a class="cta" href={GITHUB_ORG_URL} target="_blank" rel="noreferrer">
                GitHub
              </a>
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <main class="wrap">{children}</main>
        <footer class="site-footer">
          <div class="wrap">
            <a href={GITHUB_ORG_URL} target="_blank" rel="noreferrer">
              <GitHubMark style="width:14px;height:14px;vertical-align:-2px;margin-right:4px" />
              github.com/daydream-software
            </a>
          </div>
        </footer>
        <script src="/theme.js" defer></script>
        {(scripts ?? []).map((src) => (
          <script src={src} defer></script>
        ))}
      </body>
    </html>
  )
}
