/**
 * Consistency / inconsistency profiles for California energy sources.
 * Ranges are CA-typical planning bands (CF, forecast error, firm credit),
 * not live telemetry - for education and portfolio comparison.
 */

import type { Technology } from '../types'

export type ConsistencyBand = 'very high' | 'high' | 'medium' | 'low' | 'very low'

export interface SourceConsistency {
  technology: Technology
  label: string
  /** 0-100: higher = more consistent / firm */
  consistencyScore: number
  /** 0-100: higher = more variable / intermittent */
  inconsistencyScore: number
  band: ConsistencyBand
  capacityFactorTypical: number
  capacityFactorRange: [number, number]
  /** Relative intra-day swing (0-100) */
  diurnalSwing: number
  /** Relative seasonal swing (0-100) */
  seasonalSwing: number
  /** Day-ahead forecast error band, rough % of nameplate */
  forecastErrorPct: number
  /** Resource adequacy / firm credit style (illustrative 0-1) */
  firmCredit: number
  /** Minutes-to-hours characteristic variability timescale */
  timescale: string
  drivers: string[]
  strengths: string[]
  risks: string[]
  caNote: string
}

export const SOURCE_CONSISTENCY: SourceConsistency[] = [
  {
    technology: 'nuclear',
    label: 'Nuclear',
    consistencyScore: 96,
    inconsistencyScore: 4,
    band: 'very high',
    capacityFactorTypical: 0.92,
    capacityFactorRange: [0.85, 0.95],
    diurnalSwing: 5,
    seasonalSwing: 8,
    forecastErrorPct: 1,
    firmCredit: 0.95,
    timescale: 'months (outages)',
    drivers: ['Fuel inventory', 'Refueling outages', 'Thermal derates'],
    strengths: ['True baseload', 'Predictable hourly output', 'High RA credit'],
    risks: ['Long outage when offline', 'Single-unit concentration (Diablo)'],
    caNote: 'Diablo Canyon is the dense, consistent core of CA firm clean until mid-decade decisions.',
  },
  {
    technology: 'geothermal',
    label: 'Geothermal',
    consistencyScore: 90,
    inconsistencyScore: 10,
    band: 'very high',
    capacityFactorTypical: 0.75,
    capacityFactorRange: [0.65, 0.85],
    diurnalSwing: 8,
    seasonalSwing: 12,
    forecastErrorPct: 3,
    firmCredit: 0.85,
    timescale: 'days-weeks',
    drivers: ['Reservoir pressure', 'Maintenance', 'Steamfield health'],
    strengths: ['Renewable baseload', 'Low weather correlation', 'High firmness'],
    risks: ['Site-limited', 'Slow build', 'Decline without reinjection'],
    caNote: 'Geysers + Imperial Valley are the main CA firm renewable density plays.',
  },
  {
    technology: 'biomass',
    label: 'Biomass / biogas',
    consistencyScore: 82,
    inconsistencyScore: 18,
    band: 'high',
    capacityFactorTypical: 0.55,
    capacityFactorRange: [0.4, 0.7],
    diurnalSwing: 15,
    seasonalSwing: 25,
    forecastErrorPct: 5,
    firmCredit: 0.7,
    timescale: 'hours-days (fuel)',
    drivers: ['Fuel supply chain', 'Air permits', 'Seasonal ag residue'],
    strengths: ['Dispatchable renewable', 'Waste stream use'],
    risks: ['Fuel cost/logistics', 'Air quality limits', 'Small fleet scale'],
    caNote: 'Useful but small; consistency is operational, not resource weather.',
  },
  {
    technology: 'natural_gas',
    label: 'Natural gas',
    consistencyScore: 78,
    inconsistencyScore: 22,
    band: 'high',
    capacityFactorTypical: 0.35,
    capacityFactorRange: [0.1, 0.7],
    diurnalSwing: 40,
    seasonalSwing: 35,
    forecastErrorPct: 4,
    firmCredit: 0.9,
    timescale: 'minutes (dispatch)',
    drivers: ['Net load shape', 'Gas price', 'Start reliability', 'Air/outage limits'],
    strengths: ['Fast ramp', 'High firm credit', 'Fills solar duck curve'],
    risks: ['Fuel disruption', 'Emissions', 'Retirement schedule uncertainty'],
    caNote: 'Highly consistent when asked to run; CF varies because it is the flexible residual.',
  },
  {
    technology: 'hydro',
    label: 'Hydro',
    consistencyScore: 62,
    inconsistencyScore: 38,
    band: 'medium',
    capacityFactorTypical: 0.4,
    capacityFactorRange: [0.2, 0.65],
    diurnalSwing: 30,
    seasonalSwing: 70,
    forecastErrorPct: 12,
    firmCredit: 0.55,
    timescale: 'seasons (water year)',
    drivers: ['Snowpack', 'Runoff timing', 'Water rights', 'Ramping for flexibility'],
    strengths: ['Fast ramping', 'Storage value (pumped + reservoirs)', 'Zero fuel CO2'],
    risks: ['Drought years cut CF hard', 'Climate shifts snowmelt'],
    caNote: 'Year type (wet/dry) dominates consistency more than hour-of-day.',
  },
  {
    technology: 'battery',
    label: 'Battery storage',
    consistencyScore: 55,
    inconsistencyScore: 45,
    band: 'medium',
    capacityFactorTypical: 0.12,
    capacityFactorRange: [0.05, 0.25],
    diurnalSwing: 95,
    seasonalSwing: 25,
    forecastErrorPct: 8,
    firmCredit: 0.4,
    timescale: 'minutes-hours (SoC)',
    drivers: ['State of charge', 'Duration (usually 4h)', 'Price / RA calls', 'Degradation'],
    strengths: ['Precise dispatch', 'Evening peak shift', 'Fast frequency response'],
    risks: ['Energy-limited', 'Not multi-day firm', 'Correlated discharge windows'],
    caNote: 'Power is reliable for 2-4 hours; energy consistency collapses beyond duration.',
  },
  {
    technology: 'wind',
    label: 'Wind',
    consistencyScore: 38,
    inconsistencyScore: 62,
    band: 'low',
    capacityFactorTypical: 0.32,
    capacityFactorRange: [0.15, 0.45],
    diurnalSwing: 55,
    seasonalSwing: 50,
    forecastErrorPct: 18,
    firmCredit: 0.15,
    timescale: 'hours',
    drivers: ['Pressure gradients', 'Marine layer', 'Tehachapi / Altamont regimes'],
    strengths: ['Often complementary to solar at night', 'Zero fuel'],
    risks: ['Ramps', 'Forecast error', 'Low CA summer-peak coincidence'],
    caNote: 'More consistent than solar at night; still not baseload-class without firming.',
  },
  {
    technology: 'solar',
    label: 'Solar PV',
    consistencyScore: 28,
    inconsistencyScore: 72,
    band: 'low',
    capacityFactorTypical: 0.28,
    capacityFactorRange: [0.18, 0.32],
    diurnalSwing: 100,
    seasonalSwing: 45,
    forecastErrorPct: 15,
    firmCredit: 0.05,
    timescale: 'minutes-hours (clouds)',
    drivers: ['Sun angle', 'Clouds / marine layer', 'Dust / soiling', 'Inverter limits'],
    strengths: ['Very predictable clear-sky shape', 'Fast build', 'Low marginal cost'],
    risks: ['Zero at night', 'Duck-curve oversupply midday', 'Heat-wave evening gap'],
    caNote: 'Most inconsistent hour-to-hour by design: full day/night cycle every day.',
  },
  {
    technology: 'other',
    label: 'Other / imports',
    consistencyScore: 48,
    inconsistencyScore: 52,
    band: 'medium',
    capacityFactorTypical: 0.4,
    capacityFactorRange: [0.1, 0.8],
    diurnalSwing: 45,
    seasonalSwing: 40,
    forecastErrorPct: 10,
    firmCredit: 0.5,
    timescale: 'hours (market)',
    drivers: ['Neighbor BAs', 'COI / SWPL limits', 'Market prices', 'Wildfire / outages'],
    strengths: ['Diversity of NW hydro and SW solar/gas', 'Flexible net interchange'],
    risks: ['Congestion', 'Correlated West-wide heat events'],
    caNote: 'Imports look consistent until a West-wide peak day tightens every path.',
  },
]

export function bandVariant(
  band: ConsistencyBand
): 'success' | 'info' | 'warning' | 'danger' | 'default' {
  switch (band) {
    case 'very high':
      return 'success'
    case 'high':
      return 'info'
    case 'medium':
      return 'warning'
    case 'low':
    case 'very low':
      return 'danger'
    default:
      return 'default'
  }
}

export function sortedByConsistency(desc = true) {
  return [...SOURCE_CONSISTENCY].sort((a, b) =>
    desc ? b.consistencyScore - a.consistencyScore : a.consistencyScore - b.consistencyScore
  )
}
