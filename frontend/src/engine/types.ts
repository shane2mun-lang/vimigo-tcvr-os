// ─────────────────────────────────────────────────────────────────────────────
// vimigo TCVR Revenue OS — Engine type contract
//
// This file is the single source of truth for every shape the engine consumes and
// produces. The frontend store holds these input types verbatim; dashboards read
// the output types. Lock this first — everything imports from here.
// ─────────────────────────────────────────────────────────────────────────────

// ── Enumerations ─────────────────────────────────────────────────────────────

export type SalesModel =
  | 'Retail'
  | 'Online'
  | 'Service'
  | 'B2B'
  | 'Project'
  | 'Distributor'
  | 'Subscription'

export type CustomerType =
  | 'B2C'
  | 'SME'
  | 'Corporate'
  | 'Dealer'
  | 'Designer'
  | 'Developer'

export type Bottleneck =
  | 'no-traffic' // 没流量
  | 'traffic-no-close' // 有流量没成交
  | 'low-close' // 成交低
  | 'no-repeat' // 客户不复购
  | 'no-followup' // 团队不跟进
  | 'messy-product-structure' // 产品结构乱

/** Product ladder tags. Stored as the canonical Chinese token; UI localizes for display. */
export type ProductTag =
  | '引流品' // lead magnet
  | '爆品' // hero / bestseller
  | '核心品' // core
  | '利润品' // profit
  | '现金流品' // cashflow
  | '大鲸鱼' // whale / high-ticket
  | '复购品' // repeat / subscription

export const PRODUCT_TAGS: ProductTag[] = [
  '引流品',
  '爆品',
  '核心品',
  '利润品',
  '现金流品',
  '大鲸鱼',
  '复购品',
]

export type FunnelStageKey =
  | 'Lead'
  | 'QualifiedLead'
  | 'Appointment'
  | 'Quotation'
  | 'FollowUp'
  | 'ClosedWon'
  | 'ClosedLost'
  | 'PaymentCollected'

/** The multiplicative "main path" (ClosedLost is a terminal sink, handled separately). */
export const FUNNEL_MAIN_PATH: FunnelStageKey[] = [
  'Lead',
  'QualifiedLead',
  'Appointment',
  'Quotation',
  'FollowUp',
  'ClosedWon',
  'PaymentCollected',
]

export type TCVRPillar = 'traffic' | 'conversion' | 'value' | 'recurring'

export type Health = 'green' | 'yellow' | 'red'

export type RewardRole =
  | 'Sales'
  | 'Marketing'
  | 'CSM'
  | 'BranchManager'
  | 'Project'
  | 'Designer'
  | 'DealerManager'

export type RewardType =
  | 'Cash'
  | 'Diamond'
  | 'Commission'
  | 'TeamReward'
  | 'Recognition'
  | 'Leaderboard'

// ── Data-quality primitives ──────────────────────────────────────────────────

export type Confidence = 'high' | 'medium' | 'low' | 'insufficient'

export type GapSeverity = 'blocker' | 'degraded' | 'cosmetic'

export interface DataGap {
  code: string
  severity: GapSeverity
  message: string
}

export interface BlockQuality {
  confidence: Confidence
  gaps: DataGap[]
}

// ── Inputs ───────────────────────────────────────────────────────────────────

export interface CompanyProfile {
  name?: string
  industry?: string
  website?: string
  socials?: string[]
  teamSize?: number
  salesModel: SalesModel
  customerType?: CustomerType
  currentMonthlyRevenue?: number
  targetMonthlyRevenue?: number
  /** Stored as decimal (0.30) OR percent (30) — normalized centrally. */
  currentGPMargin?: number
  biggestBottleneck?: Bottleneck
}

export interface TrafficChannel {
  id: string
  name: string
  monthlyImpressions?: number
  monthlyLeads?: number
  monthlySpend?: number
  /** 1–5 subjective lead-quality rating. */
  leadQualityScore?: number
  owner?: string
  hasFollowUp?: boolean
  closedDeals?: number
  sales?: number
  gp?: number
}

