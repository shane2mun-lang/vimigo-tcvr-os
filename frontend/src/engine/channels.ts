// ─────────────────────────────────────────────────────────────────────────────
// Channel analysis. Two clearly-separated views:
//   • PAID efficiency  (CPL / ROAS / GP ROAS / CAC) — paid channels only, so free
//     organic leads & referral sales never flatter the ad numbers.
//   • OVERALL totals    — the whole business across paid + organic/free channels.
// Organic/free channels are still fully reported (leads, customers, sales, GP,
// conversion, contribution %) — just excluded from the paid efficiency maths.
// ─────────────────────────────────────────────────────────────────────────────

import { QualityBuilder, clamp, num, safeDiv, sum } from './util'
import type {
  ChannelAggregate,
  ChannelAnalysis,
  ChannelMetric,
  PaidEfficiency,
  RevenueModel,
  TCVRInput,
  TrafficChannel,
} from './types'

const MIN_LEADS = 5

export function channelMetric(c: TrafficChannel, gpMargin: number): ChannelMetric {
  const leads = num(c.monthlyLeads)
  const spend = num(c.monthlySpend)
  const sales = num(c.sales)
  const closedDeals = num(c.closedDeals)
  const impressions = num(c.monthlyImpressions)
  const isOrganic = spend <= 0
  const gp = c.gp != null && isFinite(c.gp) ? num(c.gp) : sales * gpMargin

  return {
    id: c.id,
    name: c.name,
    isOrganic,
    lowSample: leads < MIN_LEADS,
    cpl: isOrganic ? null : safeDiv(spend, leads),
    cpa: isOrganic ? null : safeDiv(spend, closedDeals),
    conversionRate: clamp(safeDiv(closedDeals, leads), 0, 1),
    leadToImpressionRate: safeDiv(leads, impressions),
    sales,
    gp,
    spend,
    leads,
    closedDeals,
    gpPerLead: safeDiv(gp, leads),
    gpPerDeal: safeDiv(gp, closedDeals),
    contributionPct: 0, // filled once totals are known
    roas: isOrganic ? null : safeDiv(sales, spend),
    roi: isOrganic ? null : safeDiv(gp - spend, spend),
    leadQualityScore: c.leadQualityScore,
    hasFollowUp: c.hasFollowUp,
  }
}

function argbest<T>(items: T[], score: (t: T) => number | null, dir: 'max' | 'min'): T | undefined {
  let best: T | undefined
  let bestVal = dir === 'max' ? -Infinity : Infinity
  for (const it of items) {
    const v = score(it)
    if (v == null || !isFinite(v)) continue
    if ((dir === 'max' && v > bestVal) || (dir === 'min' && v < bestVal)) {
      bestVal = v
      best = it
    }
  }
  return best
}

export function analyzeChannels(
  input: TCVRInput,
  revenue: RevenueModel,
  _benchmarks: { roasFloor: number; cplCeiling: number },
): ChannelAnalysis {
  const q = new QualityBuilder()
  const perChannel = input.channels.map((c) => channelMetric(c, revenue.gpMargin))
  if (perChannel.length === 0) q.add('NO_CHANNELS', 'degraded', 'No traffic channels entered.')

  const totals = {
    leads: sum(perChannel.map((c) => c.leads)),
    spend: sum(perChannel.map((c) => c.spend)),
    sales: sum(perChannel.map((c) => c.sales)),
    gp: sum(perChannel.map((c) => c.gp)),
    closedDeals: sum(perChannel.map((c) => c.closedDeals)),
    impressions: sum(perChannel.map((c) => num(input.channels.find((x) => x.id === c.id)?.monthlyImpressions))),
  }

  // Per-channel contribution = share of total sales.
  for (const m of perChannel) m.contributionPct = safeDiv(m.sales, totals.sales)

  // ── Paid vs organic split ────────────────────────────────────────────────────
  const paidCh = perChannel.filter((m) => !m.isOrganic)
  const organicCh = perChannel.filter((m) => m.isOrganic)

  const paidSpend = sum(paidCh.map((c) => c.spend))
  const paidLeads = sum(paidCh.map((c) => c.leads))
  const paidCustomers = sum(paidCh.map((c) => c.closedDeals))
  const paidSales = sum(paidCh.map((c) => c.sales))
  const paidGP = sum(paidCh.map((c) => c.gp))

  const paid: PaidEfficiency = {
    spend: paidSpend,
    leads: paidLeads,
    customers: paidCustomers,
    sales: paidSales,
    gp: paidGP,
    cpl: safeDiv(paidSpend, paidLeads),
    roas: safeDiv(paidSales, paidSpend),
    gpRoas: safeDiv(paidGP, paidSpend),
    cac: safeDiv(paidSpend, paidCustomers),
    conversionRate: clamp(safeDiv(paidCustomers, paidLeads), 0, 1),
    contributionPct: safeDiv(paidSales, totals.sales),
  }

  const organicLeads = sum(organicCh.map((c) => c.leads))
  const organicCustomers = sum(organicCh.map((c) => c.closedDeals))
  const organicSales = sum(organicCh.map((c) => c.sales))
  const organicGP = sum(organicCh.map((c) => c.gp))

  const organic: ChannelAggregate = {
    leads: organicLeads,
    customers: organicCustomers,
    sales: organicSales,
    gp: organicGP,
    spend: 0,
    conversionRate: clamp(safeDiv(organicCustomers, organicLeads), 0, 1),
    contributionPct: safeDiv(organicSales, totals.sales),
  }

  // Blended CAC reuses the revenue model's CAC (marketing ÷ all new customers).
  const blendedCAC = revenue.cac
  const paidCAC = safeDiv(paidSpend, paidCustomers)

  // ── Rankings (paid ROI only; GP across all) ──────────────────────────────────
  const paidEnough = paidCh.filter((c) => c.leads >= MIN_LEADS)
  const bestByRoi = argbest(paidEnough, (c) => c.roi, 'max')
  const worstByRoi = argbest(paidEnough, (c) => c.roi, 'min')
  const bestByGp = argbest(perChannel, (c) => c.gp, 'max')
  const bestByVolume = argbest(perChannel, (c) => c.leads, 'max')

  // ── Traffic gap to target (extra spend priced at PAID CPL) ───────────────────
  const targetRevenue = num(input.profile.targetMonthlyRevenue)
  let trafficGap: ChannelAnalysis['trafficGap'] = {}
  if (targetRevenue > 0 && totals.leads > 0 && revenue.revenue > 0) {
    const revenuePerLead = safeDiv(revenue.revenue, totals.leads)
    const leadsNeeded = safeDiv(targetRevenue, revenuePerLead)
    const gapLeads = Math.max(0, leadsNeeded - totals.leads)
    trafficGap = {
      targetRevenue,
      revenuePerLead,
      leadsNeeded,
      gapLeads,
      gapPct: safeDiv(gapLeads, totals.leads),
      extraSpendAtPaidCpl: gapLeads * paid.cpl,
    }
  } else if (targetRevenue > 0) {
    trafficGap = { targetRevenue }
  }

  return {
    perChannel,
    totals,
    paid,
    organic,
    blendedCAC,
    paidCAC,
    bestByRoi: bestByRoi?.name,
    worstByRoi: worstByRoi?.name,
    bestByGp: bestByGp?.name,
    bestByVolume: bestByVolume?.name,
    trafficGap,
    quality: q.build(),
  }
}
