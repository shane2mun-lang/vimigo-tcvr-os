// ─────────────────────────────────────────────────────────────────────────────
// Revenue model — the mathematical spine. Resolves the five TCVR factors,
// reconciles bottom-up vs stated revenue, and derives GP / CAC / LTV.
// ─────────────────────────────────────────────────────────────────────────────

import {
  QualityBuilder,
  clamp,
  num,
  rate,
  normalizeRate,
  safeDiv,
  sum,
} from './util'
import type {
  EngineConfig,
  FunnelStageKey,
  NewCustomersSource,
  RecurringReferral,
  ResolvedBenchmarks,
  RevenueModel,
  RevenueReconciliation,
  SourceOfTruthMode,
  TCVRInput,
} from './types'

function stageCount(input: TCVRInput, key: FunnelStageKey): number {
  const s = input.funnel.find((f) => f.key === key)
  return num(s?.count)
}

/** Volume-weighted ABV from products, falling back to channel sales/deals. */
export function deriveABV(input: TCVRInput): { abv?: number; source: 'products' | 'channels' | 'none' } {
  const prods = input.products.filter(
    (p) => num(p.price) > 0 && num(p.monthlyVolume) > 0 && p.tag !== '引流品',
  )
  const wsum = sum(prods.map((p) => num(p.price) * num(p.monthlyVolume)))
  const vsum = sum(prods.map((p) => num(p.monthlyVolume)))
  if (vsum > 0 && wsum > 0) return { abv: safeDiv(wsum, vsum), source: 'products' }

  const chSales = sum(input.channels.map((c) => num(c.sales)))
  const chDeals = sum(input.channels.map((c) => num(c.closedDeals)))
  if (chDeals > 0 && chSales > 0) return { abv: safeDiv(chSales, chDeals), source: 'channels' }

  return { abv: undefined, source: 'none' }
}

/** New customers via a priority cascade (funnel → channels → recurring). */
export function deriveNewCustomers(input: TCVRInput): { nc?: number; source: NewCustomersSource } {
  const won = stageCount(input, 'ClosedWon')
  if (won > 0) return { nc: won, source: 'funnel' }

  const chDeals = sum(input.channels.map((c) => num(c.closedDeals)))
  if (chDeals > 0) return { nc: chDeals, source: 'channels' }

  const rc = num(input.recurring.newCustomers)
  if (rc > 0) return { nc: rc, source: 'recurring' }

  return { nc: undefined, source: 'none' }
}

/** RPF = 1 + repeatShare × (avgRepeatCount − 1). No repeats ⇒ 1.0. */
export function repeatPurchaseFactor(r: RecurringReferral): number {
  const repeatCustomers = num(r.repeatCustomers)
  const newCustomers = num(r.newCustomers)
  const avgRepeatCount = num(r.avgRepeatCount)
  const denom = newCustomers + repeatCustomers
  if (denom <= 0 || avgRepeatCount <= 0) return 1
  const repeatShare = clamp(safeDiv(repeatCustomers, denom), 0, 1)
  return 1 + repeatShare * Math.max(0, avgRepeatCount - 1)
}

/** RM = 1 + avgReferralsPerCustomer × referralCloseRate. No referrals ⇒ 1.0. */
export function referralMultiplier(r: RecurringReferral): number {
  const refs = Math.max(0, num(r.avgReferralsPerCustomer))
  const closeRate = clamp(rate(r.referralCloseRate), 0, 1)
  return 1 + refs * closeRate
}

export function reconcile(
  stated: number | undefined,
  bottomUp: number | undefined,
  base: number | undefined,
  mode: SourceOfTruthMode,
): RevenueReconciliation {
  const hasStated = stated != null && isFinite(stated) && stated > 0
  const hasBottom = bottomUp != null && isFinite(bottomUp) && bottomUp > 0

  let variance: number | undefined
  let variancePct: number | undefined
  let agreement: RevenueReconciliation['agreement'] = 'na'
  if (hasStated && hasBottom) {
    variance = bottomUp! - stated!
    variancePct = safeDiv(bottomUp! - stated!, stated!)
    const abs = Math.abs(variancePct)
    agreement = abs < 0.15 ? 'strong' : abs < 0.4 ? 'moderate' : 'weak'
  }

  let sourceOfTruth: 'stated' | 'bottomUp'
  if (mode === 'bottomUp' && hasBottom) sourceOfTruth = 'bottomUp'
  else if (mode === 'auto') {
    if (hasStated && (!hasBottom || Math.abs(variancePct ?? 0) <= 3)) sourceOfTruth = 'stated'
    else if (hasBottom) sourceOfTruth = 'bottomUp'
    else sourceOfTruth = 'stated'
  } else {
    sourceOfTruth = hasStated ? 'stated' : 'bottomUp'
  }

  let note: string
  if (!hasStated && !hasBottom) note = 'No revenue basis — enter monthly revenue or channel/product data.'
  else if (sourceOfTruth === 'stated')
    note = hasBottom
      ? `Using stated revenue as source of truth; bottom-up model is ${agreement} agreement.`
      : 'Using stated monthly revenue as source of truth.'
  else note = 'No stated revenue — using the bottom-up model (confidence capped at medium).'

  return { stated: hasStated ? stated : undefined, bottomUp: hasBottom ? bottomUp : undefined, base, variance, variancePct, sourceOfTruth, agreement, note }
}

