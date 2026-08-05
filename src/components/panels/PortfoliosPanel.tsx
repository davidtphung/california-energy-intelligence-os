import { useMemo, useState } from 'react'
import {
  PORTFOLIOS,
  PORTFOLIO_KINDS,
  PORTFOLIO_STATE_ABBRS,
  allAssets,
  portfolioTotals,
  regionRollup,
  stateRollup,
  techCapacityRollup,
  type EnergyPortfolio,
  type PortfolioAsset,
} from '../../data/portfolios'
import {
  US_ENERGY_PLANTS,
  energyPlantTotals,
  plantTechTotals,
  plantsByOperator,
  plantsByState,
  type UsEnergyPlant,
} from '../../data/usEnergyPlants'
import { US_STATES } from '../../data/usStates'
import { PortfolioLocationMap } from '../charts/PortfolioLocationMap'
import { Badge } from '../ui/Badge'
import { Select } from '../ui/Select'
import { Input } from '../ui/Input'
import { TECH_COLORS, TECH_LABELS, TECH_ORDER } from '../../lib/utils'
import type { PortfolioKind, Technology } from '../../types'
import { useApp } from '../../context/AppContext'
import { exportCsv } from '../../lib/utils'
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
      if (stateFilter !== 'all') {
        const inState =
          p.stateAbbr === stateFilter || p.assets.some((a) => a.stateAbbr === stateFilter)
        if (!inState) return false
      }
      const q = query.toLowerCase()
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.short.toLowerCase().includes(q) ||
        p.stateName.toLowerCase().includes(q) ||
        p.stateAbbr.toLowerCase().includes(q) ||
        p.notes.toLowerCase().includes(q) ||
        p.assets.some(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.county.toLowerCase().includes(q) ||
            a.stateAbbr.toLowerCase().includes(q)
        )
      )
    })
  }, [kindFilter, stateFilter, query])

  const plantAll = useMemo(() => energyPlantTotals(), [])
  const plantTechRows = useMemo(() => plantTechTotals(), [])
  const plantStateRows = useMemo(() => plantsByState(), [])
  const plantOps = useMemo(() => plantsByOperator().slice(0, 12), [])

  const filteredPlants = useMemo(() => {
    let list = [...US_ENERGY_PLANTS]
    if (stateFilter !== 'all') list = list.filter((p) => p.stateAbbr === stateFilter)
    if (techFilter !== 'all') list = list.filter((p) => p.technology === techFilter)
    const q = query.toLowerCase()
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.operator.toLowerCase().includes(q) ||
          p.detail.toLowerCase().includes(q) ||
          p.stateName.toLowerCase().includes(q) ||
          p.stateAbbr.toLowerCase().includes(q) ||
          TECH_LABELS[p.technology].toLowerCase().includes(q)
      )
    }
    return list.sort((a, b) => b.capacityMw - a.capacityMw)
  }, [stateFilter, query, techFilter])

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
  const byTech = useMemo(() => techCapacityRollup(assets), [assets])

  const totals = useMemo(() => {
    const capacityMw = assets.reduce((s, a) => s + a.capacityMw, 0)
    const outputMw = assets.reduce((s, a) => s + Math.max(0, a.outputMw), 0)
    const chargeMw = assets.reduce((s, a) => s + (a.outputMw < 0 ? -a.outputMw : 0), 0)
    const states = new Set(filteredPortfolios.map((p) => p.stateAbbr)).size
    const techs = new Set(assets.map((a) => a.technology)).size
    return {
      capacityMw,
      outputMw,
      chargeMw,
      count: assets.length,
      portfolios: filteredPortfolios.length,
      states,
      techs,
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

  const techFlow = byTech.slice(0, 8)
  const techFlowSum = techFlow.reduce((s, r) => s + r.capacityMw, 0) || 1

  return (
    <div id="portfolios" className="mapcentric fadein t1">
      <header className="mapcentric-head">
        <div>
          <p className="kicker">Assets · map first</p>
          <h1 className="page-h2" style={{ marginBottom: 4 }}>
            Portfolio map
          </h1>
          <p className="mapcentric-lede">
            Plants and fleets on the map. Click a site — capacity, tech, and portfolio data flow into
            the drawer. Lines show selected portfolio connections.
          </p>
        </div>
        <div className="mapcentric-kpis">
          <div className="mapcentric-kpi">
            <span>Assets</span>
            <strong>{totals.count}</strong>
          </div>
          <div className="mapcentric-kpi">
            <span>Capacity</span>
            <strong>
              {(totals.capacityMw / 1000).toFixed(0)}
              <em>GW</em>
            </strong>
          </div>
          <div className="mapcentric-kpi">
            <span>Sources</span>
            <strong>{totals.techs}</strong>
          </div>
          <div className="mapcentric-kpi">
            <span>Plants</span>
            <strong>{plantAll.count}</strong>
          </div>
        </div>
      </header>

      <div className="state-chip-row" style={{ marginBottom: '0.5rem' }}>
        <button
          type="button"
          className={`state-chip${techFilter === 'all' ? ' is-on' : ''}`}
          onClick={() => {
            setTechFilter('all')
            setSelectedPortfolioId('all')
            setSelectedAsset(null)
          }}
        >
          All sources
        </button>
        {TECH_ORDER.map((t) => (
          <button
            key={t}
            type="button"
            className={`state-chip${techFilter === t ? ' is-on' : ''}`}
            onClick={() => {
              setTechFilter(t)
              setSelectedPortfolioId('all')
              setSelectedAsset(null)
            }}
          >
            <i
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: 2,
                background: TECH_COLORS[t],
                marginRight: 6,
                verticalAlign: 'middle',
              }}
            />
            {TECH_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="mapcentric-filters">
        <Input
          placeholder="Search plant, portfolio, state…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search portfolios"
          style={{ minWidth: '10rem' }}
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
                })),
                'us-portfolio-assets.csv'
              )
            }
          >
            CSV
          </Button>
        </div>
      </div>

      <div
        className={`mapcentric-stage${selectedAsset || selectedPortfolio ? ' has-drawer' : ''}`}
      >
        <div className="mapcentric-map">
          <PortfolioLocationMap
            portfolios={filteredPortfolios}
            selectedPortfolioId={selectedPortfolioId}
            selectedAssetId={selectedAsset?.id ?? null}
            techFilter={techFilter}
            stateFilter={stateFilter}
            large
            onSelectAsset={onSelectAsset}
          />
          {/* Capacity stack under map — visual data flow by tech */}
          {techFlow.length > 0 && (
            <div className="mapcentric-under">
              <p className="kicker">Capacity on map</p>
              <div className="mapcentric-flowbar" aria-hidden>
                {techFlow.map((r) => (
                  <div
                    key={r.technology}
                    style={{
                      width: `${(r.capacityMw / techFlowSum) * 100}%`,
                      background: TECH_COLORS[r.technology],
                    }}
                    title={`${TECH_LABELS[r.technology]}: ${(r.capacityMw / 1000).toFixed(1)} GW`}
                  />
                ))}
              </div>
              <ul className="mapcentric-flowlist mapcentric-flowlist-inline">
                {techFlow.map((r) => (
                  <li key={r.technology}>
                    <button
                      type="button"
                      className="linkish"
                      onClick={() => setTechFilter(r.technology)}
                    >
                      <i style={{ background: TECH_COLORS[r.technology] }} />
                      {TECH_LABELS[r.technology]}{' '}
                      <span className="mono">{(r.capacityMw / 1000).toFixed(1)} GW</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {(selectedAsset || selectedPortfolio || stateFilter !== 'all') && (
          <aside className="mapcentric-drawer" aria-label="Asset data from map">
            <p className="kicker">From map</p>
            <h2 className="page-h2" style={{ fontSize: '1.15rem' }}>
              {selectedAsset
                ? selectedAsset.name
                : selectedPortfolio
                  ? selectedPortfolio.name
                  : `${US_STATES.find((s) => s.abbr === stateFilter)?.name ?? stateFilter}`}
            </h2>

            {selectedAsset ? (
              <>
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
                          {selectedAsset.stateAbbr}
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Portfolio</th>
                      <td>{selectedAsset.portfolioShort}</td>
                    </tr>
                    <tr>
                      <th scope="row">Tech</th>
                      <td>
                        <i
                          style={{
                            display: 'inline-block',
                            width: 8,
                            height: 8,
                            borderRadius: 2,
                            background: TECH_COLORS[selectedAsset.technology],
                            marginRight: 6,
                          }}
                        />
                        {TECH_LABELS[selectedAsset.technology]}
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Capacity</th>
                      <td className="mono" style={{ color: 'var(--highlight)' }}>
                        {selectedAsset.capacityMw.toLocaleString()} MW
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Output</th>
                      <td className="mono">
                        {selectedAsset.outputMw.toLocaleString()} MW
                        {selectedAsset.outputMw < 0 ? ' charge' : ''}
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Coords</th>
                      <td className="mono">
                        {selectedAsset.latitude.toFixed(3)}°,{' '}
                        {Math.abs(selectedAsset.longitude).toFixed(3)}°W
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
                <Button size="sm" style={{ marginTop: 8 }} onClick={() => setSelectedAsset(null)}>
                  Clear site
                </Button>
              </>
            ) : selectedPortfolio ? (
              <>
                <p className="sub" style={{ maxWidth: 'none', fontSize: '0.82rem' }}>
                  {selectedPortfolio.notes}
                </p>
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
                          {selectedPortfolio.stateAbbr}
                        </button>
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Kind</th>
                      <td>
                        <Badge>{selectedPortfolio.kind}</Badge>
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Capacity</th>
                      <td className="mono" style={{ color: 'var(--highlight)' }}>
                        {(portfolioTotals(selectedPortfolio).capacityMw / 1000).toFixed(2)} GW
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Output</th>
                      <td className="mono">
                        {(portfolioTotals(selectedPortfolio).outputMw / 1000).toFixed(2)} GW
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">Sites</th>
                      <td className="mono">{selectedPortfolio.assets.length}</td>
                    </tr>
                  </tbody>
                </table>
              </>
            ) : (
              <p className="sub" style={{ maxWidth: 'none' }}>
                Click a map marker to stream site data here. Filter state or tech above to focus.
              </p>
            )}

            {regions.length > 0 && (
              <>
                <p className="kicker" style={{ marginTop: 14 }}>
                  Region rollup
                </p>
                <table className="list-table">
                  <tbody>
                    {regions.slice(0, 8).map((r) => (
                      <tr key={r.region}>
                        <th scope="row">{r.region}</th>
                        <td className="mono" style={{ fontSize: '0.75rem' }}>
                          {(r.capacityMw / 1000).toFixed(1)} GW · {r.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </aside>
        )}
      </div>

      <details className="mapcentric-details">
        <summary>
          Plants · portfolios · tables ({filteredPlants.length} plants · {filteredPortfolios.length}{' '}
          portfolios)
        </summary>
      <div className="mapcentric-details-body">

      {/* Capacity by technology in current filter */}
      <section className="block">
        <p className="kicker">Sources · filter stack</p>
        <h2 className="page-h2">Capacity by energy source</h2>
        <p className="sub">
          Nameplate in the current portfolio filter (state fleets + CA LSEs + major plant catalogs).
          Full mix — coal through storage.
        </p>
        {byTech.length > 0 ? (
          <>
            <div className="state-stack-bar" style={{ height: 14, marginBottom: 10 }} aria-hidden>
              {byTech.map((r) => {
                const pct = totals.capacityMw ? (r.capacityMw / totals.capacityMw) * 100 : 0
                return (
                  <div
                    key={r.technology}
                    className="state-stack-seg"
                    style={{ width: `${pct}%`, background: TECH_COLORS[r.technology] }}
                    title={`${TECH_LABELS[r.technology]}: ${(r.capacityMw / 1000).toFixed(1)} GW`}
                  />
                )
              })}
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th style={{ textAlign: 'right' }}>Sites</th>
                    <th style={{ textAlign: 'right' }}>Capacity</th>
                    <th style={{ textAlign: 'right' }}>Share</th>
                    <th style={{ textAlign: 'right' }}>Sample out</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {byTech.map((r) => {
                    const pct = totals.capacityMw
                      ? (r.capacityMw / totals.capacityMw) * 100
                      : 0
                    return (
                      <tr
                        key={r.technology}
                        style={{
                          cursor: 'pointer',
                          background: techFilter === r.technology ? 'var(--fill)' : undefined,
                        }}
                        onClick={() => {
                          setTechFilter(r.technology)
                          setSelectedPortfolioId('all')
                          setSelectedAsset(null)
                        }}
                      >
                        <td style={{ fontWeight: 600, color: 'var(--highlight)' }}>
                          <i
                            style={{
                              display: 'inline-block',
                              width: 10,
                              height: 10,
                              borderRadius: 2,
                              background: TECH_COLORS[r.technology],
                              marginRight: 8,
                              verticalAlign: 'middle',
                            }}
                          />
                          {TECH_LABELS[r.technology]}
                        </td>
                        <td className="num">{r.count}</td>
                        <td className="num">{(r.capacityMw / 1000).toFixed(1)} GW</td>
                        <td className="num">{pct.toFixed(1)}%</td>
                        <td className="num">{(r.outputMw / 1000).toFixed(1)} GW</td>
                        <td>
                          <button type="button" className="linkish">
                            Filter
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="muted">No assets in filter.</p>
        )}
      </section>

      <hr className="rule" />

      {/* National multi-tech plant catalog */}
      <section className="block" id="us-plants">
        <p className="kicker">United States · major plants</p>
        <h2 className="page-h2">
          {techFilter === 'all'
            ? 'Every energy source · flagship plants'
            : `${TECH_LABELS[techFilter]} · major plants`}
        </h2>
        <p className="sub">
          {plantAll.count} mapped flagship sites · {plantAll.capacityGw.toFixed(1)} GW nameplate
          sample across {plantAll.techCount} technologies and {plantAll.states} states. Includes
          Palo Verde, Vogtle, Scherer, West County, Grand Coulee, Alta, Moss Landing BESS, The
          Geysers, and more. EIA-scale samples for map UX.
        </p>

        <div className="grid-2" style={{ marginBottom: '1rem' }}>
          <div>
            <p className="kicker">By technology (major catalog)</p>
            <ol className="ov-rank-list">
              {plantTechRows.map((s, i) => (
                <li key={s.technology}>
                  <button
                    type="button"
                    className="ov-rank-btn"
                    onClick={() => {
                      setTechFilter(s.technology)
                      setSelectedPortfolioId('all')
                      setSelectedAsset(null)
                    }}
                  >
                    <span className="mono muted">{i + 1}</span>
                    <span className="ov-rank-name">
                      <i
                        style={{
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          borderRadius: 2,
                          background: TECH_COLORS[s.technology],
                          marginRight: 6,
                        }}
                      />
                      <strong>{TECH_LABELS[s.technology]}</strong>
                    </span>
                    <span className="mono">
                      {(s.capacityMw / 1000).toFixed(1)} GW · {s.count}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <p className="kicker">By state · top plant capacity</p>
            <ol className="ov-rank-list">
              {plantStateRows.slice(0, 10).map((s, i) => (
                <li key={s.stateAbbr}>
                  <button
                    type="button"
                    className="ov-rank-btn"
                    onClick={() => pickState(s.stateAbbr)}
                  >
                    <span className="mono muted">{i + 1}</span>
                    <span className="ov-rank-name">
                      <strong>{s.stateAbbr}</strong> {s.stateName}
                    </span>
                    <span className="mono">
                      {(s.capacityMw / 1000).toFixed(1)} GW · {s.count}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
            <p className="kicker" style={{ marginTop: '1rem' }}>
              By operator (top capacity)
            </p>
            <ol className="ov-rank-list">
              {plantOps.map((o, i) => (
                <li key={o.operator}>
                  <button
                    type="button"
                    className="ov-rank-btn"
                    onClick={() => setQuery(o.operator)}
                  >
                    <span className="mono muted">{i + 1}</span>
                    <span className="ov-rank-name">
                      <strong>{o.operator}</strong>
                    </span>
                    <span className="mono">
                      {(o.capacityMw / 1000).toFixed(1)} GW · {o.count}
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="table-wrap" style={{ maxHeight: '32rem', overflow: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Plant</th>
                <th>Tech</th>
                <th>State</th>
                <th>Operator</th>
                <th>Detail</th>
                <th style={{ textAlign: 'right' }}>MW cap</th>
                <th style={{ textAlign: 'right' }}>MW out</th>
                <th>Online</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlants.map((p: UsEnergyPlant) => (
                <tr
                  key={p.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    pickState(p.stateAbbr)
                    setTechFilter(p.technology)
                    setQuery(p.name)
                    const match = allAssets(PORTFOLIOS).find((a) => a.id === p.id)
                    if (match) {
                      setSelectedAsset(match)
                      setSelectedPortfolioId(match.portfolioId)
                      setDrilldown(`asset:${p.id}`)
                    }
                  }}
                >
                  <td style={{ fontWeight: 600, color: 'var(--highlight)' }}>{p.name}</td>
                  <td>
                    <Badge>{TECH_LABELS[p.technology]}</Badge>
                  </td>
                  <td className="mono">{p.stateAbbr}</td>
                  <td className="muted">{p.operator}</td>
                  <td className="muted">{p.detail}</td>
                  <td className="num">{p.capacityMw.toLocaleString()}</td>
                  <td className="num">{p.outputMw.toLocaleString()}</td>
                  <td className="mono muted">{p.onlineYear}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredPlants.length === 0 && (
          <p className="muted" style={{ marginTop: 8 }}>
            No plants match the current filters. Clear tech or search.
          </p>
        )}
        {filteredPlants.length > 0 && (
          <p className="muted" style={{ marginTop: 8, fontSize: '0.72rem' }}>
            Showing {filteredPlants.length} plant
            {filteredPlants.length === 1 ? '' : 's'}
            {techFilter !== 'all' ? ` · ${TECH_LABELS[techFilter]}` : ' · all sources'}
            {stateFilter !== 'all' ? ` · ${stateFilter}` : ''}.
          </p>
        )}
      </section>

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

      </div>
      </details>

      <p className="footer-line">
        Assets · map-centric · data flows from selection · {plantAll.count} plants · EIA-860 samples
      </p>
    </div>
  )
}
