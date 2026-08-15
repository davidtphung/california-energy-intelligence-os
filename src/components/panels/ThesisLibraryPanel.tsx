/**
 * Thesis library: digest Chronometer "Got Gas" and related models, mapped.
 */

import { useMemo, useState } from 'react'
import { ExternalLink, Download, BookOpen, Map as MapIcon } from 'lucide-react'
import { projectUS } from '../../data/usStates'
import {
  GOT_GAS_DIGEST,
  RELATED_PAPERS,
  THESIS_HUBS,
  hubColor,
  searchPapers,
  type PaperKind,
  type ThesisStance,
} from '../../data/gasThesisPapers'
import { useApp } from '../../context/AppContext'
import { exportJson } from '../../lib/utils'
import { UsBasemap } from '../grid/UsBasemap'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Badge } from '../ui/Badge'

const W = 960
const H = 520

type Section = 'digest' | 'library' | 'map'

const STANCE_LABEL: Record<ThesisStance, string> = {
  crisis: 'Crisis path',
  tight: 'Tight market',
  growth: 'Demand growth',
  balanced: 'Multi-fuel',
  skeptical: 'Skeptical',
}

export function ThesisLibraryPanel() {
  const { theme } = useApp()
  const [section, setSection] = useState<Section>('digest')
  const [query, setQuery] = useState('')
  const [stance, setStance] = useState<ThesisStance | 'all'>('all')
  const [selectedPaper, setSelectedPaper] = useState<string>('chronometer-got-gas')
  const [hubFocus, setHubFocus] = useState<string | null>('gulf-lng')

  const papers = useMemo(() => {
    let list = searchPapers(query)
    if (stance !== 'all') list = list.filter((p) => p.stance === stance)
    return list
  }, [query, stance])

  const paper = RELATED_PAPERS.find((p) => p.id === selectedPaper) ?? RELATED_PAPERS[0]
  const g = GOT_GAS_DIGEST.arithmetic
  const ink = theme === 'dark' ? '#e8e4db' : '#2e2b23'
  const mute = theme === 'dark' ? '#8a8478' : '#7a7468'

  return (
    <div id="thesis" className="thesis-panel mapcentric fadein t1">
      <header className="mapcentric-head">
        <div>
          <p className="kicker">Thesis library</p>
          <h1 className="page-h2" style={{ marginBottom: 4 }}>
            Got Gas and the AI-power research stack
          </h1>
          <p className="mapcentric-lede">
            Anchor is Chronometer Letter III (Got Gas). The library now holds both sides: shortage
            / tight-gas theses and official, academic, and NGO work that treats DC load as a wide
            range, an efficiency story, or an overstated IRP queue. Educational map of the debate,
            not investment advice.
          </p>
        </div>
        <div className="mapcentric-kpis">
          <div className="mapcentric-kpi">
            <span>Anchor paper</span>
            <strong style={{ fontSize: '0.95rem' }}>Got Gas</strong>
          </div>
          <div className="mapcentric-kpi">
            <span>Sources in library</span>
            <strong>{RELATED_PAPERS.length}</strong>
          </div>
          <div className="mapcentric-kpi">
            <span>Skeptical + balanced</span>
            <strong>
              {
                RELATED_PAPERS.filter((p) => p.stance === 'skeptical' || p.stance === 'balanced')
                  .length
              }
            </strong>
          </div>
          <div className="mapcentric-kpi">
            <span>Crisis + tight</span>
            <strong style={{ color: 'var(--danger)' }}>
              {RELATED_PAPERS.filter((p) => p.stance === 'crisis' || p.stance === 'tight').length}
            </strong>
          </div>
        </div>
      </header>

      <div className="gmap-mode" role="tablist" aria-label="Thesis sections">
        {(
          [
            ['digest', 'Digest'],
            ['map', 'Map thesis'],
            ['library', 'Library'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            className={section === id ? 'is-on' : ''}
            aria-selected={section === id}
            onClick={() => setSection(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* DIGEST */}
      {section === 'digest' && (
        <div className="thesis-digest">
          <div className="thesis-hero card-soft">
            <div className="thesis-hero-meta">
              <Badge variant="info">Primary source</Badge>
              <span className="mono muted">{GOT_GAS_DIGEST.date}</span>
            </div>
            <h2 className="page-h2">{GOT_GAS_DIGEST.title}</h2>
            <p className="sub" style={{ maxWidth: '40rem' }}>
              {GOT_GAS_DIGEST.authors} · {GOT_GAS_DIGEST.org} · {GOT_GAS_DIGEST.pages} pages
            </p>
            <p className="thesis-quote">{GOT_GAS_DIGEST.heresy}</p>
            <p className="thesis-core">{GOT_GAS_DIGEST.coreThesis}</p>
            <div className="btn-row" style={{ marginTop: 12 }}>
              <a
                className="btn btn-primary btn-sm"
                href={GOT_GAS_DIGEST.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Read PDF <ExternalLink className="h-3.5 w-3.5" style={{ marginLeft: 6 }} />
              </a>
              <Button size="sm" onClick={() => setSection('map')}>
                <MapIcon className="h-3.5 w-3.5" /> Map the thesis
              </Button>
              <Button size="sm" onClick={() => setSection('library')}>
                <BookOpen className="h-3.5 w-3.5" /> Related papers
              </Button>
            </div>
          </div>

          <section className="block thesis-debate" style={{ marginTop: '1.1rem' }}>
            <p className="kicker">Both sides of the debate</p>
            <div className="demand-chart-grid">
              <div className="demand-chart-card card-soft" style={{ padding: '0.85rem 1rem' }}>
                <p className="kicker">Shortage / tight gas</p>
                <p className="sub" style={{ margin: 0, fontSize: '0.88rem' }}>
                  Chronometer, ILTB, RBC, Hamm, NERC LTRA, Goldman: LNG + AI load + midstream lag
                  produce 2028-2030 deliverability risk. Storage days-to-cover collapses. Filter
                  library: Crisis path and Tight market.
                </p>
              </div>
              <div className="demand-chart-card card-soft" style={{ padding: '0.85rem 1rem' }}>
                <p className="kicker">Range / efficiency / overstated queues</p>
                <p className="sub" style={{ margin: 0, fontSize: '0.88rem' }}>
                  LBNL, EPRI, EIA AEO + STEO / Today in Energy (record 2026 production, GOR,
                  weekly storage), IEA, Koomey/BPC, Science 2020, WRI, SELC/LEI, ACEEE: official
                  near-term gas is still making records; DC TWh is a wide band. Filter: Skeptical
                  and Multi-fuel. Search &quot;67944&quot; or &quot;STEO&quot;.
                </p>
              </div>
            </div>
            <div className="btn-row" style={{ marginTop: 10 }}>
              <Button
                size="sm"
                onClick={() => {
                  setStance('skeptical')
                  setSection('library')
                }}
              >
                Open skeptical sources
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setStance('crisis')
                  setSection('library')
                }}
              >
                Open crisis sources
              </Button>
            </div>
          </section>

          {/* Timeline */}
          <section className="block" style={{ marginTop: '1.25rem' }}>
            <p className="kicker">Predicted path</p>
            <h2 className="page-h2">When the cushion runs out</h2>
            <div className="thesis-timeline">
              {GOT_GAS_DIGEST.timeline.map((t, i) => (
                <div key={t.year} className={`thesis-tl-item${i >= 2 ? ' is-hot' : ''}`}>
                  <span className="thesis-tl-year mono">{t.year}</span>
                  <span className="thesis-tl-dot" />
                  <div>
                    <strong>{t.label}</strong>
                    <p className="muted">{t.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Arithmetic cards */}
          <section className="block">
            <p className="kicker">The arithmetic (base case)</p>
            <h2 className="page-h2">Incremental supply vs demand to 2030</h2>
            <div className="thesis-math-grid">
              <div className="thesis-math-card is-supply">
                <span className="kicker">Production add (max)</span>
                <strong>+{g.productionAddBcf} Bcf/d</strong>
                <p className="muted">~{g.productionNowBcf} → ~{g.productionMaxBcf} by YE 2030</p>
              </div>
              <div className="thesis-math-card is-demand">
                <span className="kicker">LNG exports add</span>
                <strong>+{g.lngAddBcf} Bcf/d</strong>
                <p className="muted">~{g.lngNowBcf} → ~{g.lng2030Bcf} approved nameplate</p>
              </div>
              <div className="thesis-math-card is-demand">
                <span className="kicker">Power burn add (P50+)</span>
                <strong>+{g.powerBurnAddBcf} Bcf/d</strong>
                <p className="muted">Approved / high-prob gas gen only</p>
              </div>
              <div className="thesis-math-card is-deficit">
                <span className="kicker">Deficit by 2030</span>
                <strong>&gt;{g.deficit2030Bcf} Bcf/d</strong>
                <p className="muted">Before full force of AI load</p>
              </div>
            </div>
            <div className="thesis-storage-bar" style={{ marginTop: '1rem' }}>
              <p className="kicker">Storage days-to-cover</p>
              <div className="thesis-days-row">
                {[
                  { y: '2010', d: g.storageDays2010 },
                  { y: '2025', d: g.storageDays2025 },
                  { y: '2030', d: g.storageDays2030 },
                ].map((x) => (
                  <div key={x.y} className="thesis-days-col">
                    <div
                      className="thesis-days-fill"
                      style={{ height: `${(x.d / g.storageDays2010) * 100}%` }}
                    />
                    <span className="mono">{x.d}</span>
                    <span className="muted">{x.y}</span>
                  </div>
                ))}
              </div>
              <p className="sub" style={{ marginTop: 8 }}>
                Working storage +{g.storageGrowth2010_2025Pct}% (2010-2025) while key demand +
                {g.demandGrowth2010_2025Pct}%. Then storage +{g.storageGrowth2025_2030Pct}% vs demand
                +{g.demandGrowth2025_2030Pct}% to 2030. System larger; cushion smaller.
              </p>
            </div>
          </section>

          {/* Model layers */}
          <section className="block">
            <p className="kicker">How the model is built</p>
            <h2 className="page-h2">Six connected layers</h2>
            <div className="thesis-layers">
              {GOT_GAS_DIGEST.modelLayers.map((layer, i) => (
                <article key={layer.id} className="thesis-layer-card">
                  <span className="mono muted">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{layer.title}</h3>
                  <p>{layer.body}</p>
                </article>
              ))}
            </div>
          </section>

          <div className="grid-2" style={{ alignItems: 'start', marginTop: '0.5rem' }}>
            <section className="block">
              <p className="kicker">Clear winners (thesis view)</p>
              <ul className="about-steps" style={{ listStyle: 'disc', paddingLeft: '1.2rem' }}>
                {GOT_GAS_DIGEST.winners.map((w) => (
                  <li key={w.slice(0, 40)}>{w}</li>
                ))}
              </ul>
            </section>
            <section className="block">
              <p className="kicker">Clear losers (thesis view)</p>
              <ul className="about-steps" style={{ listStyle: 'disc', paddingLeft: '1.2rem' }}>
                {GOT_GAS_DIGEST.losers.map((w) => (
                  <li key={w.slice(0, 40)}>{w}</li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}

      {/* MAP */}
      {section === 'map' && (
        <div className="thesis-map-wrap">
          <p className="sub" style={{ maxWidth: '40rem' }}>
            Schematic geography of the Got Gas story: supply basins, Gulf LNG, load centers, and
            storage belt. Click a hub; related papers light up in the library.
          </p>
          <div className={`mapcentric-stage has-drawer`}>
            <div className="mapcentric-map">
              <svg viewBox={`0 0 ${W} ${H}`} className="fbal-svg" role="img" aria-label="Gas thesis map">
                <rect width={W} height={H} fill="var(--bg-soft)" />
                <UsBasemap w={W} h={H} />
                {/* Links basin → LNG / load */}
                {(() => {
                  const perm = projectUS(-102.5, 31.8, W, H)
                  const hay = projectUS(-93.5, 32.2, W, H)
                  const app = projectUS(-80.0, 40.0, W, H)
                  const lng = projectUS(-93.0, 29.8, W, H)
                  const pjm = projectUS(-77.5, 38.5, W, H)
                  const ercot = projectUS(-97.5, 31.0, W, H)
                  const lines = [
                    [perm, lng],
                    [hay, lng],
                    [app, pjm],
                    [perm, ercot],
                    [lng, ercot],
                  ]
                  return lines.map(([a, b], i) => (
                    <line
                      key={i}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={mute}
                      strokeWidth={1.2}
                      strokeDasharray="5 4"
                      opacity={0.45}
                      className="pmap-flow"
                    />
                  ))
                })()}
                {THESIS_HUBS.map((h) => {
                  const { x, y } = projectUS(h.lon, h.lat, W, H)
                  const on = hubFocus === h.id || paper?.mapFocus.includes(h.id)
                  const r = 8 + (h.weight / 100) * 14
                  return (
                    <g
                      key={h.id}
                      transform={`translate(${x},${y})`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setHubFocus(h.id)}
                    >
                      <circle
                        r={r + (on ? 4 : 0)}
                        fill={hubColor(h.kind)}
                        fillOpacity={on ? 0.9 : 0.55}
                        stroke={on ? ink : 'var(--bg)'}
                        strokeWidth={on ? 2 : 1}
                      />
                      <text
                        y={r + 14}
                        textAnchor="middle"
                        fill={ink}
                        fontSize={10}
                        fontWeight={600}
                        style={{ pointerEvents: 'none' }}
                      >
                        {h.label}
                      </text>
                      <title>
                        {h.label}: {h.note}
                      </title>
                    </g>
                  )
                })}
                <g transform={`translate(24, ${H - 40})`}>
                  <text fill={mute} fontSize={10} fontFamily="var(--font-mono)">
                    green basin · blue LNG · orange load · purple storage · gold power
                  </text>
                </g>
              </svg>
            </div>
            <aside className="mapcentric-drawer">
              <p className="kicker">Hub</p>
              {(() => {
                const h = THESIS_HUBS.find((x) => x.id === hubFocus) ?? THESIS_HUBS[0]
                const related = RELATED_PAPERS.filter((p) => p.mapFocus.includes(h.id)).slice(0, 5)
                return (
                  <>
                    <h3 className="page-h2" style={{ fontSize: '1.1rem' }}>
                      {h.label}
                    </h3>
                    <Badge>{h.kind}</Badge>
                    <p className="sub" style={{ maxWidth: 'none', marginTop: 8 }}>
                      {h.note}
                    </p>
                    <p className="kicker" style={{ marginTop: 12 }}>
                      Papers that hit this node
                    </p>
                    <ul className="gmap-actions">
                      {related.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            className="linkish"
                            onClick={() => {
                              setSelectedPaper(p.id)
                              setSection('library')
                            }}
                          >
                            {p.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </>
                )
              })()}
            </aside>
          </div>
        </div>
      )}

      {/* LIBRARY */}
      {section === 'library' && (
        <div className="thesis-library">
          <div className="mapcentric-filters">
            <Input
              placeholder="Search papers, claims, tags…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search thesis library"
              style={{ minWidth: '12rem' }}
            />
            <div className="gmap-mode">
              <button
                type="button"
                className={stance === 'all' ? 'is-on' : ''}
                onClick={() => setStance('all')}
              >
                All
              </button>
              {(Object.keys(STANCE_LABEL) as ThesisStance[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  className={stance === s ? 'is-on' : ''}
                  onClick={() => setStance(s)}
                >
                  {STANCE_LABEL[s]}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              icon={<Download className="h-3.5 w-3.5" />}
              onClick={() => exportJson({ gotGas: GOT_GAS_DIGEST, papers: RELATED_PAPERS }, 'eis-thesis-library.json')}
            >
              JSON
            </Button>
          </div>

          <div className={`mapcentric-stage has-drawer`}>
            <div className="thesis-paper-list">
              {papers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`thesis-paper-card${selectedPaper === p.id ? ' is-on' : ''}`}
                  onClick={() => setSelectedPaper(p.id)}
                >
                  <div className="thesis-paper-top">
                    <Badge
                      variant={
                        p.stance === 'crisis'
                          ? 'warning'
                          : p.stance === 'skeptical'
                            ? 'success'
                            : p.stance === 'balanced'
                              ? 'info'
                              : 'default'
                      }
                    >
                      {STANCE_LABEL[p.stance]}
                    </Badge>
                    <span className="mono muted">{p.year}</span>
                    <span className="mono muted">{p.relatedness}% match</span>
                  </div>
                  <strong>{p.title}</strong>
                  <span className="muted">
                    {p.authors} · {p.org}
                  </span>
                  <p>{p.summary}</p>
                  <div className="thesis-tags">
                    {p.tags.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                </button>
              ))}
              {papers.length === 0 && (
                <p className="muted">No papers match. Clear search or stance filter.</p>
              )}
            </div>

            {paper && (
              <aside className="mapcentric-drawer thesis-detail">
                <p className="kicker">{kindLabel(paper.kind)}</p>
                <h3 className="page-h2" style={{ fontSize: '1.1rem' }}>
                  {paper.title}
                </h3>
                <p className="sub" style={{ maxWidth: 'none' }}>
                  {paper.authors} · {paper.org} · {paper.year}
                </p>
                <p className="sub" style={{ maxWidth: 'none' }}>
                  {paper.summary}
                </p>
                <p className="kicker" style={{ marginTop: 12 }}>
                  Key claims
                </p>
                <ul className="about-steps" style={{ listStyle: 'disc', paddingLeft: '1.2rem' }}>
                  {paper.keyClaims.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
                <a
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 12, display: 'inline-flex' }}
                  href={paper.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open source <ExternalLink className="h-3.5 w-3.5" style={{ marginLeft: 6 }} />
                </a>
                {paper.id === 'chronometer-got-gas' && (
                  <Button size="sm" style={{ marginTop: 8 }} onClick={() => setSection('digest')}>
                    Full Got Gas digest
                  </Button>
                )}
              </aside>
            )}
          </div>
        </div>
      )}

      <p className="footer-line">
        Thesis library · Chronometer Got Gas · related AI-power and gas models · educational digest ·
        not investment advice
      </p>
    </div>
  )
}

function kindLabel(k: PaperKind): string {
  switch (k) {
    case 'letter':
      return 'Letter / memo'
    case 'report':
      return 'Report'
    case 'podcast':
      return 'Podcast'
    case 'analysis':
      return 'Analysis'
    case 'agency':
      return 'Agency'
    case 'academic':
      return 'Academic'
  }
}
