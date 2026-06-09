// ─────────────────────────────────────────────────────────────────────────────
// Scenario engine — perturb the TCVR factors and forecast Revenue/GP.
//
// Revenue is computed as a RATIO against the source-of-truth revenue, so:
//   • Scenario A (all deltas 0) === today's revenue/GP exactly, and
//   • the simulator works even when only stated revenue was entered (the absolute
//     traffic/CR/ABV cancel — only the multiplicative deltas matter).
// ─────────────────────────────────────────────────────────────────────────────

import { QualityBuilder, clamp, num, safeDiv } from './util'
import type {
  LeverDeltas,
  LeverKey,
  LeverRanking,
  ResolvedBenchmarks,
  RevenueModel,
  ScenarioAnalysis,
  ScenarioBase,
  ScenarioDeltaConfig,
  ScenarioId,
  ScenarioResult,
} from './types'

export const DEFAULT_SCENARIOS: ScenarioDeltaConfig = {
  B: { trafficPct: 20 },
  C: { conversionPct: 10 },
  D: { abvPct: 15 },
  E: { repeatPct: 25, referralPct: 25 },
}

const EFFORT: Record<LeverKey, number> = {
  conversionPct: 1,
  abvPct: 1,
  repeatPct: 1.5,
  referralPct: 1.5,
  trafficPct: 2,
  gpMarginPct: 2,
}

const SCENARIO_LABELS: Record<Exclude<ScenarioId, 'custom'>, string> = {
  A: 'Current',
  B: 'Traffic +20%',
  C: 'Conversion +10%',
  D: 'ABV +15%',
  E: 'Repeat + Referral',
}

export function baseFromRevenue(revenue: RevenueModel): ScenarioBase {
  return {
    revenue: revenue.revenue,
    gp: revenue.grossProfit,
    traffic: revenue.traffic,
    conversionRate: revenue.conversionRate,
    abv: revenue.averageBasketValue,
    rpf: revenue.repeatPurchaseFactor,
    rm: revenue.referralMultiplier,
    gpMargin: revenue.gpMargin,
  }
}

/** Apply lever deltas to a base and return the forecast. Pure & referentially transparent. */
export function simulate(
  base: ScenarioBase,
  deltas: LeverDeltas,
  benchmarks: ResolvedBenchmarks,
  id: ScenarioId = 'custom',
  label?: string,
): ScenarioResult {
  const dT = num(deltas.trafficPct) / 100
  const dC = num(deltas.conversionPct) / 100
  const dABV = num(deltas.abvPct) / 100
  const dRepeat = num(deltas.repeatPct) / 100
  const dReferral = num(deltas.referralPct) / 100
  const dGpPts = num(deltas.gpMarginPct) / 100

  const trafficMult = 1 + dT
  const abvMult = 1 + dABV
  // Conversion can't exceed 100%, so the realized multiplier may be < (1+dC).
  const convMult =
    base.conversionRate > 0
      ? safeDiv(clamp(base.conversionRate * (1 + dC), 0, 1), base.conversionRate, 1 + dC)
      : 1 + dC

  // Repeat / referral grow the headroom; from a zero base, inject a benchmark step.
  const rpfPrime =
    base.rpf <= 1 && dRepeat > 0
      ? 1 + benchmarks.repeatUplift * (dRepeat / 0.25)
      : 1 + (base.rpf - 1) * (1 + dRepeat)
  const rmPrime =
    base.rm <= 1 && dReferral > 0
      ? 1 + benchmarks.referralUplift * (dReferral / 0.25)
      : 1 + (base.rm - 1) * (1 + dReferral)
  const repeatRatio = safeDiv(rpfPrime, base.rpf, rpfPrime)
  const referralRatio = safeDiv(rmPrime, base.rm, rmPrime)

  const gpMarginPrime = clamp(base.gpMargin + dGpPts, 0, 0.95)

  const revenue = base.revenue * trafficMult * convMult * abvMult * repeatRatio * referralRatio
  const gp = revenue * gpMarginPrime

  const deltaRevenue = revenue - base.revenue
  const deltaGp = gp - base.gp

  return {
    id,
    label: label ?? (id !== 'custom' ? SCENARIO_LABELS[id] : 'Custom'),
    deltas,
    revenue,
    gp,
    deltaRevenue,
    deltaGp,
    deltaRevenuePct: safeDiv(deltaRevenue, base.revenue),
    deltaGpPct: safeDiv(deltaGp, base.gp),
  }
}

const LEVER_KEYS: LeverKey[] = [
  'trafficPct',
  'conversionPct',
  'abvPct',
  'gpMarginPct',
  'repeatPct',
  'referralPct',
]

/** Standardized isolated step for lever ranking (GP margin is in points, so smaller). */
function stepFor(lever: LeverKey): number {
  return lever === 'gpMarginPct' ? 3 : 10
}

export function rankLevers(base: ScenarioBase, benchmarks: ResolvedBenchmarks): LeverRanking[] {
  const ranked = LEVER_KEYS.map((lever) => {
    const result = simulate(base, { [lever]: stepFor(lever) }, benchmarks)
    const deltaGpAt10Pct = result.deltaGp
    return { lever, deltaGpAt10Pct, effortAdjusted: safeDiv(deltaGpAt10Pct, EFFORT[lever]), rank: 0 }
  })
  // Primary: GP impact (rounded to whole currency so sub-cent float noise doesn't
  // decide the order). Tie-break: the lower-effort lever wins — the tool's core
  // message is "the cheapest lever that moves GP", not "always buy more traffic".
  ranked.sort(
    (a, b) =>
      Math.round(b.deltaGpAt10Pct) - Math.round(a.deltaGpAt10Pct) ||
      b.effortAdjusted - a.effortAdjusted,
  )
  ranked.forEach((r, i) => (r.rank = i + 1))
  return ranked
}

export function analyzeScenarios(
  revenue: RevenueModel,
  benchmarks: ResolvedBenchmarks,
  cfg: ScenarioDeltaConfig = DEFAULT_SCENARIOS,
): ScenarioAnalysis {
  const q = new QualityBuilder()
  const base = baseFromRevenue(revenue)
  if (revenue.revenue <= 0) q.add('NO_BASE_REVENUE', 'degraded', 'No revenue base — scenarios are illustrative only.')

  const scenarios: ScenarioResult[] = [
    simulate(base, {}, benchmarks, 'A'),
    simulate(base, cfg.B, benchmarks, 'B'),
    simulate(base, cfg.C, benchmarks, 'C'),
    simulate(base, cfg.D, benchmarks, 'D'),
    simulate(base, cfg.E, benchmarks, 'E'),
  ]

  const leverRanking = rankLevers(base, benchmarks)
  const top = leverRanking[0]
  const notes: string[] = []
  if (base.rpf <= 1) notes.push('Repeat factor starts at 1.0 — the repeat lever uses a benchmark-anchored uplift.')
  if (base.rm <= 1) notes.push('Referral multiplier starts at 1.0 — the referral lever uses a benchmark-anchored uplift.')

  return {
    base,
    scenarios,
    leverRanking,
    topLever: { lever: top?.lever ?? 'conversionPct', deltaGp: top?.deltaGpAt10Pct ?? 0 },
    notes,
    quality: q.build(),
  }
}
