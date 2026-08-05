/**
 * US states + major territories energy catalog (EIA-scale sample figures for UX).
 * Includes 50 states, DC, PR, GU, VI, AS, MP. Replace with EIA API / IRP feeds in production.
 */

export type USRegion =
  | 'Northeast'
  | 'Southeast'
  | 'Midwest'
  | 'Southwest'
  | 'West'
  | 'Pacific'
  | 'Mountain'
  | 'Alaska / Hawaii'
  | 'Caribbean'
  | 'Pacific Territories'
  | 'Capital'

export type GridOperator =
  | 'CAISO'
  | 'ERCOT'
  | 'PJM'
  | 'MISO'
  | 'SPP'
  | 'NYISO'
  | 'ISONE'
  | 'SERC / non-ISO'
  | 'WECC (non-CAISO)'
  | 'Multiple / other'

export interface USStateEnergy {
  fips: string
  abbr: string
  name: string
  region: USRegion
  grid: GridOperator
  /** Approximate centroid for map (lon, lat) */
  lon: number
  lat: number
  /** Nameplate utility-scale + distributed estimate (GW) */
  capacityGw: number
  /** Annual generation (TWh) */
  generationTwh: number
  /** Peak load estimate (GW) */
  peakGw: number
  /** Clean share of generation % (renewables + nuclear + hydro) */
  cleanPct: number
  /** Leading generation source */
  primary: string
  /** Secondary source */
  secondary: string
  /** Nuclear capacity GW */
  nuclearGw: number
  solarGw: number
  windGw: number
  gasGw: number
  coalGw: number
  hydroGw: number
  storageGw: number
  note: string
}

