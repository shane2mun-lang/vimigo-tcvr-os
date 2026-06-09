// ─────────────────────────────────────────────────────────────────────────────
// Rule-based diagnostics — deterministic, no LLM. Pillar health, primary
// bottleneck, top growth levers, top leaks, reward mapping, and vimiGoal drafts.
// Text is English by default; the UI localizes by `code` where it has a string.
// ─────────────────────────────────────────────────────────────────────────────

import { QualityBuilder, band, clamp, num, ratioToScore, safeDiv, toPct } from './util'
import type {
  Bottleneck,
  ChannelAnalysis,
  CompanyProfile,
  FunnelAnalysis,
  Health,
  Insight,
  InsightReport,
  LeverKey,
  PillarHealth,
  ProductAnalysis,
  ResolvedBenchmarks,
  RetentionAnalysis,
  RevenueModel,
  RewardRole,
  RewardSuggestion,
  RewardType,
  ScenarioAnalysis,
  TCVRPillar,
  VimiGoalDraft,
} from './types'

export interface AnalysisBlocks {
  revenue: RevenueModel
  channels: ChannelAnalysis
  funnel: FunnelAnalysis
  products: ProductAnalysis
  retention: RetentionAnalysis
  scenarios: ScenarioAnalysis
}

interface ScorePart {
  score: number
  weight: number
}

function blend(parts: ScorePart[]): number {
  const live = parts.filter((p) => isFinite(p.score))
  const wsum = live.reduce((s, p) => s + p.weight, 0)
  if (wsum <= 0) return 50
  return clamp(live.reduce((s, p) => s + p.score * p.weight, 0) / wsum, 0, 100)
}

// ── Pillar health ──────────────────────────────────────────────────────────────

function trafficHealth(b: AnalysisBlocks, bm: ResolvedBenchmarks): PillarHealth {
  // Ad efficiency is judged on PAID CPL only; organic-only businesses skip this factor.
  const cplScore =
    b.channels.paid.spend > 0
      ? ratioToScore(b.channels.paid.cpl, bm.cplCeiling, { lowerIsBetter: true })
      : NaN
  const leadsNeeded = b.channels.trafficGap.leadsNeeded
  const volumeScore = leadsNeeded ? ratioToScore(b.channels.totals.leads, leadsNeeded) : NaN
  const qualities = b.channels.perChannel.map((c) => num(c.leadQualityScore)).filter((x) => x > 0)
  const qualityScore = qualities.length ? (qualities.reduce((s, x) => s + x, 0) / qualities.length / 5) * 100 : NaN
  const score = blend([
    { score: cplScore, weight: 2 },
    { score: volumeScore, weight: 1.5 },
    { score: qualityScore, weight: 1 },
  ])
  return {
    pillar: 'traffic',
    score,
    band: band(score),
    drivers: [
      { code: 'CPL', actual: b.channels.paid.cpl, benchmark: bm.cplCeiling },
      { code: 'LEADS', actual: b.channels.totals.leads, benchmark: leadsNeeded ?? 0 },
    ],
  }
}

function conversionHealth(b: AnalysisBlocks, bm: ResolvedBenchmarks): PillarHealth {
  const closeScore = ratioToScore(b.funnel.overallConversion, bm.closeRate)
  const sopScore = b.funnel.sopCoverage * 100
  const payScore = b.funnel.paymentCollectionRate > 0 ? b.funnel.paymentCollectionRate * 100 : NaN
  const score = blend([
    { score: closeScore, weight: 2.5 },
    { score: sopScore, weight: 1 },
    { score: payScore, weight: 1 },
  ])
  return {
    pillar: 'conversion',
    score,
    band: band(score),
    drivers: [
      { code: 'CLOSE_RATE', actual: b.funnel.overallConversion, benchmark: bm.closeRate },
      { code: 'SOP', actual: b.funnel.sopCoverage, benchmark: 1 },
    ],
  }
}

function valueHealth(b: AnalysisBlocks, bm: ResolvedBenchmarks): PillarHealth {
  const marginScore = ratioToScore(b.revenue.gpMargin, bm.gpMargin)
  const degradedGaps = b.products.ladderGaps.filter((g) => g.severity === 'degraded').length
  const ladderScore = clamp(100 - degradedGaps * 25, 0, 100)
  const score = blend([
    { score: marginScore, weight: 2 },
    { score: ladderScore, weight: 1.5 },
  ])
  return {
    pillar: 'value',
    score,
    band: band(score),
    drivers: [
      { code: 'GP_MARGIN', actual: b.revenue.gpMargin, benchmark: bm.gpMargin },
      { code: 'LADDER', actual: b.products.ladderPresent.length, benchmark: 6 },
    ],
  }
}

