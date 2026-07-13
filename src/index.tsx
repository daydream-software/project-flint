import { Hono } from 'hono'
import type { Bindings } from './bindings.js'
import { dashboardRoutes } from './routes/dashboard.js'
import { publicRoutes } from './routes/public.js'

const app = new Hono<{ Bindings: Bindings }>()

app.route('/', publicRoutes)
// Cloudflare Access gates everything under /dashboard/* at the edge —
// no auth middleware needed here (see flint-architecture project memory).
app.route('/dashboard', dashboardRoutes)

// Phase 2 (not yet wired): branch on `c.req.header('host')` here to serve
// docs.daydreamsoftware.ca as a simplified view of the same project data,
// once it's ready to replace project-elm/docs. Static assets (css/js/fonts)
// under public/ are served directly by the Workers assets layer and never
// reach this Worker.

export default app
