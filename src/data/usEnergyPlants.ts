/**
 * Major US generating plants across every technology category:
 * coal, natural gas, nuclear, wind, solar, hydro, geothermal, biomass, battery, other.
 * Nameplate MW are EIA / operator-scale samples for map UX — not a live inventory.
 * Wire to EIA-860 plant file in production.
 */

import type { Technology } from '../types'
import { TECH_ORDER } from '../lib/utils'
import type { EnergyPortfolio, PortfolioAsset } from './portfolios'
import { US_HYDRO_PLANTS, type UsHydroPlant } from './usHydroPlants'

export interface UsEnergyPlant {
  id: string
  name: string
  technology: Technology
  stateAbbr: string
  stateName: string
  capacityMw: number
  /** Typical sample output MW for map rings (negative = charging/load) */
  outputMw: number
  latitude: number
  longitude: number
  operator: string
  /** Basin, fuel, river, or cluster label */
  detail: string
  onlineYear: number
  region: string
  note?: string
}

function hydroToEnergy(p: UsHydroPlant): UsEnergyPlant {
  return {
    id: p.id,
    name: p.name,
    technology: 'hydro',
    stateAbbr: p.stateAbbr,
    stateName: p.stateName,
    capacityMw: p.capacityMw,
    outputMw: p.outputMw,
    latitude: p.latitude,
    longitude: p.longitude,
    operator: p.operator,
    detail: `${p.kind} · ${p.river}`,
    onlineYear: p.onlineYear,
    region: p.region,
    note: p.note,
  }
}

