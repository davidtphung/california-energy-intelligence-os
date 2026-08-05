/**
 * Major US hydroelectric plants (conventional + pumped storage).
 * Nameplate MW are EIA / operator-scale samples for map UX - not a live inventory.
 * Wire to EIA-860, USACE, USBR, TVA, and BPA plant lists in production.
 */

import type { EnergyPortfolio, PortfolioAsset } from './portfolios'

export type HydroKind = 'conventional' | 'pumped-storage' | 'run-of-river'

export interface UsHydroPlant {
  id: string
  name: string
  stateAbbr: string
  stateName: string
  capacityMw: number
  /** Typical sample output MW for map rings */
  outputMw: number
  latitude: number
  longitude: number
  operator: string
  river: string
  kind: HydroKind
  onlineYear: number
  region: string
  note?: string
}

/** Flagship and large hydro fleet across the United States */
export const US_HYDRO_PLANTS: UsHydroPlant[] = [
  // Pacific Northwest - Columbia / Snake
  { id: 'h-grand-coulee', name: 'Grand Coulee', stateAbbr: 'WA', stateName: 'Washington', capacityMw: 6809, outputMw: 3200, latitude: 47.956, longitude: -118.982, operator: 'USBR', river: 'Columbia', kind: 'conventional', onlineYear: 1941, region: 'Pacific', note: 'Largest US power plant by capacity.' },
  { id: 'h-chief-joseph', name: 'Chief Joseph', stateAbbr: 'WA', stateName: 'Washington', capacityMw: 2620, outputMw: 1400, latitude: 47.995, longitude: -119.64, operator: 'USACE', river: 'Columbia', kind: 'conventional', onlineYear: 1955, region: 'Pacific' },
  { id: 'h-john-day', name: 'John Day', stateAbbr: 'OR', stateName: 'Oregon', capacityMw: 2160, outputMw: 1100, latitude: 45.716, longitude: -120.694, operator: 'USACE', river: 'Columbia', kind: 'conventional', onlineYear: 1968, region: 'Pacific' },
  { id: 'h-the-dalles', name: 'The Dalles', stateAbbr: 'OR', stateName: 'Oregon', capacityMw: 2070, outputMw: 1000, latitude: 45.614, longitude: -121.134, operator: 'USACE', river: 'Columbia', kind: 'conventional', onlineYear: 1957, region: 'Pacific' },
  { id: 'h-mcnary', name: 'McNary', stateAbbr: 'OR', stateName: 'Oregon', capacityMw: 1127, outputMw: 600, latitude: 45.935, longitude: -119.298, operator: 'USACE', river: 'Columbia', kind: 'conventional', onlineYear: 1954, region: 'Pacific' },
  { id: 'h-bonneville', name: 'Bonneville', stateAbbr: 'OR', stateName: 'Oregon', capacityMw: 1227, outputMw: 650, latitude: 45.644, longitude: -121.941, operator: 'USACE', river: 'Columbia', kind: 'conventional', onlineYear: 1938, region: 'Pacific' },
  { id: 'h-rocky-reach', name: 'Rocky Reach', stateAbbr: 'WA', stateName: 'Washington', capacityMw: 1300, outputMw: 700, latitude: 47.533, longitude: -120.295, operator: 'Chelan PUD', river: 'Columbia', kind: 'conventional', onlineYear: 1961, region: 'Pacific' },
  { id: 'h-wanapum', name: 'Wanapum', stateAbbr: 'WA', stateName: 'Washington', capacityMw: 1092, outputMw: 550, latitude: 46.873, longitude: -119.971, operator: 'Grant PUD', river: 'Columbia', kind: 'conventional', onlineYear: 1963, region: 'Pacific' },
  { id: 'h-priest-rapids', name: 'Priest Rapids', stateAbbr: 'WA', stateName: 'Washington', capacityMw: 956, outputMw: 480, latitude: 46.643, longitude: -119.909, operator: 'Grant PUD', river: 'Columbia', kind: 'conventional', onlineYear: 1959, region: 'Pacific' },
  { id: 'h-wells', name: 'Wells', stateAbbr: 'WA', stateName: 'Washington', capacityMw: 840, outputMw: 420, latitude: 47.947, longitude: -119.866, operator: 'Douglas PUD', river: 'Columbia', kind: 'conventional', onlineYear: 1967, region: 'Pacific' },
  { id: 'h-boundary', name: 'Boundary', stateAbbr: 'WA', stateName: 'Washington', capacityMw: 1050, outputMw: 500, latitude: 48.987, longitude: -117.349, operator: 'Seattle City Light', river: 'Pend Oreille', kind: 'conventional', onlineYear: 1967, region: 'Pacific' },
  { id: 'h-ice-harbor', name: 'Ice Harbor', stateAbbr: 'WA', stateName: 'Washington', capacityMw: 603, outputMw: 280, latitude: 46.25, longitude: -118.88, operator: 'USACE', river: 'Snake', kind: 'conventional', onlineYear: 1961, region: 'Pacific' },
  { id: 'h-lower-monumental', name: 'Lower Monumental', stateAbbr: 'WA', stateName: 'Washington', capacityMw: 810, outputMw: 350, latitude: 46.563, longitude: -118.538, operator: 'USACE', river: 'Snake', kind: 'conventional', onlineYear: 1969, region: 'Pacific' },
  { id: 'h-little-goose', name: 'Little Goose', stateAbbr: 'WA', stateName: 'Washington', capacityMw: 810, outputMw: 340, latitude: 46.587, longitude: -118.026, operator: 'USACE', river: 'Snake', kind: 'conventional', onlineYear: 1970, region: 'Pacific' },
  { id: 'h-lower-granite', name: 'Lower Granite', stateAbbr: 'WA', stateName: 'Washington', capacityMw: 810, outputMw: 330, latitude: 46.66, longitude: -117.428, operator: 'USACE', river: 'Snake', kind: 'conventional', onlineYear: 1975, region: 'Pacific' },
  { id: 'h-round-butte', name: 'Round Butte', stateAbbr: 'OR', stateName: 'Oregon', capacityMw: 425, outputMw: 200, latitude: 44.604, longitude: -121.276, operator: 'Portland General', river: 'Deschutes', kind: 'conventional', onlineYear: 1964, region: 'Pacific' },
  { id: 'h-hells-canyon', name: 'Hells Canyon', stateAbbr: 'ID', stateName: 'Idaho', capacityMw: 392, outputMw: 180, latitude: 45.253, longitude: -116.698, operator: 'Idaho Power', river: 'Snake', kind: 'conventional', onlineYear: 1967, region: 'Mountain' },
  { id: 'h-brownlee', name: 'Brownlee', stateAbbr: 'ID', stateName: 'Idaho', capacityMw: 585, outputMw: 280, latitude: 44.836, longitude: -116.9, operator: 'Idaho Power', river: 'Snake', kind: 'conventional', onlineYear: 1958, region: 'Mountain' },
  { id: 'h-oxbow', name: 'Oxbow', stateAbbr: 'OR', stateName: 'Oregon', capacityMw: 190, outputMw: 90, latitude: 44.968, longitude: -116.85, operator: 'Idaho Power', river: 'Snake', kind: 'conventional', onlineYear: 1961, region: 'Pacific' },
  { id: 'h-dworshak', name: 'Dworshak', stateAbbr: 'ID', stateName: 'Idaho', capacityMw: 400, outputMw: 180, latitude: 46.515, longitude: -116.296, operator: 'USACE', river: 'N. Fork Clearwater', kind: 'conventional', onlineYear: 1973, region: 'Mountain' },

  // California
  { id: 'h-helms', name: 'Helms Pumped Storage', stateAbbr: 'CA', stateName: 'California', capacityMw: 1212, outputMw: 400, latitude: 37.039, longitude: -119.101, operator: 'PG&E', river: 'Kings (pumped)', kind: 'pumped-storage', onlineYear: 1984, region: 'Pacific' },
  { id: 'h-castaic', name: 'Castaic Pumped Storage', stateAbbr: 'CA', stateName: 'California', capacityMw: 1247, outputMw: 350, latitude: 34.587, longitude: -118.657, operator: 'LADWP', river: 'CA Aqueduct (pumped)', kind: 'pumped-storage', onlineYear: 1972, region: 'Pacific' },
  { id: 'h-shasta', name: 'Shasta', stateAbbr: 'CA', stateName: 'California', capacityMw: 710, outputMw: 380, latitude: 40.718, longitude: -122.419, operator: 'USBR', river: 'Sacramento', kind: 'conventional', onlineYear: 1944, region: 'Pacific' },
  { id: 'h-oroville-hyatt', name: 'Hyatt (Oroville)', stateAbbr: 'CA', stateName: 'California', capacityMw: 645, outputMw: 280, latitude: 39.54, longitude: -121.485, operator: 'CA DWR', river: 'Feather', kind: 'conventional', onlineYear: 1968, region: 'Pacific' },
  { id: 'h-big-creek', name: 'Big Creek Hydro Complex', stateAbbr: 'CA', stateName: 'California', capacityMw: 1000, outputMw: 520, latitude: 37.206, longitude: -119.24, operator: 'SCE', river: 'San Joaquin tributaries', kind: 'conventional', onlineYear: 1913, region: 'Pacific' },
  { id: 'h-folsom', name: 'Folsom', stateAbbr: 'CA', stateName: 'California', capacityMw: 199, outputMw: 90, latitude: 38.708, longitude: -121.157, operator: 'USBR', river: 'American', kind: 'conventional', onlineYear: 1955, region: 'Pacific' },
  { id: 'h-new-melones', name: 'New Melones', stateAbbr: 'CA', stateName: 'California', capacityMw: 300, outputMw: 120, latitude: 37.948, longitude: -120.525, operator: 'USBR', river: 'Stanislaus', kind: 'conventional', onlineYear: 1979, region: 'Pacific' },
  { id: 'h-trinity', name: 'Trinity', stateAbbr: 'CA', stateName: 'California', capacityMw: 140, outputMw: 60, latitude: 40.801, longitude: -122.762, operator: 'USBR', river: 'Trinity', kind: 'conventional', onlineYear: 1964, region: 'Pacific' },
  { id: 'h-edward-hyatt-thermalito', name: 'Thermalito Pumped Storage', stateAbbr: 'CA', stateName: 'California', capacityMw: 120, outputMw: 40, latitude: 39.515, longitude: -121.63, operator: 'CA DWR', river: 'Feather (pumped)', kind: 'pumped-storage', onlineYear: 1968, region: 'Pacific' },
  { id: 'h-pit-river', name: 'Pit River cascade (PG&E)', stateAbbr: 'CA', stateName: 'California', capacityMw: 700, outputMw: 350, latitude: 40.98, longitude: -121.55, operator: 'PG&E', river: 'Pit', kind: 'conventional', onlineYear: 1922, region: 'Pacific' },

  // Colorado River / Southwest
  { id: 'h-hoover', name: 'Hoover Dam', stateAbbr: 'NV', stateName: 'Nevada', capacityMw: 2080, outputMw: 900, latitude: 36.016, longitude: -114.737, operator: 'USBR', river: 'Colorado', kind: 'conventional', onlineYear: 1936, region: 'Southwest', note: 'Power allocated to AZ, CA, NV entities.' },
  { id: 'h-glen-canyon', name: 'Glen Canyon', stateAbbr: 'AZ', stateName: 'Arizona', capacityMw: 1320, outputMw: 600, latitude: 36.937, longitude: -111.484, operator: 'USBR', river: 'Colorado', kind: 'conventional', onlineYear: 1964, region: 'Southwest' },
  { id: 'h-parker', name: 'Parker', stateAbbr: 'CA', stateName: 'California', capacityMw: 120, outputMw: 50, latitude: 34.296, longitude: -114.139, operator: 'USBR', river: 'Colorado', kind: 'conventional', onlineYear: 1942, region: 'Southwest' },
  { id: 'h-davis', name: 'Davis', stateAbbr: 'AZ', stateName: 'Arizona', capacityMw: 240, outputMw: 100, latitude: 35.197, longitude: -114.569, operator: 'USBR', river: 'Colorado', kind: 'conventional', onlineYear: 1951, region: 'Southwest' },
  { id: 'h-flaming-gorge', name: 'Flaming Gorge', stateAbbr: 'UT', stateName: 'Utah', capacityMw: 152, outputMw: 70, latitude: 40.915, longitude: -109.422, operator: 'USBR', river: 'Green', kind: 'conventional', onlineYear: 1963, region: 'Mountain' },
  { id: 'h-crystal', name: 'Crystal', stateAbbr: 'CO', stateName: 'Colorado', capacityMw: 28, outputMw: 12, latitude: 38.51, longitude: -107.333, operator: 'USBR', river: 'Gunnison', kind: 'conventional', onlineYear: 1978, region: 'Mountain' },
  { id: 'h-blue-mesa', name: 'Blue Mesa', stateAbbr: 'CO', stateName: 'Colorado', capacityMw: 86, outputMw: 35, latitude: 38.453, longitude: -107.335, operator: 'USBR', river: 'Gunnison', kind: 'conventional', onlineYear: 1967, region: 'Mountain' },
  { id: 'h-morrow-point', name: 'Morrow Point', stateAbbr: 'CO', stateName: 'Colorado', capacityMw: 173, outputMw: 70, latitude: 38.452, longitude: -107.538, operator: 'USBR', river: 'Gunnison', kind: 'conventional', onlineYear: 1970, region: 'Mountain' },

  // Montana / Missouri headwaters
  { id: 'h-libby', name: 'Libby', stateAbbr: 'MT', stateName: 'Montana', capacityMw: 600, outputMw: 280, latitude: 48.41, longitude: -115.315, operator: 'USACE', river: 'Kootenai', kind: 'conventional', onlineYear: 1975, region: 'Mountain' },
  { id: 'h-hungry-horse', name: 'Hungry Horse', stateAbbr: 'MT', stateName: 'Montana', capacityMw: 428, outputMw: 180, latitude: 48.341, longitude: -114.014, operator: 'USBR', river: 'S. Fork Flathead', kind: 'conventional', onlineYear: 1953, region: 'Mountain' },
  { id: 'h-fort-peck', name: 'Fort Peck', stateAbbr: 'MT', stateName: 'Montana', capacityMw: 185, outputMw: 80, latitude: 48.003, longitude: -106.416, operator: 'USACE', river: 'Missouri', kind: 'conventional', onlineYear: 1943, region: 'Mountain' },
  { id: 'h-noyes', name: 'Noxon Rapids', stateAbbr: 'MT', stateName: 'Montana', capacityMw: 527, outputMw: 220, latitude: 47.96, longitude: -115.735, operator: 'Avista', river: 'Clark Fork', kind: 'conventional', onlineYear: 1959, region: 'Mountain' },
  { id: 'h-kerr', name: 'Séliš Ksanka Qlispé (Kerr)', stateAbbr: 'MT', stateName: 'Montana', capacityMw: 194, outputMw: 90, latitude: 47.678, longitude: -114.234, operator: 'Energy Keepers / CSKT', river: 'Flathead', kind: 'conventional', onlineYear: 1938, region: 'Mountain' },

  // Missouri mainstem
  { id: 'h-garrison', name: 'Garrison', stateAbbr: 'ND', stateName: 'North Dakota', capacityMw: 583, outputMw: 250, latitude: 47.495, longitude: -101.412, operator: 'USACE', river: 'Missouri', kind: 'conventional', onlineYear: 1955, region: 'Midwest' },
  { id: 'h-oahe', name: 'Oahe', stateAbbr: 'SD', stateName: 'South Dakota', capacityMw: 786, outputMw: 320, latitude: 44.451, longitude: -100.399, operator: 'USACE', river: 'Missouri', kind: 'conventional', onlineYear: 1962, region: 'Midwest' },
  { id: 'h-big-bend', name: 'Big Bend', stateAbbr: 'SD', stateName: 'South Dakota', capacityMw: 520, outputMw: 200, latitude: 44.05, longitude: -99.448, operator: 'USACE', river: 'Missouri', kind: 'conventional', onlineYear: 1964, region: 'Midwest' },
  { id: 'h-fort-randall', name: 'Fort Randall', stateAbbr: 'SD', stateName: 'South Dakota', capacityMw: 320, outputMw: 130, latitude: 43.066, longitude: -98.554, operator: 'USACE', river: 'Missouri', kind: 'conventional', onlineYear: 1954, region: 'Midwest' },
  { id: 'h-gavins-point', name: 'Gavins Point', stateAbbr: 'SD', stateName: 'South Dakota', capacityMw: 132, outputMw: 55, latitude: 42.849, longitude: -97.483, operator: 'USACE', river: 'Missouri', kind: 'conventional', onlineYear: 1956, region: 'Midwest' },

  // TVA / Southeast
  { id: 'h-raccoon-mtn', name: 'Raccoon Mountain Pumped Storage', stateAbbr: 'TN', stateName: 'Tennessee', capacityMw: 1652, outputMw: 500, latitude: 35.048, longitude: -85.397, operator: 'TVA', river: 'Tennessee (pumped)', kind: 'pumped-storage', onlineYear: 1978, region: 'Southeast' },
  { id: 'h-wilson', name: 'Wilson', stateAbbr: 'AL', stateName: 'Alabama', capacityMw: 663, outputMw: 300, latitude: 34.801, longitude: -87.626, operator: 'TVA', river: 'Tennessee', kind: 'conventional', onlineYear: 1924, region: 'Southeast' },
  { id: 'h-wheeler', name: 'Wheeler', stateAbbr: 'AL', stateName: 'Alabama', capacityMw: 411, outputMw: 180, latitude: 34.807, longitude: -87.382, operator: 'TVA', river: 'Tennessee', kind: 'conventional', onlineYear: 1936, region: 'Southeast' },
  { id: 'h-guntersville', name: 'Guntersville', stateAbbr: 'AL', stateName: 'Alabama', capacityMw: 122, outputMw: 50, latitude: 34.423, longitude: -86.393, operator: 'TVA', river: 'Tennessee', kind: 'conventional', onlineYear: 1939, region: 'Southeast' },
  { id: 'h-chickamauga', name: 'Chickamauga', stateAbbr: 'TN', stateName: 'Tennessee', capacityMw: 160, outputMw: 70, latitude: 35.104, longitude: -85.229, operator: 'TVA', river: 'Tennessee', kind: 'conventional', onlineYear: 1940, region: 'Southeast' },
  { id: 'h-kentucky-dam', name: 'Kentucky Dam', stateAbbr: 'KY', stateName: 'Kentucky', capacityMw: 223, outputMw: 100, latitude: 37.013, longitude: -88.269, operator: 'TVA', river: 'Tennessee', kind: 'conventional', onlineYear: 1944, region: 'Southeast' },
  { id: 'h-fontana', name: 'Fontana', stateAbbr: 'NC', stateName: 'North Carolina', capacityMw: 294, outputMw: 120, latitude: 35.452, longitude: -83.805, operator: 'TVA', river: 'Little Tennessee', kind: 'conventional', onlineYear: 1944, region: 'Southeast' },
  { id: 'h-norris', name: 'Norris', stateAbbr: 'TN', stateName: 'Tennessee', capacityMw: 132, outputMw: 55, latitude: 36.224, longitude: -84.091, operator: 'TVA', river: 'Clinch', kind: 'conventional', onlineYear: 1936, region: 'Southeast' },
  { id: 'h-cherokee', name: 'Cherokee', stateAbbr: 'TN', stateName: 'Tennessee', capacityMw: 136, outputMw: 50, latitude: 36.17, longitude: -83.498, operator: 'TVA', river: 'Holston', kind: 'conventional', onlineYear: 1941, region: 'Southeast' },
  { id: 'h-douglas', name: 'Douglas', stateAbbr: 'TN', stateName: 'Tennessee', capacityMw: 146, outputMw: 55, latitude: 35.961, longitude: -83.539, operator: 'TVA', river: 'French Broad', kind: 'conventional', onlineYear: 1943, region: 'Southeast' },
  { id: 'h-hiwassee', name: 'Hiwassee', stateAbbr: 'NC', stateName: 'North Carolina', capacityMw: 185, outputMw: 70, latitude: 35.151, longitude: -84.178, operator: 'TVA', river: 'Hiwassee', kind: 'conventional', onlineYear: 1940, region: 'Southeast' },

  // Appalachian / PJM pumped storage & run-of-river
  { id: 'h-bath-county', name: 'Bath County Pumped Storage', stateAbbr: 'VA', stateName: 'Virginia', capacityMw: 3003, outputMw: 900, latitude: 38.209, longitude: -79.8, operator: 'Dominion / LS Power', river: 'Back Creek (pumped)', kind: 'pumped-storage', onlineYear: 1985, region: 'Southeast', note: 'Largest pumped-storage plant in the US.' },
  { id: 'h-smith-mtn', name: 'Smith Mountain', stateAbbr: 'VA', stateName: 'Virginia', capacityMw: 636, outputMw: 200, latitude: 37.044, longitude: -79.536, operator: 'Appalachian Power', river: 'Roanoke', kind: 'pumped-storage', onlineYear: 1965, region: 'Southeast' },
  { id: 'h-muddy-run', name: 'Muddy Run Pumped Storage', stateAbbr: 'PA', stateName: 'Pennsylvania', capacityMw: 1072, outputMw: 350, latitude: 39.809, longitude: -76.298, operator: 'Constellation', river: 'Susquehanna (pumped)', kind: 'pumped-storage', onlineYear: 1968, region: 'Northeast' },
  { id: 'h-safe-harbor', name: 'Safe Harbor', stateAbbr: 'PA', stateName: 'Pennsylvania', capacityMw: 418, outputMw: 180, latitude: 39.916, longitude: -76.39, operator: 'Brookfield / partners', river: 'Susquehanna', kind: 'conventional', onlineYear: 1931, region: 'Northeast' },
  { id: 'h-conowingo', name: 'Conowingo', stateAbbr: 'MD', stateName: 'Maryland', capacityMw: 572, outputMw: 240, latitude: 39.657, longitude: -76.175, operator: 'Constellation', river: 'Susquehanna', kind: 'conventional', onlineYear: 1928, region: 'Northeast' },
  { id: 'h-holtwood', name: 'Holtwood', stateAbbr: 'PA', stateName: 'Pennsylvania', capacityMw: 252, outputMw: 100, latitude: 39.827, longitude: -76.332, operator: 'Brookfield', river: 'Susquehanna', kind: 'conventional', onlineYear: 1910, region: 'Northeast' },
  { id: 'h-yards-creek', name: 'Yards Creek Pumped Storage', stateAbbr: 'NJ', stateName: 'New Jersey', capacityMw: 420, outputMw: 120, latitude: 41.05, longitude: -74.95, operator: 'LS Power / FirstEnergy', river: 'Yards Creek (pumped)', kind: 'pumped-storage', onlineYear: 1965, region: 'Northeast' },

  // New York / New England
  { id: 'h-niagara-moses', name: 'Robert Moses Niagara', stateAbbr: 'NY', stateName: 'New York', capacityMw: 2515, outputMw: 1400, latitude: 43.143, longitude: -79.04, operator: 'NYPA', river: 'Niagara', kind: 'conventional', onlineYear: 1961, region: 'Northeast' },
  { id: 'h-lewiston', name: 'Lewiston Pump-Generating', stateAbbr: 'NY', stateName: 'New York', capacityMw: 240, outputMw: 80, latitude: 43.143, longitude: -79.02, operator: 'NYPA', river: 'Niagara (pumped)', kind: 'pumped-storage', onlineYear: 1961, region: 'Northeast' },
  { id: 'h-st-lawrence', name: 'St. Lawrence-FDR', stateAbbr: 'NY', stateName: 'New York', capacityMw: 912, outputMw: 450, latitude: 44.97, longitude: -74.8, operator: 'NYPA', river: 'St. Lawrence', kind: 'conventional', onlineYear: 1958, region: 'Northeast' },
  { id: 'h-blenheim-gilboa', name: 'Blenheim-Gilboa Pumped Storage', stateAbbr: 'NY', stateName: 'New York', capacityMw: 1160, outputMw: 350, latitude: 42.47, longitude: -74.45, operator: 'NYPA', river: 'Schoharie (pumped)', kind: 'pumped-storage', onlineYear: 1973, region: 'Northeast' },
  { id: 'h-northfield', name: 'Northfield Mountain Pumped Storage', stateAbbr: 'MA', stateName: 'Massachusetts', capacityMw: 1168, outputMw: 350, latitude: 42.61, longitude: -72.44, operator: 'FirstLight', river: 'Connecticut (pumped)', kind: 'pumped-storage', onlineYear: 1972, region: 'Northeast' },
  { id: 'h-bear-swamp', name: 'Bear Swamp Pumped Storage', stateAbbr: 'MA', stateName: 'Massachusetts', capacityMw: 600, outputMw: 180, latitude: 42.68, longitude: -72.96, operator: 'Brookfield', river: 'Deerfield (pumped)', kind: 'pumped-storage', onlineYear: 1974, region: 'Northeast' },
  { id: 'h-moore', name: 'Moore', stateAbbr: 'NH', stateName: 'New Hampshire', capacityMw: 192, outputMw: 80, latitude: 44.336, longitude: -71.875, operator: 'Great River Hydro', river: 'Connecticut', kind: 'conventional', onlineYear: 1957, region: 'Northeast' },
  { id: 'h-comerford', name: 'Comerford', stateAbbr: 'NH', stateName: 'New Hampshire', capacityMw: 164, outputMw: 70, latitude: 44.325, longitude: -71.995, operator: 'Great River Hydro', river: 'Connecticut', kind: 'conventional', onlineYear: 1930, region: 'Northeast' },
  { id: 'h-harris', name: 'Harris', stateAbbr: 'ME', stateName: 'Maine', capacityMw: 85, outputMw: 35, latitude: 45.16, longitude: -70.02, operator: 'Brookfield', river: 'Kennebec', kind: 'conventional', onlineYear: 1954, region: 'Northeast' },
  { id: 'h-wyman', name: 'Wyman', stateAbbr: 'ME', stateName: 'Maine', capacityMw: 72, outputMw: 30, latitude: 45.07, longitude: -69.9, operator: 'Brookfield', river: 'Kennebec', kind: 'conventional', onlineYear: 1930, region: 'Northeast' },
  { id: 'h-harriman', name: 'Harriman', stateAbbr: 'VT', stateName: 'Vermont', capacityMw: 41, outputMw: 18, latitude: 42.89, longitude: -72.91, operator: 'Great River Hydro', river: 'Deerfield', kind: 'conventional', onlineYear: 1925, region: 'Northeast' },

  // Michigan / Great Lakes
  { id: 'h-ludington', name: 'Ludington Pumped Storage', stateAbbr: 'MI', stateName: 'Michigan', capacityMw: 1872, outputMw: 600, latitude: 43.894, longitude: -86.445, operator: 'Consumers / DTE', river: 'Lake Michigan (pumped)', kind: 'pumped-storage', onlineYear: 1973, region: 'Midwest' },
  { id: 'h-kingsford', name: 'Kingsford', stateAbbr: 'MI', stateName: 'Michigan', capacityMw: 50, outputMw: 20, latitude: 45.81, longitude: -88.07, operator: 'WE Energies', river: 'Menominee', kind: 'conventional', onlineYear: 1924, region: 'Midwest' },

  // Carolinas / Georgia pumped storage
  { id: 'h-bad-creek', name: 'Bad Creek Pumped Storage', stateAbbr: 'SC', stateName: 'South Carolina', capacityMw: 1065, outputMw: 350, latitude: 35.01, longitude: -82.99, operator: 'Duke Energy', river: 'Bad Creek (pumped)', kind: 'pumped-storage', onlineYear: 1991, region: 'Southeast' },
  { id: 'h-jocassee', name: 'Jocassee', stateAbbr: 'SC', stateName: 'South Carolina', capacityMw: 710, outputMw: 250, latitude: 34.96, longitude: -82.91, operator: 'Duke Energy', river: 'Keowee (pumped/conventional)', kind: 'pumped-storage', onlineYear: 1973, region: 'Southeast' },
  { id: 'h-russell', name: 'Richard B. Russell', stateAbbr: 'GA', stateName: 'Georgia', capacityMw: 600, outputMw: 200, latitude: 34.03, longitude: -82.64, operator: 'USACE', river: 'Savannah', kind: 'pumped-storage', onlineYear: 1985, region: 'Southeast' },
  { id: 'h-hartwell', name: 'Hartwell', stateAbbr: 'GA', stateName: 'Georgia', capacityMw: 421, outputMw: 160, latitude: 34.36, longitude: -82.82, operator: 'USACE', river: 'Savannah', kind: 'conventional', onlineYear: 1962, region: 'Southeast' },
  { id: 'h-thurmond', name: 'J. Strom Thurmond', stateAbbr: 'GA', stateName: 'Georgia', capacityMw: 380, outputMw: 140, latitude: 33.66, longitude: -82.2, operator: 'USACE', river: 'Savannah', kind: 'conventional', onlineYear: 1954, region: 'Southeast' },

  // Arkansas / Missouri / Oklahoma rivers
  { id: 'h-bull-shoals', name: 'Bull Shoals', stateAbbr: 'AR', stateName: 'Arkansas', capacityMw: 340, outputMw: 140, latitude: 36.37, longitude: -92.58, operator: 'USACE', river: 'White', kind: 'conventional', onlineYear: 1953, region: 'Southeast' },
  { id: 'h-norfork', name: 'Norfork', stateAbbr: 'AR', stateName: 'Arkansas', capacityMw: 81, outputMw: 35, latitude: 36.25, longitude: -92.24, operator: 'USACE', river: 'North Fork White', kind: 'conventional', onlineYear: 1944, region: 'Southeast' },
  { id: 'h-table-rock', name: 'Table Rock', stateAbbr: 'MO', stateName: 'Missouri', capacityMw: 200, outputMw: 80, latitude: 36.6, longitude: -93.31, operator: 'USACE', river: 'White', kind: 'conventional', onlineYear: 1959, region: 'Midwest' },
  { id: 'h-bagnell', name: 'Bagnell (Osage)', stateAbbr: 'MO', stateName: 'Missouri', capacityMw: 215, outputMw: 90, latitude: 38.2, longitude: -92.63, operator: 'Ameren Missouri', river: 'Osage', kind: 'conventional', onlineYear: 1931, region: 'Midwest' },
  { id: 'h-pensacola', name: 'Pensacola (Grand Lake)', stateAbbr: 'OK', stateName: 'Oklahoma', capacityMw: 120, outputMw: 45, latitude: 36.47, longitude: -95.04, operator: 'GRDA', river: 'Grand (Neosho)', kind: 'conventional', onlineYear: 1940, region: 'Southwest' },
  { id: 'h-keystone', name: 'Keystone', stateAbbr: 'OK', stateName: 'Oklahoma', capacityMw: 70, outputMw: 25, latitude: 36.15, longitude: -96.25, operator: 'USACE', river: 'Arkansas', kind: 'conventional', onlineYear: 1968, region: 'Southwest' },

  // Texas / Southwest other
  { id: 'h-mansfield', name: 'Mansfield', stateAbbr: 'TX', stateName: 'Texas', capacityMw: 102, outputMw: 35, latitude: 30.72, longitude: -97.43, operator: 'LCRA', river: 'Colorado (TX)', kind: 'conventional', onlineYear: 1965, region: 'Southwest' },
  { id: 'h-amistad', name: 'Amistad', stateAbbr: 'TX', stateName: 'Texas', capacityMw: 66, outputMw: 25, latitude: 29.45, longitude: -101.06, operator: 'USIBWC / USACE', river: 'Rio Grande', kind: 'conventional', onlineYear: 1983, region: 'Southwest' },
  { id: 'h-falcon', name: 'Falcon', stateAbbr: 'TX', stateName: 'Texas', capacityMw: 32, outputMw: 12, latitude: 26.56, longitude: -99.17, operator: 'USIBWC', river: 'Rio Grande', kind: 'conventional', onlineYear: 1954, region: 'Southwest' },

  // Alaska / Hawaii
  { id: 'h-eklutna', name: 'Eklutna', stateAbbr: 'AK', stateName: 'Alaska', capacityMw: 47, outputMw: 25, latitude: 61.48, longitude: -149.15, operator: 'CEA / MEA / Anchorage', river: 'Eklutna', kind: 'conventional', onlineYear: 1955, region: 'Alaska / Hawaii' },
  { id: 'h-bradley-lake', name: 'Bradley Lake', stateAbbr: 'AK', stateName: 'Alaska', capacityMw: 126, outputMw: 60, latitude: 59.78, longitude: -150.95, operator: 'Alaska Energy Authority', river: 'Bradley', kind: 'conventional', onlineYear: 1991, region: 'Alaska / Hawaii' },
  { id: 'h-snettisham', name: 'Snettisham', stateAbbr: 'AK', stateName: 'Alaska', capacityMw: 78, outputMw: 40, latitude: 58.14, longitude: -133.74, operator: 'AEL&P', river: 'Speel', kind: 'conventional', onlineYear: 1973, region: 'Alaska / Hawaii' },
  { id: 'h-waiau', name: 'Waiau hydro (legacy HI)', stateAbbr: 'HI', stateName: 'Hawaii', capacityMw: 12, outputMw: 5, latitude: 21.39, longitude: -157.97, operator: 'Hawaiian Electric', river: 'local streams', kind: 'run-of-river', onlineYear: 1900, region: 'Alaska / Hawaii', note: 'Illustrative small hydro; HI fleet is mostly thermal/solar.' },

  // Wisconsin / Midwest conventional
  { id: 'h-prairie-du-sac', name: 'Prairie du Sac', stateAbbr: 'WI', stateName: 'Wisconsin', capacityMw: 31, outputMw: 14, latitude: 43.3, longitude: -89.73, operator: 'Alliant / partners', river: 'Wisconsin', kind: 'conventional', onlineYear: 1914, region: 'Midwest' },
  { id: 'h-starved-rock', name: 'Starved Rock', stateAbbr: 'IL', stateName: 'Illinois', capacityMw: 35, outputMw: 15, latitude: 41.32, longitude: -88.99, operator: 'Dynegy / partners', river: 'Illinois', kind: 'conventional', onlineYear: 1933, region: 'Midwest' },
  { id: 'h-keokuk', name: 'Keokuk', stateAbbr: 'IA', stateName: 'Iowa', capacityMw: 142, outputMw: 60, latitude: 40.39, longitude: -91.37, operator: 'Ameren', river: 'Mississippi', kind: 'conventional', onlineYear: 1913, region: 'Midwest' },

  // Washington additional
  { id: 'h-box-canyon', name: 'Box Canyon', stateAbbr: 'WA', stateName: 'Washington', capacityMw: 90, outputMw: 40, latitude: 48.78, longitude: -117.41, operator: 'Pend Oreille PUD', river: 'Pend Oreille', kind: 'conventional', onlineYear: 1956, region: 'Pacific' },
  { id: 'h-ross', name: 'Ross', stateAbbr: 'WA', stateName: 'Washington', capacityMw: 450, outputMw: 200, latitude: 48.73, longitude: -121.07, operator: 'Seattle City Light', river: 'Skagit', kind: 'conventional', onlineYear: 1952, region: 'Pacific' },
  { id: 'h-diablo', name: 'Diablo (Skagit)', stateAbbr: 'WA', stateName: 'Washington', capacityMw: 159, outputMw: 70, latitude: 48.71, longitude: -121.13, operator: 'Seattle City Light', river: 'Skagit', kind: 'conventional', onlineYear: 1936, region: 'Pacific' },
  { id: 'h-gorge', name: 'Gorge (Skagit)', stateAbbr: 'WA', stateName: 'Washington', capacityMw: 207, outputMw: 90, latitude: 48.7, longitude: -121.21, operator: 'Seattle City Light', river: 'Skagit', kind: 'conventional', onlineYear: 1924, region: 'Pacific' },
]

