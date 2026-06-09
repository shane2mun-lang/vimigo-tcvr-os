// ─────────────────────────────────────────────────────────────────────────────
// Engine utilities — safe math, normalization, scoring, and quality tracking.
// There is NO bare `/` anywhere in the engine; every division goes through safeDiv.
// ─────────────────────────────────────────────────────────────────────────────

import type { BlockQuality, Confidence, DataGap, GapSeverity, Health } from './types'

/** Division that never returns NaN/Infinity. */
export function safeDiv(n: number, d: number, fallback = 0): number {
  if (!isFinite(n) || !isFinite(d) || d === 0) return fallback
  const r = n / d
  return isFinite(r) ? r : fallback
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x))
}

/** Coerce a possibly-undefined/NaN value to a finite number. */
export function num(x: number | undefined | null, fallback = 0): number {
  return typeof x === 'number' && isFinite(x) ? x : fallback
}

/** Sum, ignoring non-finite entries. */
export function sum(xs: number[]): number {
  let s = 0
  for (const x of xs) if (isFinite(x)) s += x
  return s
}

export const round0 = (x: number): number => Math.round(x)
export const round2 = (x: number): number => Math.round(x * 100) / 100
export const toPct = (x: number): number => round2(x * 100)

/**
 * Normalize a rate/margin that the user may have typed as a decimal (0.30) OR as
 * a percent (30). Anything > 1.5 is treated as percent and divided by 100.
 * Negative values are floored to 0. Returns undefined when there's no value.
 */
export function normalizeRate(x: number | undefined | null): number | undefined {
  if (x == null || !isFinite(x)) return undefined
  const v = x < 0 ? 0 : x
  return v > 1.5 ? v / 100 : v
}

/** normalizeRate with a guaranteed numeric fallback. */
export function rate(x: number | undefined | null, fallback = 0): number {
  const n = normalizeRate(x)
  return n == null ? fallback : n
}

/**
 * Map an actual value to a 0–100 score relative to a benchmark.
 * `good` = ratio at which you hit 100; `ok` = ratio at which you hit 50.
 * Set lowerIsBetter for cost-like metrics (CPL, CAC, cycle time).
 */
export function ratioToScore(
  actual: number,
  benchmark: number,
  opts: { good?: number; ok?: number; lowerIsBetter?: boolean } = {},
): number {
  const good = opts.good ?? 1
  const ok = opts.ok ?? 0.6
  if (opts.lowerIsBetter && actual <= 0) return 100 // can't be lower than free/instant
  const r = opts.lowerIsBetter ? safeDiv(benchmark, actual, 0) : safeDiv(actual, benchmark, 0)
  let score: number
  if (r >= good) score = 100
  else if (r >= ok) score = 50 + (50 * (r - ok)) / (good - ok)
  else score = 50 * safeDiv(r, ok)
  return clamp(score, 0, 100)
}

export function band(score: number): Health {
  return score >= 70 ? 'green' : score >= 45 ? 'yellow' : 'red'
}

const CONF_ORDER: Confidence[] = ['high', 'medium', 'low', 'insufficient']

function worse(a: Confidence, b: Confidence): Confidence {
  return CONF_ORDER.indexOf(a) >= CONF_ORDER.indexOf(b) ? a : b
}

/** Accumulates data gaps and the floor confidence for one analysis block. */
export class QualityBuilder {
  private gaps: DataGap[] = []
  private confidence: Confidence = 'high'

  add(code: string, severity: GapSeverity, message: string): this {
    this.gaps.push({ code, severity, message })
    if (severity === 'blocker') this.confidence = worse(this.confidence, 'insufficient')
    else if (severity === 'degraded') this.confidence = worse(this.confidence, 'medium')
    return this
  }

  cap(c: Confidence): this {
    this.confidence = worse(this.confidence, c)
    return this
  }

  build(): BlockQuality {
    return { confidence: this.confidence, gaps: this.gaps }
  }
}

/** Merge several block qualities, taking the floor confidence and all gaps. */
export function rollupQuality(qs: BlockQuality[]): BlockQuality {
  let confidence: Confidence = 'high'
  const gaps: DataGap[] = []
  for (const q of qs) {
    confidence = worse(confidence, q.confidence)
    for (const g of q.gaps) gaps.push(g)
  }
  return { confidence, gaps }
}