export const US_STATES: USStateEnergy[] = [
  { fips: '01', abbr: 'AL', name: 'Alabama', region: 'Southeast', grid: 'SERC / non-ISO', lon: -86.9, lat: 32.8, capacityGw: 35, generationTwh: 140, peakGw: 28, cleanPct: 48, primary: 'Nuclear', secondary: 'Gas', nuclearGw: 5.8, solarGw: 1.2, windGw: 0, gasGw: 14, coalGw: 5, hydroGw: 3.2, storageGw: 0.1, note: 'Nuclear + gas heavy; limited wind.' },
  { fips: '02', abbr: 'AK', name: 'Alaska', region: 'Alaska / Hawaii', grid: 'Multiple / other', lon: -152.5, lat: 64.2, capacityGw: 3.2, generationTwh: 6.5, peakGw: 1.4, cleanPct: 32, primary: 'Gas', secondary: 'Hydro', nuclearGw: 0, solarGw: 0.02, windGw: 0.06, gasGw: 1.4, coalGw: 0.2, hydroGw: 0.5, storageGw: 0.05, note: 'Isolated grids; diesel + gas + hydro villages.' },
  { fips: '04', abbr: 'AZ', name: 'Arizona', region: 'Southwest', grid: 'WECC (non-CAISO)', lon: -111.7, lat: 34.3, capacityGw: 32, generationTwh: 115, peakGw: 22, cleanPct: 42, primary: 'Gas', secondary: 'Nuclear', nuclearGw: 3.9, solarGw: 6.5, windGw: 0.6, gasGw: 14, coalGw: 2.5, hydroGw: 2.8, storageGw: 1.2, note: 'Palo Verde nuclear; fast solar growth.' },
  { fips: '05', abbr: 'AR', name: 'Arkansas', region: 'Southeast', grid: 'MISO', lon: -92.4, lat: 34.9, capacityGw: 18, generationTwh: 65, peakGw: 12, cleanPct: 35, primary: 'Gas', secondary: 'Coal', nuclearGw: 1.8, solarGw: 1.0, windGw: 0, gasGw: 8, coalGw: 4, hydroGw: 1.2, storageGw: 0.05, note: 'MISO South; nuclear + thermal mix.' },
  { fips: '06', abbr: 'CA', name: 'California', region: 'Pacific', grid: 'CAISO', lon: -119.5, lat: 37.2, capacityGw: 124, generationTwh: 200, peakGw: 52, cleanPct: 56, primary: 'Gas', secondary: 'Solar', nuclearGw: 2.25, solarGw: 42.5, windGw: 7.8, gasGw: 38, coalGw: 0.1, hydroGw: 14, storageGw: 13.5, note: 'Largest storage fleet; CAISO; high solar share.' },
  { fips: '08', abbr: 'CO', name: 'Colorado', region: 'Mountain', grid: 'WECC (non-CAISO)', lon: -105.5, lat: 39.0, capacityGw: 22, generationTwh: 55, peakGw: 12, cleanPct: 48, primary: 'Gas', secondary: 'Wind', nuclearGw: 0, solarGw: 3.5, windGw: 5.5, gasGw: 8, coalGw: 3, hydroGw: 1.2, storageGw: 0.4, note: 'Wind corridor; coal exit underway.' },
  { fips: '09', abbr: 'CT', name: 'Connecticut', region: 'Northeast', grid: 'ISONE', lon: -72.7, lat: 41.6, capacityGw: 10, generationTwh: 35, peakGw: 7.5, cleanPct: 55, primary: 'Gas', secondary: 'Nuclear', nuclearGw: 2.1, solarGw: 1.0, windGw: 0.05, gasGw: 5, coalGw: 0, hydroGw: 0.2, storageGw: 0.15, note: 'ISO-NE; nuclear + gas residual.' },
  { fips: '10', abbr: 'DE', name: 'Delaware', region: 'Northeast', grid: 'PJM', lon: -75.5, lat: 39.0, capacityGw: 3.8, generationTwh: 8, peakGw: 2.5, cleanPct: 18, primary: 'Gas', secondary: 'Solar', nuclearGw: 0, solarGw: 0.4, windGw: 0, gasGw: 2.8, coalGw: 0.2, hydroGw: 0, storageGw: 0.05, note: 'Small PJM state; gas dominant.' },
  { fips: '12', abbr: 'FL', name: 'Florida', region: 'Southeast', grid: 'SERC / non-ISO', lon: -81.7, lat: 28.1, capacityGw: 72, generationTwh: 250, peakGw: 55, cleanPct: 22, primary: 'Gas', secondary: 'Nuclear', nuclearGw: 3.7, solarGw: 12, windGw: 0, gasGw: 48, coalGw: 4, hydroGw: 0.1, storageGw: 0.8, note: 'Summer peak state; rapid solar build.' },
  { fips: '13', abbr: 'GA', name: 'Georgia', region: 'Southeast', grid: 'SERC / non-ISO', lon: -83.4, lat: 32.7, capacityGw: 42, generationTwh: 135, peakGw: 28, cleanPct: 40, primary: 'Gas', secondary: 'Nuclear', nuclearGw: 5.5, solarGw: 5, windGw: 0, gasGw: 18, coalGw: 6, hydroGw: 2, storageGw: 0.2, note: 'Vogtle nuclear expansion lifts clean share.' },
  { fips: '15', abbr: 'HI', name: 'Hawaii', region: 'Alaska / Hawaii', grid: 'Multiple / other', lon: -157.5, lat: 20.5, capacityGw: 3.5, generationTwh: 10, peakGw: 1.5, cleanPct: 35, primary: 'Oil', secondary: 'Solar', nuclearGw: 0, solarGw: 1.4, windGw: 0.2, gasGw: 0.1, coalGw: 0.2, hydroGw: 0.05, storageGw: 0.35, note: 'Island grids; oil still material; solar+storage growth.' },
  { fips: '16', abbr: 'ID', name: 'Idaho', region: 'Mountain', grid: 'WECC (non-CAISO)', lon: -114.5, lat: 44.4, capacityGw: 6.5, generationTwh: 18, peakGw: 3.5, cleanPct: 78, primary: 'Hydro', secondary: 'Wind', nuclearGw: 0, solarGw: 0.6, windGw: 1.0, gasGw: 0.8, coalGw: 0, hydroGw: 2.8, storageGw: 0.05, note: 'Hydro-dominant Northwest profile.' },
  { fips: '17', abbr: 'IL', name: 'Illinois', region: 'Midwest', grid: 'PJM', lon: -89.2, lat: 40.1, capacityGw: 48, generationTwh: 185, peakGw: 28, cleanPct: 62, primary: 'Nuclear', secondary: 'Wind', nuclearGw: 11.5, solarGw: 2.5, windGw: 8, gasGw: 14, coalGw: 5, hydroGw: 0.1, storageGw: 0.3, note: 'Largest Midwest nuclear fleet; PJM + MISO edges.' },
  { fips: '18', abbr: 'IN', name: 'Indiana', region: 'Midwest', grid: 'MISO', lon: -86.3, lat: 39.9, capacityGw: 30, generationTwh: 95, peakGw: 18, cleanPct: 22, primary: 'Coal', secondary: 'Gas', nuclearGw: 0, solarGw: 1.5, windGw: 3.5, gasGw: 10, coalGw: 12, hydroGw: 0.1, storageGw: 0.1, note: 'Coal still material; wind/solar rising.' },
  { fips: '19', abbr: 'IA', name: 'Iowa', region: 'Midwest', grid: 'MISO', lon: -93.5, lat: 42.0, capacityGw: 28, generationTwh: 70, peakGw: 10, cleanPct: 62, primary: 'Wind', secondary: 'Coal', nuclearGw: 0.6, solarGw: 0.5, windGw: 12.5, gasGw: 4, coalGw: 5, hydroGw: 0.2, storageGw: 0.05, note: 'Wind leader by share of generation.' },
  { fips: '20', abbr: 'KS', name: 'Kansas', region: 'Midwest', grid: 'SPP', lon: -98.3, lat: 38.5, capacityGw: 22, generationTwh: 55, peakGw: 9, cleanPct: 55, primary: 'Wind', secondary: 'Coal', nuclearGw: 1.2, solarGw: 0.3, windGw: 9, gasGw: 3, coalGw: 5, hydroGw: 0, storageGw: 0.05, note: 'SPP wind belt.' },
  { fips: '21', abbr: 'KY', name: 'Kentucky', region: 'Southeast', grid: 'PJM', lon: -84.9, lat: 37.5, capacityGw: 22, generationTwh: 70, peakGw: 14, cleanPct: 12, primary: 'Coal', secondary: 'Gas', nuclearGw: 0, solarGw: 0.4, windGw: 0, gasGw: 6, coalGw: 12, hydroGw: 1, storageGw: 0.05, note: 'Coal-heavy; hydro in east.' },
  { fips: '22', abbr: 'LA', name: 'Louisiana', region: 'Southeast', grid: 'MISO', lon: -91.9, lat: 31.0, capacityGw: 32, generationTwh: 100, peakGw: 18, cleanPct: 22, primary: 'Gas', secondary: 'Nuclear', nuclearGw: 2.1, solarGw: 1.2, windGw: 0, gasGw: 22, coalGw: 2, hydroGw: 0.2, storageGw: 0.1, note: 'Industrial gas load; nuclear base.' },
  { fips: '23', abbr: 'ME', name: 'Maine', region: 'Northeast', grid: 'ISONE', lon: -69.2, lat: 45.3, capacityGw: 5, generationTwh: 12, peakGw: 2.2, cleanPct: 72, primary: 'Hydro', secondary: 'Wind', nuclearGw: 0, solarGw: 0.5, windGw: 1.1, gasGw: 1.2, coalGw: 0, hydroGw: 0.8, storageGw: 0.05, note: 'Hydro + wind; ISO-NE north.' },
  { fips: '24', abbr: 'MD', name: 'Maryland', region: 'Northeast', grid: 'PJM', lon: -76.7, lat: 39.0, capacityGw: 14, generationTwh: 35, peakGw: 14, cleanPct: 45, primary: 'Gas', secondary: 'Nuclear', nuclearGw: 1.7, solarGw: 1.8, windGw: 0.2, gasGw: 6, coalGw: 1.5, hydroGw: 0.5, storageGw: 0.15, note: 'PJM mid-Atlantic; solar growth.' },
  { fips: '25', abbr: 'MA', name: 'Massachusetts', region: 'Northeast', grid: 'ISONE', lon: -71.8, lat: 42.3, capacityGw: 14, generationTwh: 28, peakGw: 13, cleanPct: 42, primary: 'Gas', secondary: 'Solar', nuclearGw: 0.7, solarGw: 3.5, windGw: 0.1, gasGw: 7, coalGw: 0, hydroGw: 0.3, storageGw: 0.4, note: 'Offshore wind pipeline; high imports.' },
  { fips: '26', abbr: 'MI', name: 'Michigan', region: 'Midwest', grid: 'MISO', lon: -85.6, lat: 44.3, capacityGw: 32, generationTwh: 110, peakGw: 22, cleanPct: 38, primary: 'Gas', secondary: 'Nuclear', nuclearGw: 3.5, solarGw: 1.5, windGw: 3.5, gasGw: 12, coalGw: 6, hydroGw: 0.4, storageGw: 0.15, note: 'MISO + PJM; nuclear fleet.' },
  { fips: '27', abbr: 'MN', name: 'Minnesota', region: 'Midwest', grid: 'MISO', lon: -94.3, lat: 46.0, capacityGw: 22, generationTwh: 58, peakGw: 12, cleanPct: 48, primary: 'Gas', secondary: 'Wind', nuclearGw: 1.7, solarGw: 2.0, windGw: 5, gasGw: 7, coalGw: 3, hydroGw: 0.3, storageGw: 0.1, note: 'Strong wind + nuclear; coal exit path.' },
  { fips: '28', abbr: 'MS', name: 'Mississippi', region: 'Southeast', grid: 'MISO', lon: -89.7, lat: 32.7, capacityGw: 18, generationTwh: 65, peakGw: 12, cleanPct: 28, primary: 'Gas', secondary: 'Nuclear', nuclearGw: 1.4, solarGw: 0.8, windGw: 0, gasGw: 12, coalGw: 2, hydroGw: 0, storageGw: 0.05, note: 'MISO South gas + nuclear.' },
  { fips: '29', abbr: 'MO', name: 'Missouri', region: 'Midwest', grid: 'SPP', lon: -92.5, lat: 38.4, capacityGw: 24, generationTwh: 75, peakGw: 14, cleanPct: 25, primary: 'Coal', secondary: 'Gas', nuclearGw: 1.2, solarGw: 0.8, windGw: 1.5, gasGw: 7, coalGw: 9, hydroGw: 0.5, storageGw: 0.05, note: 'SPP/MISO edge; coal still large.' },
  { fips: '30', abbr: 'MT', name: 'Montana', region: 'Mountain', grid: 'WECC (non-CAISO)', lon: -110.0, lat: 47.0, capacityGw: 8, generationTwh: 28, peakGw: 2.5, cleanPct: 55, primary: 'Coal', secondary: 'Hydro', nuclearGw: 0, solarGw: 0.2, windGw: 1.5, gasGw: 0.5, coalGw: 2.5, hydroGw: 2.5, storageGw: 0.02, note: 'Export-oriented hydro/coal/wind.' },
  { fips: '31', abbr: 'NE', name: 'Nebraska', region: 'Midwest', grid: 'SPP', lon: -99.8, lat: 41.5, capacityGw: 12, generationTwh: 38, peakGw: 5.5, cleanPct: 42, primary: 'Coal', secondary: 'Wind', nuclearGw: 0.8, solarGw: 0.2, windGw: 3.5, gasGw: 2, coalGw: 4, hydroGw: 0.3, storageGw: 0.02, note: 'Public power heavy; SPP wind.' },
  { fips: '32', abbr: 'NV', name: 'Nevada', region: 'West', grid: 'WECC (non-CAISO)', lon: -116.6, lat: 39.3, capacityGw: 18, generationTwh: 42, peakGw: 9, cleanPct: 45, primary: 'Gas', secondary: 'Solar', nuclearGw: 0, solarGw: 5.5, windGw: 0.2, gasGw: 8, coalGw: 0.5, hydroGw: 1.1, storageGw: 0.8, note: 'Desert solar + gas peakers; storage rising.' },
  { fips: '33', abbr: 'NH', name: 'New Hampshire', region: 'Northeast', grid: 'ISONE', lon: -71.6, lat: 43.7, capacityGw: 5, generationTwh: 18, peakGw: 2.5, cleanPct: 58, primary: 'Nuclear', secondary: 'Gas', nuclearGw: 1.2, solarGw: 0.2, windGw: 0.2, gasGw: 1.8, coalGw: 0, hydroGw: 0.4, storageGw: 0.05, note: 'Seabrook nuclear; ISO-NE.' },
  { fips: '34', abbr: 'NJ', name: 'New Jersey', region: 'Northeast', grid: 'PJM', lon: -74.5, lat: 40.2, capacityGw: 20, generationTwh: 65, peakGw: 18, cleanPct: 48, primary: 'Gas', secondary: 'Nuclear', nuclearGw: 3.5, solarGw: 4.5, windGw: 0.05, gasGw: 10, coalGw: 0.5, hydroGw: 0.1, storageGw: 0.5, note: 'Nuclear + gas; offshore wind plans.' },
  { fips: '35', abbr: 'NM', name: 'New Mexico', region: 'Southwest', grid: 'WECC (non-CAISO)', lon: -106.1, lat: 34.4, capacityGw: 14, generationTwh: 38, peakGw: 4.5, cleanPct: 55, primary: 'Wind', secondary: 'Coal', nuclearGw: 0, solarGw: 2.5, windGw: 4.5, gasGw: 3, coalGw: 2.5, hydroGw: 0.1, storageGw: 0.3, note: 'Wind + solar export potential to West.' },
  { fips: '36', abbr: 'NY', name: 'New York', region: 'Northeast', grid: 'NYISO', lon: -75.5, lat: 43.0, capacityGw: 42, generationTwh: 130, peakGw: 32, cleanPct: 52, primary: 'Gas', secondary: 'Hydro', nuclearGw: 3.3, solarGw: 5, windGw: 2.5, gasGw: 18, coalGw: 0, hydroGw: 4.5, storageGw: 0.6, note: 'NYISO; hydro upstate; gas downstate.' },
  { fips: '37', abbr: 'NC', name: 'North Carolina', region: 'Southeast', grid: 'SERC / non-ISO', lon: -79.4, lat: 35.6, capacityGw: 38, generationTwh: 130, peakGw: 26, cleanPct: 38, primary: 'Gas', secondary: 'Nuclear', nuclearGw: 5.1, solarGw: 8, windGw: 0.2, gasGw: 14, coalGw: 6, hydroGw: 1.8, storageGw: 0.3, note: 'Large solar build; dual nuclear plants.' },
  { fips: '38', abbr: 'ND', name: 'North Dakota', region: 'Midwest', grid: 'MISO', lon: -100.5, lat: 47.5, capacityGw: 12, generationTwh: 42, peakGw: 2.5, cleanPct: 48, primary: 'Coal', secondary: 'Wind', nuclearGw: 0, solarGw: 0.1, windGw: 4.5, gasGw: 0.8, coalGw: 4, hydroGw: 0.6, storageGw: 0.02, note: 'Export wind/coal; low local peak.' },
  { fips: '39', abbr: 'OH', name: 'Ohio', region: 'Midwest', grid: 'PJM', lon: -82.8, lat: 40.3, capacityGw: 35, generationTwh: 120, peakGw: 26, cleanPct: 28, primary: 'Gas', secondary: 'Coal', nuclearGw: 2.1, solarGw: 1.5, windGw: 1.2, gasGw: 16, coalGw: 8, hydroGw: 0.1, storageGw: 0.15, note: 'PJM industrial load; gas overtook coal.' },
  { fips: '40', abbr: 'OK', name: 'Oklahoma', region: 'Southwest', grid: 'SPP', lon: -97.5, lat: 35.5, capacityGw: 32, generationTwh: 90, peakGw: 14, cleanPct: 48, primary: 'Wind', secondary: 'Gas', nuclearGw: 0, solarGw: 0.8, windGw: 12, gasGw: 12, coalGw: 3, hydroGw: 0.8, storageGw: 0.1, note: 'SPP wind powerhouse.' },
  { fips: '41', abbr: 'OR', name: 'Oregon', region: 'Pacific', grid: 'WECC (non-CAISO)', lon: -120.6, lat: 44.0, capacityGw: 18, generationTwh: 62, peakGw: 8, cleanPct: 72, primary: 'Hydro', secondary: 'Gas', nuclearGw: 0, solarGw: 1.2, windGw: 3.8, gasGw: 4, coalGw: 0, hydroGw: 8, storageGw: 0.15, note: 'Hydro + wind; PNW exports to CA.' },
  { fips: '42', abbr: 'PA', name: 'Pennsylvania', region: 'Northeast', grid: 'PJM', lon: -77.6, lat: 40.9, capacityGw: 52, generationTwh: 230, peakGw: 30, cleanPct: 42, primary: 'Gas', secondary: 'Nuclear', nuclearGw: 9.5, solarGw: 1.5, windGw: 1.5, gasGw: 22, coalGw: 6, hydroGw: 0.8, storageGw: 0.2, note: 'Major PJM exporter; large nuclear + gas.' },
  { fips: '44', abbr: 'RI', name: 'Rhode Island', region: 'Northeast', grid: 'ISONE', lon: -71.5, lat: 41.7, capacityGw: 2.5, generationTwh: 7, peakGw: 2, cleanPct: 28, primary: 'Gas', secondary: 'Solar', nuclearGw: 0, solarGw: 0.5, windGw: 0.05, gasGw: 1.6, coalGw: 0, hydroGw: 0, storageGw: 0.08, note: 'Smallest state grid; ISO-NE imports.' },
  { fips: '45', abbr: 'SC', name: 'South Carolina', region: 'Southeast', grid: 'SERC / non-ISO', lon: -80.9, lat: 33.9, capacityGw: 28, generationTwh: 100, peakGw: 16, cleanPct: 55, primary: 'Nuclear', secondary: 'Gas', nuclearGw: 6.5, solarGw: 3.5, windGw: 0, gasGw: 10, coalGw: 3, hydroGw: 1.5, storageGw: 0.15, note: 'High nuclear share; solar growth.' },
  { fips: '46', abbr: 'SD', name: 'South Dakota', region: 'Midwest', grid: 'SPP', lon: -100.2, lat: 44.4, capacityGw: 8, generationTwh: 18, peakGw: 2.2, cleanPct: 68, primary: 'Wind', secondary: 'Hydro', nuclearGw: 0, solarGw: 0.1, windGw: 3.5, gasGw: 0.5, coalGw: 0.8, hydroGw: 1.8, storageGw: 0.02, note: 'Wind + Missouri River hydro.' },
  { fips: '47', abbr: 'TN', name: 'Tennessee', region: 'Southeast', grid: 'SERC / non-ISO', lon: -86.3, lat: 35.8, capacityGw: 28, generationTwh: 85, peakGw: 20, cleanPct: 48, primary: 'Nuclear', secondary: 'Gas', nuclearGw: 5.7, solarGw: 1.2, windGw: 0, gasGw: 8, coalGw: 4, hydroGw: 3.5, storageGw: 0.1, note: 'TVA footprint; nuclear + hydro.' },
  { fips: '48', abbr: 'TX', name: 'Texas', region: 'Southwest', grid: 'ERCOT', lon: -99.3, lat: 31.5, capacityGw: 165, generationTwh: 480, peakGw: 85, cleanPct: 38, primary: 'Gas', secondary: 'Wind', nuclearGw: 5.0, solarGw: 22, windGw: 40, gasGw: 70, coalGw: 14, hydroGw: 0.5, storageGw: 5.5, note: 'Largest wind fleet; ERCOT island; storage boom.' },
  { fips: '49', abbr: 'UT', name: 'Utah', region: 'Mountain', grid: 'WECC (non-CAISO)', lon: -111.6, lat: 39.3, capacityGw: 12, generationTwh: 40, peakGw: 6, cleanPct: 25, primary: 'Coal', secondary: 'Gas', nuclearGw: 0, solarGw: 2.5, windGw: 0.4, gasGw: 3, coalGw: 4, hydroGw: 0.3, storageGw: 0.2, note: 'Coal exit + solar; Intermountain history.' },
  { fips: '50', abbr: 'VT', name: 'Vermont', region: 'Northeast', grid: 'ISONE', lon: -72.7, lat: 44.0, capacityGw: 1.2, generationTwh: 2.2, peakGw: 1.0, cleanPct: 95, primary: 'Hydro', secondary: 'Solar', nuclearGw: 0, solarGw: 0.4, windGw: 0.15, gasGw: 0.05, coalGw: 0, hydroGw: 0.35, storageGw: 0.05, note: 'Highest clean share; heavy imports for energy.' },
  { fips: '51', abbr: 'VA', name: 'Virginia', region: 'Southeast', grid: 'PJM', lon: -78.6, lat: 37.5, capacityGw: 32, generationTwh: 95, peakGw: 24, cleanPct: 42, primary: 'Gas', secondary: 'Nuclear', nuclearGw: 3.6, solarGw: 5, windGw: 0.05, gasGw: 14, coalGw: 2, hydroGw: 0.8, storageGw: 0.4, note: 'Data center load growth; PJM.' },
  { fips: '53', abbr: 'WA', name: 'Washington', region: 'Pacific', grid: 'WECC (non-CAISO)', lon: -120.5, lat: 47.4, capacityGw: 35, generationTwh: 110, peakGw: 14, cleanPct: 85, primary: 'Hydro', secondary: 'Gas', nuclearGw: 1.2, solarGw: 0.5, windGw: 3.5, gasGw: 3.5, coalGw: 0, hydroGw: 22, storageGw: 0.2, note: 'Columbia River hydro superpower; exports south.' },
  { fips: '54', abbr: 'WV', name: 'West Virginia', region: 'Southeast', grid: 'PJM', lon: -80.6, lat: 38.6, capacityGw: 16, generationTwh: 65, peakGw: 5, cleanPct: 12, primary: 'Coal', secondary: 'Gas', nuclearGw: 0, solarGw: 0.2, windGw: 0.7, gasGw: 2, coalGw: 11, hydroGw: 0.3, storageGw: 0.02, note: 'Coal export baseload to PJM.' },
  { fips: '55', abbr: 'WI', name: 'Wisconsin', region: 'Midwest', grid: 'MISO', lon: -89.8, lat: 44.5, capacityGw: 20, generationTwh: 62, peakGw: 14, cleanPct: 32, primary: 'Gas', secondary: 'Coal', nuclearGw: 1.2, solarGw: 1.5, windGw: 1.0, gasGw: 8, coalGw: 5, hydroGw: 0.5, storageGw: 0.1, note: 'MISO; nuclear + thermal mix.' },
  { fips: '56', abbr: 'WY', name: 'Wyoming', region: 'Mountain', grid: 'WECC (non-CAISO)', lon: -107.5, lat: 43.0, capacityGw: 12, generationTwh: 48, peakGw: 2.5, cleanPct: 28, primary: 'Coal', secondary: 'Wind', nuclearGw: 0, solarGw: 0.2, windGw: 2.5, gasGw: 1, coalGw: 6.5, hydroGw: 0.3, storageGw: 0.05, note: 'Coal exporter; wind growth for West.' },
  { fips: '72', abbr: 'PR', name: 'Puerto Rico', region: 'Caribbean', grid: 'Multiple / other', lon: -66.5, lat: 18.22, capacityGw: 5.8, generationTwh: 18, peakGw: 3.0, cleanPct: 8, primary: 'Oil / residual', secondary: 'Gas', nuclearGw: 0, solarGw: 0.7, windGw: 0.15, gasGw: 1.2, coalGw: 0.5, hydroGw: 0.1, storageGw: 0.15, note: 'PREPA / LUMA island grid; heavy oil and distillate legacy; solar + storage recovery build after Maria and grid reforms.' },
  { fips: '11', abbr: 'DC', name: 'District of Columbia', region: 'Capital', grid: 'PJM', lon: -77.04, lat: 38.91, capacityGw: 0.2, generationTwh: 0.2, peakGw: 2.2, cleanPct: 75, primary: 'Imports', secondary: 'Solar', nuclearGw: 0, solarGw: 0.12, windGw: 0, gasGw: 0.05, coalGw: 0, hydroGw: 0, storageGw: 0.02, note: 'Almost fully import-dependent in PJM; aggressive local clean and building standards.' },
  { fips: '66', abbr: 'GU', name: 'Guam', region: 'Pacific Territories', grid: 'Multiple / other', lon: 144.79, lat: 13.44, capacityGw: 0.55, generationTwh: 1.8, peakGw: 0.28, cleanPct: 12, primary: 'Oil', secondary: 'Solar', nuclearGw: 0, solarGw: 0.08, windGw: 0, gasGw: 0, coalGw: 0, hydroGw: 0, storageGw: 0.04, note: 'Island GPA system; oil-fired legacy with solar and storage build.' },
  { fips: '78', abbr: 'VI', name: 'U.S. Virgin Islands', region: 'Caribbean', grid: 'Multiple / other', lon: -64.9, lat: 18.34, capacityGw: 0.32, generationTwh: 0.9, peakGw: 0.12, cleanPct: 15, primary: 'Oil', secondary: 'Solar', nuclearGw: 0, solarGw: 0.05, windGw: 0, gasGw: 0, coalGw: 0, hydroGw: 0, storageGw: 0.02, note: 'WAPA island grids; high fuel cost; solar and storage growth.' },
  { fips: '60', abbr: 'AS', name: 'American Samoa', region: 'Pacific Territories', grid: 'Multiple / other', lon: -170.7, lat: -14.3, capacityGw: 0.05, generationTwh: 0.15, peakGw: 0.03, cleanPct: 10, primary: 'Diesel', secondary: 'Solar', nuclearGw: 0, solarGw: 0.01, windGw: 0, gasGw: 0, coalGw: 0, hydroGw: 0, storageGw: 0.005, note: 'Remote Pacific diesel systems; solar pilots via ASPA.' },
  { fips: '69', abbr: 'MP', name: 'Northern Mariana Islands', region: 'Pacific Territories', grid: 'Multiple / other', lon: 145.75, lat: 15.2, capacityGw: 0.1, generationTwh: 0.3, peakGw: 0.05, cleanPct: 8, primary: 'Diesel', secondary: 'Solar', nuclearGw: 0, solarGw: 0.015, windGw: 0, gasGw: 0, coalGw: 0, hydroGw: 0, storageGw: 0.01, note: 'CNMI CUC diesel grids; typhoon resilience and solar goals.' },
]

