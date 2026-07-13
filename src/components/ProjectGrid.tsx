import type { Project } from '../data/projects.js'
import { GitHubMark } from './Marks.js'

function ProjectCard({ project }: { project: Project }) {
  const href = project.homepage ?? project.repoUrl
  const meta = [project.language, project.stars > 0 ? `★ ${project.stars}` : null].filter(Boolean).join(' · ')
  return (
    <article class="card" data-category={project.category}>
      <div class="card-top">
        <h3>
          <a href={href} target="_blank" rel="noreferrer">
            {project.name}
          </a>
        </h3>
        {meta ? <span class="status-badge">{meta}</span> : null}
      </div>
      <p>{project.description}</p>
      <div class="card-foot">
        {project.category ? <span class="pill category">{project.category}</span> : <span />}
        <a class="repo-link" href={project.repoUrl} target="_blank" rel="noreferrer">
          <GitHubMark />
          Code
        </a>
      </div>
    </article>
  )
}

export function ProjectGrid({ projects }: { projects: Project[] }) {
  if (projects.length === 0) {
    return <p class="sub">Nothing featured yet — pick a few repos from the dashboard.</p>
  }
  const categories = [...new Set(projects.map((p) => p.category).filter(Boolean))]
  return (
    <>
      {categories.length > 1 ? (
        <div class="categories" role="group" aria-label="Filter by category">
          <button type="button" class="pill filter-pill is-active" data-filter="">
            All
          </button>
          {categories.map((c) => (
            <button type="button" class="pill filter-pill" data-filter={c}>
              {c}
            </button>
          ))}
        </div>
      ) : null}
      <div class="grid" data-project-grid>
        {projects.map((project) => (
          <ProjectCard project={project} />
        ))}
      </div>
    </>
  )
}
