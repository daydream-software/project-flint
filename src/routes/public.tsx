import { Hono } from 'hono'
import { isAccessAuthenticated } from '../access.js'
import type { Bindings } from '../bindings.js'
import { Layout } from '../components/Layout.js'
import { ProjectGrid } from '../components/ProjectGrid.js'
import { listFeaturedProjects } from '../data/projects.js'

export const publicRoutes = new Hono<{ Bindings: Bindings }>()

publicRoutes.get('/', async (c) => {
  const [projects, authenticated] = await Promise.all([listFeaturedProjects(c.env), isAccessAuthenticated(c)])
  return c.html(
    <Layout
      title="Daydream Software"
      description="Projects and tools by Daydream Software."
      activeNav="home"
      scripts={['/filter.js']}
      showDashboardLink={authenticated}
    >
      <section class="hero">
        <span class="eyebrow">Daydream Software</span>
        <h1>
          We build <span class="accent">tools</span> we actually want to use ourselves.
        </h1>
        <p class="lead">A running list of what we're building — creator tools, tabletop gaming, languages, and more.</p>
      </section>
      <section class="section">
        <h2>Projects</h2>
        <p class="sub">All the code is open on GitHub.</p>
        <ProjectGrid projects={projects} />
      </section>
    </Layout>,
  )
})
