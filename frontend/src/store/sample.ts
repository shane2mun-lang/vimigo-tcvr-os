// Default empty input + a rich sample company (also used as the demo / test fixture).

import { FUNNEL_MAIN_PATH } from '@/engine/types'
import type { FunnelStage, FunnelStageKey, TCVRInput } from '@/engine/types'

const ALL_STAGES: FunnelStageKey[] = [
  'Lead',
  'QualifiedLead',
  'Appointment',
  'Quotation',
  'FollowUp',
  'ClosedWon',
  'ClosedLost',
  'PaymentCollected',
]

export function emptyFunnel(): FunnelStage[] {
  return ALL_STAGES.map((key) => ({ key }))
}

export function emptyInput(): TCVRInput {
  return {
    profile: { salesModel: 'Retail' },
    channels: [],
    funnel: emptyFunnel(),
    products: [],
    recurring: {},
    costs: {},
  }
}

export const sampleInput: TCVRInput = {
  profile: {
    name: 'Acme Living Sdn Bhd',
    industry: 'Furniture Retail',
    website: 'https://acmeliving.example',
    teamSize: 18,
    salesModel: 'Retail',
    customerType: 'B2C',
    currentMonthlyRevenue: 300000,
    targetMonthlyRevenue: 450000,
    currentGPMargin: 35,
    biggestBottleneck: 'traffic-no-close',
  },
  channels: [
    { id: 'ch-fb', name: 'Facebook Ads', monthlyImpressions: 200000, monthlyLeads: 320, monthlySpend: 6000, leadQualityScore: 3, owner: 'Mktg', hasFollowUp: true, closedDeals: 28, sales: 84000, gp: 29400 },
    { id: 'ch-tt', name: 'TikTok Ads', monthlyImpressions: 150000, monthlyLeads: 180, monthlySpend: 3500, leadQualityScore: 3, owner: 'Mktg', hasFollowUp: false, closedDeals: 12, sales: 30000, gp: 10500 },
    { id: 'ch-walk', name: 'Walk-in', monthlyImpressions: 0, monthlyLeads: 140, monthlySpend: 0, leadQualityScore: 4, owner: 'Branch', hasFollowUp: true, closedDeals: 40, sales: 130000, gp: 45500 },
    { id: 'ch-ref', name: 'Referral', monthlyImpressions: 0, monthlyLeads: 60, monthlySpend: 0, leadQualityScore: 5, owner: 'Sales', hasFollowUp: false, closedDeals: 30, sales: 95000, gp: 33250 },
    { id: 'ch-goog', name: 'Google Ads', monthlyImpressions: 80000, monthlyLeads: 90, monthlySpend: 4000, leadQualityScore: 4, owner: 'Mktg', hasFollowUp: true, closedDeals: 10, sales: 31000, gp: 10850 },
  ],
  funnel: [
    { key: 'Lead', count: 790, avgWaitTime: 1, owner: 'Mktg', hasSOP: true },
    { key: 'QualifiedLead', count: 420, avgWaitTime: 2, owner: 'Sales', lostReason: 'Not qualified / budget', hasSOP: true },
    { key: 'Appointment', count: 260, avgWaitTime: 3, owner: 'Sales', lostReason: 'No-show', hasSOP: false },
    { key: 'Quotation', count: 180, avgWaitTime: 4, owner: 'Sales', hasSOP: true },
    { key: 'FollowUp', count: 150, avgWaitTime: 7, owner: 'Sales', lostReason: 'No follow-up cadence', nextAction: 'WhatsApp + call day 3', hasSOP: false },
    { key: 'ClosedWon', count: 120, avgWaitTime: 2, owner: 'Sales', hasSOP: true },
    { key: 'ClosedLost', count: 60, owner: 'Sales', lostReason: 'Price / went cold' },
    { key: 'PaymentCollected', count: 110, avgWaitTime: 5, owner: 'Admin', hasSOP: true },
  ],
  products: [
    { id: 'p-clean', name: 'Sofa Care Voucher', tag: '引流品', price: 39, cost: 10, avgCycle: 1, avgCloseRate: 40, monthlyVolume: 80, easyRepeat: true, goodForAds: true, easyPriceCompare: true },
    { id: 'p-sofa', name: '3-Seater Bestseller Sofa', tag: '爆品', price: 2200, cost: 1300, avgCycle: 7, avgCloseRate: 25, monthlyVolume: 35, goodForAds: true, easyUpsell: true },
    { id: 'p-mod', name: 'Modular Sofa Set', tag: '核心品', price: 4800, cost: 3000, avgCycle: 14, avgCloseRate: 20, monthlyVolume: 22, easyUpsell: true },
    { id: 'p-rec', name: 'Premium Recliner', tag: '利润品', price: 6500, cost: 3200, avgCycle: 10, avgCloseRate: 18, monthlyVolume: 8, goodForReward: true, easyUpsell: true },
    { id: 'p-home', name: 'Full Home Package', tag: '大鲸鱼', price: 38000, cost: 22000, avgCycle: 30, avgCloseRate: 12, monthlyVolume: 2, goodForReward: true },
    { id: 'p-care', name: 'Care & Protection Plan', tag: '复购品', price: 299, cost: 60, avgCycle: 2, avgCloseRate: 35, monthlyVolume: 40, easyRepeat: true, easyReferral: true },
  ],
  recurring: {
    newCustomers: 120,
    repeatCustomers: 18,
    avgRepeatCount: 2.2,
    avgRepeatCycle: 240,
    customerLifespan: 18,
    avgReferralsPerCustomer: 0.4,
    referralCloseRate: 35,
    hasMembership: false,
    hasAftercare: true,
    hasReviewMechanism: false,
    hasReferralReward: false,
  },
  costs: {
    marketingCost: 13500,
    rewardCost: 4000,
    operationalCost: 60000,
  },
}

export { FUNNEL_MAIN_PATH }