export const US_REGIONS: USRegion[] = [
  'Northeast',
  'Southeast',
  'Midwest',
  'Southwest',
  'West',
  'Pacific',
  'Mountain',
  'Alaska / Hawaii',
  'Caribbean',
  'Pacific Territories',
  'Capital',
]

export const GRID_OPS: GridOperator[] = [
  'CAISO',
  'ERCOT',
  'PJM',
  'MISO',
  'SPP',
  'NYISO',
  'ISONE',
  'SERC / non-ISO',
  'WECC (non-CAISO)',
  'Multiple / other',
]

/** Project lon/lat to SVG for contiguous US + AK / HI / PR insets */
export function projectUS(
  lon: number,
  lat: number,
  w = 720,
  h = 460
): { x: number; y: number } {
  // Alaska inset
  if (lon < -130 && lat > 50) {
    const x = 40 + ((lon + 170) / 40) * 120
    const y = 320 + ((72 - lat) / 20) * 90
    return { x: Math.min(170, Math.max(30, x)), y: Math.min(430, Math.max(310, y)) }
  }
  // Hawaii inset
  if (lon > -162 && lon < -154 && lat < 24) {
    const x = 180 + ((lon + 162) / 8) * 80
    const y = 380 + ((22.5 - lat) / 4) * 40
    return { x: Math.min(280, Math.max(170, x)), y: Math.min(440, Math.max(370, y)) }
  }
  // Puerto Rico inset (Caribbean)
  if (lon > -68 && lon < -65 && lat > 17 && lat < 19) {
    const x = 320 + ((lon + 67.5) / 2.5) * 70
    const y = 390 + ((18.6 - lat) / 1.2) * 35
    return { x: Math.min(410, Math.max(310, x)), y: Math.min(440, Math.max(375, y)) }
  }
  // Contiguous US
  const minLon = -125
  const maxLon = -66.5
  const minLat = 24.5
  const maxLat = 49.5
  const padX = 28
  const padY = 20
  const x = padX + ((lon - minLon) / (maxLon - minLon)) * (w - padX * 2)
  const y = padY + ((maxLat - lat) / (maxLat - minLat)) * (h - padY * 2 - 40)
  return { x, y }
}