function recurringHealth(b: AnalysisBlocks, bm: ResolvedBenchmarks): PillarHealth {
  const repeatScore = ratioToScore(b.retention.repeatPurchaseRate, bm.repeatRate)
  const referralScore = ratioToScore(b.retention.referralRate, bm.referralRate)
  const infraScore = (b.retention.retentionInfraScore / 4) * 100
  const score = blend([
    { score: repeatScore, weight: 2 },
    { score: referralScore, weight: 1.5 },
    { score: infraScore, weight: 1 },
  ])
  return {
    pillar: 'recurring',
    score,
    band: band(score),
    drivers: [
      { code: 'REPEAT', actual: b.retention.repeatPurchaseRate, benchmark: bm.repeatRate },
      { code: 'REFERRAL', actual: b.retention.referralRate, benchmark: bm.referralRate },
    ],
  }
}

// ── Bottleneck ───────────────────────────────────────────────────────────────

function pickBottleneck(pillars: PillarHealth[], b: AnalysisBlocks): { code: Bottleneck; evidence: string[] } {
  const lowest = [...pillars].sort((a, c) => a.score - c.score)[0]!
  const evidence: string[] = []
  let code: Bottleneck

  if (lowest.pillar === 'traffic') {
    code = 'no-traffic'
    evidence.push(`Traffic health ${Math.round(lowest.score)} / 100; paid CPL ${Math.round(b.channels.paid.cpl)}.`)
  } else if (lowest.pillar === 'conversion') {
    if (b.funnel.sopCoverage < 0.5) {
      code = 'no-followup'
      evidence.push(`Only ${toPct(b.funnel.sopCoverage)}% of funnel stages have a follow-up SOP.`)
    } else {
      code = 'low-close'
      evidence.push(`Overall conversion ${toPct(b.funnel.overallConversion)}%.`)
    }
  } else if (lowest.pillar === 'value') {
    code = 'messy-product-structure'
    evidence.push(`${b.products.ladderGaps.length} product-ladder gap(s); GP margin ${toPct(b.revenue.gpMargin)}%.`)
  } else {
    code = 'no-repeat'
    evidence.push(`Repeat rate ${toPct(b.retention.repeatPurchaseRate)}% vs healthy levels.`)
  }
  return { code, evidence }
}

// ── Levers / leaks ─────────────────────────────────────────────────────────────

const LEVER_PILLAR: Record<LeverKey, TCVRPillar> = {
  trafficPct: 'traffic',
  conversionPct: 'conversion',
  abvPct: 'value',
  gpMarginPct: 'value',
  repeatPct: 'recurring',
  referralPct: 'recurring',
}

function leverHowTo(lever: LeverKey, b: AnalysisBlocks): string {
  switch (lever) {
    case 'trafficPct':
      return `Scale your best-ROI channel (${b.channels.bestByRoi ?? 'top channel'}) and fix or cut the worst (${b.channels.worstByRoi ?? 'weakest channel'}).`
    case 'conversionPct': {
      const drop = b.funnel.biggestDropStage
      return drop
        ? `Add a script/SOP at the biggest drop-off: ${drop.from} → ${drop.to} (only ${toPct(drop.rate)}% advance).`
        : 'Tighten qualification and follow-up SOP to lift close rate.'
    }
    case 'abvPct':
      return `Introduce an upsell/bundle around ${b.products.bestUpsellProduct ?? 'your hero product'}.`
    case 'gpMarginPct':
      return `Shift the sales mix toward higher-GP products (${b.products.bestGpProduct ?? 'profit products'}).`
    case 'repeatPct':
      return 'Launch a membership / after-care / reactivation flow to bring customers back.'
    case 'referralPct':
      return 'Add a referral reward so happy customers introduce new ones.'
  }
}

function topGrowthLevers(b: AnalysisBlocks): Insight[] {
  return b.scenarios.leverRanking.slice(0, 3).map((r) => ({
    code: `LEVER_${r.lever}`,
    severity: 'info' as const,
    pillar: LEVER_PILLAR[r.lever],
    title: `Grow GP via ${LEVER_PILLAR[r.lever]}`,
    detail: leverHowTo(r.lever, b),
    moneyImpact: r.deltaGpAt10Pct,
  }))
}

