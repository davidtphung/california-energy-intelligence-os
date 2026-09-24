export interface ScoredPair {
  actual: number
  pred: number
  p10: number | null
  p90: number | null
}

export interface Score {
  n: number
  mape: number | null
  mae: number | null
  rmse: number | null
  bias: number | null
  coverageP10P90: number | null
}

export function scorePairs(pairs: ScoredPair[]): Score {
  const finite = pairs.filter((p) => Number.isFinite(p.actual) && Number.isFinite(p.pred))
  if (!finite.length) {
    return { n: 0, mape: null, mae: null, rmse: null, bias: null, coverageP10P90: null }
  }
  let abs = 0
  let sq = 0
  let bias = 0
  let mapeSum = 0
  let mapeN = 0
  let coverN = 0
  let coverHit = 0
  for (const p of finite) {
    const err = p.pred - p.actual
    abs += Math.abs(err)
    sq += err * err
    bias += err
    if (p.actual !== 0) {
      mapeSum += Math.abs(err) / Math.abs(p.actual)
      mapeN += 1
    }
    if (p.p10 != null && p.p90 != null) {
      coverN += 1
      if (p.actual >= p.p10 && p.actual <= p.p90) coverHit += 1
    }
  }
  const n = finite.length
  return {
    n,
    mape: mapeN ? (mapeSum / mapeN) * 100 : null,
    mae: abs / n,
    rmse: Math.sqrt(sq / n),
    bias: bias / n,
    coverageP10P90: coverN ? coverHit / coverN : null,
  }
}

export function quantile(sortedAsc: number[], p: number): number | null {
  if (!sortedAsc.length) return null
  const idx = (sortedAsc.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sortedAsc[lo]
  const w = idx - lo
  return sortedAsc[lo] * (1 - w) + sortedAsc[hi] * w
}

export function residualQuantiles(residuals: number[]): { p10: number; p90: number } | null {
  if (residuals.length < 8) return null
  const sorted = [...residuals].sort((a, b) => a - b)
  const p10 = quantile(sorted, 0.1)
  const p90 = quantile(sorted, 0.9)
  if (p10 == null || p90 == null) return null
  return { p10, p90 }
}
