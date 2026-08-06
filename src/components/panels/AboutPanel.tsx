/**
 * About · how EIS works and data sources.
 */

import { useState } from 'react'
import { useApp } from '../../context/AppContext'

type AboutTab = 'about' | 'how' | 'sources'

export function AboutPanel() {
  const { setView } = useApp()
  const [tab, setTab] = useState<AboutTab>('about')

  return (
    <div id="about" className="about-panel fadein t1">
      <header className="mapcentric-head">
        <div>
          <p className="kicker">About</p>
          <h1 className="page-h2" style={{ marginBottom: 4 }}>
            Energy Intelligence System
          </h1>
          <p className="mapcentric-lede">
            Map-first tools for US electricity: live grid metrics, construction pipelines, utility
            footprints, future balance, assets, fuels, and policy.
          </p>
        </div>
      </header>

      <div className="gmap-mode" role="tablist" aria-label="About sections" style={{ marginBottom: '1rem' }}>
        {(
          [
            ['about', 'About'],
            ['how', 'How it works'],
            ['sources', 'Sources'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? 'is-on' : ''}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'about' && (
        <section className="block about-section">
          <h2 className="page-h2">What this is</h2>
          <p className="sub" style={{ maxWidth: '40rem' }}>
            EIS is a browser-based energy intelligence workspace. The Map is the center: live
            electrical metrics, generation construction, ISO/utility structure, and projected
            demand vs firm supply. Supporting tabs cover states, plant portfolios, fossil fuels,
            policy history, and scenarios.
          </p>
          <p className="sub" style={{ maxWidth: '40rem' }}>
            Figures are educational samples scaled to EIA / ISO / operator public ranges—not a
            substitute for official filings, real-time SCADA, or your utility&apos;s IRP.
          </p>
          <div className="btn-row" style={{ marginTop: '1rem' }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setView('map')
                window.history.replaceState(null, '', '#map')
              }}
            >
              Open Map
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setTab('how')}
            >
              How it works
            </button>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => setTab('sources')}
            >
              Sources
            </button>
          </div>
          <p className="footer-line" style={{ marginTop: '1.5rem' }}>
            Built by{' '}
            <a href="https://x.com/davidtphung" target="_blank" rel="noopener noreferrer">
              David T Phung
            </a>
            {' · '}
            <a href="https://eis.davidtphung.com" target="_blank" rel="noopener noreferrer">
              eis.davidtphung.com
            </a>
          </p>
        </section>
      )}

      {tab === 'how' && (
        <section className="block about-section">
          <h2 className="page-h2">How it works</h2>
          <ol className="about-steps">
            <li>
              <strong>Map first.</strong> Start on Map. Lenses switch context without leaving the
              spatial view: Live grid, Grid / utilities, Construction, Future balance.
            </li>
            <li>
              <strong>Click to focus.</strong> Nodes, states, projects, and zones open a side drawer
              with metrics. Tables and long catalogs sit under expandable sections so the map stays
              primary.
            </li>
            <li>
              <strong>Live grid lens.</strong> A simulated stream updates load, generation, voltage,
              current, density, storage SOC, and alerts on a US hub graph. Modes include live,
              historical scrub, and short-range forecast samples.
            </li>
            <li>
              <strong>Grid / utilities.</strong> Shows Eastern, Western, and Texas interconnections,
              ISO/RTO-style footprints, utility companies, multi-zone overlaps, and intertie/seam
              links (schematic, not legal GIS).
            </li>
            <li>
              <strong>Construction.</strong> Flagship generation and storage projects under build or
              late pipeline—filter by tech and status; size encodes MW.
            </li>
            <li>
              <strong>Future balance.</strong> State-level peak demand vs firm supply trajectories
              (2025–2045 sample path) with deficit/surplus coloring and intelligence copy.
            </li>
            <li>
              <strong>USA / Assets / Fuels / Policy / Scenario.</strong> National catalog, multi-tech
              plant portfolios, hydrocarbon history, energy law stack, and pathway scenarios.
            </li>
            <li>
              <strong>Export.</strong> CSV/JSON from map tools and catalog panels for offline use.
            </li>
          </ol>
          <p className="sub" style={{ maxWidth: '40rem', marginTop: '1rem' }}>
            Dark mode and reduced-motion preferences are respected. Role views (analyst / operator /
            executive) change KPI density on the live map, not access control.
          </p>
        </section>
      )}

      {tab === 'sources' && (
        <section className="block about-section">
          <h2 className="page-h2">Sources &amp; methods</h2>
          <p className="sub" style={{ maxWidth: '40rem' }}>
            Data are composite educational samples. Production should wire live APIs and official
            series. Primary reference families:
          </p>
          <div className="table-wrap" style={{ marginTop: '1rem' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Reference sources</th>
                  <th>In this app</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Generation &amp; capacity</td>
                  <td>EIA-860 / 860m, EIA Electric Power Monthly, plant operator reports</td>
                  <td>State fleets, construction map, portfolios</td>
                </tr>
                <tr>
                  <td>Operations &amp; markets</td>
                  <td>CAISO OASIS, ERCOT, PJM, MISO, SPP, NYISO, ISO-NE public dashboards</td>
                  <td>Live grid simulation; optional live CAISO hooks</td>
                </tr>
                <tr>
                  <td>Grid structure</td>
                  <td>NERC, FERC, ISO/RTO about pages, EIA-861 utility lists</td>
                  <td>Interconnect / zone / utility schematic map</td>
                </tr>
                <tr>
                  <td>Demand outlook</td>
                  <td>EIA AEO, NREL, ISO load forecasts, IRPs</td>
                  <td>Future balance trajectories (sample path)</td>
                </tr>
                <tr>
                  <td>Fossil / fuels</td>
                  <td>EIA petroleum, natural gas, coal historical series</td>
                  <td>Fuels tab annual series</td>
                </tr>
                <tr>
                  <td>Hydro &amp; plants</td>
                  <td>USACE, USBR, TVA, BPA, EIA plant inventory</td>
                  <td>Major plant catalogs</td>
                </tr>
                <tr>
                  <td>Policy</td>
                  <td>Federal statutes, FERC, state PUCs, local ordinances (summaries)</td>
                  <td>Policy tab hierarchical timeline</td>
                </tr>
                <tr>
                  <td>Trade / transfers</td>
                  <td>EIA state-to-state electricity, intertie public ratings</td>
                  <td>USA trade samples; intertie MW samples</td>
                </tr>
              </tbody>
            </table>
          </div>
          <h3 className="page-h2" style={{ fontSize: '1.05rem', marginTop: '1.25rem' }}>
            Limitations
          </h3>
          <ul className="about-steps" style={{ listStyle: 'disc', paddingLeft: '1.25rem' }}>
            <li>Not real-time SCADA or billing-grade metering.</li>
            <li>Zone blobs and utility dots are approximate, not service-territory polygons.</li>
            <li>Construction COD years and MW are public-scale samples; queues change weekly.</li>
            <li>Future deficit/surplus is a stylized firm-capacity path, not an IRP case.</li>
          </ul>
          <p className="sub" style={{ maxWidth: '40rem', marginTop: '1rem' }}>
            Official portals:{' '}
            <a href="https://www.eia.gov" target="_blank" rel="noopener noreferrer">
              eia.gov
            </a>
            {' · '}
            <a href="https://www.caiso.com" target="_blank" rel="noopener noreferrer">
              caiso.com
            </a>
            {' · '}
            <a href="https://www.ferc.gov" target="_blank" rel="noopener noreferrer">
              ferc.gov
            </a>
            {' · '}
            <a href="https://www.nerc.com" target="_blank" rel="noopener noreferrer">
              nerc.com
            </a>
          </p>
        </section>
      )}
    </div>
  )
}