function topLeaks(b: AnalysisBlocks): Insight[] {
  const gpMargin = b.revenue.gpMargin
  const worst = b.channels.perChannel.find((c) => c.name === b.channels.worstByRoi)
  const candidates: Insight[] = [
    {
      code: 'FUNNEL_DROP',
      severity: 'warning',
      pillar: 'conversion',
      title: 'Follow-up leakage',
      detail: `${Math.round(b.funnel.followUpLeakageDeals)} quoted/followed-up deals never closed.`,
      moneyImpact: b.funnel.followUpLeakageGP,
    },
    {
      code: 'LOST_DEALS',
      severity: 'warning',
      pillar: 'conversion',
      title: 'Lost deals',
      detail: `${Math.round(b.funnel.lostDeals)} deals marked lost this period.`,
      moneyImpact: b.funnel.lostGPValue,
    },
    {
      code: 'LOW_REPEAT',
      severity: 'warning',
      pillar: 'recurring',
      title: 'Weak repeat purchase',
      detail: 'Lifting repeat behavior to healthy levels would add recurring GP.',
      moneyImpact: b.retention.lostRetentionValue * gpMargin,
    },
    {
      code: 'NO_REFERRAL',
      severity: 'info',
      pillar: 'recurring',
      title: 'Unrealized referrals',
      detail: 'Customers are not being mobilized to refer.',
      moneyImpact: b.retention.referralGpForecast,
    },
  ]
  if (worst && worst.roi != null && worst.roi < 0) {
    candidates.push({
      code: 'WORST_CHANNEL',
      severity: 'warning',
      pillar: 'traffic',
      title: `Loss-making channel: ${worst.name}`,
      detail: `${worst.name} is returning negative ROI on ${Math.round(worst.spend)} spend.`,
      moneyImpact: Math.max(0, -worst.roi) * worst.spend,
    })
  }
  return candidates
    .filter((c) => num(c.moneyImpact) > 0)
    .sort((a, c) => num(c.moneyImpact) - num(a.moneyImpact))
    .slice(0, 3)
}

// ── Reward mapping ─────────────────────────────────────────────────────────────

function refineRole(role: RewardRole, profile: CompanyProfile): RewardRole {
  if ((profile.customerType === 'Dealer' || profile.salesModel === 'Distributor') && role === 'Sales') return 'DealerManager'
  if (profile.customerType === 'Designer' && role === 'Sales') return 'Designer'
  if (profile.salesModel === 'Project' && role === 'BranchManager') return 'Project'
  return role
}

function mapRewards(b: AnalysisBlocks, pillars: PillarHealth[], profile: CompanyProfile): RewardSuggestion[] {
  const out: RewardSuggestion[] = []
  const weak = (p: TCVRPillar) => (pillars.find((x) => x.pillar === p)?.band ?? 'green') !== 'green'
  const push = (s: RewardSuggestion) => out.push({ ...s, role: refineRole(s.role, profile) })

  if (weak('traffic'))
    push({ pillar: 'traffic', metricCode: 'CPL_LEADS', role: 'Marketing', rewardType: 'Leaderboard', suggestedKpi: 'Qualified leads & cost-per-lead', rationale: 'Reward the channels and people that bring efficient, qualified traffic.' })
  if (weak('conversion')) {
    push({ pillar: 'conversion', metricCode: 'CLOSE_RATE', role: 'Sales', rewardType: 'Commission', suggestedKpi: 'Lead → close rate', rationale: 'Tie commission to close rate so the team optimizes conversion, not just activity.' })
    if (b.funnel.sopCoverage < 0.6)
      push({ pillar: 'conversion', metricCode: 'FOLLOWUP_SOP', role: 'CSM', rewardType: 'Diamond', suggestedKpi: 'Follow-up SOP compliance & speed', rationale: 'Reward disciplined, fast follow-up to stop quoted deals leaking.' })
  }
  if (weak('value')) {
    push({ pillar: 'value', metricCode: 'ABV_UPSELL', role: 'Sales', rewardType: 'Commission', suggestedKpi: 'Average basket value / upsell rate', rationale: 'Reward bigger baskets so ABV rises without more traffic.' })
    push({ pillar: 'value', metricCode: 'GP_MIX', role: 'BranchManager', rewardType: 'TeamReward', suggestedKpi: 'High-GP product mix %', rationale: 'Reward the team for selling the profit products, not only the easy ones.' })
  }
  if (weak('recurring')) {
    push({ pillar: 'recurring', metricCode: 'REPEAT', role: 'CSM', rewardType: 'TeamReward', suggestedKpi: 'Repeat customers / reactivations', rationale: 'Reward bringing customers back — the cheapest revenue you have.' })
    push({ pillar: 'recurring', metricCode: 'REFERRAL', role: 'CSM', rewardType: 'Cash', suggestedKpi: 'Referred customers who close', rationale: 'Pay for referred closes to lower blended CAC.' })
  }
  return out
}

// ── vimiGoal drafts ──────────────────────────────────────────────────────────

