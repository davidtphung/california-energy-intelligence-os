import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { SOURCES, ASSUMPTIONS } from '../../data/mockData'
import { Badge } from '../ui/Badge'
import { Tabs } from '../ui/Tabs'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { ExternalLink, Plus } from 'lucide-react'
import type { Source } from '../../types'

const ORG_VARIANT: Record<
  Source['organization'],
  'info' | 'success' | 'warning' | 'violet' | 'default'
> = {
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
  const [orgFilter, setOrgFilter] = useState('all')
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
    <div className="animate-in stack">
      <section className="hero">
        <p className="section-label">Catalog</p>
        <h1 className="page-title gradient-text">Research workspace</h1>
        <p className="lede">
          Source library, notes, assumptions tracker, and citations for California energy research.
        </p>
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
      </section>

      {tab === 'sources' && (
        <section className="tray panel">
          <div className="filter-bar">
            <Input
              placeholder="Search sources…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search sources"
              style={{ minWidth: '12rem' }}
            />
            <label className="field" style={{ minWidth: '8rem' }}>
              <span className="section-label tight">Org</span>
              <select
                className="select"
                value={orgFilter}
                onChange={(e) => setOrgFilter(e.target.value)}
              >
                <option value="all">All</option>
                {['CEC', 'CAISO', 'EIA', 'CPUC', 'Utility', 'Policy'].map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid-2">
            <div className="stack" style={{ gap: '0.5rem', maxHeight: '28rem', overflowY: 'auto' }}>
              {filteredSources.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`card block${selectedSource?.id === s.id ? ' stat-glow' : ''}`}
                  style={{
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderColor:
                      selectedSource?.id === s.id ? 'var(--accent-border)' : undefined,
                  }}
                  onClick={() => setSelectedSource(s)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <strong style={{ fontSize: '0.88rem' }}>{s.title}</strong>
                    <Badge variant={ORG_VARIANT[s.organization]}>{s.organization}</Badge>
                  </div>
                  <p className="muted" style={{ margin: '0.35rem 0 0', fontSize: '0.78rem' }}>
                    {s.summary}
                  </p>
                </button>
              ))}
            </div>

            <div className="card-solid block">
              {selectedSource ? (
                <>
                  <p className="section-label">
                    {selectedSource.organization} · {selectedSource.year} · {selectedSource.type}
                  </p>
                  <h2 className="page-h2">{selectedSource.title}</h2>
                  <p className="sub">{selectedSource.summary}</p>
                  <a
                    href={selectedSource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm"
                    style={{ display: 'inline-flex', marginBottom: '1rem' }}
                  >
                    Open source <ExternalLink className="h-3 w-3" />
                  </a>
                  <p className="section-label">Citation</p>
                  <blockquote className="code-block" style={{ whiteSpace: 'normal' }}>
                    {selectedSource.organization}. ({selectedSource.year}).{' '}
                    <em>{selectedSource.title}</em>. {selectedSource.url}
                  </blockquote>
                </>
              ) : (
                <p className="muted">Select a source.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {tab === 'notes' && (
        <div className="grid-2">
          <section className="tray panel">
            <p className="section-label">Compose</p>
            <h2 className="page-h2">Add note</h2>
            <div className="stack" style={{ gap: '0.75rem', marginTop: '0.75rem' }}>
              <Input
                label="Title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Finding…"
              />
              <label className="field">
                <span className="section-label tight">Body</span>
                <textarea
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  rows={5}
                  placeholder="Detail, caveats, next steps…"
                />
              </label>
              <Button
                variant="primary"
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
          </section>
          <div className="stack">
            {notes.map((n) => (
              <section key={n.id} className="card panel">
                <p className="section-label">{new Date(n.updatedAt).toLocaleDateString()}</p>
                <h2 className="page-h2">{n.title}</h2>
                <p className="sub" style={{ marginBottom: '0.75rem' }}>
                  {n.body}
                </p>
                <div className="chip-row">
                  {n.tags.map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}

      {tab === 'assumptions' && (
        <section className="tray panel">
          <p className="section-label">Traceability</p>
          <h2 className="page-h2">Assumptions tracker</h2>
          <p className="sub">Parameters with confidence and source links.</p>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Key</th>
                  <th style={{ textAlign: 'right' }}>Value</th>
                  <th>Unit</th>
                  <th>Confidence</th>
                  <th>Source</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {ASSUMPTIONS.map((a) => {
                  const src = SOURCES.find((s) => s.id === a.sourceId)
                  return (
                    <tr key={a.id}>
                      <td className="mono" style={{ color: 'var(--text)' }}>
                        {a.key}
                      </td>
                      <td className="num">{a.value}</td>
                      <td className="muted">{a.unit}</td>
                      <td>
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
                      <td className="muted">{src?.organization ?? '—'}</td>
                      <td className="muted" style={{ maxWidth: 200 }}>
                        {a.notes ?? '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'citations' && (
        <section className="tray panel">
          <p className="section-label">Bibliography</p>
          <h2 className="page-h2">Citations</h2>
          <ol style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-2)' }}>
            {citations.map((s) => (
              <li key={s.id} style={{ marginBottom: '0.85rem', fontSize: '0.9rem' }}>
                <strong style={{ color: 'var(--text)' }}>{s.organization}</strong> ({s.year}).{' '}
                <em>{s.title}</em>.{' '}
                <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
                  {s.url}
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
