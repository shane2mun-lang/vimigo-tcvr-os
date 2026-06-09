// Formula audit — runs the engine on the FULL sample dataset and dumps every
// intermediate value so each formula can be hand-verified. Run: tsx scripts/formula-audit.ts
import { analyze } from '../frontend/src/engine/index'
import type { TCVRInput } from '../frontend/src/engine/types'

// Full sample (mirrors frontend/src/store/sample.ts)
const input: TCVRInput = {
  profile: { name: 'Acme Living', industry: 'Furniture Retail', salesModel: 'Retail', customerType: 'B2C', currentMonthlyRevenue: 300000, targetMonthlyRevenue: 450000, currentGPMargin: 35, biggestBottleneck: 'traffic-no-close' },
  channels: [
    { id: 'ch-fb', name: 'Facebook Ads', monthlyImpressions: 200000, monthlyLeads: 320, monthlySpend: 6000, leadQualityScore: 3, hasFollowUp: true, closedDeals: 28, sales: 84000, gp: 29400 },
    { id: 'ch-tt', name: 'TikTok Ads', monthlyImpressions: 150000, monthlyLeads: 180, monthlySpend: 3500, leadQualityScore: 3, hasFollowUp: false, closedDeals: 12, sales: 30000, gp: 10500 },
    { id: 'ch-walk', name: 'Walk-in', monthlyImpressions: 0, monthlyLeads: 140, monthlySpend: 0, leadQualityScore: 4, hasFollowUp: true, closedDeals: 40, sales: 130000, gp: 45500 },
    { id: 'ch-ref', name: 'Referral', monthlyImpressions: 0, monthlyLeads: 60, monthlySpend: 0, leadQualityScore: 5, hasFollowUp: false, closedDeals: 30, sales: 95000, gp: 33250 },
    { id: 'ch-goog', name: 'Google Ads', monthlyImpressions: 80000, monthlyLeads: 90, monthlySpend: 4000, leadQualityScore: 4, hasFollowUp: true, closedDeals: 10, sales: 31000, gp: 10850 },
  ],
  funnel: [
    { key: 'Lead', count: 790, avgWaitTime: 1, hasSOP: true },
    { key: 'QualifiedLead', count: 420, avgWaitTime: 2, hasSOP: true },
    { key: 'Appointment', count: 260, avgWaitTime: 3, hasSOP: false },
    { key: 'Quotation', count: 180, avgWaitTime: 4, hasSOP: true },
    { key: 'FollowUp', count: 150, avgWaitTime: 7, hasSOP: false },
    { key: 'ClosedWon', count: 120, avgWaitTime: 2, hasSOP: true },
    { key: 'ClosedLost', count: 60 },
    { key: 'PaymentCollected', count: 110, avgWaitTime: 5, hasSOP: true },
  ],
  products: [
    { id: 'p-clean', name: 'Sofa Care Voucher', tag: '引流品', price: 39, cost: 10, avgCycle: 1, avgCloseRate: 40, monthlyVolume: 80, easyRepeat: true, goodForAds: true, easyPriceCompare: true },
    { id: 'p-sofa', name: '3-Seater Sofa', tag: '爆品', price: 2200, cost: 1300, avgCycle: 7, avgCloseRate: 25, monthlyVolume: 35, goodForAds: true, easyUpsell: true },
    { id: 'p-mod', name: 'Modular Sofa Set', tag: '核心品', price: 4800, cost: 3000, avgCycle: 14, avgCloseRate: 20, monthlyVolume: 22, easyUpsell: true },
    { id: 'p-rec', name: 'Premium Recliner', tag: '利润品', price: 6500, cost: 3200, avgCycle: 10, avgCloseRate: 18, monthlyVolume: 8, goodForReward: true, easyUpsell: true },
    { id: 'p-home', name: 'Full Home Package', tag: '大鲸鱼', price: 38000, cost: 22000, avgCycle: 30, avgCloseRate: 12, monthlyVolume: 2, goodForReward: true },
    { id: 'p-care', name: 'Care & Protection Plan', tag: '复购品', price: 299, cost: 60, avgCycle: 2, avgCloseRate: 35, monthlyVolume: 40, easyRepeat: true, easyReferral: true },
  ],
  recurring: { newCustomers: 120, repeatCustomers: 18, avgRepeatCount: 2.2, avgRepeatCycle: 240, customerLifespan: 18, avgReferralsPerCustomer: 0.4, referralCloseRate: 35, hasMembership: false, hasAftercare: true, hasReviewMechanism: false, hasReferralReward: false },
  costs: { marketingCost: 13500, rewardCost: 4000, operationalCost: 60000 },
}

const r = analyze(input)
const f2 = (x: number) => Math.round(x * 100) / 100
const pct = (x: number) => f2(x * 100) + '%'

console.log('═══ REVENUE ═══')
console.log({
  traffic_T: r.revenue.traffic,
  newCustomers_NC: r.revenue.newCustomers, ncSource: r.revenue.newCustomersSource,
  ABV: f2(r.revenue.averageBasketValue),
  conversionRate: pct(r.revenue.conversionRate),
  gpMargin: pct(r.revenue.gpMargin),
  RPF: f2(r.revenue.repeatPurchaseFactor),
  RM: f2(r.revenue.referralMultiplier),
  bottomUpRaw: f2(r.revenue.bottomUpRevenueRaw),
  revenue: f2(r.revenue.revenue),
  grossProfit: f2(r.revenue.grossProfit),
  CAC: f2(r.revenue.cac),
  purchaseFreq: f2(r.revenue.purchaseFrequency),
  LTV: f2(r.revenue.ltv),
  ltvToCac: f2(r.revenue.ltvToCac),
  netProfitImpact: f2(r.revenue.netProfitImpact),
  reconciliation: { sot: r.revenue.reconciliation.sourceOfTruth, agreement: r.revenue.reconciliation.agreement, variancePct: r.revenue.reconciliation.variancePct != null ? pct(r.revenue.reconciliation.variancePct) : null },
})

