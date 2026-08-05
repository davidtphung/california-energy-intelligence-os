import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { SOURCES, ASSUMPTIONS } from '../../data/mockData'
import { Card } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Tabs } from '../ui/Tabs'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { ExternalLink, Plus, BookMarked, Quote, ListChecks } from 'lucide-react'
import type { Source } from '../../types'

const ORG_VARIANT: Record<Source['organization'], 'info' | 'success' | 'warning' | 'violet' | 'default'> = {
  CEC: 'info',
  CAISO: 'success',
  EIA: 'warning',
  CPUC: 'violet',
  Utility: 'default',
  Policy: 'info',
  Other: 'default',
}

export function ResearchWorkspace() {
  const { notes, addNote } = useApp()
  const [tab, setTab] = useState('sources')
  const [query, setQuery] = useState('')
  const [orgFilter, setOrgFilter] = useState<string>('all')
  const [selectedSource, setSelectedSource] = useState<Source | null>(SOURCES[0])
  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody, setNoteBody] = useState('')

  const filteredSources = useMemo(() => {
    return SOURCES.filter((s) => {
      const q = query.toLowerCase()
      const matchQ =
        !q ||
        s.title.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q))
      const matchOrg = orgFilter === 'all' || s.organization === orgFilter
      return matchQ && matchOrg
    })
  }, [query, orgFilter])

  const citations = useMemo(() => {
    const linked = notes.flatMap((n) => n.linkedSourceIds)
    return SOURCES.filter((s) => linked.includes(s.id) || selectedSource?.id === s.id)
  }, [notes, selectedSource])

  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Research Workspace
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Source library, notes, assumptions tracker, and citation panel for California energy
            research.
          </p>
        </div>
        <Tabs
          tabs={[
            { id: 'sources', label: 'Sources', count: SOURCES.length },
            { id: 'notes', label: 'Notes', count: notes.length },
            { id: 'assumptions', label: 'Assumptions', count: ASSUMPTIONS.length },
            { id: 'citations', label: 'Citations' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'sources' && (
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="space-y-3 lg:col-span-2">
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="Search sources…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="min-w-[12rem] flex-1"
                aria-label="Search sources"
              />
              <select
                value={orgFilter}
                onChange={(e) => setOrgFilter(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                aria-label="Filter by organization"
              >
                <option value="all">All orgs</option>
                {['CEC', 'CAISO', 'EIA', 'CPUC', 'Utility', 'Policy'].map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div className="max-h-[32rem] space-y-2 overflow-y-auto scrollbar-thin pr-1">
              {filteredSources.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedSource(s)}
                  className={`w-full rounded-xl border p-3 text-left transition-all ${
                    selectedSource?.id === s.id
                      ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/30'
                      : 'border-slate-200 hover:border-slate-300 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {s.title}
                    </p>
                    <Badge variant={ORG_VARIANT[s.organization]}>{s.organization}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{s.summary}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {s.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Card
            title={selectedSource?.title ?? 'Select a source'}
            subtitle={
              selectedSource
                ? `${selectedSource.organization} · ${selectedSource.year} · ${selectedSource.type}`
                : undefined
            }
            className="lg:col-span-3"
            action={
              selectedSource && (
                <a
                  href={selectedSource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-sky-600 hover:underline dark:text-sky-400"
                >
                  Open <ExternalLink className="h-3 w-3" />
                </a>
              )
            }
          >
            {selectedSource ? (
              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {selectedSource.summary}
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                    <p className="text-[10px] uppercase text-slate-400">Organization</p>
                    <p className="font-semibold">{selectedSource.organization}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                    <p className="text-[10px] uppercase text-slate-400">Year</p>
                    <p className="font-semibold">{selectedSource.year}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                    <p className="text-[10px] uppercase text-slate-400">Type</p>
                    <p className="font-semibold capitalize">{selectedSource.type}</p>
                  </div>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Suggested citation
                  </p>
                  <blockquote className="rounded-lg border-l-4 border-sky-500 bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                    {selectedSource.organization}. ({selectedSource.year}).{' '}
                    <em>{selectedSource.title}</em>. Retrieved from {selectedSource.url}
                  </blockquote>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <BookMarked className="h-3.5 w-3.5" />
                  Linked in {notes.filter((n) => n.linkedSourceIds.includes(selectedSource.id)).length}{' '}
                  note(s)
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Choose a source from the library.</p>
            )}
          </Card>
        </div>
      )}

      {tab === 'notes' && (
        <div className="grid gap-4 lg:grid-cols-5">
          <Card title="Add note" className="lg:col-span-2">
            <div className="space-y-3">
              <Input
                label="Title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Observation or finding…"
              />
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">Body</span>
                <textarea
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  rows={5}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
                  placeholder="Supporting detail, caveats, next steps…"
                />
              </label>
              <Button
                icon={<Plus className="h-3.5 w-3.5" />}
                disabled={!noteTitle.trim() || !noteBody.trim()}
                onClick={() => {
                  addNote({
                    title: noteTitle.trim(),
                    body: noteBody.trim(),
                    tags: ['research'],
                    linkedSourceIds: selectedSource ? [selectedSource.id] : [],
                    linkedAssumptionIds: [],
                  })
                  setNoteTitle('')
                  setNoteBody('')
                }}
              >
                Save note
              </Button>
            </div>
          </Card>
          <div className="space-y-3 lg:col-span-3">
            {notes.map((n) => (
              <Card key={n.id} title={n.title} subtitle={new Date(n.updatedAt).toLocaleDateString()}>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{n.body}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {n.tags.map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                  {n.linkedSourceIds.map((sid) => {
                    const s = SOURCES.find((x) => x.id === sid)
                    return s ? (
                      <Badge key={sid} variant="info">
                        {s.organization}
                      </Badge>
                    ) : null
                  })}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === 'assumptions' && (
        <Card
          title="Assumptions tracker"
          subtitle="Traceable parameters with confidence and source links"
          action={<ListChecks className="h-4 w-4 text-slate-400" aria-hidden />}
        >
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500 dark:border-slate-700">
                  <th className="px-3 py-2">Key</th>
                  <th className="px-3 py-2 text-right">Value</th>
                  <th className="px-3 py-2">Unit</th>
                  <th className="px-3 py-2">Confidence</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {ASSUMPTIONS.map((a) => {
                  const src = SOURCES.find((s) => s.id === a.sourceId)
                  return (
                    <tr
                      key={a.id}
                      className="border-b border-slate-100 dark:border-slate-800"
                    >
                      <td className="px-3 py-2.5 font-mono text-xs text-slate-800 dark:text-slate-100">
                        {a.key}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-semibold">{a.value}</td>
                      <td className="px-3 py-2.5 text-slate-500">{a.unit}</td>
                      <td className="px-3 py-2.5">
                        <Badge
                          variant={
                            a.confidence === 'high'
                              ? 'success'
                              : a.confidence === 'medium'
                                ? 'warning'
                                : 'danger'
                          }
                        >
                          {a.confidence}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-500">
                        {src?.organization ?? '—'}
                      </td>
                      <td className="max-w-xs truncate px-3 py-2.5 text-xs text-slate-500">
                        {a.notes ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'citations' && (
        <Card
          title="Citation panel"
          subtitle="Sources linked to notes and active selection"
          action={<Quote className="h-4 w-4 text-slate-400" aria-hidden />}
        >
          <ol className="list-decimal space-y-4 pl-5">
            {citations.map((s) => (
              <li key={s.id} className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                <span className="font-semibold">{s.organization}</span> ({s.year}).{' '}
                <em>{s.title}</em>. {s.type}.{' '}
                <a
                  href={s.url}
                  className="text-sky-600 hover:underline dark:text-sky-400"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {s.url}
                </a>
              </li>
            ))}
          </ol>
        </Card>
      )}
    </div>
  )
}