/** Non-hydro flagship plants (hydro comes from US_HYDRO_PLANTS) */
export const US_NON_HYDRO_PLANTS: UsEnergyPlant[] = [
  // ── Nuclear ──────────────────────────────────────────────
  { id: 'n-palo-verde', name: 'Palo Verde', technology: 'nuclear', stateAbbr: 'AZ', stateName: 'Arizona', capacityMw: 3937, outputMw: 3700, latitude: 33.389, longitude: -112.865, operator: 'APS', detail: 'PWR · 3 units', onlineYear: 1986, region: 'Southwest', note: 'Largest US nuclear plant by capacity.' },
  { id: 'n-peach-bottom', name: 'Peach Bottom', technology: 'nuclear', stateAbbr: 'PA', stateName: 'Pennsylvania', capacityMw: 2785, outputMw: 2600, latitude: 39.759, longitude: -76.269, operator: 'Constellation', detail: 'BWR', onlineYear: 1974, region: 'Mid-Atlantic' },
  { id: 'n-browns-ferry', name: 'Browns Ferry', technology: 'nuclear', stateAbbr: 'AL', stateName: 'Alabama', capacityMw: 3450, outputMw: 3200, latitude: 34.704, longitude: -87.119, operator: 'TVA', detail: 'BWR · 3 units', onlineYear: 1974, region: 'Southeast' },
  { id: 'n-south-texas', name: 'South Texas Project', technology: 'nuclear', stateAbbr: 'TX', stateName: 'Texas', capacityMw: 2708, outputMw: 2550, latitude: 28.795, longitude: -96.048, operator: 'STPNOC', detail: 'PWR', onlineYear: 1988, region: 'Texas' },
  { id: 'n-vogtle', name: 'Vogtle', technology: 'nuclear', stateAbbr: 'GA', stateName: 'Georgia', capacityMw: 4540, outputMw: 4200, latitude: 33.143, longitude: -81.762, operator: 'Southern Nuclear', detail: 'PWR · Units 1–4', onlineYear: 1987, region: 'Southeast', note: 'Units 3–4 AP1000s online 2023–24.' },
  { id: 'n-comanche-peak', name: 'Comanche Peak', technology: 'nuclear', stateAbbr: 'TX', stateName: 'Texas', capacityMw: 2400, outputMw: 2250, latitude: 32.298, longitude: -97.785, operator: 'Luminant', detail: 'PWR', onlineYear: 1990, region: 'Texas' },
  { id: 'n-diablo', name: 'Diablo Canyon', technology: 'nuclear', stateAbbr: 'CA', stateName: 'California', capacityMw: 2256, outputMw: 2100, latitude: 35.211, longitude: -120.856, operator: 'PG&E', detail: 'PWR · 2 units', onlineYear: 1985, region: 'Pacific' },
  { id: 'n-byron', name: 'Byron', technology: 'nuclear', stateAbbr: 'IL', stateName: 'Illinois', capacityMw: 2347, outputMw: 2200, latitude: 42.074, longitude: -89.282, operator: 'Constellation', detail: 'PWR', onlineYear: 1985, region: 'Midwest' },
  { id: 'n-braidwood', name: 'Braidwood', technology: 'nuclear', stateAbbr: 'IL', stateName: 'Illinois', capacityMw: 2386, outputMw: 2250, latitude: 41.244, longitude: -88.229, operator: 'Constellation', detail: 'PWR', onlineYear: 1988, region: 'Midwest' },
  { id: 'n-lasalle', name: 'LaSalle', technology: 'nuclear', stateAbbr: 'IL', stateName: 'Illinois', capacityMw: 2320, outputMw: 2180, latitude: 41.246, longitude: -88.669, operator: 'Constellation', detail: 'BWR', onlineYear: 1982, region: 'Midwest' },
  { id: 'n-susquehanna', name: 'Susquehanna', technology: 'nuclear', stateAbbr: 'PA', stateName: 'Pennsylvania', capacityMw: 2520, outputMw: 2360, latitude: 41.092, longitude: -76.149, operator: 'Talen', detail: 'BWR', onlineYear: 1983, region: 'Mid-Atlantic' },
  { id: 'n-mcguire', name: 'McGuire', technology: 'nuclear', stateAbbr: 'NC', stateName: 'North Carolina', capacityMw: 2316, outputMw: 2180, latitude: 35.433, longitude: -80.948, operator: 'Duke Energy', detail: 'PWR', onlineYear: 1981, region: 'Southeast' },
  { id: 'n-catawba', name: 'Catawba', technology: 'nuclear', stateAbbr: 'SC', stateName: 'South Carolina', capacityMw: 2310, outputMw: 2170, latitude: 35.051, longitude: -81.07, operator: 'Duke Energy', detail: 'PWR', onlineYear: 1985, region: 'Southeast' },
  { id: 'n-oyster-creek', name: 'Oconee', technology: 'nuclear', stateAbbr: 'SC', stateName: 'South Carolina', capacityMw: 2554, outputMw: 2400, latitude: 34.794, longitude: -82.899, operator: 'Duke Energy', detail: 'PWR · 3 units', onlineYear: 1973, region: 'Southeast' },
  { id: 'n-watts-bar', name: 'Watts Bar', technology: 'nuclear', stateAbbr: 'TN', stateName: 'Tennessee', capacityMw: 2338, outputMw: 2200, latitude: 35.602, longitude: -84.79, operator: 'TVA', detail: 'PWR · Units 1–2', onlineYear: 1996, region: 'Southeast' },
  { id: 'n-sequoyah', name: 'Sequoyah', technology: 'nuclear', stateAbbr: 'TN', stateName: 'Tennessee', capacityMw: 2332, outputMw: 2190, latitude: 35.226, longitude: -85.092, operator: 'TVA', detail: 'PWR', onlineYear: 1981, region: 'Southeast' },
  { id: 'n-nine-mile', name: 'Nine Mile Point', technology: 'nuclear', stateAbbr: 'NY', stateName: 'New York', capacityMw: 1927, outputMw: 1800, latitude: 43.521, longitude: -76.41, operator: 'Constellation', detail: 'BWR', onlineYear: 1969, region: 'Northeast' },
  { id: 'n-millstone', name: 'Millstone', technology: 'nuclear', stateAbbr: 'CT', stateName: 'Connecticut', capacityMw: 2098, outputMw: 1970, latitude: 41.311, longitude: -72.168, operator: 'Dominion', detail: 'PWR', onlineYear: 1975, region: 'Northeast' },
  { id: 'n-salem', name: 'Salem / Hope Creek complex', technology: 'nuclear', stateAbbr: 'NJ', stateName: 'New Jersey', capacityMw: 3650, outputMw: 3400, latitude: 39.463, longitude: -75.536, operator: 'PSEG', detail: 'PWR + BWR', onlineYear: 1977, region: 'Mid-Atlantic' },
  { id: 'n-turkey-point', name: 'Turkey Point', technology: 'nuclear', stateAbbr: 'FL', stateName: 'Florida', capacityMw: 1632, outputMw: 1520, latitude: 25.434, longitude: -80.331, operator: 'FPL', detail: 'PWR', onlineYear: 1972, region: 'Southeast' },
  { id: 'n-st-lucie', name: 'St. Lucie', technology: 'nuclear', stateAbbr: 'FL', stateName: 'Florida', capacityMw: 1968, outputMw: 1840, latitude: 27.349, longitude: -80.246, operator: 'FPL', detail: 'PWR', onlineYear: 1976, region: 'Southeast' },

  // ── Coal ─────────────────────────────────────────────────
  { id: 'c-ghent', name: 'Ghent', technology: 'coal', stateAbbr: 'KY', stateName: 'Kentucky', capacityMw: 2000, outputMw: 1100, latitude: 38.75, longitude: -85.035, operator: 'Kentucky Utilities', detail: 'Bituminous', onlineYear: 1973, region: 'Southeast' },
  { id: 'c-miller', name: 'James H. Miller Jr.', technology: 'coal', stateAbbr: 'AL', stateName: 'Alabama', capacityMw: 2822, outputMw: 1500, latitude: 33.632, longitude: -87.06, operator: 'Alabama Power', detail: 'Bituminous', onlineYear: 1978, region: 'Southeast', note: 'Among largest US coal plants.' },
  { id: 'c-gibson', name: 'Gibson', technology: 'coal', stateAbbr: 'IN', stateName: 'Indiana', capacityMw: 3340, outputMw: 1700, latitude: 38.372, longitude: -87.766, operator: 'Duke Energy', detail: 'Bituminous', onlineYear: 1975, region: 'Midwest' },
  { id: 'c-labadie', name: 'Labadie', technology: 'coal', stateAbbr: 'MO', stateName: 'Missouri', capacityMw: 2389, outputMw: 1300, latitude: 38.565, longitude: -90.838, operator: 'Ameren', detail: 'Bituminous', onlineYear: 1970, region: 'Midwest' },
  { id: 'c-monroe', name: 'Monroe', technology: 'coal', stateAbbr: 'MI', stateName: 'Michigan', capacityMw: 3293, outputMw: 1600, latitude: 41.89, longitude: -83.345, operator: 'DTE', detail: 'Bituminous', onlineYear: 1971, region: 'Midwest' },
  { id: 'c-john-e-amos', name: 'John E. Amos', technology: 'coal', stateAbbr: 'WV', stateName: 'West Virginia', capacityMw: 2933, outputMw: 1450, latitude: 38.473, longitude: -81.823, operator: 'Appalachian Power', detail: 'Bituminous', onlineYear: 1971, region: 'Mid-Atlantic' },
  { id: 'c-robert-w-scherer', name: 'Robert W. Scherer', technology: 'coal', stateAbbr: 'GA', stateName: 'Georgia', capacityMw: 3564, outputMw: 1800, latitude: 33.058, longitude: -83.807, operator: 'Georgia Power', detail: 'PRB coal', onlineYear: 1982, region: 'Southeast' },
  { id: 'c-w-a-parish', name: 'W.A. Parish', technology: 'coal', stateAbbr: 'TX', stateName: 'Texas', capacityMw: 3675, outputMw: 1600, latitude: 29.476, longitude: -95.635, operator: 'NRG', detail: 'Coal + gas units', onlineYear: 1977, region: 'Texas' },
  { id: 'c-martin-lake', name: 'Martin Lake', technology: 'coal', stateAbbr: 'TX', stateName: 'Texas', capacityMw: 2250, outputMw: 1100, latitude: 32.26, longitude: -94.57, operator: 'Luminant', detail: 'Lignite', onlineYear: 1977, region: 'Texas' },
  { id: 'c-colstrip', name: 'Colstrip', technology: 'coal', stateAbbr: 'MT', stateName: 'Montana', capacityMw: 1480, outputMw: 900, latitude: 45.883, longitude: -106.614, operator: 'Talen / NorthWestern', detail: 'PRB', onlineYear: 1975, region: 'Mountain' },
  { id: 'c-jim-bridger', name: 'Jim Bridger', technology: 'coal', stateAbbr: 'WY', stateName: 'Wyoming', capacityMw: 2110, outputMw: 1200, latitude: 41.738, longitude: -108.788, operator: 'PacifiCorp', detail: 'PRB', onlineYear: 1974, region: 'Mountain' },
  { id: 'c-craig', name: 'Craig', technology: 'coal', stateAbbr: 'CO', stateName: 'Colorado', capacityMw: 1280, outputMw: 700, latitude: 40.463, longitude: -107.591, operator: 'Tri-State', detail: 'Bituminous', onlineYear: 1979, region: 'Mountain' },
  { id: 'c-intermountain', name: 'Intermountain Power Project', technology: 'coal', stateAbbr: 'UT', stateName: 'Utah', capacityMw: 1800, outputMw: 400, latitude: 39.508, longitude: -112.58, operator: 'IPA / LADWP', detail: 'Coal → gas conversion path', onlineYear: 1986, region: 'Mountain' },
  { id: 'c-navajo', name: 'Navajo (retired stack sample)', technology: 'coal', stateAbbr: 'AZ', stateName: 'Arizona', capacityMw: 2250, outputMw: 0, latitude: 36.903, longitude: -111.39, operator: 'SRP / others', detail: 'Retired 2019', onlineYear: 1974, region: 'Southwest', note: 'Historical major; marker for fleet transition.' },
  { id: 'c-four-corners', name: 'Four Corners', technology: 'coal', stateAbbr: 'NM', stateName: 'New Mexico', capacityMw: 1540, outputMw: 700, latitude: 36.69, longitude: -108.481, operator: 'APS', detail: 'PRB', onlineYear: 1963, region: 'Southwest' },
  { id: 'c-crystal-river', name: 'Crystal River (coal remnant)', technology: 'coal', stateAbbr: 'FL', stateName: 'Florida', capacityMw: 1444, outputMw: 500, latitude: 28.959, longitude: -82.7, operator: 'Duke Energy', detail: 'Bituminous', onlineYear: 1966, region: 'Southeast' },
  { id: 'c-bowen', name: 'Bowen', technology: 'coal', stateAbbr: 'GA', stateName: 'Georgia', capacityMw: 3499, outputMw: 1700, latitude: 34.126, longitude: -84.92, operator: 'Georgia Power', detail: 'Bituminous', onlineYear: 1971, region: 'Southeast' },
  { id: 'c-keystone', name: 'Keystone', technology: 'coal', stateAbbr: 'PA', stateName: 'Pennsylvania', capacityMw: 1711, outputMw: 850, latitude: 40.66, longitude: -79.34, operator: 'NRG', detail: 'Bituminous', onlineYear: 1967, region: 'Mid-Atlantic' },

  // ── Natural gas ──────────────────────────────────────────
  { id: 'g-west-county', name: 'West County Energy Center', technology: 'natural_gas', stateAbbr: 'FL', stateName: 'Florida', capacityMw: 3756, outputMw: 1800, latitude: 26.7, longitude: -80.375, operator: 'FPL', detail: 'CCGT', onlineYear: 2009, region: 'Southeast', note: 'Among largest US gas plants.' },
  { id: 'g-forney', name: 'Forney Energy Center', technology: 'natural_gas', stateAbbr: 'TX', stateName: 'Texas', capacityMw: 1792, outputMw: 900, latitude: 32.755, longitude: -96.443, operator: 'Luminant', detail: 'CCGT', onlineYear: 2003, region: 'Texas' },
  { id: 'g-midlothian', name: 'Midlothian Energy', technology: 'natural_gas', stateAbbr: 'TX', stateName: 'Texas', capacityMw: 1665, outputMw: 800, latitude: 32.456, longitude: -97.0, operator: 'Calpine', detail: 'CCGT', onlineYear: 2000, region: 'Texas' },
  { id: 'g-hays', name: 'Hays Energy', technology: 'natural_gas', stateAbbr: 'TX', stateName: 'Texas', capacityMw: 1030, outputMw: 500, latitude: 29.883, longitude: -97.99, operator: 'Calpine', detail: 'CCGT', onlineYear: 2002, region: 'Texas' },
  { id: 'g-moss-landing', name: 'Moss Landing Power Plant', technology: 'natural_gas', stateAbbr: 'CA', stateName: 'California', capacityMw: 2530, outputMw: 600, latitude: 36.804, longitude: -121.78, operator: 'Vistra', detail: 'Gas + colocated BESS', onlineYear: 1950, region: 'Pacific' },
  { id: 'g-alamitos', name: 'Alamitos Energy Center', technology: 'natural_gas', stateAbbr: 'CA', stateName: 'California', capacityMw: 1950, outputMw: 700, latitude: 33.769, longitude: -118.101, operator: 'AES', detail: 'Coastal redevelopment', onlineYear: 1956, region: 'Pacific' },
  { id: 'g-haynes', name: 'Haynes Generating Station', technology: 'natural_gas', stateAbbr: 'CA', stateName: 'California', capacityMw: 1570, outputMw: 500, latitude: 33.766, longitude: -118.097, operator: 'LADWP', detail: 'Coastal', onlineYear: 1962, region: 'Pacific' },
  { id: 'g-jackson', name: 'Jackson Generation', technology: 'natural_gas', stateAbbr: 'IL', stateName: 'Illinois', capacityMw: 1200, outputMw: 600, latitude: 41.3, longitude: -88.15, operator: 'Competitive Power Ventures', detail: 'CCGT', onlineYear: 2022, region: 'Midwest' },
  { id: 'g-tenaska-frontier', name: 'Tenaska Frontier', technology: 'natural_gas', stateAbbr: 'TX', stateName: 'Texas', capacityMw: 830, outputMw: 400, latitude: 30.47, longitude: -96.0, operator: 'Tenaska', detail: 'CCGT', onlineYear: 2000, region: 'Texas' },
  { id: 'g-port-westward', name: 'Port Westward', technology: 'natural_gas', stateAbbr: 'OR', stateName: 'Oregon', capacityMw: 650, outputMw: 300, latitude: 46.18, longitude: -123.17, operator: 'PGE', detail: 'CCGT', onlineYear: 2007, region: 'Pacific' },
  { id: 'g-hermiston', name: 'Hermiston Generating', technology: 'natural_gas', stateAbbr: 'OR', stateName: 'Oregon', capacityMw: 474, outputMw: 220, latitude: 45.82, longitude: -119.37, operator: 'Hermiston / PacifiCorp', detail: 'CCGT', onlineYear: 1996, region: 'Pacific' },
  { id: 'g-cape-canaveral', name: 'Cape Canaveral Next Generation', technology: 'natural_gas', stateAbbr: 'FL', stateName: 'Florida', capacityMw: 1290, outputMw: 650, latitude: 28.47, longitude: -80.57, operator: 'FPL', detail: 'CCGT', onlineYear: 2013, region: 'Southeast' },
  { id: 'g-sanford', name: 'Sanford', technology: 'natural_gas', stateAbbr: 'FL', stateName: 'Florida', capacityMw: 2050, outputMw: 1000, latitude: 28.84, longitude: -81.33, operator: 'Duke Energy', detail: 'CCGT / dual fuel', onlineYear: 2002, region: 'Southeast' },
  { id: 'g-baytown', name: 'Baytown Energy Center', technology: 'natural_gas', stateAbbr: 'TX', stateName: 'Texas', capacityMw: 850, outputMw: 420, latitude: 29.74, longitude: -94.98, operator: 'Calpine', detail: 'CCGT · industrial', onlineYear: 2002, region: 'Texas' },
  { id: 'g-delta', name: 'Delta Energy Center', technology: 'natural_gas', stateAbbr: 'CA', stateName: 'California', capacityMw: 880, outputMw: 400, latitude: 38.02, longitude: -121.89, operator: 'Calpine', detail: 'CCGT', onlineYear: 2002, region: 'Pacific' },
  { id: 'g-gateway', name: 'Gateway Generating Station', technology: 'natural_gas', stateAbbr: 'CA', stateName: 'California', capacityMw: 530, outputMw: 220, latitude: 38.017, longitude: -121.763, operator: 'PG&E', detail: 'CCGT', onlineYear: 2009, region: 'Pacific' },
  { id: 'g-eagle-mountain', name: 'Eagle Mountain Energy Center', technology: 'natural_gas', stateAbbr: 'TX', stateName: 'Texas', capacityMw: 1350, outputMw: 650, latitude: 32.85, longitude: -97.5, operator: 'Engie / others', detail: 'CCGT ERCOT', onlineYear: 2024, region: 'Texas' },
  { id: 'g-marshall', name: 'Marshall (gas conversion path)', technology: 'natural_gas', stateAbbr: 'NC', stateName: 'North Carolina', capacityMw: 2100, outputMw: 900, latitude: 35.6, longitude: -80.96, operator: 'Duke Energy', detail: 'Coal-to-gas transition fleet', onlineYear: 1965, region: 'Southeast' },

  // ── Wind ─────────────────────────────────────────────────
  { id: 'w-alta', name: 'Alta Wind Energy Center', technology: 'wind', stateAbbr: 'CA', stateName: 'California', capacityMw: 1548, outputMw: 480, latitude: 35.02, longitude: -118.32, operator: 'Terra-Gen / NextEra', detail: 'Tehachapi', onlineYear: 2010, region: 'Pacific', note: 'Largest US wind complex historically.' },
  { id: 'w-shepherds-flat', name: 'Shepherds Flat', technology: 'wind', stateAbbr: 'OR', stateName: 'Oregon', capacityMw: 845, outputMw: 280, latitude: 45.7, longitude: -120.06, operator: 'Caithness / GE', detail: 'Columbia Plateau', onlineYear: 2012, region: 'Pacific' },
  { id: 'w-roscoe', name: 'Roscoe Wind Farm', technology: 'wind', stateAbbr: 'TX', stateName: 'Texas', capacityMw: 781, outputMw: 260, latitude: 32.47, longitude: -100.67, operator: 'E.ON / RWE', detail: 'West Texas', onlineYear: 2009, region: 'Texas' },
  { id: 'w-horse-hollow', name: 'Horse Hollow', technology: 'wind', stateAbbr: 'TX', stateName: 'Texas', capacityMw: 735, outputMw: 250, latitude: 32.22, longitude: -100.05, operator: 'NextEra', detail: 'West Texas', onlineYear: 2006, region: 'Texas' },
  { id: 'w-capricorn-ridge', name: 'Capricorn Ridge', technology: 'wind', stateAbbr: 'TX', stateName: 'Texas', capacityMw: 662, outputMw: 220, latitude: 31.9, longitude: -100.9, operator: 'NextEra', detail: 'West Texas', onlineYear: 2007, region: 'Texas' },
  { id: 'w-fowler-ridge', name: 'Fowler Ridge', technology: 'wind', stateAbbr: 'IN', stateName: 'Indiana', capacityMw: 600, outputMw: 200, latitude: 40.58, longitude: -87.32, operator: 'BP / Dominion', detail: 'Midwest', onlineYear: 2009, region: 'Midwest' },
  { id: 'w-buffalo-gap', name: 'Buffalo Gap', technology: 'wind', stateAbbr: 'TX', stateName: 'Texas', capacityMw: 523, outputMw: 175, latitude: 32.3, longitude: -100.15, operator: 'AES', detail: 'West Texas', onlineYear: 2005, region: 'Texas' },
  { id: 'w-sweetwater', name: 'Sweetwater Wind', technology: 'wind', stateAbbr: 'TX', stateName: 'Texas', capacityMw: 585, outputMw: 195, latitude: 32.4, longitude: -100.4, operator: 'Lower Colorado River Auth / others', detail: 'West Texas', onlineYear: 2003, region: 'Texas' },
  { id: 'w-traverse', name: 'Traverse Wind Energy Center', technology: 'wind', stateAbbr: 'OK', stateName: 'Oklahoma', capacityMw: 999, outputMw: 350, latitude: 36.4, longitude: -98.3, operator: 'NextEra', detail: 'OK panhandle region', onlineYear: 2021, region: 'South Central' },
  { id: 'w-salkum', name: 'Lower Snake River Wind', technology: 'wind', stateAbbr: 'WA', stateName: 'Washington', capacityMw: 343, outputMw: 110, latitude: 46.4, longitude: -117.85, operator: 'Puget Sound Energy', detail: 'SE Washington', onlineYear: 2012, region: 'Pacific' },
  { id: 'w-block-island', name: 'Block Island Wind Farm', technology: 'wind', stateAbbr: 'RI', stateName: 'Rhode Island', capacityMw: 30, outputMw: 12, latitude: 41.12, longitude: -71.52, operator: 'Ørsted', detail: 'Offshore pilot', onlineYear: 2016, region: 'Northeast' },
  { id: 'w-vineyard', name: 'Vineyard Wind 1', technology: 'wind', stateAbbr: 'MA', stateName: 'Massachusetts', capacityMw: 800, outputMw: 350, latitude: 41.05, longitude: -70.5, operator: 'Avangrid / CIP', detail: 'Offshore', onlineYear: 2024, region: 'Northeast' },
  { id: 'w-south-fork', name: 'South Fork Wind', technology: 'wind', stateAbbr: 'NY', stateName: 'New York', capacityMw: 132, outputMw: 55, latitude: 41.1, longitude: -71.7, operator: 'Ørsted / Eversource', detail: 'Offshore', onlineYear: 2024, region: 'Northeast' },
  { id: 'w-buffalo-ridge', name: 'Buffalo Ridge (MN complex)', technology: 'wind', stateAbbr: 'MN', stateName: 'Minnesota', capacityMw: 450, outputMw: 150, latitude: 44.0, longitude: -96.2, operator: 'Multiple', detail: 'Upper Midwest', onlineYear: 2006, region: 'Midwest' },
  { id: 'w-flat-ridge', name: 'Flat Ridge', technology: 'wind', stateAbbr: 'KS', stateName: 'Kansas', capacityMw: 570, outputMw: 190, latitude: 37.35, longitude: -98.2, operator: 'BP / others', detail: 'Southern KS', onlineYear: 2009, region: 'South Central' },
  { id: 'w-meadow-lake', name: 'Meadow Lake', technology: 'wind', stateAbbr: 'IN', stateName: 'Indiana', capacityMw: 801, outputMw: 270, latitude: 40.6, longitude: -87.0, operator: 'EDP Renewables', detail: 'Midwest', onlineYear: 2009, region: 'Midwest' },
  { id: 'w-los-vientos', name: 'Los Vientos', technology: 'wind', stateAbbr: 'TX', stateName: 'Texas', capacityMw: 912, outputMw: 310, latitude: 26.4, longitude: -97.6, operator: 'Duke Energy', detail: 'South Texas', onlineYear: 2012, region: 'Texas' },

  // ── Solar ────────────────────────────────────────────────
  { id: 's-solar-star', name: 'Solar Star', technology: 'solar', stateAbbr: 'CA', stateName: 'California', capacityMw: 579, outputMw: 350, latitude: 34.86, longitude: -118.35, operator: 'BHE Renewables', detail: 'Antelope Valley PV', onlineYear: 2015, region: 'Pacific' },
  { id: 's-topaz', name: 'Topaz Solar Farm', technology: 'solar', stateAbbr: 'CA', stateName: 'California', capacityMw: 550, outputMw: 320, latitude: 35.39, longitude: -120.07, operator: 'BHE Renewables', detail: 'Carrizo Plain', onlineYear: 2014, region: 'Pacific' },
  { id: 's-desert-sunlight', name: 'Desert Sunlight', technology: 'solar', stateAbbr: 'CA', stateName: 'California', capacityMw: 550, outputMw: 320, latitude: 33.82, longitude: -115.4, operator: 'NextEra', detail: 'Desert Center', onlineYear: 2015, region: 'Pacific' },
  { id: 's-ivanpah', name: 'Ivanpah Solar Electric', technology: 'solar', stateAbbr: 'CA', stateName: 'California', capacityMw: 392, outputMw: 180, latitude: 35.57, longitude: -115.47, operator: 'NRG / BrightSource', detail: 'CSP tower', onlineYear: 2014, region: 'Pacific' },
  { id: 's-copper-mountain', name: 'Copper Mountain Solar', technology: 'solar', stateAbbr: 'NV', stateName: 'Nevada', capacityMw: 552, outputMw: 320, latitude: 35.78, longitude: -114.99, operator: 'Sempra', detail: 'Boulder City area', onlineYear: 2010, region: 'Southwest' },
  { id: 's-agua-caliente', name: 'Agua Caliente', technology: 'solar', stateAbbr: 'AZ', stateName: 'Arizona', capacityMw: 290, outputMw: 170, latitude: 32.98, longitude: -113.49, operator: 'First Solar / NRG', detail: 'Yuma County', onlineYear: 2014, region: 'Southwest' },
  { id: 's-mount-signal', name: 'Mount Signal Solar', technology: 'solar', stateAbbr: 'CA', stateName: 'California', capacityMw: 794, outputMw: 460, latitude: 32.68, longitude: -115.64, operator: '8minutenergy / others', detail: 'Imperial Valley', onlineYear: 2014, region: 'Pacific' },
  { id: 's-edwards-sanborn', name: 'Edwards & Sanborn Solar', technology: 'solar', stateAbbr: 'CA', stateName: 'California', capacityMw: 875, outputMw: 500, latitude: 34.9, longitude: -117.9, operator: 'Terra-Gen', detail: 'Kern hybrid', onlineYear: 2022, region: 'Pacific' },
  { id: 's-gemini', name: 'Gemini Solar', technology: 'solar', stateAbbr: 'NV', stateName: 'Nevada', capacityMw: 690, outputMw: 400, latitude: 36.4, longitude: -114.8, operator: 'Quinbrook / Arevon', detail: 'Moapa area + storage', onlineYear: 2023, region: 'Southwest' },
  { id: 's-quinebaug', name: 'Quinebaug / New England PV cluster', technology: 'solar', stateAbbr: 'CT', stateName: 'Connecticut', capacityMw: 50, outputMw: 28, latitude: 41.8, longitude: -71.9, operator: 'Multiple', detail: 'Distributed utility PV sample', onlineYear: 2019, region: 'Northeast' },
  { id: 's-cattlemen', name: 'Cattlemen Solar', technology: 'solar', stateAbbr: 'TX', stateName: 'Texas', capacityMw: 420, outputMw: 250, latitude: 31.5, longitude: -101.5, operator: 'Multiple / NextEra area', detail: 'West Texas PV', onlineYear: 2022, region: 'Texas' },
  { id: 's-prospero', name: 'Prospero Solar', technology: 'solar', stateAbbr: 'TX', stateName: 'Texas', capacityMw: 479, outputMw: 280, latitude: 32.0, longitude: -102.0, operator: 'Ørsted', detail: 'Andrews County', onlineYear: 2021, region: 'Texas' },
  { id: 's-sampson', name: 'Sampson Solar', technology: 'solar', stateAbbr: 'NC', stateName: 'North Carolina', capacityMw: 160, outputMw: 95, latitude: 34.9, longitude: -78.4, operator: 'Duke / others', detail: 'SE solar belt', onlineYear: 2018, region: 'Southeast' },
  { id: 's-misae', name: 'Misae Solar', technology: 'solar', stateAbbr: 'TX', stateName: 'Texas', capacityMw: 240, outputMw: 140, latitude: 33.0, longitude: -101.5, operator: 'SB Energy', detail: 'West Texas', onlineYear: 2020, region: 'Texas' },
  { id: 's-arbor-hill', name: 'Arbor Hill Solar', technology: 'solar', stateAbbr: 'IA', stateName: 'Iowa', capacityMw: 100, outputMw: 55, latitude: 41.4, longitude: -94.0, operator: 'MidAmerican', detail: 'Midwest PV', onlineYear: 2021, region: 'Midwest' },

  // ── Geothermal ───────────────────────────────────────────
  { id: 'geo-geysers', name: 'The Geysers', technology: 'geothermal', stateAbbr: 'CA', stateName: 'California', capacityMw: 725, outputMw: 550, latitude: 38.79, longitude: -122.76, operator: 'Calpine', detail: 'Dry steam field', onlineYear: 1960, region: 'Pacific', note: 'Largest geothermal complex worldwide.' },
  { id: 'geo-salton', name: 'Salton Sea geothermal cluster', technology: 'geothermal', stateAbbr: 'CA', stateName: 'California', capacityMw: 400, outputMw: 320, latitude: 33.2, longitude: -115.6, operator: 'Multiple / IID area', detail: 'Imperial Valley', onlineYear: 1982, region: 'Pacific' },
  { id: 'geo-coso', name: 'Coso', technology: 'geothermal', stateAbbr: 'CA', stateName: 'California', capacityMw: 270, outputMw: 200, latitude: 36.0, longitude: -117.8, operator: 'Coso Operating Co.', detail: 'Naval Air Weapons Station', onlineYear: 1987, region: 'Pacific' },
  { id: 'geo-heber', name: 'Heber geothermal', technology: 'geothermal', stateAbbr: 'CA', stateName: 'California', capacityMw: 92, outputMw: 70, latitude: 32.73, longitude: -115.53, operator: 'Ormat / others', detail: 'Imperial', onlineYear: 1985, region: 'Pacific' },
  { id: 'geo-dixie-valley', name: 'Dixie Valley', technology: 'geothermal', stateAbbr: 'NV', stateName: 'Nevada', capacityMw: 62, outputMw: 48, latitude: 39.97, longitude: -117.86, operator: 'Ormat', detail: 'Basin and Range', onlineYear: 1988, region: 'Southwest' },
  { id: 'geo-steamboat', name: 'Steamboat (Reno area)', technology: 'geothermal', stateAbbr: 'NV', stateName: 'Nevada', capacityMw: 84, outputMw: 65, latitude: 39.39, longitude: -119.75, operator: 'Ormat', detail: 'Steamboat Hills', onlineYear: 1988, region: 'Southwest' },
  { id: 'geo-mcginness', name: 'McGinness Hills', technology: 'geothermal', stateAbbr: 'NV', stateName: 'Nevada', capacityMw: 140, outputMw: 110, latitude: 39.6, longitude: -116.9, operator: 'Ormat', detail: 'Lander County', onlineYear: 2012, region: 'Southwest' },
  { id: 'geo-tuscarora', name: 'Tuscarora', technology: 'geothermal', stateAbbr: 'NV', stateName: 'Nevada', capacityMw: 32, outputMw: 25, latitude: 41.3, longitude: -116.2, operator: 'Ormat', detail: 'NE Nevada', onlineYear: 2012, region: 'Southwest' },
  { id: 'geo-puna', name: 'Puna Geothermal Venture', technology: 'geothermal', stateAbbr: 'HI', stateName: 'Hawaii', capacityMw: 38, outputMw: 25, latitude: 19.48, longitude: -154.89, operator: 'Ormat', detail: 'Big Island', onlineYear: 1993, region: 'Pacific' },
  { id: 'geo-blundell', name: 'Blundell', technology: 'geothermal', stateAbbr: 'UT', stateName: 'Utah', capacityMw: 34, outputMw: 26, latitude: 38.5, longitude: -112.85, operator: 'PacifiCorp', detail: 'Roosevelt Hot Springs', onlineYear: 1984, region: 'Mountain' },

  // ── Biomass / waste ──────────────────────────────────────
  { id: 'b-wheelabrator', name: 'Wheelabrator / waste-to-energy sample', technology: 'biomass', stateAbbr: 'MA', stateName: 'Massachusetts', capacityMw: 68, outputMw: 45, latitude: 42.1, longitude: -71.0, operator: 'Wheelabrator', detail: 'MSW', onlineYear: 1985, region: 'Northeast' },
  { id: 'b-covanta', name: 'Covanta Delaware Valley', technology: 'biomass', stateAbbr: 'PA', stateName: 'Pennsylvania', capacityMw: 90, outputMw: 60, latitude: 39.85, longitude: -75.35, operator: 'Covanta', detail: 'MSW', onlineYear: 1991, region: 'Mid-Atlantic' },
  { id: 'b-gainesville', name: 'Gainesville Renewable Energy Center', technology: 'biomass', stateAbbr: 'FL', stateName: 'Florida', capacityMw: 102, outputMw: 70, latitude: 29.7, longitude: -82.4, operator: 'GREC', detail: 'Wood biomass', onlineYear: 2013, region: 'Southeast' },
  { id: 'b-plainfield', name: 'Plainfield Renewable Energy', technology: 'biomass', stateAbbr: 'CT', stateName: 'Connecticut', capacityMw: 37, outputMw: 28, latitude: 41.68, longitude: -71.92, operator: 'PRE', detail: 'Wood', onlineYear: 2013, region: 'Northeast' },
  { id: 'b-multitrade', name: 'Multitrade of Pittsylvania', technology: 'biomass', stateAbbr: 'VA', stateName: 'Virginia', capacityMw: 83, outputMw: 55, latitude: 36.8, longitude: -79.4, operator: 'Multitrade', detail: 'Wood', onlineYear: 1994, region: 'Mid-Atlantic' },
  { id: 'b-sacramento', name: 'Sacramento biomass / landfill gas cluster', technology: 'biomass', stateAbbr: 'CA', stateName: 'California', capacityMw: 50, outputMw: 30, latitude: 38.5, longitude: -121.4, operator: 'Multiple', detail: 'LFG + wood', onlineYear: 1990, region: 'Pacific' },
  { id: 'b-honolulu', name: 'HPOWER', technology: 'biomass', stateAbbr: 'HI', stateName: 'Hawaii', capacityMw: 90, outputMw: 60, latitude: 21.3, longitude: -158.0, operator: 'Covanta', detail: 'MSW Honolulu', onlineYear: 1990, region: 'Pacific' },
  { id: 'b-mead', name: 'Mead Westvaco / pulp mill cogen sample', technology: 'biomass', stateAbbr: 'SC', stateName: 'South Carolina', capacityMw: 100, outputMw: 70, latitude: 33.2, longitude: -80.0, operator: 'Industrial cogen', detail: 'Black liquor / wood', onlineYear: 1980, region: 'Southeast' },

  // ── Battery storage ──────────────────────────────────────
  { id: 'bat-moss', name: 'Moss Landing Energy Storage', technology: 'battery', stateAbbr: 'CA', stateName: 'California', capacityMw: 750, outputMw: -200, latitude: 36.805, longitude: -121.782, operator: 'Vistra', detail: 'Lithium-ion', onlineYear: 2021, region: 'Pacific', note: 'Among largest US BESS.' },
  { id: 'bat-edwards', name: 'Edwards & Sanborn BESS', technology: 'battery', stateAbbr: 'CA', stateName: 'California', capacityMw: 3285, outputMw: -800, latitude: 34.905, longitude: -117.905, operator: 'Terra-Gen', detail: 'Hybrid with solar', onlineYear: 2022, region: 'Pacific' },
  { id: 'bat-alamitos', name: 'Alamitos BESS', technology: 'battery', stateAbbr: 'CA', stateName: 'California', capacityMw: 100, outputMw: -30, latitude: 33.77, longitude: -118.1, operator: 'AES', detail: 'Coastal', onlineYear: 2021, region: 'Pacific' },
  { id: 'bat-gateway', name: 'Gateway Energy Storage', technology: 'battery', stateAbbr: 'CA', stateName: 'California', capacityMw: 250, outputMw: -80, latitude: 32.9, longitude: -115.5, operator: 'LS Power', detail: 'Imperial', onlineYear: 2020, region: 'Pacific' },
  { id: 'bat-gemini', name: 'Gemini Storage', technology: 'battery', stateAbbr: 'NV', stateName: 'Nevada', capacityMw: 380, outputMw: -120, latitude: 36.4, longitude: -114.8, operator: 'Arevon', detail: 'With Gemini solar', onlineYear: 2023, region: 'Southwest' },
  { id: 'bat-manatee', name: 'Manatee Energy Storage', technology: 'battery', stateAbbr: 'FL', stateName: 'Florida', capacityMw: 409, outputMw: -150, latitude: 27.5, longitude: -82.4, operator: 'FPL', detail: 'Lithium-ion', onlineYear: 2021, region: 'Southeast' },
  { id: 'bat-hickory-park', name: 'Hickory Park', technology: 'battery', stateAbbr: 'GA', stateName: 'Georgia', capacityMw: 195, outputMw: -60, latitude: 31.5, longitude: -83.5, operator: 'NextEra', detail: 'With solar', onlineYear: 2022, region: 'Southeast' },
  { id: 'bat-eunice', name: 'Eunice / West Texas BESS sample', technology: 'battery', stateAbbr: 'TX', stateName: 'Texas', capacityMw: 200, outputMw: -70, latitude: 32.4, longitude: -102.4, operator: 'Multiple ERCOT', detail: 'ERCOT storage', onlineYear: 2023, region: 'Texas' },
  { id: 'bat-limestone', name: 'Limestone / TX storage sample', technology: 'battery', stateAbbr: 'TX', stateName: 'Texas', capacityMw: 150, outputMw: -50, latitude: 31.4, longitude: -96.2, operator: 'Multiple', detail: 'ERCOT', onlineYear: 2022, region: 'Texas' },
  { id: 'bat-sierra', name: 'Sierra Estrella / AZ storage', technology: 'battery', stateAbbr: 'AZ', stateName: 'Arizona', capacityMw: 100, outputMw: -35, latitude: 33.2, longitude: -112.3, operator: 'APS / others', detail: 'Desert SW', onlineYear: 2023, region: 'Southwest' },

  // ── Other / oil / dual-fuel peaking ───────────────────────
  { id: 'o-astoria', name: 'Astoria Generating (oil/gas peakers)', technology: 'other', stateAbbr: 'NY', stateName: 'New York', capacityMw: 1290, outputMw: 200, latitude: 40.78, longitude: -73.9, operator: 'NRG / others', detail: 'Peaking oil/gas', onlineYear: 1950, region: 'Northeast' },
  { id: 'o-northport', name: 'Northport', technology: 'other', stateAbbr: 'NY', stateName: 'New York', capacityMw: 1560, outputMw: 300, latitude: 40.92, longitude: -73.34, operator: 'National Grid', detail: 'Oil/gas steam', onlineYear: 1967, region: 'Northeast' },
  { id: 'o-kahe', name: 'Kahe', technology: 'other', stateAbbr: 'HI', stateName: 'Hawaii', capacityMw: 650, outputMw: 350, latitude: 21.35, longitude: -158.13, operator: 'HECO', detail: 'Oil-fired', onlineYear: 1963, region: 'Pacific' },
  { id: 'o-waiau', name: 'Waiau', technology: 'other', stateAbbr: 'HI', stateName: 'Hawaii', capacityMw: 500, outputMw: 250, latitude: 21.39, longitude: -157.97, operator: 'HECO', detail: 'Oil-fired', onlineYear: 1938, region: 'Pacific' },
  { id: 'o-canal', name: 'Canal Generating', technology: 'other', stateAbbr: 'MA', stateName: 'Massachusetts', capacityMw: 1120, outputMw: 150, latitude: 41.77, longitude: -70.52, operator: 'Canal Generating', detail: 'Oil/gas', onlineYear: 1968, region: 'Northeast' },
  { id: 'o-newington', name: 'Newington', technology: 'other', stateAbbr: 'NH', stateName: 'New Hampshire', capacityMw: 400, outputMw: 80, latitude: 43.1, longitude: -70.8, operator: 'Granite Shore', detail: 'Oil/gas peaker', onlineYear: 1974, region: 'Northeast' },
]