export function totals(states: USStateEnergy[]) {
  return {
    capacityGw: states.reduce((s, x) => s + x.capacityGw, 0),
    generationTwh: states.reduce((s, x) => s + x.generationTwh, 0),
    peakGw: states.reduce((s, x) => s + x.peakGw, 0),
    cleanAvg:
      states.reduce((s, x) => s + x.cleanPct, 0) / Math.max(1, states.length),
    count: states.length,
  }
}

export function stateByAbbr(abbr: string): USStateEnergy | undefined {
  return US_STATES.find((s) => s.abbr.toUpperCase() === abbr.toUpperCase())
}

/** 1 = highest for the metric among all states */
export function rankOf(
  abbr: string,
  metric: keyof Pick<
    USStateEnergy,
    | 'capacityGw'
    | 'generationTwh'
    | 'peakGw'
    | 'cleanPct'
    | 'solarGw'
    | 'windGw'
    | 'nuclearGw'
    | 'storageGw'
  >
): { rank: number; of: number; value: number } {
  const sorted = [...US_STATES].sort(
    (a, b) => (b[metric] as number) - (a[metric] as number)
  )
  const idx = sorted.findIndex((s) => s.abbr === abbr)
  const row = sorted[idx] ?? sorted[0]
  return { rank: idx + 1, of: sorted.length, value: row[metric] as number }
}

