import { useMemo, useState } from 'react'
import {
  PORTFOLIOS,
  PORTFOLIO_KINDS,
  PORTFOLIO_STATE_ABBRS,
  allAssets,
  portfolioTotals,
  regionRollup,
  stateRollup,
  type EnergyPortfolio,
  type PortfolioAsset,
} from '../../data/portfolios'
import { US_STATES } from '../../data/usStates'
import { PortfolioLocationMap } from '../charts/PortfolioLocationMap'
import { Badge } from '../ui/Badge'
import { Select } from '../ui/Select'
import { Input } from '../ui/Input'
import { TECH_LABELS } from '../../lib/utils'
import type { PortfolioKind, Technology } from '../../types'
import { useApp } from '../../context/AppContext'
import { exportCsv, exportJson } from '../../lib/utils'
import { Button } from '../ui/Button'
import { Download } from 'lucide-react'

type AssetRow = PortfolioAsset & {
  portfolioId: string
  portfolioShort: string
  kind: PortfolioKind
  stateName: string
}

export function PortfoliosPanel() {
  const { setDrilldown, openStateDetail } = useApp()
  const [kindFilter, setKindFilter] = useState<PortfolioKind | 'all'>('all')
  const [techFilter, setTechFilter] = useState<Technology | 'all'>('all')
  const [stateFilter, setStateFilter] = useState<string | 'all'>('all')
  const [query, setQuery] = useState('')
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | 'all'>('all')
  const [selectedAsset, setSelectedAsset] = useState<AssetRow | null>(null)

  const filteredPortfolios = useMemo(() => {
    return PORTFOLIOS.filter((p) => {
      if (kindFilter !== 'all' && p.kind !== kindFilter) return false
      if (stateFilter !== 'all' && p.stateAbbr !== stateFilter) return false
      const q = query.toLowerCase()
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.short.toLowerCase().includes(q) ||
        p.stateName.toLowerCase().includes(q) ||
        p.stateAbbr.toLowerCase().includes(q) ||
        p.notes.toLowerCase().includes(q) ||
        p.assets.some(
          (a) => a.name.toLowerCase().includes(q) || a.county.toLowerCase().includes(q)
        )
      )
    })
  }, [kindFilter, stateFilter, query])

  const selectedPortfolio: EnergyPortfolio | null =
    selectedPortfolioId === 'all'
      ? null
      : filteredPortfolios.find((p) => p.id === selectedPortfolioId) ?? null

  const assets = useMemo(() => {
    let list = allAssets(filteredPortfolios)
    if (selectedPortfolioId !== 'all') list = list.filter((a) => a.portfolioId === selectedPortfolioId)
    if (techFilter !== 'all') list = list.filter((a) => a.technology === techFilter)
    return list
  }, [filteredPortfolios, selectedPortfolioId, techFilter])

  const regions = useMemo(() => regionRollup(assets), [assets])
  const byState = useMemo(() => stateRollup(filteredPortfolios), [filteredPortfolios])

  const totals = useMemo(() => {
    const capacityMw = assets.reduce((s, a) => s + a.capacityMw, 0)
    const outputMw = assets.reduce((s, a) => s + Math.max(0, a.outputMw), 0)
    const chargeMw = assets.reduce((s, a) => s + (a.outputMw < 0 ? -a.outputMw : 0), 0)
    const states = new Set(filteredPortfolios.map((p) => p.stateAbbr)).size
    return {
      capacityMw,
      outputMw,
      chargeMw,
      count: assets.length,
      portfolios: filteredPortfolios.length,
      states,
    }
  }, [assets, filteredPortfolios])

  const onSelectAsset = (a: AssetRow) => {
    setSelectedAsset(a)
    setSelectedPortfolioId(a.portfolioId)
    setStateFilter(a.stateAbbr)
    setDrilldown(`asset:${a.id}`)
  }

  const pickState = (abbr: string | 'all') => {
    setStateFilter(abbr)
    setSelectedPortfolioId('all')
    setSelectedAsset(null)
  }

  return (
    <div id="portfolios" className="fadein t1">
      <div className="intro">
        <strong>Portfolios · all states</strong>
        <p>
          Energy portfolios across all 50 states and Puerto Rico. California has detailed IOU, CCA,
          muni, and generator samples; every other state has a representative fleet built from
          capacity totals. Click a state to filter, or open the full state energy page.
        </p>
      </div>

      <div className="metric-strip">
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">States</span>
          <span className="metric-value">{totals.states}</span>
          <span className="metric-hint">of {PORTFOLIO_STATE_ABBRS.length} with portfolios</span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Portfolios</span>
          <span className="metric-value">{totals.portfolios}</span>
          <span className="metric-hint">in current filter</span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Mapped assets</span>
          <span className="metric-value">{totals.count}</span>
          <span className="metric-hint">plants · fleets · nodes</span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Nameplate</span>
          <span className="metric-value">
            {(totals.capacityMw / 1000).toFixed(0)}
            <span className="metric-unit">GW</span>
          </span>
          <span className="metric-hint">
            {(totals.outputMw / 1000).toFixed(0)} GW sample output
          </span>
        </div>
      </div>

      {/* State picker - every state */}
      <section className="block">
        <p className="kicker">States</p>
        <h2 className="page-h2">Browse by jurisdiction</h2>
        <p className="sub">
          Select a state to focus its portfolios on the map and tables. CA shows detailed LSEs;
          other states show fleet nodes by technology.
        </p>
        <div className="state-abbr-grid" style={{ marginBottom: '0.65rem' }}>
          <button
            type="button"
            className={`state-abbr-btn${stateFilter === 'all' ? ' is-on' : ''}`}
            onClick={() => pickState('all')}
            title="All states"
          >
            ALL
          </button>
          {PORTFOLIO_STATE_ABBRS.map((abbr) => {
            const st = US_STATES.find((s) => s.abbr === abbr)
            const n = PORTFOLIOS.filter((p) => p.stateAbbr === abbr).length
            return (
              <button
                key={abbr}
                type="button"
                className={`state-abbr-btn${stateFilter === abbr ? ' is-on' : ''}`}
                onClick={() => pickState(abbr)}
                title={`${st?.name ?? abbr} · ${n} portfolio${n === 1 ? '' : 's'}`}
              >
                {abbr}
              </button>
            )
          })}
        </div>
        {stateFilter !== 'all' && (
          <div className="btn-row" style={{ marginBottom: '0.5rem' }}>
            <Badge variant="info">
              {US_STATES.find((s) => s.abbr === stateFilter)?.name ?? stateFilter}
            </Badge>
            <Button size="sm" onClick={() => openStateDetail(stateFilter)}>
              Open {stateFilter} energy page
            </Button>
            <Button size="sm" onClick={() => pickState('all')}>
              Clear state filter
            </Button>
          </div>
        )}
      </section>

      <div className="filters">
        <Input
          placeholder="Search portfolio, plant, state, county…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search portfolios"
          style={{ minWidth: '12rem' }}
        />
        <Select
          label="State"
          value={stateFilter}
          onChange={(e) => pickState(e.target.value)}
          options={[
            { value: 'all', label: 'All states' },
            ...PORTFOLIO_STATE_ABBRS.map((abbr) => {
              const st = US_STATES.find((s) => s.abbr === abbr)
              return { value: abbr, label: `${abbr} · ${st?.name ?? abbr}` }
            }),
          ]}
        />
        <Select
          label="Kind"
          value={kindFilter}
          onChange={(e) => setKindFilter(e.target.value as PortfolioKind | 'all')}
          options={[
            { value: 'all', label: 'All kinds' },
            ...PORTFOLIO_KINDS.map((k) => ({ value: k, label: k })),
          ]}
        />
        <Select
          label="Technology"
          value={techFilter}
          onChange={(e) => setTechFilter(e.target.value as Technology | 'all')}
          options={[
            { value: 'all', label: 'All tech' },
            ...Object.entries(TECH_LABELS).map(([k, v]) => ({ value: k, label: v })),
          ]}
        />
        <Select
          label="Portfolio"
          value={selectedPortfolioId}
          onChange={(e) => {
            setSelectedPortfolioId(e.target.value)
            setSelectedAsset(null)
          }}
          options={[
            { value: 'all', label: 'All portfolios' },
            ...filteredPortfolios.map((p) => ({
              value: p.id,
              label: `${p.stateAbbr} · ${p.short}`,
            })),
          ]}
        />
        <div className="btn-row" style={{ alignSelf: 'flex-end' }}>
          <Button
            size="sm"
            icon={<Download className="h-3.5 w-3.5" />}
            onClick={() =>
              exportCsv(
                assets.map((a) => ({
                  state: a.stateAbbr,
                  portfolio: a.portfolioShort,
                  name: a.name,
                  technology: a.technology,
                  capacity_mw: a.capacityMw,
                  output_mw: a.outputMw,
                  latitude: a.latitude,
                  longitude: a.longitude,
                  region: a.region,
                  county: a.county,
                  status: a.status,
                })),
                'us-portfolio-assets.csv'
              )
            }
          >
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={() =>
              exportJson({ portfolios: filteredPortfolios, assets }, 'us-portfolios.json')
            }
          >
            Export JSON
          </Button>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <section className="block">
          <p className="kicker">Map</p>
          <h2 className="page-h2">
            {stateFilter === 'all' ? 'USA location outputs' : `${stateFilter} location outputs`}
          </h2>
          <p className="sub">
            Click a site for capacity, sample output, and coordinates. Size scales with nameplate.
          </p>
          <PortfolioLocationMap
            portfolios={filteredPortfolios}
            selectedPortfolioId={selectedPortfolioId}
            selectedAssetId={selectedAsset?.id ?? null}
            techFilter={techFilter}
            stateFilter={stateFilter}
            onSelectAsset={onSelectAsset}
          />
        </section>

        <section className="block">
          <p className="kicker">Selection</p>
          <h2 className="page-h2">
            {selectedAsset
              ? selectedAsset.name
              : selectedPortfolio
                ? selectedPortfolio.name
                : stateFilter !== 'all'
                  ? `${US_STATES.find((s) => s.abbr === stateFilter)?.name ?? stateFilter} portfolios`
                  : 'All portfolios'}
          </h2>

          {selectedAsset ? (
            <div>
              <table className="list-table">
                <tbody>
                  <tr>
                    <th scope="row">State</th>
                    <td>
                      <button
                        type="button"
                        className="linkish"
                        onClick={() => openStateDetail(selectedAsset.stateAbbr)}
                      >
                        {selectedAsset.stateAbbr} · {selectedAsset.stateName}
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Portfolio</th>
                    <td>{selectedAsset.portfolioShort}</td>
                  </tr>
                  <tr>
                    <th scope="row">Technology</th>
                    <td>{TECH_LABELS[selectedAsset.technology]}</td>
                  </tr>
                  <tr>
                    <th scope="row">Capacity</th>
                    <td className="mono" style={{ color: 'var(--highlight)' }}>
                      {selectedAsset.capacityMw.toLocaleString()} MW
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Sample output</th>
                    <td className="mono">
                      {selectedAsset.outputMw.toLocaleString()} MW
                      {selectedAsset.outputMw < 0 ? ' (charging / load)' : ''}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Location</th>
                    <td>
                      {selectedAsset.latitude.toFixed(4)}°N,{' '}
                      {Math.abs(selectedAsset.longitude).toFixed(4)}°W
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Region / county</th>
                    <td>
                      {selectedAsset.region} · {selectedAsset.county}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Status</th>
                    <td>
                      <Badge>{selectedAsset.status}</Badge>
                    </td>
                  </tr>
                </tbody>
              </table>
              <Button
                size="sm"
                className="btn-ghost"
                style={{ marginTop: 8 }}
                onClick={() => setSelectedAsset(null)}
              >
                Clear site
              </Button>
            </div>
          ) : selectedPortfolio ? (
            <div>
              <p className="sub">{selectedPortfolio.notes}</p>
              <table className="list-table">
                <tbody>
                  <tr>
                    <th scope="row">State</th>
                    <td>
                      <button
                        type="button"
                        className="linkish"
                        onClick={() => openStateDetail(selectedPortfolio.stateAbbr)}
                      >
                        {selectedPortfolio.stateAbbr} · {selectedPortfolio.stateName}
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Kind</th>
                    <td>
                      <Badge>{selectedPortfolio.kind}</Badge> · {selectedPortfolio.sector}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">HQ</th>
                    <td>{selectedPortfolio.hq}</td>
                  </tr>
                  {selectedPortfolio.customers && (
                    <tr>
                      <th scope="row">Customers</th>
                      <td>{selectedPortfolio.customers}</td>
                    </tr>
                  )}
                  {selectedPortfolio.loadSharePct != null && (
                    <tr>
                      <th scope="row">~Load share</th>
                      <td className="mono">{selectedPortfolio.loadSharePct}%</td>
                    </tr>
                  )}
                  {selectedPortfolio.cleanTarget && (
                    <tr>
                      <th scope="row">Clean target</th>
                      <td>{selectedPortfolio.cleanTarget}</td>
                    </tr>
                  )}
                  <tr>
                    <th scope="row">Mapped capacity</th>
                    <td className="mono" style={{ color: 'var(--highlight)' }}>
                      {(portfolioTotals(selectedPortfolio).capacityMw / 1000).toFixed(2)} GW
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Sample output</th>
                    <td className="mono">
                      {(portfolioTotals(selectedPortfolio).outputMw / 1000).toFixed(2)} GW gen
                    </td>
                  </tr>
                </tbody>
              </table>
              {selectedPortfolio.website && (
                <p style={{ marginTop: 8 }}>
                  <a href={selectedPortfolio.website} target="_blank" rel="noopener noreferrer">
                    Open portfolio site
                  </a>
                </p>
              )}
            </div>
          ) : (
            <p className="sub">
              Select a state above, pick a portfolio from the catalog, or click a map site. CA has
              detailed LSEs; every other state has a tech fleet sample.
            </p>
          )}

          <p className="kicker" style={{ marginTop: '1.25rem' }}>
            {stateFilter === 'all' ? 'Region rollup' : 'Within selection'}
          </p>
          <table className="list-table">
            <tbody>
              {regions.slice(0, 12).map((r) => (
                <tr key={r.region}>
                  <th scope="row">{r.region}</th>
                  <td className="mono">
                    {(r.capacityMw / 1000).toFixed(1)} GW cap · {(r.outputMw / 1000).toFixed(1)} GW
                    out · {r.count} sites ·{' '}
                    {r.capacityMw ? Math.round((r.cleanMw / r.capacityMw) * 100) : 0}% clean cap
                  </td>
                </tr>
              ))}
              {regions.length === 0 && (
                <tr>
                  <td colSpan={2} className="muted">
                    No assets in filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>

      <hr className="rule" />

      {/* Per-state directory */}
      <section className="block">
        <p className="kicker">Directory</p>
        <h2 className="page-h2">Portfolios by state</h2>
        <p className="sub">
          Every jurisdiction with mapped portfolios. Click a row to filter; open state page for full
          energy profile.
        </p>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>State</th>
                <th style={{ textAlign: 'right' }}>Portfolios</th>
                <th style={{ textAlign: 'right' }}>Assets</th>
                <th style={{ textAlign: 'right' }}>Capacity</th>
                <th style={{ textAlign: 'right' }}>Output</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {byState.map((s) => (
                <tr
                  key={s.stateAbbr}
                  onClick={() => pickState(s.stateAbbr)}
                  style={{
                    cursor: 'pointer',
                    background: stateFilter === s.stateAbbr ? 'var(--fill)' : undefined,
                  }}
                >
                  <td style={{ fontWeight: 600, color: 'var(--highlight)' }}>
                    {s.stateAbbr}{' '}
                    <span style={{ fontWeight: 500, color: 'var(--ink-2)' }}>{s.stateName}</span>
                  </td>
                  <td className="num">{s.portfolios}</td>
                  <td className="num">{s.assets}</td>
                  <td className="num">{(s.capacityMw / 1000).toFixed(1)} GW</td>
                  <td className="num">{(s.outputMw / 1000).toFixed(1)} GW</td>
                  <td>
                    <button
                      type="button"
                      className="linkish"
                      onClick={(e) => {
                        e.stopPropagation()
                        openStateDetail(s.stateAbbr)
                      }}
                    >
                      State page
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <hr className="rule" />

      <section className="block">
        <p className="kicker">Catalog</p>
        <h2 className="page-h2">
          {stateFilter === 'all' ? 'All portfolios' : `${stateFilter} portfolios`}
        </h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>State</th>
                <th>Portfolio</th>
                <th>Kind</th>
                <th>Sector</th>
                <th style={{ textAlign: 'right' }}>Assets</th>
                <th style={{ textAlign: 'right' }}>Capacity</th>
                <th style={{ textAlign: 'right' }}>Output</th>
                <th>HQ</th>
              </tr>
            </thead>
            <tbody>
              {filteredPortfolios.map((p) => {
                const t = portfolioTotals(p)
                const active = p.id === selectedPortfolioId
                return (
                  <tr
                    key={p.id}
                    onClick={() => {
                      setSelectedPortfolioId(p.id)
                      setSelectedAsset(null)
                      setStateFilter(p.stateAbbr)
                    }}
                    style={{
                      cursor: 'pointer',
                      background: active ? 'var(--fill)' : undefined,
                    }}
                  >
                    <td className="mono" style={{ fontWeight: 600, color: 'var(--highlight)' }}>
                      {p.stateAbbr}
                    </td>
                    <td style={{ color: 'var(--highlight)', fontWeight: 600 }}>{p.short}</td>
                    <td>
                      <Badge>{p.kind}</Badge>
                    </td>
                    <td className="muted">{p.sector}</td>
                    <td className="num">{p.assets.length}</td>
                    <td className="num">{(t.capacityMw / 1000).toFixed(2)} GW</td>
                    <td className="num">{(t.outputMw / 1000).toFixed(2)} GW</td>
                    <td className="muted">{p.hq}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <hr className="rule" />

      <section className="block">
        <p className="kicker">Assets</p>
        <h2 className="page-h2">Location output table</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Site</th>
                <th>State</th>
                <th>Portfolio</th>
                <th>Tech</th>
                <th style={{ textAlign: 'right' }}>MW cap</th>
                <th style={{ textAlign: 'right' }}>MW out</th>
                <th>Lat</th>
                <th>Lon</th>
                <th>Region</th>
              </tr>
            </thead>
            <tbody>
              {assets.slice(0, 200).map((a) => (
                <tr
                  key={a.id}
                  onClick={() => onSelectAsset(a)}
                  style={{
                    cursor: 'pointer',
                    background: selectedAsset?.id === a.id ? 'var(--fill)' : undefined,
                  }}
                >
                  <td style={{ color: 'var(--highlight)', fontWeight: 500 }}>{a.name}</td>
                  <td className="mono">{a.stateAbbr}</td>
                  <td>{a.portfolioShort}</td>
                  <td>{TECH_LABELS[a.technology]}</td>
                  <td className="num">{a.capacityMw.toLocaleString()}</td>
                  <td className="num">{a.outputMw.toLocaleString()}</td>
                  <td className="mono muted">{a.latitude.toFixed(3)}</td>
                  <td className="mono muted">{a.longitude.toFixed(3)}</td>
                  <td className="muted">{a.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {assets.length > 200 && (
          <p className="muted" style={{ marginTop: 8, fontSize: '0.8rem' }}>
            Showing first 200 of {assets.length} assets. Narrow state or tech filters for the full
            set.
          </p>
        )}
      </section>

      <p className="footer-line">
        Portfolios · 50 states + PR · CA detail LSEs · other states from EIA-scale capacity totals ·
        replace with CEC QFER / EIA-860 / LSE IRP feeds
      </p>
    </div>
  )
}