/** Unified catalog: every technology including major hydro */
export const US_ENERGY_PLANTS: UsEnergyPlant[] = [
  ...US_NON_HYDRO_PLANTS,
  ...US_HYDRO_PLANTS.map(hydroToEnergy),
].sort((a, b) => b.capacityMw - a.capacityMw)

export function plantsByTech(
  tech: Technology | 'all' = 'all',
  plants: UsEnergyPlant[] = US_ENERGY_PLANTS
): UsEnergyPlant[] {
  if (tech === 'all') return plants
  return plants.filter((p) => p.technology === tech)
}

export function plantTechTotals(plants: UsEnergyPlant[] = US_ENERGY_PLANTS) {
  const map = new Map<
    Technology,
    { technology: Technology; count: number; capacityMw: number; states: number }
  >()
  for (const t of TECH_ORDER) {
    map.set(t, { technology: t, count: 0, capacityMw: 0, states: 0 })
  }
  const stateSets = new Map<Technology, Set<string>>()
  for (const p of plants) {
    const cur = map.get(p.technology) ?? {
      technology: p.technology,
      count: 0,
      capacityMw: 0,
      states: 0,
    }
    cur.count += 1
    cur.capacityMw += p.capacityMw
    map.set(p.technology, cur)
    const set = stateSets.get(p.technology) ?? new Set()
    set.add(p.stateAbbr)
    stateSets.set(p.technology, set)
  }
  for (const [t, row] of map) {
    row.states = stateSets.get(t)?.size ?? 0
  }
  return TECH_ORDER.map((t) => map.get(t)!).filter((r) => r.count > 0)
}