export interface FunnelStage {
  key: FunnelStageKey
  count?: number
  /** Average days a deal waits at this stage. */
  avgWaitTime?: number
  owner?: string
  lostReason?: string
  nextAction?: string
  hasSOP?: boolean
}

export interface Product {
  id: string
  name: string
  tag?: ProductTag
  price?: number
  cost?: number
  /** Average days to close this product. */
  avgCycle?: number
  /** 0..1 or 0..100 — normalized. */
  avgCloseRate?: number
  monthlyVolume?: number
  easyPriceCompare?: boolean
  easyUpsell?: boolean
  easyRepeat?: boolean
  easyReferral?: boolean
  goodForAds?: boolean
  goodForReward?: boolean
}

export interface RecurringReferral {
  newCustomers?: number
  repeatCustomers?: number
  avgRepeatCount?: number
  /** Days between repeat purchases. */
  avgRepeatCycle?: number
  /** Months. */
  customerLifespan?: number
  avgReferralsPerCustomer?: number
  /** 0..1 or 0..100 — normalized. */
  referralCloseRate?: number
  hasMembership?: boolean
  hasAftercare?: boolean
  hasReviewMechanism?: boolean
  hasReferralReward?: boolean
}

export interface Costs {
  marketingCost?: number
  rewardCost?: number
  operationalCost?: number
}

export interface TCVRInput {
  profile: CompanyProfile
  channels: TrafficChannel[]
  funnel: FunnelStage[]
  products: Product[]
  recurring: RecurringReferral
  costs: Costs
}

// ── Config ───────────────────────────────────────────────────────────────────

/** All lever values are PERCENT POINTS. +20 trafficPct → traffic ×1.20. */
export interface LeverDeltas {
  trafficPct?: number
  conversionPct?: number
  abvPct?: number
  /** Additive in margin points: +5 → margin + 0.05. */
  gpMarginPct?: number
  repeatPct?: number
  referralPct?: number
}

export interface ScenarioDeltaConfig {
  B: LeverDeltas
  C: LeverDeltas
  D: LeverDeltas
  E: LeverDeltas
}

export type SourceOfTruthMode = 'stated' | 'bottomUp' | 'auto'

export interface EngineConfig {
  benchmarks?: Partial<BenchmarkTable>
  scenarioDeltas?: ScenarioDeltaConfig
  sourceOfTruth?: SourceOfTruthMode
}

// ── Benchmarks ───────────────────────────────────────────────────────────────

export interface BenchmarkSet {
  closeRate: number
  gpMargin: number
  repeatRate: number
  referralRate: number
  cplCeiling: number
  roasFloor: number
  salesCycleDays: number
  repeatUplift: number
  referralUplift: number
  reactivationRate: number
}

export type BenchmarkTable = Record<SalesModel, BenchmarkSet>

export interface ResolvedBenchmarks extends BenchmarkSet {
  model: SalesModel
}

// ── Revenue model ────────────────────────────────────────────────────────────

export interface RevenueReconciliation {
  stated?: number
  bottomUp?: number
  base?: number
  variance?: number
  variancePct?: number
  sourceOfTruth: 'stated' | 'bottomUp'
  agreement: 'strong' | 'moderate' | 'weak' | 'na'
  note: string
}

export type NewCustomersSource = 'funnel' | 'channels' | 'recurring' | 'derived' | 'none'

export interface RevenueModel {
  revenue: number
  grossProfit: number
  gpMargin: number
  netProfitImpact: number
  // Decomposed TCVR factors
  traffic: number
  conversionRate: number
  averageBasketValue: number
  repeatPurchaseFactor: number
  referralMultiplier: number
  newCustomers: number
  newCustomersSource: NewCustomersSource
  // Financials
  cac: number
  ltv: number
  ltvToCac: number
  purchaseFrequency: number
  customerLifespanMonths: number
  reconciliation: RevenueReconciliation
  /** Raw bottom-up revenue before scaling to source-of-truth (used by scenarios). */
  bottomUpRevenueRaw: number
  quality: BlockQuality
}

