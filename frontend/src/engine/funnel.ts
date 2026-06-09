// ─────────────────────────────────────────────────────────────────────────────
// Funnel analysis — stage-to-stage conversion, biggest drop, lost value, and
// follow-up leakage. Bridges over missing intermediate stages.
// ─────────────────────────────────────────────────────────────────────────────

import { QualityBuilder, clamp, num, safeDiv, sum } from './util'
import { FUNNEL_MAIN_PATH } from './types'
import type {
  FunnelAnalysis,
  FunnelStage,
  FunnelStageKey,
  FunnelStepRate,
  RevenueModel,
  TCVRInput,
} from './types'

const MIN_STAGE = 3

function countMap(funnel: FunnelStage[]): Map<FunnelStageKey, number> {
  const m = new Map<FunnelStageKey, number>()
  for (const s of funnel) {
    if (s.count != null && isFinite(s.count)) m.set(s.key, num(s.count))
  }
  return m
}

export function analyzeFunnel(
  input: TCVRInput,
  revenue: RevenueModel,
  _benchmarks: { salesCycleDays: number },
): FunnelAnalysis {
  const q = new QualityBuilder()
  const counts = countMap(input.funnel)
  const abv = revenue.averageBasketValue
  const gpMargin = revenue.gpMargin

  if (counts.size === 0) q.add('NO_FUNNEL', 'degraded', 'No funnel stages entered.')

  // Present main-path stages, in canonical order.
  const presentPath = FUNNEL_MAIN_PATH.filter((k) => counts.has(k))
  const stepRates: FunnelStepRate[] = []
  for (let i = 0; i < presentPath.length - 1; i++) {
    const from = presentPath[i]!
    const to = presentPath[i + 1]!
    const fromCount = counts.get(from)!
    const toCount = counts.get(to)!
    const bridged = FUNNEL_MAIN_PATH.indexOf(to) - FUNNEL_MAIN_PATH.indexOf(from) > 1
    stepRates.push({ from, to, rate: clamp(safeDiv(toCount, fromCount), 0, 1), fromCount, toCount, bridged })
    if (bridged) q.add('FUNNEL_BRIDGED', 'cosmetic', `Bridged missing stage(s) between ${from} and ${to}.`)
  }

  const leadCount = num(counts.get('Lead'))
  const wonCount = num(counts.get('ClosedWon'))
  const overallConversion = clamp(safeDiv(wonCount, leadCount), 0, 1)
  const paymentCollectionRate = clamp(safeDiv(num(counts.get('PaymentCollected')), wonCount), 0, 1)

  // Biggest drop along the main path (ignore thin stages).
  let biggestDropStage: FunnelAnalysis['biggestDropStage']
  let lowest = Infinity
  for (const sr of stepRates) {
    if (sr.fromCount >= MIN_STAGE && sr.rate < lowest) {
      lowest = sr.rate
      biggestDropStage = { from: sr.from, to: sr.to, rate: sr.rate }
    }
  }

  // Lost & leakage value.
  const quotation = num(counts.get('Quotation'))
  const lostDeals = counts.has('ClosedLost')
    ? num(counts.get('ClosedLost'))
    : Math.max(0, quotation - wonCount)
  const lostSalesValue = lostDeals * abv
  const lostGPValue = lostSalesValue * gpMargin

  const followUp = counts.get('FollowUp')
  const followUpLeakageDeals = followUp != null
    ? Math.max(0, num(followUp) - wonCount)
    : Math.max(0, quotation - wonCount)
  const followUpLeakageValue = followUpLeakageDeals * abv
  const followUpLeakageGP = followUpLeakageValue * gpMargin

  const salesCycleDays = sum(
    FUNNEL_MAIN_PATH.map((k) => num(input.funnel.find((s) => s.key === k)?.avgWaitTime)),
  )

  const forecastedSales = wonCount * abv
  const forecastedGP = forecastedSales * gpMargin

  const present = input.funnel.filter((s) => counts.has(s.key))
  const sopCoverage = present.length > 0
    ? safeDiv(present.filter((s) => s.hasSOP === true).length, present.length)
    : 0

  return {
    stepRates,
    overallConversion,
    paymentCollectionRate,
    biggestDropStage,
    lostDeals,
    lostSalesValue,
    lostGPValue,
    followUpLeakageDeals,
    followUpLeakageValue,
    followUpLeakageGP,
    salesCycleDays,
    forecastedSales,
    forecastedGP,
    sopCoverage,
    quality: q.build(),
  }
}