export function regionTotals(region: USRegion) {
  return totals(US_STATES.filter((s) => s.region === region))
}

export function gridTotals(grid: GridOperator) {
  return totals(US_STATES.filter((s) => s.grid === grid))
}

/** Full capacity mix for a state (all fuels, including fossil) */
export function fuelStack(s: USStateEnergy, opts?: { includeZero?: boolean }) {
  const parts = [
    { key: 'Coal', gw: s.coalGw, color: '#44403c', clean: false },
    { key: 'Gas', gw: s.gasGw, color: '#78716c', clean: false },
    { key: 'Nuclear', gw: s.nuclearGw, color: '#7c3aed', clean: true },
    { key: 'Hydro', gw: s.hydroGw, color: '#0e7490', clean: true },
    { key: 'Wind', gw: s.windGw, color: '#0369a1', clean: true },
    { key: 'Solar', gw: s.solarGw, color: '#b45309', clean: true },
    { key: 'Storage', gw: s.storageGw, color: '#166534', clean: true },
  ]
  const sum = parts.reduce((a, p) => a + p.gw, 0) || 1
  const list = opts?.includeZero ? parts : parts.filter((p) => p.gw > 0)
  return list.map((p) => ({ ...p, pct: (p.gw / sum) * 100 }))
}

/** National rollup of nameplate by source across all jurisdictions */
export function nationalFuelMix(states = US_STATES) {
  const mix = {
    coalGw: 0,
    gasGw: 0,
    nuclearGw: 0,
    hydroGw: 0,
    windGw: 0,
    solarGw: 0,
    storageGw: 0,
  }
  for (const s of states) {
    mix.coalGw += s.coalGw
    mix.gasGw += s.gasGw
    mix.nuclearGw += s.nuclearGw
    mix.hydroGw += s.hydroGw
    mix.windGw += s.windGw
    mix.solarGw += s.solarGw
    mix.storageGw += s.storageGw
  }
  const total =
    mix.coalGw +
    mix.gasGw +
    mix.nuclearGw +
    mix.hydroGw +
    mix.windGw +
    mix.solarGw +
    mix.storageGw
  const rows = [
    { key: 'Coal', gw: mix.coalGw, color: '#44403c', clean: false },
    { key: 'Natural gas', gw: mix.gasGw, color: '#78716c', clean: false },
    { key: 'Nuclear', gw: mix.nuclearGw, color: '#7c3aed', clean: true },
    { key: 'Hydro', gw: mix.hydroGw, color: '#0e7490', clean: true },
    { key: 'Wind', gw: mix.windGw, color: '#0369a1', clean: true },
    { key: 'Solar', gw: mix.solarGw, color: '#b45309', clean: true },
    { key: 'Storage', gw: mix.storageGw, color: '#166534', clean: true },
  ].map((r) => ({
    ...r,
    pct: total > 0 ? (r.gw / total) * 100 : 0,
  }))
  return { ...mix, totalGw: total, rows }
}