// ── Channel analysis ─────────────────────────────────────────────────────────

export interface ChannelMetric {
  id: string
  name: string
  isOrganic: boolean
  lowSample: boolean
  cpl: number | null
  cpa: number | null
  conversionRate: number
  leadToImpressionRate: number
  sales: number
  gp: number
  spend: number
  leads: number
  closedDeals: number
  gpPerLead: number
  gpPerDeal: number
  contributionPct: number
  roas: number | null
  roi: number | null
  leadQualityScore?: number
  hasFollowUp?: boolean
}

export interface ChannelTotals {
  leads: number
  spend: number
  sales: number
  gp: number
  closedDeals: number
  impressions: number
}

export interface TrafficGap {
  targetRevenue?: number
  revenuePerLead?: number
  leadsNeeded?: number
  gapLeads?: number
  gapPct?: number
  extraSpendAtPaidCpl?: number
}

export interface ChannelAggregate {
  leads: number
  customers: number
  sales: number
  gp: number
  spend: number
  conversionRate: number
  contributionPct: number
}

/** Paid-channels-only efficiency — undistorted by free organic leads / referral sales. */
export interface PaidEfficiency {
  spend: number
  leads: number
  customers: number
  sales: number
  gp: number
  cpl: number // paid spend ÷ paid leads
  roas: number // paid sales ÷ paid spend
  gpRoas: number // paid GP ÷ paid spend
  cac: number // paid spend ÷ paid customers
  conversionRate: number // paid customers ÷ paid leads
  contributionPct: number // paid sales share of total sales
}

export interface ChannelAnalysis {
  perChannel: ChannelMetric[]
  totals: ChannelTotals
  /** Paid Channel Efficiency view — how well the ads are performing. */
  paid: PaidEfficiency
  /** Organic / free channels (walk-in, referral, organic…) — shown, but excluded from paid efficiency. */
  organic: ChannelAggregate
  /** Blended CAC = total marketing spend ÷ all new customers (overall acquisition efficiency). */
  blendedCAC: number
  /** Paid CAC = paid marketing spend ÷ new customers from paid channels. */
  paidCAC: number
  bestByRoi?: string
  worstByRoi?: string
  bestByGp?: string
  bestByVolume?: string
  trafficGap: TrafficGap
  quality: BlockQuality
}

// ── Funnel analysis ──────────────────────────────────────────────────────────

export interface FunnelStepRate {
  from: FunnelStageKey
  to: FunnelStageKey
  rate: number
  fromCount: number
  toCount: number
  bridged: boolean
}

export interface FunnelAnalysis {
  stepRates: FunnelStepRate[]
  overallConversion: number
  paymentCollectionRate: number
  biggestDropStage?: { from: FunnelStageKey; to: FunnelStageKey; rate: number }
  lostDeals: number
  lostSalesValue: number
  lostGPValue: number
  followUpLeakageDeals: number
  followUpLeakageValue: number
  followUpLeakageGP: number
  salesCycleDays: number
  forecastedSales: number
  forecastedGP: number
  sopCoverage: number // 0..1 share of stages with an SOP
  quality: BlockQuality
}

// ── Product analysis ─────────────────────────────────────────────────────────

export interface ProductMetric {
  id: string
  name: string
  tag?: ProductTag
  price: number
  cost: number
  gpPerUnit: number
  gpMargin: number
  monthlyVolume: number
  monthlySales: number
  monthlyGP: number
  gpVelocity: number // GP per cycle-day (cashflow proxy)
  mixContributionPct: number // share of total GP
  closeRate: number
  rewardPriority: boolean
  flags: {
    easyPriceCompare: boolean
    easyUpsell: boolean
    easyRepeat: boolean
    easyReferral: boolean
    goodForAds: boolean
    goodForReward: boolean
  }
}

