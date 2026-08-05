import { useMemo, useState } from 'react'
import {
  ENERGY_POLICIES,
  LAW_FORMS,
  POLICY_ERAS,
  POLICY_LEVELS,
  POLICY_THEMES,
  filterPolicies,
  policyStats,
  resolveLawForm,
  type EnergyPolicy,
  type LawForm,
  type PolicyEra,
  type PolicyLevel,
  type PolicyStatus,
  type PolicyTheme,
} from '../../data/energyPolicies'
import { ALL_JURISDICTION_ABBRS, jurisdictionCoverage } from '../../data/jurisdictionPolicies'
import { Badge } from '../ui/Badge'
import { Select } from '../ui/Select'
import { Input } from '../ui/Input'
import { Button } from '../ui/Button'
import { Download } from 'lucide-react'
import { exportCsv, exportJson } from '../../lib/utils'
import { useApp } from '../../context/AppContext'
import { US_STATES } from '../../data/usStates'

function statusVariant(
  s: PolicyStatus
): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  if (s === 'active') return 'success'
  if (s === 'proposed') return 'info'
  if (s === 'superseded') return 'warning'
  return 'default'
}

function levelVariant(
  l: PolicyLevel
): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  if (l === 'constitutional') return 'danger'
  if (l === 'federal') return 'info'
  if (l === 'regulatory') return 'info'
  if (l === 'tribal') return 'warning'
  if (l === 'state') return 'success'
  if (l === 'local') return 'warning'
  return 'default'
}

