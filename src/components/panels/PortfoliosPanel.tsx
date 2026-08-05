import { useMemo, useState } from 'react'
import {
  PORTFOLIOS,
  PORTFOLIO_KINDS,
  allAssets,
  portfolioTotals,
  regionRollup,
  type EnergyPortfolio,
  type PortfolioAsset,
} from '../../data/portfolios'
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

export function PortfoliosPanel() {
  const { setDrilldown } = useApp()
  const [kindFilter, setKindFilter] = useState<PortfolioKind | 'all'>('all')
  const [techFilter, setTechFilter] = useState<Technology | 'all'>('all')
  const [query, setQuery] = useState('')
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | 'all'>('all')
  const [selectedAsset, setSelectedAsset] = useState<
    (PortfolioAsset & { portfolioId: string; portfolioShort: string }) | null
  >(null)

  const filteredPortfolios = useMemo(() => {
    return PORTFOLIOS.filter((p) => {
      if (kindFilter !== 'all' && p.kind !== kindFilter) return false
      const q = query.toLowerCase()
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q) ||
        p.short.toLowerCase().includes(q) ||
        p.notes.toLowerCase().includes(q) ||
        p.assets.some((a) => a.name.toLowerCase().includes(q) || a.county.toLowerCase().includes(q))
      )
    })
  }, [kindFilter, query])

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

  const totals = useMemo(() => {
    const capacityMw = assets.reduce((s, a) => s + a.capacityMw, 0)
    const outputMw = assets.reduce((s, a) => s + Math.max(0, a.outputMw), 0)
    const chargeMw = assets.reduce((s, a) => s + (a.outputMw < 0 ? -a.outputMw : 0), 0)
    return { capacityMw, outputMw, chargeMw, count: assets.length, portfolios: filteredPortfolios.length }
  }, [assets, filteredPortfolios])

  const onSelectAsset = (
    a: PortfolioAsset & { portfolioId: string; portfolioShort: string }
  ) => {
    setSelectedAsset(a)
    setSelectedPortfolioId(a.portfolioId)
    setDrilldown(`asset:${a.id}`)
  }

  return (
    <div id="portfolios" className="fadein t1">
      <div className="intro">
        <strong>Portfolios</strong>
        <p>
          California energy portfolios across IOUs, CCAs, munis, generators, hydro systems, and the
          CAISO footprint - with map location outputs for capacity and sample generation.
        </p>
      </div>

      <div className="metric-strip">
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Portfolios</span>
          <span className="metric-value">{totals.portfolios}</span>
          <span className="metric-hint">in current filter</span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Mapped assets</span>
          <span className="metric-value">{totals.count}</span>
          <span className="metric-hint">plants · storage · nodes</span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Nameplate</span>
          <span className="metric-value">
            {(totals.capacityMw / 1000).toFixed(1)}
            <span className="metric-unit">GW</span>
          </span>
          <span className="metric-hint">{totals.capacityMw.toLocaleString()} MW</span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Sample output</span>
          <span className="metric-value">
            {(totals.outputMw / 1000).toFixed(1)}
            <span className="metric-unit">GW</span>
          </span>
          <span className="metric-hint">
            gen · {totals.chargeMw.toLocaleString()} MW charging/load
          </span>
        </div>
      </div>

      <div className="filters">
        <Input
          placeholder="Search portfolio, plant, county…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search portfolios"
          style={{ minWidth: '12rem' }}
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
            ...filteredPortfolios.map((p) => ({ value: p.id, label: p.short })),
          ]}
        />
        <div className="btn-row" style={{ alignSelf: 'flex-end' }}>
          <Button
            size="sm"
            icon={<Download className="h-3.5 w-3.5" />}
            onClick={() =>
              exportCsv(
                assets.map((a) => ({
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
                'ca-portfolio-assets.csv'
              )
            }
          >
            Export CSV
          </Button>
          <Button
            size="sm"
            onClick={() => exportJson({ portfolios: filteredPortfolios, assets }, 'ca-portfolios.json')}
          >
            Export JSON
          </Button>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <section className="block">
          <p className="kicker">Map</p>
          <h2 className="page-h2">Location outputs</h2>
          <p className="sub">
            Click a site for capacity, sample output, and coordinates. Size scales with nameplate.
          </p>
          <PortfolioLocationMap
            portfolios={filteredPortfolios}
            selectedPortfolioId={selectedPortfolioId}
            selectedAssetId={selectedAsset?.id ?? null}
            techFilter={techFilter}
            onSelectAsset={onSelectAsset}
          />
        </section>

        <section className="block">
          <p className="kicker">Selection</p>
          <h2 className="page-h2">
            {selectedAsset ? selectedAsset.name : selectedPortfolio ? selectedPortfolio.name : 'All portfolios'}
          </h2>

          {selectedAsset ? (
            <div>
              <table className="list-table">
                <tbody>
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
              Select a portfolio from the list or click a map site. Filters cover IOU, CCA, muni,
              generator, hydro, and balancing nodes.
            </p>
          )}

          <p className="kicker" style={{ marginTop: '1.25rem' }}>
            Regional rollup
          </p>
          <table className="list-table">
            <tbody>
              {regions.map((r) => (
                <tr key={r.region}>
                  <th scope="row">{r.region}</th>
                  <td className="mono">
                    {(r.capacityMw / 1000).toFixed(1)} GW cap · {(r.outputMw / 1000).toFixed(1)} GW
                    out · {r.count} sites ·{' '}
                    {r.capacityMw ? Math.round((r.cleanMw / r.capacityMw) * 100) : 0}% clean cap
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <hr className="rule" />

      <section className="block">
        <p className="kicker">Catalog</p>
        <h2 className="page-h2">All portfolios</h2>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
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
                    }}
                    style={{
                      cursor: 'pointer',
                      background: active ? 'var(--fill)' : undefined,
                    }}
                  >
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
                <th>Portfolio</th>
                <th>Tech</th>
                <th style={{ textAlign: 'right' }}>MW cap</th>
                <th style={{ textAlign: 'right' }}>MW out</th>
                <th>Lat</th>
                <th>Lon</th>
                <th>Region</th>
                <th>County</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => onSelectAsset(a)}
                  style={{
                    cursor: 'pointer',
                    background: selectedAsset?.id === a.id ? 'var(--fill)' : undefined,
                  }}
                >
                  <td style={{ color: 'var(--highlight)', fontWeight: 500 }}>{a.name}</td>
                  <td>{a.portfolioShort}</td>
                  <td>{TECH_LABELS[a.technology]}</td>
                  <td className="num">{a.capacityMw.toLocaleString()}</td>
                  <td className="num">{a.outputMw.toLocaleString()}</td>
                  <td className="mono muted">{a.latitude.toFixed(3)}</td>
                  <td className="mono muted">{a.longitude.toFixed(3)}</td>
                  <td className="muted">{a.region}</td>
                  <td className="muted">{a.county}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="footer-line">
        Portfolios · sample registry for map UX · replace with CEC QFER / EIA-860 / LSE IRP feeds
      </p>
    </div>
  )
}