export function plantsByState(plants: UsEnergyPlant[] = US_ENERGY_PLANTS) {
  const map = new Map<
    string,
    { stateAbbr: string; stateName: string; count: number; capacityMw: number }
  >()
  for (const p of plants) {
    const cur = map.get(p.stateAbbr) ?? {
      stateAbbr: p.stateAbbr,
      stateName: p.stateName,
      count: 0,
      capacityMw: 0,
    }
    cur.count += 1
    cur.capacityMw += p.capacityMw
    map.set(p.stateAbbr, cur)
  }
  return [...map.values()].sort((a, b) => b.capacityMw - a.capacityMw)
}

export function plantsByOperator(plants: UsEnergyPlant[] = US_ENERGY_PLANTS) {
  const map = new Map<string, { operator: string; count: number; capacityMw: number }>()
  for (const p of plants) {
    const cur = map.get(p.operator) ?? { operator: p.operator, count: 0, capacityMw: 0 }
    cur.count += 1
    cur.capacityMw += p.capacityMw
    map.set(p.operator, cur)
  }
  return [...map.values()].sort((a, b) => b.capacityMw - a.capacityMw)
}

export function energyPlantTotals(plants: UsEnergyPlant[] = US_ENERGY_PLANTS) {
  const capacityMw = plants.reduce((s, p) => s + p.capacityMw, 0)
  const states = new Set(plants.map((p) => p.stateAbbr)).size
  const byTech = plantTechTotals(plants)
  return {
    count: plants.length,
    capacityGw: capacityMw / 1000,
    states,
    techCount: byTech.length,
    byTech,
  }
}