function draftVimiGoals(b: AnalysisBlocks, bm: ResolvedBenchmarks, profile: CompanyProfile): VimiGoalDraft[] {
  const rankMap = new Map(b.scenarios.leverRanking.map((r) => [r.lever, r.deltaGpAt10Pct]))
  const top = b.scenarios.leverRanking.slice(0, 3)

  return top.map((r): VimiGoalDraft => {
    const lever = r.lever
    const pillar = LEVER_PILLAR[lever]
    const impact = num(rankMap.get(lever))
    let goal = ''
    let measure = ''
    let accountability: RewardRole = 'Sales'
    let reward: { type: RewardType; basis: string } = { type: 'Commission', basis: '% of incremental GP' }

    if (lever === 'conversionPct') {
      const cur = b.funnel.overallConversion
      const target = cur < bm.closeRate * 0.5 ? (cur + bm.closeRate) / 2 : bm.closeRate
      goal = `Lift lead→close from ${toPct(cur)}% to ${toPct(target)}%`
      measure = `ClosedWon ÷ Lead ≥ ${toPct(target)}% (monthly)`
      accountability = 'Sales'
      reward = { type: 'Commission', basis: '2% of incremental GP' }
    } else if (lever === 'trafficPct') {
      goal = `Grow qualified leads by 20%`
      measure = `Monthly leads ≥ ${Math.round(b.channels.totals.leads * 1.2)}`
      accountability = 'Marketing'
      reward = { type: 'Leaderboard', basis: 'Top-lead-generator board + Diamond' }
    } else if (lever === 'abvPct') {
      goal = `Raise average basket value by 15%`
      measure = `ABV ≥ ${Math.round(b.revenue.averageBasketValue * 1.15)}`
      accountability = 'Sales'
      reward = { type: 'Commission', basis: 'Tiered commission on basket size' }
    } else if (lever === 'gpMarginPct') {
      goal = `Shift mix to lift GP margin to ${toPct(bm.gpMargin)}%`
      measure = `Blended GP margin ≥ ${toPct(bm.gpMargin)}%`
      accountability = 'BranchManager'
      reward = { type: 'TeamReward', basis: 'Team reward on profit-product mix' }
    } else if (lever === 'repeatPct') {
      const target = Math.max(bm.repeatRate, b.retention.repeatPurchaseRate + 0.1)
      goal = `Lift repeat rate to ${toPct(target)}%`
      measure = `Repeat customers ÷ total ≥ ${toPct(target)}%`
      accountability = 'CSM'
      reward = { type: 'TeamReward', basis: 'Team reward on retained revenue' }
    } else {
      goal = `Generate referred closes from existing customers`
      measure = `Referred customers who close ≥ ${Math.max(1, Math.round(b.revenue.newCustomers * 0.1))}/month`
      accountability = 'CSM'
      reward = { type: 'Cash', basis: 'Cash per referred close' }
    }

    return {
      goal,
      measure,
      accountability: refineRole(accountability, profile),
      reward,
      linkedPillar: pillar,
      expectedGpImpact: impact,
    }
  })
}

// ── Orchestration ──────────────────────────────────────────────────────────────

export function buildInsights(
  blocks: AnalysisBlocks,
  benchmarks: ResolvedBenchmarks,
  profile: CompanyProfile,
): InsightReport {
  const q = new QualityBuilder()

  const pillarHealth: PillarHealth[] = [
    trafficHealth(blocks, benchmarks),
    conversionHealth(blocks, benchmarks),
    valueHealth(blocks, benchmarks),
    recurringHealth(blocks, benchmarks),
  ]

  const minScore = Math.min(...pillarHealth.map((p) => p.score))
  const avgScore =
    pillarHealth.reduce((s, p, i) => s + p.score * [0.25, 0.3, 0.25, 0.2][i]!, 0)
  const overallHealth: Health = band(0.5 * minScore + 0.5 * avgScore)

  const bottleneck = pickBottleneck(pillarHealth, blocks)
  const stated = profile.biggestBottleneck
  const primaryBottleneck: InsightReport['primaryBottleneck'] = {
    computed: bottleneck.code,
    stated,
    agreement: stated && stated === bottleneck.code ? 'confirmed' : 'differs',
    evidence: bottleneck.evidence,
  }

  const growth = topGrowthLevers(blocks)
  const leaks = topLeaks(blocks)
  const ladderGapMessages: Insight[] = blocks.products.ladderGaps.map((g) => ({
    code: g.code,
    severity: g.severity === 'degraded' ? 'warning' : 'info',
    pillar: 'value',
    title: 'Product ladder gap',
    detail: g.message,
  }))
  const rewardSuggestions = mapRewards(blocks, pillarHealth, profile)
  const vimiGoalDrafts = draftVimiGoals(blocks, benchmarks, profile)

  const allInsights: Insight[] = [...growth, ...leaks, ...ladderGapMessages]

  return {
    pillarHealth,
    overallHealth,
    primaryBottleneck,
    topGrowthLevers: growth,
    topLeaks: leaks,
    ladderGapMessages,
    rewardSuggestions,
    vimiGoalDrafts,
    allInsights,
    quality: q.build(),
  }
}