export function hydroTotals(plants: UsHydroPlant[] = US_HYDRO_PLANTS) {
  const capacityMw = plants.reduce((s, p) => s + p.capacityMw, 0)
  const outputMw = plants.reduce((s, p) => s + Math.max(0, p.outputMw), 0)
  const pumpedMw = plants.filter((p) => p.kind === 'pumped-storage').reduce((s, p) => s + p.capacityMw, 0)
  const states = new Set(plants.map((p) => p.stateAbbr)).size
  return {
    count: plants.length,
    capacityMw,
    capacityGw: capacityMw / 1000,
    outputMw,
    pumpedMw,
    pumpedGw: pumpedMw / 1000,
    states,
  }
}

export function hydroByState(plants: UsHydroPlant[] = US_HYDRO_PLANTS) {
  const map = new Map<
    string,
    { stateAbbr: string; stateName: string; count: number; capacityMw: number; outputMw: number }
  >()
  for (const p of plants) {
    const cur = map.get(p.stateAbbr) ?? {
      stateAbbr: p.stateAbbr,
      stateName: p.stateName,
      count: 0,
      capacityMw: 0,
      outputMw: 0,
    }
    cur.count += 1
    cur.capacityMw += p.capacityMw
    cur.outputMw += Math.max(0, p.outputMw)
    map.set(p.stateAbbr, cur)
  }
  return [...map.values()].sort((a, b) => b.capacityMw - a.capacityMw)
}

