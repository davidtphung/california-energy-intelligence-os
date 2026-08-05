import { useMemo } from 'react'
import {
  US_STATES,
  fuelStack,
  rankOf,
  stateByAbbr,
  totals,
} from '../../data/usStates'
import { tradeOf } from '../../data/energyTrade'
import { useApp } from '../../context/AppContext'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { LiveGridPanel } from './LiveGridPanel'
import { CaliforniaTradeDetail } from '../charts/ImportExportChart'

export function StateDetailPanel() {
  const { selectedStateAbbr, openStateDetail, setView, setDrilldown } = useApp()

  const state = useMemo(
    () => (selectedStateAbbr ? stateByAbbr(selectedStateAbbr) : null) ?? US_STATES[0],
    [selectedStateAbbr]
  )

  const trade = tradeOf(state.abbr)
  const stack = fuelStack(state)
  const us = totals(US_STATES)

  const ranks = useMemo(
    () => ({
      capacity: rankOf(state.abbr, 'capacityGw'),
      clean: rankOf(state.abbr, 'cleanPct'),
      solar: rankOf(state.abbr, 'solarGw'),
      wind: rankOf(state.abbr, 'windGw'),
      nuclear: rankOf(state.abbr, 'nuclearGw'),
      storage: rankOf(state.abbr, 'storageGw'),
      peak: rankOf(state.abbr, 'peakGw'),
      gen: rankOf(state.abbr, 'generationTwh'),
    }),
    [state.abbr]
  )

  const peers = useMemo(
    () =>
      US_STATES.filter(
        (s) => s.abbr !== state.abbr && (s.region === state.region || s.grid === state.grid)
      )
        .sort((a, b) => b.capacityGw - a.capacityGw)
        .slice(0, 8),
    [state]
  )

  const neighbors = useMemo(() => {
    const names = new Set([...(trade?.importFrom ?? []), ...(trade?.exportTo ?? [])])
    return US_STATES.filter(
      (s) => names.has(s.abbr) || [...names].some((n) => n.includes(s.abbr))
    ).slice(0, 10)
  }, [trade])

  const goBack = () => {
    setView('overview')
    setDrilldown(null)
    window.history.replaceState(null, '', '#overview')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goCatalog = () => {
    setView('states')
    window.history.replaceState(null, '', '#states')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const net = trade ? trade.exportsTwh - trade.importsTwh : 0

  return (
    <div id="state-detail" className="fadein t1 state-detail">
      <div className="state-detail-nav">
        <Button size="sm" onClick={goBack}>
          Overview
        </Button>
        <Button size="sm" onClick={goCatalog}>
          USA catalog
        </Button>
        <span className="mono muted" style={{ fontSize: '0.75rem' }}>
          #{state.abbr}
        </span>
      </div>

      <div className="intro">
        <strong>
          {state.name}{' '}
          <span className="mono muted" style={{ fontWeight: 500, fontSize: '0.95rem' }}>
            {state.abbr}
          </span>
        </strong>
        <p>{state.note}</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
          <Badge variant="info">{state.region}</Badge>
          <Badge>{state.grid}</Badge>
          {state.abbr === 'CA' && <Badge variant="success">Live CAISO available</Badge>}
          {state.abbr === 'PR' && <Badge variant="warning">Territory</Badge>}
        </div>
      </div>

      <div className="metric-strip">
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Capacity</span>
          <span className="metric-value">
            {state.capacityGw}
            <span className="metric-unit">GW</span>
          </span>
          <span className="metric-hint">
            #{ranks.capacity.rank} of {ranks.capacity.of} states
          </span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Peak load</span>
          <span className="metric-value">
            {state.peakGw}
            <span className="metric-unit">GW</span>
          </span>
          <span className="metric-hint">
            #{ranks.peak.rank} · gen {state.generationTwh} TWh
          </span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Clean share</span>
          <span className="metric-value">
            {state.cleanPct}
            <span className="metric-unit">%</span>
          </span>
          <span className="metric-hint">
            #{ranks.clean.rank} · US avg {us.cleanAvg.toFixed(0)}%
          </span>
        </div>
        <div className="metric" style={{ cursor: 'default' }}>
          <span className="metric-label">Primary fuel</span>
          <span className="metric-value" style={{ fontSize: '1.05rem' }}>
            {state.primary}
          </span>
          <span className="metric-hint">then {state.secondary}</span>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: 'start' }}>
        <section className="block">
          <p className="kicker">Fleet</p>
          <h2 className="page-h2">All energy sources</h2>
          <p className="sub">
            Full nameplate mix: coal, gas, nuclear, hydro, wind, solar, and storage (not clean-only).
          </p>
          <div className="state-stack-bar" aria-hidden>
            {stack.map((p) => (
              <div
                key={p.key}
                className="state-stack-seg"
                style={{ width: `${Math.max(p.pct, p.gw > 0 ? 0.4 : 0)}%`, background: p.color }}
                title={`${p.key}: ${p.gw} GW (${p.pct.toFixed(1)}%)`}
              />
            ))}
          </div>
          <div className="state-stack-legend">
            {stack.map((p) => (
              <span key={p.key}>
                <i style={{ background: p.color }} />
                {p.key} {p.gw} GW
                <span className="muted"> ({p.pct.toFixed(0)}%)</span>
              </span>
            ))}
          </div>
          <table className="list-table" style={{ marginTop: '1rem' }}>
            <tbody>
              <tr>
                <th scope="row">Coal</th>
                <td className="mono">{state.coalGw} GW</td>
              </tr>
              <tr>
                <th scope="row">Natural gas</th>
                <td className="mono">{state.gasGw} GW</td>
              </tr>
              <tr>
                <th scope="row">Nuclear</th>
                <td className="mono">
                  {state.nuclearGw} GW · rank #{ranks.nuclear.rank}
                </td>
              </tr>
              <tr>
                <th scope="row">Hydro</th>
                <td className="mono">{state.hydroGw} GW</td>
              </tr>
              <tr>
                <th scope="row">Wind</th>
                <td className="mono">
                  {state.windGw} GW · rank #{ranks.wind.rank}
                </td>
              </tr>
              <tr>
                <th scope="row">Solar</th>
                <td className="mono">
                  {state.solarGw} GW · rank #{ranks.solar.rank}
                </td>
              </tr>
              <tr>
                <th scope="row">Storage</th>
                <td className="mono">
                  {state.storageGw} GW · rank #{ranks.storage.rank}
                </td>
              </tr>
              <tr>
                <th scope="row">Annual gen</th>
                <td className="mono">
                  {state.generationTwh} TWh · rank #{ranks.gen.rank}
                </td>
              </tr>
              <tr>
                <th scope="row">Primary / secondary</th>
                <td>
                  {state.primary} · {state.secondary}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="block">
          <p className="kicker">Trade</p>
          <h2 className="page-h2">Import and export</h2>
          {trade ? (
            <>
              <table className="list-table">
                <tbody>
                  <tr>
                    <th scope="row">Imports</th>
                    <td className="mono" style={{ color: 'var(--highlight)' }}>
                      {trade.importsTwh} TWh/yr
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Exports</th>
                    <td className="mono">{trade.exportsTwh} TWh/yr</td>
                  </tr>
                  <tr>
                    <th scope="row">Net export</th>
                    <td className="mono">
                      {net >= 0 ? '+' : ''}
                      {net} TWh ({net >= 0 ? 'exporter' : 'importer'})
                    </td>
                  </tr>
                  <tr>
                    <th scope="row">Import from</th>
                    <td>{trade.importFrom.join(' · ') || 'none listed'}</td>
                  </tr>
                  <tr>
                    <th scope="row">Export to</th>
                    <td>{trade.exportTo.join(' · ') || 'none listed'}</td>
                  </tr>
                </tbody>
              </table>
              <p className="sub" style={{ marginTop: 10 }}>
                {trade.note}
              </p>
            </>
          ) : (
            <p className="sub">No trade sample for this jurisdiction.</p>
          )}

          {neighbors.length > 0 && (
            <>
              <p className="kicker" style={{ marginTop: '1.15rem' }}>
                Trade partners on map
              </p>
              <div className="state-chip-row">
                {neighbors.map((n) => (
                  <button
                    key={n.abbr}
                    type="button"
                    className="state-chip"
                    onClick={() => openStateDetail(n.abbr)}
                  >
                    <span className="mono">{n.abbr}</span> {n.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <hr className="rule" />

      <section className="block">
        <p className="kicker">Peers</p>
        <h2 className="page-h2">
          Same region or grid
        </h2>
        <p className="sub">
          Other jurisdictions in {state.region} or {state.grid}. Open any for a full page.
        </p>
        <div className="state-chip-row">
          {peers.map((p) => (
            <button
              key={p.abbr}
              type="button"
              className="state-chip"
              onClick={() => openStateDetail(p.abbr)}
            >
              <span className="mono">{p.abbr}</span>
              <span>
                {p.name} · {p.capacityGw} GW · {p.cleanPct}% clean
              </span>
            </button>
          ))}
          {peers.length === 0 && <p className="muted">No peers listed.</p>}
        </div>
      </section>

      {state.abbr === 'CA' && (
        <>
          <hr className="rule" />
          <section className="block">
            <p className="kicker">California deep dive</p>
            <h2 className="page-h2">Live CAISO + trade detail</h2>
            <p className="sub">
              California is the home workspace with live ISO feeds and richer trade notes.
            </p>
            <LiveGridPanel />
            <div style={{ marginTop: '1.25rem' }}>
              <CaliforniaTradeDetail />
            </div>
          </section>
        </>
      )}

      <hr className="rule" />

      <section className="block">
        <p className="kicker">Browse</p>
        <h2 className="page-h2">Jump to any state</h2>
        <div className="state-abbr-grid">
          {US_STATES.map((s) => (
            <button
              key={s.abbr}
              type="button"
              className={`state-abbr-btn${s.abbr === state.abbr ? ' is-on' : ''}`}
              onClick={() => openStateDetail(s.abbr)}
              title={s.name}
            >
              {s.abbr}
            </button>
          ))}
        </div>
      </section>

      <p className="footer-line">
        State profile · EIA-scale sample ·{' '}
        <button type="button" className="linkish" onClick={goBack}>
          Overview
        </button>{' '}
        ·{' '}
        <button type="button" className="linkish" onClick={goCatalog}>
          USA catalog
        </button>
      </p>
    </div>
  )
}