function plantToAsset(p: UsEnergyPlant): PortfolioAsset {
  return {
    id: p.id,
    name: p.name,
    technology: p.technology,
    capacityMw: p.capacityMw,
    outputMw: p.outputMw,
    latitude: p.latitude,
    longitude: p.longitude,
    region: p.region,
    county: `${p.detail} · ${p.stateName}`,
    stateAbbr: p.stateAbbr,
    status: p.outputMw === 0 && p.note?.toLowerCase().includes('retired')
      ? 'retired-planned'
      : 'operating',
  }
}

const TECH_SECTOR: Partial<Record<Technology, EnergyPortfolio['sector']>> = {
  hydro: 'hydro system',
  solar: 'renewables',
  wind: 'renewables',
  battery: 'storage',
  nuclear: 'wholesale gen',
  coal: 'wholesale gen',
  natural_gas: 'wholesale gen',
  geothermal: 'renewables',
  biomass: 'wholesale gen',
  other: 'wholesale gen',
}

/**
 * Group non-hydro major plants into technology fleet portfolios for the map.
 * Hydro operator fleets still come from buildUsHydroPortfolios().
 */
export function buildUsTechPlantPortfolios(
  plants: UsEnergyPlant[] = US_NON_HYDRO_PLANTS
): EnergyPortfolio[] {
  const byTech = new Map<Technology, UsEnergyPlant[]>()
  for (const p of plants) {
    const list = byTech.get(p.technology) ?? []
    list.push(p)
    byTech.set(p.technology, list)
  }

  return TECH_ORDER.filter((t) => t !== 'hydro' && byTech.has(t))
    .map((tech) => {
      const list = byTech.get(tech)!
      const cap = list.reduce((s, p) => s + p.capacityMw, 0)
      const states = [...new Set(list.map((p) => p.stateAbbr))].sort()
      const primary = list.slice().sort((a, b) => b.capacityMw - a.capacityMw)[0]
      return {
        id: `us-tech-${tech}`,
        name: `US major ${tech.split('_').join(' ')} plants`,
        short: tech === 'natural_gas' ? 'US Gas plants' : `US ${tech}`,
        kind: 'Generator' as const,
        sector: TECH_SECTOR[tech] ?? 'wholesale gen',
        stateAbbr: primary.stateAbbr,
        stateName: primary.stateName,
        hq: states.slice(0, 8).join(', ') + (states.length > 8 ? '…' : ''),
        notes: `${list.length} mapped ${tech.split('_').join(' ')} plants · ${states.length} states · ${(cap / 1000).toFixed(1)} GW nameplate sample (EIA-scale flagship sites).`,
        assets: list.map(plantToAsset),
      } satisfies EnergyPortfolio
    })
    .sort((a, b) => {
      const ca = a.assets.reduce((s, x) => s + x.capacityMw, 0)
      const cb = b.assets.reduce((s, x) => s + x.capacityMw, 0)
      return cb - ca
    })
}
