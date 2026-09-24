import type { Project } from './types.ts'

/** Inclusive rank. Unknown statuses are excluded, never guessed. */
export const PROJECT_STATUS_RANK = ['announced', 'permitted', 'construction', 'operating'] as const

export const DEFAULT_PROJECT_STATUS_MIN = 'construction'

export interface ProjectLoad {
  mw: number
  included: { name: string; mw: number; source: string; sourceUrl: string | null }[]
  excluded: { name: string; reason: string }[]
}

export function projectLoadAt(
  projects: Project[],
  atIso: string,
  statusMin = DEFAULT_PROJECT_STATUS_MIN
): ProjectLoad {
  const minRank = PROJECT_STATUS_RANK.indexOf(statusMin as (typeof PROJECT_STATUS_RANK)[number])
  const at = Date.parse(atIso)
  const included: ProjectLoad['included'] = []
  const excluded: ProjectLoad['excluded'] = []

  const groups = new Map<string, Project[]>()
  for (const project of projects) {
    const key = project.siteKey || project.name
    const list = groups.get(key) ?? []
    list.push(project)
    groups.set(key, list)
  }

  for (const [, group] of groups) {
    const withPaths = group.filter((p) => p.pathId)
    let candidates = group
    if (withPaths.length > 1) {
      const primaries = withPaths.filter((p) => p.pathRole === 'primary')
      if (primaries.length !== 1) {
        for (const p of withPaths) {
          excluded.push({
            name: p.name,
            reason: 'alternative power paths and no single primary path',
          })
        }
        candidates = group.filter((p) => !p.pathId)
      } else {
        const primary = primaries[0]
        for (const p of withPaths) {
          if (p !== primary) {
            excluded.push({ name: p.name, reason: 'alternative path, not primary' })
          }
        }
        candidates = [...group.filter((p) => !p.pathId), primary]
      }
    }

    for (const project of candidates) {
      if (project.mw == null) {
        excluded.push({ name: project.name, reason: 'mw is empty' })
        continue
      }
      if (!project.targetDate) {
        excluded.push({ name: project.name, reason: 'target date is empty' })
        continue
      }
      const rank = project.status
        ? PROJECT_STATUS_RANK.indexOf(project.status as (typeof PROJECT_STATUS_RANK)[number])
        : -1
      if (minRank === -1 || rank < minRank) {
        excluded.push({ name: project.name, reason: 'status below threshold or unknown' })
        continue
      }
      const online = Date.parse(`${project.targetDate}T00:00:00Z`)
      if (!Number.isFinite(online) || online > at) {
        excluded.push({ name: project.name, reason: 'target date is after this hour' })
        continue
      }
      included.push({
        name: project.name,
        mw: project.mw,
        source: project.source,
        sourceUrl: project.sourceUrl,
      })
    }
  }

  const mw = included.reduce((sum, row) => sum + row.mw, 0)
  return { mw, included, excluded }
}
