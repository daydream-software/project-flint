import { Hono } from 'hono'
import type { Bindings } from '../bindings.js'
import { Layout } from '../components/Layout.js'
import { loadDashboardData, setCuration, type Project } from '../data/projects.js'

// No auth code here on purpose: Cloudflare Access gates the whole
// /dashboard/* path at the edge (configured in the Cloudflare Zero Trust
// dashboard, not in this repo) — see flint-architecture project memory.
export const dashboardRoutes = new Hono<{ Bindings: Bindings }>()

const CATEGORY_LIST_ID = 'dashboard-categories'

function CurationRow({ project }: { project: Project }) {
  return (
    <form
      class={`curate-row${project.featured ? ' is-featured' : ''}`}
      method="post"
      action={`/dashboard/repos/${project.slug}/curate`}
      data-curate-row
    >
      <div class="curate-repo">
        <div class="meta">
          <strong>
            <a href={project.repoUrl} target="_blank" rel="noreferrer">
              {project.name}
            </a>
          </strong>
          {project.language ? <span class="pill">{project.language}</span> : null}
          {project.stars > 0 ? <span class="status-badge">★ {project.stars}</span> : null}
        </div>
        <p class="repo-description">{project.description || 'No description on GitHub.'}</p>
      </div>
      <div class="curate-fields">
        <label class="checkbox-field">
          <input type="checkbox" name="featured" checked={project.featured} data-featured-input />
          Featured
        </label>
        <input type="text" name="category" placeholder="Category" value={project.category} list={CATEGORY_LIST_ID} />
        <input
          type="number"
          name="order"
          value={project.order}
          title="Position on the landing page — lower shows first"
        />
        <button class="btn small primary" type="submit" data-save-button>
          Save
        </button>
      </div>
    </form>
  )
}

dashboardRoutes.get('/', async (c) => {
  // Featured repos float to the top so what's already live is easy to scan;
  // everything else stays in the recency order loadDashboardData gives us.
  const { projects: sorted, categories } = await loadDashboardData(c.env)
  const featuredCount = sorted.filter((p) => p.featured).length

  return c.html(
    <Layout title="Dashboard — Daydream Software" activeNav="dashboard" scripts={['/dashboard.js']}>
      <section class="section">
        <div class="dash-toolbar">
          <h2>Dashboard</h2>
          <span class="status-badge" data-featured-count>
            {featuredCount} featured
          </span>
        </div>
        <p class="sub">Toggle Featured to show a repo on the landing page, and set a category to group it there.</p>
        <datalist id={CATEGORY_LIST_ID}>
          {categories.map((category) => (
            <option value={category} />
          ))}
        </datalist>
        <div class="dash-list">
          {sorted.map((project) => (
            <CurationRow project={project} />
          ))}
        </div>
      </section>
    </Layout>,
  )
})

dashboardRoutes.post('/repos/:slug/curate', async (c) => {
  const slug = c.req.param('slug')
  const form = await c.req.formData()
  const parsedOrder = Number(form.get('order'))
  const entry = {
    featured: form.get('featured') === 'on',
    // Trimmed so accidental leading/trailing whitespace from copy-paste
    // doesn't create a near-duplicate category alongside an existing one.
    category: String(form.get('category') ?? '').trim(),
    order: Number.isFinite(parsedOrder) ? parsedOrder : 0,
  }
  await setCuration(c.env, slug, entry)

  // dashboard.js posts here with Accept: application/json and applies the
  // result in place; a plain form submit (JS off) gets the normal redirect.
  if (c.req.header('accept')?.includes('application/json')) {
    return c.json({ ok: true, featured: entry.featured })
  }
  return c.redirect('/dashboard', 303)
})