export function resolveRevenue(
  input: TCVRInput,
  benchmarks: ResolvedBenchmarks,
  config: EngineConfig = {},
): RevenueModel {
  const q = new QualityBuilder()
  const mode: SourceOfTruthMode = config.sourceOfTruth ?? 'stated'
  const { profile, recurring, costs } = input

  const statedRaw = num(profile.currentMonthlyRevenue)
  const stated = statedRaw > 0 ? statedRaw : undefined

  // ── Traffic ────────────────────────────────────────────────────────────────
  const channelLeads = sum(input.channels.map((c) => num(c.monthlyLeads)))
  const traffic = channelLeads > 0 ? channelLeads : stageCount(input, 'Lead')
  if (traffic <= 0) q.add('NO_LEADS', 'degraded', 'No lead volume entered (channels or funnel).')

  // ── ABV & New Customers (break the circular dependency) ──────────────────────
  const abvRes = deriveABV(input)
  const ncRes = deriveNewCustomers(input)
  let abv = abvRes.abv
  let newCustomers = ncRes.nc
  let ncSource = ncRes.source

  const channelSales = sum(input.channels.map((c) => num(c.sales)))
  const revenueBasis = stated ?? (channelSales > 0 ? channelSales : undefined)

  if (newCustomers == null && abv != null && abv > 0 && revenueBasis != null) {
    newCustomers = safeDiv(revenueBasis, abv)
    ncSource = 'derived'
  }
  if (abv == null && newCustomers != null && newCustomers > 0 && stated != null) {
    abv = safeDiv(stated, newCustomers)
  }
  if (newCustomers == null) q.add('NO_CUSTOMERS', 'degraded', 'Could not determine new-customer count.')
  if (abv == null) q.add('NO_ABV', 'degraded', 'Could not determine average basket value.')

  // ── GP margin (cascade) ──────────────────────────────────────────────────────
  let gpMargin = rate(profile.currentGPMargin, 0)
  let gpMarginKnown = normalizeRate(profile.currentGPMargin) != null
  if (!gpMarginKnown) {
    const chGp = sum(input.channels.map((c) => num(c.gp)))
    if (channelSales > 0 && chGp > 0) {
      gpMargin = clamp(safeDiv(chGp, channelSales), 0, 1)
      gpMarginKnown = true
    }
  }
  if (!gpMarginKnown) {
    const prods = input.products.filter((p) => num(p.price) > 0 && num(p.monthlyVolume) > 0)
    const pSales = sum(prods.map((p) => num(p.price) * num(p.monthlyVolume)))
    const pGp = sum(prods.map((p) => (num(p.price) - num(p.cost)) * num(p.monthlyVolume)))
    if (pSales > 0) {
      gpMargin = clamp(safeDiv(pGp, pSales), 0, 1)
      gpMarginKnown = true
    }
  }
  if (!gpMarginKnown) {
    gpMargin = benchmarks.gpMargin
    q.add('GP_MARGIN_DEFAULTED', 'degraded', 'GP margin not provided — using a benchmark default.')
  }

  // ── Factors & bottom-up revenue ──────────────────────────────────────────────
  const conversionRate = traffic > 0 && newCustomers != null ? clamp(safeDiv(newCustomers, traffic), 0, 1) : 0
  const rpf = repeatPurchaseFactor(recurring)
  const rm = referralMultiplier(recurring)

  const haveBottom = traffic > 0 && abv != null && abv > 0 && newCustomers != null
  const base = haveBottom ? traffic * conversionRate * abv! : undefined
  const bottomUp = base != null ? base * rpf * rm : undefined

  const reconciliation = reconcile(stated, bottomUp, base, mode)

  let revenue = 0
  if (reconciliation.sourceOfTruth === 'stated' && stated != null) revenue = stated
  else if (bottomUp != null) {
    revenue = bottomUp
    q.cap('medium')
  } else if (stated != null) revenue = stated
  else {
    q.add('NO_REVENUE_BASIS', 'blocker', 'No stated revenue and not enough data to model it.')
  }

  // ── Financials ───────────────────────────────────────────────────────────────
  const grossProfit = revenue * gpMargin
  const marketingCost = num(costs.marketingCost)
  const rewardCost = num(costs.rewardCost)
  const operationalCost = num(costs.operationalCost)
  const netProfitImpact = grossProfit - marketingCost - rewardCost - operationalCost

  const cac = safeDiv(marketingCost, num(newCustomers))

  // LTV
  const lifespanMonths = num(recurring.customerLifespan)
  const repeatCycleDays = num(recurring.avgRepeatCycle)
  let purchaseFrequency: number
  if (lifespanMonths > 0 && repeatCycleDays > 0) {
    purchaseFrequency = Math.max(1, safeDiv(lifespanMonths * 30, repeatCycleDays, lifespanMonths))
  } else if (num(recurring.avgRepeatCount) > 0) {
    purchaseFrequency = Math.max(1, num(recurring.avgRepeatCount))
    q.add('LTV_APPROXIMATED', 'degraded', 'Lifespan/cycle missing — LTV approximated from repeat count.')
  } else {
    purchaseFrequency = 1
    q.add('LTV_APPROXIMATED', 'degraded', 'No retention data — LTV assumes a single purchase.')
  }
  const ltv = num(abv) * gpMargin * purchaseFrequency
  const ltvToCac = safeDiv(ltv, cac)

  return {
    revenue,
    grossProfit,
    gpMargin,
    netProfitImpact,
    traffic,
    conversionRate,
    averageBasketValue: num(abv),
    repeatPurchaseFactor: rpf,
    referralMultiplier: rm,
    newCustomers: num(newCustomers),
    newCustomersSource: ncSource,
    cac,
    ltv,
    ltvToCac,
    purchaseFrequency,
    customerLifespanMonths: lifespanMonths,
    reconciliation,
    bottomUpRevenueRaw: num(bottomUp),
    quality: q.build(),
  }
}