export function PolicyPanel() {
  const { openStateDetail, setDrilldown } = useApp()
  const [level, setLevel] = useState<PolicyLevel | 'all'>('all')
  const [lawForm, setLawForm] = useState<LawForm | 'all'>('all')
  const [era, setEra] = useState<PolicyEra | 'all'>('all')
  const [status, setStatus] = useState<PolicyStatus | 'all'>('all')
  const [theme, setTheme] = useState<PolicyTheme | 'all'>('all')
  const [stateAbbr, setStateAbbr] = useState<string | 'all'>('all')
  const [query, setQuery] = useState('')
  // Empty id → detail pane defaults to newest matching policy
  const [selectedId, setSelectedId] = useState<string>('')

  const filtered = useMemo(
    () =>
      filterPolicies(ENERGY_POLICIES, {
        level,
        lawForm,
        era,
        status,
        theme,
        stateAbbr,
        query,
      }),
    [level, lawForm, era, status, theme, stateAbbr, query]
  )

  const stats = useMemo(() => policyStats(filtered), [filtered])
  const allStats = useMemo(() => policyStats(ENERGY_POLICIES), [])

  const selected: EnergyPolicy | null =
    filtered.find((p) => p.id === selectedId) ?? filtered[0] ?? null

  const byEra = useMemo(() => {
    return POLICY_ERAS.map((e) => ({
      ...e,
      count: filtered.filter((p) => p.era === e.id).length,
      items: filtered.filter((p) => p.era === e.id),
    })).filter((e) => e.count > 0)
  }, [filtered])

  const select = (p: EnergyPolicy) => {
    setSelectedId(p.id)
    setDrilldown(`policy:${p.id}`)
  }

  const coverage = useMemo(() => jurisdictionCoverage(ENERGY_POLICIES), [])

  const stateOptions = useMemo(() => {
    return ALL_JURISDICTION_ABBRS.map((a) => {
      const st = US_STATES.find((s) => s.abbr === a)
      const name =
        st?.name ??
        ({
          DC: 'District of Columbia',
          GU: 'Guam',
          VI: 'U.S. Virgin Islands',
          AS: 'American Samoa',
          MP: 'Northern Mariana Islands',
        } as Record<string, string>)[a] ??
        a
      return { value: a, label: `${a} · ${name}` }
    })
  }, [])

  const nameFor = (abbr: string) =>
    US_STATES.find((s) => s.abbr === abbr)?.name ??
    stateOptions.find((s) => s.value === abbr)?.label.replace(/^[A-Z]{2} · /, '') ??
    abbr

  return (
    <div id="policy" className="fadein t1">
      <div className="intro">
        <strong>Energy and usage law · all levels</strong>
        <p>
          Full legal stack for energy supply and energy usage: constitutional, federal statutes,
          agency regulations and orders, tribal, state, local, and market tariffs - plus keystones
          for every state and territory. Newest first. Educational sample - not legal advice.
        </p>
      </div>

      <div className="metric-strip">
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Laws shown</span>
          <span className="metric-value">{stats.count}</span>
          <span className="metric-hint">of {allStats.count} in catalog</span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Jurisdictions</span>
          <span className="metric-value">{coverage.covered.length}</span>
          <span className="metric-hint">
            of {ALL_JURISDICTION_ABBRS.length} states + DC + territories
          </span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Law levels</span>
          <span className="metric-value">{POLICY_LEVELS.length}</span>
          <span className="metric-hint">const → market tariffs</span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Year span</span>
          <span className="metric-value" style={{ fontSize: '1.1rem' }}>
            {stats.count ? `${stats.yearMin}-${stats.yearMax}` : '-'}
          </span>
          <span className="metric-hint">active {stats.byStatus.active}</span>
        </div>
      </div>

      <section className="block">
        <p className="kicker">Hierarchy</p>
        <h2 className="page-h2">All levels of energy and usage law</h2>
        <p className="sub">
          Click a level to filter. Higher rows generally preempt lower ones when Congress or the
          Constitution occupies the field.
        </p>
        <div className="policy-level-grid">
          {POLICY_LEVELS.map((l) => (
            <button
              key={l.id}
              type="button"
              className={`policy-level-card${level === l.id ? ' is-on' : ''}`}
              onClick={() => setLevel(level === l.id ? 'all' : l.id)}
            >
              <span className="policy-level-rank mono">{l.rank}</span>
              <span className="policy-level-name">{l.label}</span>
              <span className="policy-level-count mono">
                {allStats.byLevel[l.id] ?? 0} entries
              </span>
              <span className="policy-level-blurb muted">{l.blurb}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="block">
        <p className="kicker">Jurisdictions</p>
        <h2 className="page-h2">All states and territories</h2>
        <p className="sub">
          Click any abbr to filter policies for that jurisdiction. Coverage:{' '}
          {coverage.covered.length}/{ALL_JURISDICTION_ABBRS.length}.
        </p>
        <div className="state-abbr-grid">
          <button
            type="button"
            className={`state-abbr-btn${stateAbbr === 'all' ? ' is-on' : ''}`}
            onClick={() => setStateAbbr('all')}
            title="All jurisdictions"
          >
            ALL
          </button>
          {ALL_JURISDICTION_ABBRS.map((abbr) => (
            <button
              key={abbr}
              type="button"
              className={`state-abbr-btn${stateAbbr === abbr ? ' is-on' : ''}`}
              onClick={() => setStateAbbr(abbr)}
              title={nameFor(abbr)}
            >
              {abbr}
            </button>
          ))}
        </div>
        {stateAbbr !== 'all' && (
          <div className="btn-row" style={{ marginTop: 10 }}>
            <Badge variant="info">{nameFor(stateAbbr)}</Badge>
            {US_STATES.some((s) => s.abbr === stateAbbr) && (
              <Button size="sm" onClick={() => openStateDetail(stateAbbr)}>
                Open {stateAbbr} energy page
              </Button>
            )}
            <Button size="sm" onClick={() => setStateAbbr('all')}>
              Clear filter
            </Button>
          </div>
        )}
      </section>

      <div className="filters">
        <Input
          placeholder="Search title, jurisdiction, instrument…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search policies"
          style={{ minWidth: '12rem' }}
        />
        <Select
          label="Law level"
          value={level}
          onChange={(e) => setLevel(e.target.value as PolicyLevel | 'all')}
          options={[
            { value: 'all', label: 'All levels' },
            ...POLICY_LEVELS.map((l) => ({ value: l.id, label: `${l.rank}. ${l.label}` })),
          ]}
        />
        <Select
          label="Form of law"
          value={lawForm}
          onChange={(e) => setLawForm(e.target.value as LawForm | 'all')}
          options={[
            { value: 'all', label: 'All forms' },
            ...LAW_FORMS.map((f) => ({ value: f.id, label: f.label })),
          ]}
        />
        <Select
          label="Era"
          value={era}
          onChange={(e) => setEra(e.target.value as PolicyEra | 'all')}
          options={[
            { value: 'all', label: 'All eras' },
            ...POLICY_ERAS.map((e) => ({ value: e.id, label: e.label })),
          ]}
        />
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as PolicyStatus | 'all')}
          options={[
            { value: 'all', label: 'All status' },
            { value: 'active', label: 'Active' },
            { value: 'historical', label: 'Historical' },
            { value: 'superseded', label: 'Superseded' },
            { value: 'proposed', label: 'Proposed' },
          ]}
        />
        <Select
          label="Theme"
          value={theme}
          onChange={(e) => setTheme(e.target.value as PolicyTheme | 'all')}
          options={[
            { value: 'all', label: 'All themes' },
            ...POLICY_THEMES.map((t) => ({ value: t.id, label: t.label })),
          ]}
        />
        <Select
          label="State"
          value={stateAbbr}
          onChange={(e) => setStateAbbr(e.target.value)}
          options={[{ value: 'all', label: 'All jurisdictions' }, ...stateOptions]}
        />
        <div className="btn-row" style={{ alignSelf: 'flex-end' }}>
          <Button
            size="sm"
            icon={<Download className="h-3.5 w-3.5" />}
            onClick={() =>
              exportCsv(
                filtered.map((p) => ({
                  year: p.year,
                  end_year: p.endYear ?? '',
                  title: p.title,
                  short: p.short,
                  level: p.level,
                  law_form: resolveLawForm(p),
                  jurisdiction: p.jurisdiction,
                  state: p.stateAbbr ?? '',
                  era: p.era,
                  status: p.status,
                  themes: p.themes.join('|'),
                  instruments: p.instruments.join('|'),
                  cite: p.cite ?? '',
                })),
                'us-energy-usage-law.csv'
              )
            }
          >
            CSV
          </Button>
          <Button size="sm" onClick={() => exportJson(filtered, 'us-energy-policies.json')}>
            JSON
          </Button>
        </div>
      </div>

      <div className="state-chip-row" style={{ marginBottom: '1rem' }}>
        <button
          type="button"
          className={`state-chip${theme === 'all' ? ' is-on' : ''}`}
          onClick={() => setTheme('all')}
        >
          All themes
        </button>
        <button
          type="button"
          className={`state-chip${theme === 'usage' ? ' is-on' : ''}`}
          onClick={() => setTheme('usage')}
        >
          Energy usage
        </button>
        <button
          type="button"
          className={`state-chip${theme === 'demand' ? ' is-on' : ''}`}
          onClick={() => setTheme('demand')}
        >
          Demand response
        </button>
        <button
          type="button"
          className={`state-chip${theme === 'efficiency' ? ' is-on' : ''}`}
          onClick={() => setTheme('efficiency')}
        >
          Efficiency
        </button>
        <button
          type="button"
          className={`state-chip${theme === 'rates' ? ' is-on' : ''}`}
          onClick={() => setTheme('rates')}
        >
          Rates
        </button>
        <button
          type="button"
          className={`state-chip${theme === 'buildings' ? ' is-on' : ''}`}
          onClick={() => setTheme('buildings')}
        >
          Buildings
        </button>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <section className="block">
          <p className="kicker">Timeline</p>
          <h2 className="page-h2">By era · latest first</h2>
          <p className="sub">
            Newest policies on top (current decade down to pre-1900). Within each era, years run
            latest to oldest. Click a row for detail.
          </p>

          <div className="policy-timeline">
            {byEra.map((e) => (
              <div key={e.id} className="policy-era-block">
                <div className="policy-era-head">
                  <span className="policy-era-label">{e.label}</span>
                  <span className="mono muted policy-era-meta">
                    {e.range} · {e.count}
                  </span>
                </div>
                <ul className="policy-era-list">
                  {e.items.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className={`policy-row${selected?.id === p.id ? ' is-on' : ''}`}
                        onClick={() => select(p)}
                      >
                        <span className="policy-year mono">{p.year}</span>
                        <span className="policy-row-main">
                          <span className="policy-row-title">{p.short}</span>
                          <span className="policy-row-sub muted">
                            {p.jurisdiction} · {p.level}
                          </span>
                        </span>
                        <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {byEra.length === 0 && <p className="muted">No policies match filters.</p>}
          </div>
        </section>

        <section className="block">
          <p className="kicker">Detail</p>
          {selected ? (
            <>
              <h2 className="page-h2">{selected.title}</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                <Badge variant={levelVariant(selected.level)}>
                  {POLICY_LEVELS.find((l) => l.id === selected.level)?.label ?? selected.level}
                </Badge>
                <Badge>
                  {LAW_FORMS.find((f) => f.id === resolveLawForm(selected))?.label ??
                    resolveLawForm(selected)}
                </Badge>
                <Badge variant={statusVariant(selected.status)}>{selected.status}</Badge>
                <Badge>
                  {selected.year}
                  {selected.endYear ? `-${selected.endYear}` : ''}
                </Badge>
                {POLICY_ERAS.find((e) => e.id === selected.era) && (
                  <Badge variant="info">
                    {POLICY_ERAS.find((e) => e.id === selected.era)!.label}
                  </Badge>
                )}
              </div>
              <table className="list-table">
                <tbody>
                  <tr>
                    <th scope="row">Jurisdiction</th>
                    <td>
                      {selected.jurisdiction}
                      {selected.stateAbbr && (
                        <>
                          {' · '}
                          <button
                            type="button"
                            className="linkish"
                            onClick={() => openStateDetail(selected.stateAbbr!)}
                          >
                            Open {selected.stateAbbr} page
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Law level</th>
                    <td>
                      {POLICY_LEVELS.find((l) => l.id === selected.level)?.label ?? selected.level}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Form of law</th>
                    <td>
                      {LAW_FORMS.find((f) => f.id === resolveLawForm(selected))?.label ??
                        resolveLawForm(selected)}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Themes</th>
                    <td style={{ whiteSpace: 'normal' }}>
                      {selected.themes
                        .map((t) => POLICY_THEMES.find((x) => x.id === t)?.label ?? t)
                        .join(' · ')}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Instruments</th>
                    <td style={{ whiteSpace: 'normal' }}>{selected.instruments.join(' · ')}</td>
                  </tr>
                  {selected.cite && (
                    <tr>
                      <th scope="row">Cite</th>
                      <td className="mono" style={{ whiteSpace: 'normal' }}>
                        {selected.cite}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <p className="kicker" style={{ marginTop: '1rem' }}>
                Summary
              </p>
              <p className="sub" style={{ maxWidth: 'none' }}>
                {selected.summary}
              </p>
              <p className="kicker">Impact</p>
              <p className="sub" style={{ maxWidth: 'none' }}>
                {selected.impact}
              </p>
            </>
          ) : (
            <p className="sub">Select a policy from the timeline.</p>
          )}
        </section>
      </div>

      <hr className="rule" />

      <section className="block">
        <p className="kicker">Catalog</p>
        <h2 className="page-h2">All matching policies</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Short name</th>
                <th>Level</th>
                <th>Form</th>
                <th>Jurisdiction</th>
                <th>Status</th>
                <th>Themes</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => select(p)}
                  style={{
                    cursor: 'pointer',
                    background: selected?.id === p.id ? 'var(--fill)' : undefined,
                  }}
                >
                  <td className="num mono">{p.year}</td>
                  <td style={{ fontWeight: 600, color: 'var(--highlight)' }}>{p.short}</td>
                  <td>
                    <Badge variant={levelVariant(p.level)}>
                      {POLICY_LEVELS.find((l) => l.id === p.level)?.label ?? p.level}
                    </Badge>
                  </td>
                  <td className="muted">
                    {LAW_FORMS.find((f) => f.id === resolveLawForm(p))?.label ??
                      resolveLawForm(p)}
                  </td>
                  <td className="muted">{p.jurisdiction}</td>
                  <td>
                    <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                  </td>
                  <td className="muted">{p.themes.slice(0, 3).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="footer-line">
        Policy · federal · state · local · all {ALL_JURISDICTION_ABBRS.length} jurisdictions ·{' '}
        {allStats.yearMin}-{allStats.yearMax} sample catalog · pair with Research and USA pages
      </p>
    </div>
  )
}