export interface LadderGap {
  code: string
  missingTag?: ProductTag
  message: string
  severity: GapSeverity
}

export interface ProductAnalysis {
  perProduct: ProductMetric[]
  abvProducts: number
  totalMonthlyGP: number
  bestGpProduct?: string
  bestCashflowProduct?: string
  bestLeadMagnetProduct?: string
  bestUpsellProduct?: string
  ladderPresent: ProductTag[]
  ladderGaps: LadderGap[]
  recommendedLadder: ProductTag[]
  quality: BlockQuality
}

// ── Retention / referral analysis ────────────────────────────────────────────

export interface RetentionAnalysis {
  repeatPurchaseRate: number
  referralRate: number
  ltv: number
  referralLtv: number
  retentionRevenue: number
  lostRetentionValue: number
  comebackForecast: number
  referralSalesForecast: number
  referralGpForecast: number
  retentionInfraScore: number // 0..4
  missingMechanisms: ('membership' | 'aftercare' | 'review' | 'referralReward')[]
  quality: BlockQuality
}

// ── Scenario analysis ────────────────────────────────────────────────────────

export type ScenarioId = 'A' | 'B' | 'C' | 'D' | 'E' | 'custom'

export interface ScenarioResult {
  id: ScenarioId
  label: string
  deltas: LeverDeltas
  revenue: number
  gp: number
  deltaRevenue: number
  deltaGp: number
  deltaRevenuePct: number
  deltaGpPct: number
}

export type LeverKey = keyof LeverDeltas

export interface LeverRanking {
  lever: LeverKey
  deltaGpAt10Pct: number
  effortAdjusted: number
  rank: number
}

export interface ScenarioBase {
  revenue: number
  gp: number
  traffic: number
  conversionRate: number
  abv: number
  rpf: number
  rm: number
  gpMargin: number
}

export interface ScenarioAnalysis {
  base: ScenarioBase
  scenarios: ScenarioResult[]
  leverRanking: LeverRanking[]
  topLever: { lever: LeverKey; deltaGp: number }
  notes: string[]
  quality: BlockQuality
}

// ── Insights ─────────────────────────────────────────────────────────────────

export interface PillarHealth {
  pillar: TCVRPillar
  score: number
  band: Health
  drivers: { code: string; actual: number; benchmark: number }[]
}

export type InsightSeverity = 'critical' | 'warning' | 'info'

export interface Insight {
  code: string
  severity: InsightSeverity
  pillar?: TCVRPillar
  title: string
  detail: string
  moneyImpact?: number
}

export interface RewardSuggestion {
  pillar: TCVRPillar
  metricCode: string
  role: RewardRole
  rewardType: RewardType
  rationale: string
  suggestedKpi: string
}

export interface VimiGoalDraft {
  goal: string
  measure: string
  accountability: RewardRole
  reward: { type: RewardType; basis: string }
  linkedPillar: TCVRPillar
  expectedGpImpact: number
}

export interface InsightReport {
  pillarHealth: PillarHealth[]
  overallHealth: Health
  primaryBottleneck: {
    computed: Bottleneck
    stated?: Bottleneck
    agreement: 'confirmed' | 'differs'
    evidence: string[]
  }
  topGrowthLevers: Insight[]
  topLeaks: Insight[]
  ladderGapMessages: Insight[]
  rewardSuggestions: RewardSuggestion[]
  vimiGoalDrafts: VimiGoalDraft[]
  allInsights: Insight[]
  quality: BlockQuality
}

// ── Top-level result ─────────────────────────────────────────────────────────

export interface EngineResult {
  revenue: RevenueModel
  channels: ChannelAnalysis
  funnel: FunnelAnalysis
  products: ProductAnalysis
  retention: RetentionAnalysis
  scenarios: ScenarioAnalysis
  insights: InsightReport
  benchmarksUsed: ResolvedBenchmarks
  quality: BlockQuality
  meta: { engineVersion: string; salesModel: SalesModel }
}