export function hydroByOperator(plants: UsHydroPlant[] = US_HYDRO_PLANTS) {
  const map = new Map<string, { operator: string; count: number; capacityMw: number }>()
  for (const p of plants) {
    const cur = map.get(p.operator) ?? { operator: p.operator, count: 0, capacityMw: 0 }
    cur.count += 1
    cur.capacityMw += p.capacityMw
    map.set(p.operator, cur)
  }
  return [...map.values()].sort((a, b) => b.capacityMw - a.capacityMw)
}

function plantToAsset(p: UsHydroPlant): PortfolioAsset {
  return {
    id: p.id,
    name: p.name,
    technology: 'hydro',
    capacityMw: p.capacityMw,
    outputMw: p.outputMw,
    latitude: p.latitude,
    longitude: p.longitude,
    region: p.region,
    county: `${p.river} · ${p.stateName}`,
    stateAbbr: p.stateAbbr,
    status: 'operating',
  }
}

/** Group major hydro into operator portfolios for the Portfolios map/catalog */
export function buildUsHydroPortfolios(plants: UsHydroPlant[] = US_HYDRO_PLANTS): EnergyPortfolio[] {
  const byOp = new Map<string, UsHydroPlant[]>()
  for (const p of plants) {
    const list = byOp.get(p.operator) ?? []
    list.push(p)
    byOp.set(p.operator, list)
  }

  return [...byOp.entries()]
    .map(([operator, list]) => {
      const cap = list.reduce((s, p) => s + p.capacityMw, 0)
      const states = [...new Set(list.map((p) => p.stateAbbr))].sort().join(', ')
      const primaryState = list.slice().sort((a, b) => b.capacityMw - a.capacityMw)[0]
      const slug = operator
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 40)
      return {
        id: `hydro-${slug}`,
        name: `${operator} hydro fleet`,
        short: operator.length > 18 ? operator.slice(0, 16) + '…' : operator,
        kind: operator.includes('USBR') || operator.includes('USACE') || operator === 'TVA' || operator === 'NYPA'
          ? ('Federal / state' as const)
          : operator.includes('PUD') || operator.includes('City') || operator.includes('Authority')
            ? ('Municipal' as const)
            : ('Generator' as const),
        sector: 'hydro system' as const,
        stateAbbr: primaryState.stateAbbr,
        stateName: primaryState.stateName,
        hq: states,
        cleanTarget: 'Hydro (zero direct CO2 at generation)',
        notes: `${list.length} mapped hydro plants · ${states} · ${(cap / 1000).toFixed(1)} GW nameplate sample. Includes conventional and pumped-storage where listed.`,
        assets: list.map(plantToAsset),
      } satisfies EnergyPortfolio
    })
    .sort((a, b) => {
      const ca = a.assets.reduce((s, x) => s + x.capacityMw, 0)
      const cb = b.assets.reduce((s, x) => s + x.capacityMw, 0)
      return cb - ca
    })
}
