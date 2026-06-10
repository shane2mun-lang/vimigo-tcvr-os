// ─────────────────────────────────────────────────────────────────────────────
// Demo account — a fully-populated Malaysian electrical-appliance retail chain
// (Seng Heng-style business). Every module is filled so every dashboard lights up.
// The numbers are internally consistent ON PURPOSE so the engine reads cleanly:
//   • channel sales sum to RM1,250,000 = stated monthly revenue
//   • channel GP ≈ 22% = stated GP margin
//   • funnel Lead count = channel leads; ClosedWon = channel closes
//   • the story: strong walk-in traffic, decent conversion, thin margins, WEAK
//     repeat/referral (classic appliance retail) → engine diagnoses 'no-repeat'
//     and recommends warranty/consumables/membership plays. Great classroom demo.
// ─────────────────────────────────────────────────────────────────────────────

import type { TCVRInput } from '@/engine/types'

export const DEMO_NAME = 'SH 电器连锁 Demo · SH Electrical Chain'

export const demoElectricalChain: TCVRInput = {
  profile: {
    name: DEMO_NAME,
    industry: '家电零售连锁 Electrical Appliances Retail',
    website: 'https://www.sh-electrical-demo.com.my',
    teamSize: 45,
    salesModel: 'Retail',
    customerType: 'B2C',
    currentMonthlyRevenue: 1250000,
    targetMonthlyRevenue: 1800000,
    currentGPMargin: 22,
    biggestBottleneck: 'no-repeat',
  },
  channels: [
    { id: 'demo-walk', name: 'Walk-in 门店自然客流', monthlyImpressions: 0, monthlyLeads: 2200, monthlySpend: 0, leadQualityScore: 4, owner: '门市组', hasFollowUp: false, closedDeals: 660, sales: 580000, gp: 127600 },
    { id: 'demo-fb', name: 'Facebook Ads', monthlyImpressions: 850000, monthlyLeads: 1200, monthlySpend: 18000, leadQualityScore: 3, owner: '市场部', hasFollowUp: true, closedDeals: 95, sales: 218000, gp: 48000 },
    { id: 'demo-ecom', name: 'Shopee / Lazada 电商', monthlyImpressions: 400000, monthlyLeads: 900, monthlySpend: 12000, leadQualityScore: 3, owner: '电商组', hasFollowUp: true, closedDeals: 180, sales: 162000, gp: 32400 },
    { id: 'demo-tt', name: 'TikTok 直播带货', monthlyImpressions: 600000, monthlyLeads: 650, monthlySpend: 6500, leadQualityScore: 2, owner: '市场部', hasFollowUp: false, closedDeals: 70, sales: 75000, gp: 15800 },
    { id: 'demo-goog', name: 'Google Ads', monthlyImpressions: 220000, monthlyLeads: 380, monthlySpend: 9500, leadQualityScore: 4, owner: '市场部', hasFollowUp: true, closedDeals: 55, sales: 132000, gp: 29000 },
    { id: 'demo-ref', name: 'Referral 老客转介绍', monthlyImpressions: 0, monthlyLeads: 160, monthlySpend: 0, leadQualityScore: 5, owner: '客服组', hasFollowUp: true, closedDeals: 85, sales: 83000, gp: 19900 },
  ],
  funnel: [
    { key: 'Lead', count: 5490, avgWaitTime: 0, owner: '市场部', hasSOP: true },
    { key: 'QualifiedLead', count: 3800, avgWaitTime: 1, owner: '销售组', lostReason: '只是问价 / 预算不符', hasSOP: true },
    { key: 'Appointment', count: 2900, avgWaitTime: 1, owner: '门市组', lostReason: '没到店', nextAction: 'WhatsApp 提醒 + 到店礼', hasSOP: true },
    { key: 'Quotation', count: 2100, avgWaitTime: 2, owner: '销售组', lostReason: '去竞争对手比价', hasSOP: true },
    { key: 'FollowUp', count: 1500, avgWaitTime: 3, owner: '销售组', lostReason: '没人跟进就冷掉', nextAction: '报价后 D1 WhatsApp / D3 电话', hasSOP: false },
    { key: 'ClosedWon', count: 1145, avgWaitTime: 1, owner: '销售组', hasSOP: true },
    { key: 'ClosedLost', count: 750, owner: '销售组', lostReason: '价格 / 比价输了' },
    { key: 'PaymentCollected', count: 1095, avgWaitTime: 3, owner: '财务', hasSOP: true },
  ],
  products: [
    { id: 'demo-p1', name: '小家电特价区（电水壶/风扇）', tag: '引流品', price: 49, cost: 38, avgCycle: 1, avgCloseRate: 45, monthlyVolume: 850, easyPriceCompare: true, goodForAds: true },
    { id: 'demo-p2', name: '32–43寸智能电视', tag: '爆品', price: 1299, cost: 1070, avgCycle: 2, avgCloseRate: 30, monthlyVolume: 220, easyPriceCompare: true, goodForAds: true, easyUpsell: true },
    { id: 'demo-p3', name: '冰箱 / 洗衣机大家电', tag: '核心品', price: 2400, cost: 1900, avgCycle: 3, avgCloseRate: 25, monthlyVolume: 180, easyUpsell: true },
    { id: 'demo-p4', name: '安装 + 延长保修配套', tag: '利润品', price: 399, cost: 80, avgCycle: 1, avgCloseRate: 35, monthlyVolume: 260, easyUpsell: true, goodForReward: true },
    { id: 'demo-p5', name: '手机配件 / 数码周边', tag: '现金流品', price: 89, cost: 52, avgCycle: 1, avgCloseRate: 40, monthlyVolume: 600, easyRepeat: true },
    { id: 'demo-p6', name: '全屋家电配套（新房 Package）', tag: '大鲸鱼', price: 18800, cost: 15200, avgCycle: 21, avgCloseRate: 15, monthlyVolume: 8, goodForReward: true },
    { id: 'demo-p7', name: '净水器滤芯 / 耗材会员包', tag: '复购品', price: 159, cost: 60, avgCycle: 2, avgCloseRate: 50, monthlyVolume: 320, easyRepeat: true, easyReferral: true },
  ],
  recurring: {
    newCustomers: 1145,
    repeatCustomers: 95,
    avgRepeatCount: 1.6,
    avgRepeatCycle: 280,
    customerLifespan: 36,
    avgReferralsPerCustomer: 0.15,
    referralCloseRate: 53,
    hasMembership: false,
    hasAftercare: true,
    hasReviewMechanism: true,
    hasReferralReward: false,
  },
  costs: {
    marketingCost: 46000,
    rewardCost: 15000,
    operationalCost: 165000,
  },
}
