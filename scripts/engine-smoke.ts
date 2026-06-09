// Runtime smoke test for the pure engine. Run: tsx scripts/engine-smoke.ts
import { analyze } from '../frontend/src/engine/index'
import type { TCVRInput } from '../frontend/src/engine/types'

const input: TCVRInput = {
  profile: {
    salesModel: 'Retail',
    currentMonthlyRevenue: 300000,
    targetMonthlyRevenue: 450000,
    currentGPMargin: 35,
    biggestBottleneck: 'traffic-no-close',
  },
  channels: [
    { id: 'a', name: 'Facebook Ads', monthlyImpressions: 200000, monthlyLeads: 320, monthlySpend: 6000, leadQualityScore: 3, hasFollowUp: true, closedDeals: 28, sales: 84000, gp: 29400 },
    { id: 'b', name: 'Walk-in', monthlyLeads: 140, monthlySpend: 0, leadQualityScore: 4, closedDeals: 40, sales: 130000, gp: 45500 },
    { id: 'c', name: 'TikTok Ads', monthlyLeads: 180, monthlySpend: 3500, closedDeals: 12, sales: 30000, gp: 10500 },
  ],
  funnel: [
    { key: 'Lead', count: 640 },
    { key: 'QualifiedLead', count: 360 },
    { key: 'Appointment', count: 220 },
    { key: 'Quotation', count: 150 },
    { key: 'FollowUp', count: 130, hasSOP: false },
    { key: 'ClosedWon', count: 80 },
    { key: 'ClosedLost', count: 50 },
    { key: 'PaymentCollected', count: 74 },
  ],
  products: [
    { id: 'p1', name: 'Voucher', tag: '引流品', price: 39, cost: 10, monthlyVolume: 80, avgCloseRate: 40 },
    { id: 'p2', name: 'Sofa', tag: '爆品', price: 2200, cost: 1300, monthlyVolume: 35, avgCloseRate: 25, easyUpsell: true },
    { id: 'p3', name: 'Recliner', tag: '利润品', price: 6500, cost: 3200, monthlyVolume: 8, goodForReward: true },
  ],
  recurring: {
    newCustomers: 80, repeatCustomers: 14, avgRepeatCount: 2.2, avgRepeatCycle: 240,
    customerLifespan: 18, avgReferralsPerCustomer: 0.4, referralCloseRate: 35, hasAftercare: true,
  },
  costs: { marketingCost: 9500, rewardCost: 4000, operationalCost: 60000 },
}

const r = analyze(input)
const fin = (x: number) => Number.isFinite(x)

const checks: [string, boolean, unknown][] = [
  ['revenue finite & >0', fin(r.revenue.revenue) && r.revenue.revenue > 0, r.revenue.revenue],
  ['gpMargin 0..1', r.revenue.gpMargin > 0 && r.revenue.gpMargin <= 1, r.revenue.gpMargin],
  ['CAC finite', fin(r.revenue.cac), r.revenue.cac],
  ['LTV finite', fin(r.revenue.ltv), r.revenue.ltv],
  ['conv rate 0..1', r.revenue.conversionRate >= 0 && r.revenue.conversionRate <= 1, r.revenue.conversionRate],
  ['paid CPL finite', fin(r.channels.paid.cpl), r.channels.paid.cpl],
  ['paid CAC > blended CAC (organic dilutes)', r.channels.paidCAC > r.channels.blendedCAC, { paid: r.channels.paidCAC, blended: r.channels.blendedCAC }],
  ['walk-in organic cpl null', r.channels.perChannel.find((c) => c.id === 'b')?.cpl === null, r.channels.perChannel.find((c) => c.id === 'b')?.cpl],
  ['overall conversion finite', fin(r.funnel.overallConversion), r.funnel.overallConversion],
  ['biggest drop present', !!r.funnel.biggestDropStage, r.funnel.biggestDropStage],
  ['products total GP finite', fin(r.products.totalMonthlyGP), r.products.totalMonthlyGP],
  ['ladder gaps detected', r.products.ladderGaps.length > 0, r.products.ladderGaps.map((g) => g.code)],
  ['scenario A == today', Math.abs(r.scenarios.scenarios[0]!.deltaGp) < 1, r.scenarios.scenarios[0]!.deltaGp],
  ['scenario B GP > A GP', r.scenarios.scenarios[1]!.gp > r.scenarios.scenarios[0]!.gp, r.scenarios.scenarios[1]!.deltaGp],
  ['top lever set', !!r.scenarios.topLever.lever, r.scenarios.topLever],
  ['4 pillar healths', r.insights.pillarHealth.length === 4, r.insights.pillarHealth.map((p) => `${p.pillar}:${Math.round(p.score)}:${p.band}`)],
  ['bottleneck computed', !!r.insights.primaryBottleneck.computed, r.insights.primaryBottleneck],
  ['reward suggestions', r.insights.rewardSuggestions.length > 0, r.insights.rewardSuggestions.length],
  ['vimigoal drafts', r.insights.vimiGoalDrafts.length > 0, r.insights.vimiGoalDrafts.map((g) => g.goal)],
  ['no NaN in revenue block', Object.values(r.revenue).every((v) => typeof v !== 'number' || fin(v)), 'ok'],
]

let pass = 0
for (const [name, ok, val] of checks) {
  console.log(`${ok ? '✅' : '❌'} ${name} =>`, JSON.stringify(val))
  if (ok) pass++
}
console.log(`\n${pass}/${checks.length} checks passed`)
console.log('\nHeadline:', {
  revenue: Math.round(r.revenue.revenue),
  gp: Math.round(r.revenue.grossProfit),
  cac: Math.round(r.revenue.cac),
  ltv: Math.round(r.revenue.ltv),
  overallHealth: r.insights.overallHealth,
  topLever: r.scenarios.topLever.lever,
})
if (pass < checks.length) process.exit(1)