console.log('\n═══ CHANNELS ═══')
for (const c of r.channels.perChannel) console.log(`${c.name}: cpl=${c.cpl} conv=${pct(c.conversionRate)} roi=${c.roi != null ? f2(c.roi) : null} contrib=${pct(c.contributionPct)} organic=${c.isOrganic}`)
console.log('totals', r.channels.totals)
const pd = r.channels.paid
console.log('PAID', { spend: pd.spend, leads: pd.leads, customers: pd.customers, sales: pd.sales, gp: pd.gp, cpl: f2(pd.cpl), roas: f2(pd.roas), gpRoas: f2(pd.gpRoas), cac: f2(pd.cac), conv: pct(pd.conversionRate), contrib: pct(pd.contributionPct) })
const og = r.channels.organic
console.log('ORGANIC', { leads: og.leads, customers: og.customers, sales: og.sales, gp: og.gp, conv: pct(og.conversionRate), contrib: pct(og.contributionPct) })
console.log('CAC', { blended: f2(r.channels.blendedCAC), paid: f2(r.channels.paidCAC) })
console.log('best/worst byRoi', r.channels.bestByRoi, '/', r.channels.worstByRoi, 'bestGp', r.channels.bestByGp)
console.log('trafficGap', { leadsNeeded: f2(r.channels.trafficGap.leadsNeeded ?? 0), gapLeads: f2(r.channels.trafficGap.gapLeads ?? 0), extraSpend: f2(r.channels.trafficGap.extraSpendAtPaidCpl ?? 0) })

console.log('\n═══ FUNNEL ═══')
for (const s of r.funnel.stepRates) console.log(`${s.from}→${s.to}: ${pct(s.rate)} (${s.fromCount}→${s.toCount}) bridged=${s.bridged}`)
console.log({ overallConv: pct(r.funnel.overallConversion), paymentRate: pct(r.funnel.paymentCollectionRate), biggestDrop: r.funnel.biggestDropStage, lostDeals: r.funnel.lostDeals, lostSales: f2(r.funnel.lostSalesValue), lostGP: f2(r.funnel.lostGPValue), followUpLeakDeals: r.funnel.followUpLeakageDeals, followUpLeakVal: f2(r.funnel.followUpLeakageValue), followUpLeakGP: f2(r.funnel.followUpLeakageGP), salesCycleDays: r.funnel.salesCycleDays, forecastSales: f2(r.funnel.forecastedSales), sopCoverage: pct(r.funnel.sopCoverage) })

console.log('\n═══ PRODUCTS ═══')
for (const p of r.products.perProduct) console.log(`${p.name} [${p.tag}]: gp/u=${f2(p.gpPerUnit)} margin=${pct(p.gpMargin)} monthlyGP=${f2(p.monthlyGP)} mix=${pct(p.mixContributionPct)} velocity=${f2(p.gpVelocity)} rewardPri=${p.rewardPriority}`)
console.log({ abvProducts: f2(r.products.abvProducts), totalMonthlyGP: f2(r.products.totalMonthlyGP), bestGp: r.products.bestGpProduct, bestCashflow: r.products.bestCashflowProduct, bestLeadMagnet: r.products.bestLeadMagnetProduct, bestUpsell: r.products.bestUpsellProduct, ladderPresent: r.products.ladderPresent, gaps: r.products.ladderGaps.map((g) => g.code) })

console.log('\n═══ RETENTION ═══')
console.log({ repeatRate: pct(r.retention.repeatPurchaseRate), referralRate: pct(r.retention.referralRate), ltv: f2(r.retention.ltv), referralLtv: f2(r.retention.referralLtv), retentionRevenue: f2(r.retention.retentionRevenue), lostRetention: f2(r.retention.lostRetentionValue), comeback: f2(r.retention.comebackForecast), referralSalesForecast: f2(r.retention.referralSalesForecast), referralGpForecast: f2(r.retention.referralGpForecast), infraScore: r.retention.retentionInfraScore, missing: r.retention.missingMechanisms })

console.log('\n═══ SCENARIOS ═══')
for (const s of r.scenarios.scenarios) console.log(`${s.id} ${s.label}: rev=${f2(s.revenue)} gp=${f2(s.gp)} ΔGP=${f2(s.deltaGp)} ΔGP%=${pct(s.deltaGpPct)}`)
console.log('leverRanking', r.scenarios.leverRanking.map((l) => `${l.lever}:Δ${f2(l.deltaGpAt10Pct)}(rank${l.rank})`))
console.log('topLever', r.scenarios.topLever.lever, f2(r.scenarios.topLever.deltaGp))

console.log('\n═══ INSIGHTS ═══')
console.log('pillarHealth', r.insights.pillarHealth.map((p) => `${p.pillar}:${Math.round(p.score)}:${p.band}`))
console.log('overall', r.insights.overallHealth)
console.log('bottleneck', r.insights.primaryBottleneck.computed, 'vs stated', r.insights.primaryBottleneck.stated, '→', r.insights.primaryBottleneck.agreement)
console.log('topLeaks', r.insights.topLeaks.map((l) => `${l.code}:${f2(l.moneyImpact ?? 0)}`))
console.log('rewardSuggestions', r.insights.rewardSuggestions.map((s) => `${s.metricCode}→${s.role}/${s.rewardType}`))
console.log('vimiGoals', r.insights.vimiGoalDrafts.map((g) => g.goal))
