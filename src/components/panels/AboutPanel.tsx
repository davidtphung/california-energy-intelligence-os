/**
 * About · how EIS works, sources, and donate (aligned with starlinkatlas About/Donate).
 */

import { useState } from 'react'
import { CRYPTO_METHODS, VENMO } from '../../data/donate'
import { useApp } from '../../context/AppContext'
import { navigate, onSameOriginClick } from '../../seo/navigate'
import { aboutTabFromPath, type AboutTab } from '../../seo/pages'

function CopyAddress({ address, label }: { address: string; label: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* ignore */
    }
  }
  return (
    <div className="donate-address-row">
      <code className="donate-address" title={address}>
        {address}
      </code>
      <button type="button" className="btn btn-sm" onClick={() => void copy()} aria-label={`Copy ${label} address`}>
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

export function AboutPanel() {
  const { pathname } = useApp()
  const tab = aboutTabFromPath(pathname)

  const goTab = (id: AboutTab) => {
    navigate(id === 'about' ? '/about' : `/about/${id}`)
  }

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
            ['donate', 'Donate'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? 'is-on' : ''}
            onClick={() => goTab(id)}
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
            electrical metrics, demand drivers (AI data centers, population, industrial),
            generation construction, ISO/utility structure, and projected firm-capacity balance.
            Supporting tabs cover states, plant portfolios, fossil fuels, and thesis papers.
          </p>
          <p className="sub" style={{ maxWidth: '40rem' }}>
            Figures are educational samples scaled to EIA / ISO / operator public ranges, not a
            substitute for official filings, real-time SCADA, or your utility&apos;s IRP.
          </p>
          <div className="btn-row" style={{ marginTop: '1rem' }}>
            <a href="/map" className="btn btn-primary btn-sm" onClick={onSameOriginClick}>
              Open Map
            </a>
            <button type="button" className="btn btn-sm" onClick={() => goTab('how')}>
              How it works
            </button>
            <button type="button" className="btn btn-sm" onClick={() => goTab('sources')}>
              Sources
            </button>
            <button type="button" className="btn btn-sm" onClick={() => goTab('donate')}>
              Donate
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
              <strong>Map first.</strong> Start on Map. Lenses: Live grid, Demand, All sources,
              Grid / utilities, Construction, Future deficits.
            </li>
            <li>
              <strong>Demand.</strong> Primary Demand tab (also a map lens). AI / data-center peak,
              population growth, and industrial manufacturing by state, plus private vs public
              capital ($B sample path). Stacked national charts and leader table.
            </li>
            <li>
              <strong>Balance / All sources.</strong> Production, firm contribution, demand, and
              deficits for gas, coal, nuclear, oil, solar, wind, hydro, battery, geothermal, and
              biomass. Timelines 2025-2040 tied to the same AI / population / industrial drivers.
            </li>
            <li>
              <strong>Click to focus.</strong> Nodes, states, projects open a side drawer with
              metrics. Catalogs stay map-centric.
            </li>
            <li>
              <strong>Live grid.</strong> Simulated stream: load, generation, voltage, current,
              density, storage SOC, alerts.
            </li>
            <li>
              <strong>Grid / risk.</strong> Eastern / Western / Texas interconnects, ISO/utility
              footprints, interties, how much each state buys (TWh), and a composite dependence
              risk (import share, isolation, AI load, fuel mix). Construction and Future deficits
              remain separate lenses.
            </li>
            <li>
              <strong>USA / Assets / Fuels / Thesis.</strong> State catalog, multi-tech plants,
              hydrocarbon history, Got Gas and related papers. Policy is at /policy and scenarios are at
              /scenarios. Older hashes #usa, #assets, and #fuels open USA, Assets, and Fuels.
            </li>
            <li>
              <strong>Export.</strong> CSV/JSON from map tools and catalogs.
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
            Data are composite educational samples plus live CAISO pulls where wired. Primary
            reference families and how often EIS updates:
          </p>
          <div className="table-wrap" style={{ marginTop: '1rem' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Feed</th>
                  <th>Update rate now</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Map stream (national graph)</td>
                  <td>Every 0.8 s (simulated)</td>
                  <td>Client sample path · not SCADA</td>
                </tr>
                <tr>
                  <td>CAISO Today&apos;s Outlook</td>
                  <td>Every 15 s when tab open · 90 s when hidden · edge ≤10 s</td>
                  <td>CAISO public CSV via /api/live/caiso</td>
                </tr>
                <tr>
                  <td>CA weather (Open-Meteo)</td>
                  <td>Same pull cycle as CAISO</td>
                  <td>open-meteo.com</td>
                </tr>
                <tr>
                  <td>EIA CISO hourly</td>
                  <td>Same cycle if VITE_EIA_API_KEY set</td>
                  <td>EIA Open Data</td>
                </tr>
                <tr>
                  <td>Demand / Balance / USA / Assets / Fuels / Thesis</td>
                  <td>On deploy only (static catalog)</td>
                  <td>Sample models scaled to public ranges</td>
                </tr>
              </tbody>
            </table>
          </div>
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
                  <td>Live map stream + CAISO real load badge</td>
                </tr>
                <tr>
                  <td>Grid structure</td>
                  <td>NERC, FERC, ISO/RTO about pages, EIA-861 utility lists</td>
                  <td>Interconnect / zone / utility schematic map</td>
                </tr>
                <tr>
                  <td>Demand outlook</td>
                  <td>EIA AEO, NREL, ISO load forecasts, IRPs</td>
                  <td>Demand + Balance all-source map (sample path)</td>
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
                  <td>Policy hash route</td>
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
            . Crawlers can also read <a href="/llms.txt">/llms.txt</a> and{' '}
            <a href="/api/key-figures">/api/key-figures</a>.
          </p>
        </section>
      )}

      {tab === 'donate' && (
        <section className="block about-section donate-section">
          <p className="kicker">Support</p>
          <h2 className="page-h2">Support Energy Intelligence System</h2>
          <p className="sub" style={{ maxWidth: '36rem' }}>
            Independent energy software. No ads, no paywalls, no corporate sponsors, no user
            tracking. Your contribution funds development, data, and hosting.
          </p>

          <p className="kicker" style={{ marginTop: '1.25rem' }}>
            Donation methods
          </p>

          <a
            className="donate-method-card"
            href={VENMO.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="donate-method-badge" aria-hidden>
              V
            </span>
            <span className="donate-method-body">
              <strong>Venmo</strong>
              <span className="muted">{VENMO.handle}</span>
            </span>
            <span className="donate-method-ext muted" aria-hidden>
              ↗
            </span>
          </a>

          <div className="donate-crypto-list">
            {CRYPTO_METHODS.map((m) => (
              <div key={m.key} className="donate-crypto-card">
                <div className="donate-crypto-head">
                  <strong>{m.name}</strong>
                  <span className="muted">{m.network}</span>
                </div>
                <CopyAddress address={m.address} label={m.name} />
              </div>
            ))}
          </div>

          <div className="donate-important">
            <p className="kicker">Important</p>
            <ul className="about-steps" style={{ listStyle: 'disc', paddingLeft: '1.25rem' }}>
              <li>Donations are voluntary and non-refundable.</li>
              <li>
                Crypto transactions are irreversible. Please double-check every address before
                sending.
              </li>
              <li>This is not a 501(c)(3) nonprofit. Contributions are not tax deductible.</li>
            </ul>
          </div>

          <p className="footer-line" style={{ marginTop: '1.25rem' }}>
            Questions or feedback?{' '}
            <a href="https://x.com/davidtphung" target="_blank" rel="noopener noreferrer">
              @davidtphung
            </a>{' '}
            on X.
          </p>
        </section>
      )}
    </div>
  )
}
