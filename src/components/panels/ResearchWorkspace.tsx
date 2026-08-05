import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { SOURCES, ASSUMPTIONS } from '../../data/mockData'
import { Badge } from '../ui/Badge'
import { Tabs } from '../ui/Tabs'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import type { Source } from '../../types'

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
      return matchQ && (orgFilter === 'all' || s.organization === orgFilter)
    }).sort((a, b) => b.year - a.year || a.title.localeCompare(b.title))
  }, [query, orgFilter])

  const citations = useMemo(() => {
    const linked = notes.flatMap((n) => n.linkedSourceIds)
    return SOURCES.filter((s) => linked.includes(s.id) || selectedSource?.id === s.id)
  }, [notes, selectedSource])

  return (
    <div id="research">
      <div className="intro fadein t1">
        <strong>Research</strong>
        <p>
          Source library, notes, assumptions, and citations - CEC, CAISO, EIA, utility filings, and
          policy documents in one quiet list.
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

      {tab === 'sources' && (
        <div className="fadein t2">
          <div className="filters">
            <Input
              placeholder="Search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search sources"
              style={{ minWidth: '12rem' }}
            />
            <label className="field">
              <span>Org</span>
              <select value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)}>
                <option value="all">All</option>
                {['CEC', 'CAISO', 'EIA', 'CPUC', 'Utility', 'Policy'].map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <table className="list-table">
            <tbody>
              {filteredSources.map((s) => (
                <tr key={s.id}>
                  <th scope="row">
                    <button
                      type="button"
                      onClick={() => setSelectedSource(s)}
                      style={{
                        background: 'none',
                        border: 0,
                        padding: 0,
                        font: 'inherit',
                        fontWeight: 600,
                        color:
                          selectedSource?.id === s.id ? 'var(--highlight)' : 'var(--ink-2)',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      {s.organization}
                    </button>
                  </th>
                  <td>
                    <button
                      type="button"
                      onClick={() => setSelectedSource(s)}
                      style={{
                        background: 'none',
                        border: 0,
                        padding: 0,
                        font: 'inherit',
                        color: 'var(--highlight)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontWeight: 500,
                      }}
                    >
                      {s.title}
                    </button>
                    <div className="muted" style={{ fontSize: '0.82rem', marginTop: 2 }}>
                      {s.summary}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {selectedSource && (
            <>
              <hr className="rule-lite" />
              <p className="kicker">Selected</p>
              <h2 className="page-h2">{selectedSource.title}</h2>
              <p className="sub">
                {selectedSource.organization} · {selectedSource.year} · {selectedSource.type}
              </p>
              <p className="lede">{selectedSource.summary}</p>
              <p>
                <a href={selectedSource.url} target="_blank" rel="noopener noreferrer">
                  Open source
                </a>
              </p>
              <pre className="code-block" style={{ marginTop: '0.85rem' }}>
                {selectedSource.organization}. ({selectedSource.year}). {selectedSource.title}.{' '}
                {selectedSource.url}
              </pre>
            </>
          )}
        </div>
      )}

      {tab === 'notes' && (
        <div className="grid-2 fadein t2">
          <div>
            <p className="kicker">Compose</p>
            <div className="stack" style={{ gap: '0.75rem' }}>
              <Input
                label="Title"
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Finding…"
              />
              <label className="field">
                <span>Body</span>
                <textarea
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  rows={5}
                  placeholder="Detail, caveats…"
                />
              </label>
              <Button
                variant="primary"
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
          </div>
          <div>
            <ul className="idea-list">
              {notes.map((n) => (
                <li key={n.id} style={{ marginBottom: '1rem' }}>
                  <strong style={{ color: 'var(--highlight)' }}>{n.title}</strong>
                  <p className="sub" style={{ margin: '0.25rem 0 0.4rem' }}>
                    {n.body}
                  </p>
                  <div className="chip-row">
                    {n.tags.map((t) => (
                      <Badge key={t}>{t}</Badge>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {tab === 'assumptions' && (
        <div className="fadein t2">
          <p className="kicker">Traceability</p>
          <h2 className="page-h2">Assumptions</h2>
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
                      <td className="mono" style={{ color: 'var(--highlight)' }}>
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
                      <td className="muted">{src?.organization ?? '-'}</td>
                      <td className="muted">{a.notes ?? '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'citations' && (
        <div className="fadein t2">
          <p className="kicker">Bibliography</p>
          <ol style={{ margin: 0, paddingLeft: '1.15rem', color: 'var(--ink-2)' }}>
            {citations.map((s) => (
              <li key={s.id} style={{ marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                <strong style={{ color: 'var(--highlight)' }}>{s.organization}</strong> ({s.year}).{' '}
                <em>{s.title}</em>.{' '}
                <a href={s.url} target="_blank" rel="noopener noreferrer">
                  {s.url}
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}

      <p className="footer-line">Research · sources · notes · assumptions</p>
    </div>
  )
}
