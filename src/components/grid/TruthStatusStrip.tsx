/**
 * Always-visible truth-class chrome: LIVE / CATALOG / SCENARIO.
 * A visitor on #map should see what is measured, curated, or a planning path in ~5s.
 */

import { ageLabel } from '../../data/refreshRates'
import {
  SCENARIO_CHROME,
  SCENARIO_METHOD,
  failLoudNumber,
  type LiveFailMode,
} from '../../data/truthClasses'
import { STATE_CATALOG_AS_OF, STATE_CATALOG_SOURCE } from '../../data/usStates'
import { CONSTRUCTION_CITE_COUNTS } from '../../data/energyConstruction'
import { ENERGY_PLANT_CITE_COUNTS } from '../../data/usEnergyPlants'
import type { WeatherSnapshot } from '../../data/liveSources'

export function TruthStatusStrip({
  liveMode,
  caisoGw,
  lastOk,
  weather,
  liveError,
  lens = 'live',
}: {
  liveMode: LiveFailMode
  caisoGw: number | null
  lastOk: string | null
  weather?: WeatherSnapshot | null
  liveError?: string | null
  lens?: 'live' | 'demand' | 'sources' | 'grid' | 'build' | 'future'
}) {
  const liveText = failLoudNumber(caisoGw, { mode: liveMode, digits: 2, unit: 'GW' })
  const liveStamp = lastOk ? ageLabel(lastOk) : 'no timestamp'
  const weatherText =
    weather != null
      ? `Open-Meteo ${weather.tempC.toFixed(0)} C · ${weather.asOf}`
      : 'Open-Meteo error or skipped'

  const catalogLine = `Plants ${ENERGY_PLANT_CITE_COUNTS.cited}/${ENERGY_PLANT_CITE_COUNTS.total} cited · build ${CONSTRUCTION_CITE_COUNTS.cited}/${CONSTRUCTION_CITE_COUNTS.total} cited · states as of ${STATE_CATALOG_AS_OF}`

  const scenarioHint =
    lens === 'demand' || lens === 'sources' || lens === 'future'
      ? `${SCENARIO_CHROME} · ${SCENARIO_METHOD}`
      : lens === 'live'
        ? 'National graph is SAMPLE / PLANNING PATH. CAISO badge is LIVE when the CSV parses.'
        : lens === 'build'
          ? 'Construction is CATALOG. UNCITED rows stay on the map, labeled.'
          : 'Grid / risk is CATALOG schematic. Intertie use is a clocked sample.'

  return (
    <div className="truth-strip" role="status" aria-label="Truth classes">
      <div className={`truth-chip truth-live is-${liveMode}`}>
        <span className="truth-kicker">LIVE</span>
        <strong>CAISO {liveText}</strong>
        <span className="truth-meta">
          {liveStamp}
          {liveError ? ` · ${liveError}` : ''}
        </span>
        <span className="truth-meta">{weatherText}</span>
      </div>
      <div className="truth-chip truth-catalog">
        <span className="truth-kicker">CATALOG</span>
        <strong>Cited rows + vintage</strong>
        <span className="truth-meta">{catalogLine}</span>
        <span className="truth-meta">
          <a href={STATE_CATALOG_SOURCE.url} target="_blank" rel="noopener noreferrer">
            EIA state profiles
          </a>
          {' · '}
          <a href={STATE_CATALOG_SOURCE.epmUrl} target="_blank" rel="noopener noreferrer">
            EPM
          </a>
        </span>
      </div>
      <div className="truth-chip truth-scenario">
        <span className="truth-kicker">SCENARIO</span>
        <strong>{SCENARIO_CHROME}</strong>
        <span className="truth-meta">{scenarioHint}</span>
      </div>
    </div>
  )
}

export function BasemapCredit() {
  return (
    <p className="basemap-credit">
      State lines: US Atlas 10m (Census TIGER / Natural Earth lineage). Schematic, not legal GIS.
    </p>
  )
}

export function CiteLine({
  sourceUrl,
  eiaPlantCode,
  eiaGeneratorId,
  asOf,
  citation,
  priorValue,
  priorAsOf,
  status,
}: {
  sourceUrl?: string
  eiaPlantCode?: string
  eiaGeneratorId?: string
  asOf?: string
  citation?: string
  priorValue?: number
  priorAsOf?: string
  status?: string
}) {
  if (citation === 'demoted' || citation === 'uncited' || (!sourceUrl && !eiaPlantCode && !eiaGeneratorId)) {
    return (
      <p className="cite-line cite-uncited">
        UNCITED{citation === 'demoted' ? ' · demoted (kept, not a verified MW claim)' : ''}
      </p>
    )
  }
  return (
    <p className="cite-line">
      CITED
      {eiaPlantCode ? ` · EIA plant ${eiaPlantCode}` : ''}
      {eiaGeneratorId ? ` · gen ${eiaGeneratorId}` : ''}
      {asOf ? ` · as of ${asOf}` : ''}
      {status ? ` · ${status}` : ''}
      {sourceUrl ? (
        <>
          {' · '}
          <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
            source
          </a>
        </>
      ) : null}
      {priorValue != null ? (
        <span className="muted">
          {' '}
          · prior {priorValue} MW{priorAsOf ? ` (${priorAsOf})` : ''}
        </span>
      ) : null}
    </p>
  )
}
