// ─────────────────────────────────────────────────────────────────────────────
// Product analysis — per-product GP, mix contribution, "best" products, and
// product-ladder gap detection (引流品 → 爆品 → 核心品 → 利润品 → 大鲸鱼 → 复购品).
// ─────────────────────────────────────────────────────────────────────────────

import { QualityBuilder, clamp, num, rate, safeDiv, sum } from './util'
import { PRODUCT_TAGS } from './types'
import type {
  LadderGap,
  Product,
  ProductAnalysis,
  ProductMetric,
  ProductTag,
  TCVRInput,
} from './types'

function metricFor(p: Product, totalGpRef: { value: number }): ProductMetric {
  const price = num(p.price)
  const cost = num(p.cost)
  const gpPerUnit = price - cost
  const monthlyVolume = num(p.monthlyVolume)
  const monthlyGP = gpPerUnit * monthlyVolume
  const avgCycle = num(p.avgCycle)
  return {
    id: p.id,
    name: p.name,
    tag: p.tag,
    price,
    cost,
    gpPerUnit,
    gpMargin: clamp(safeDiv(gpPerUnit, price), -1, 1),
    monthlyVolume,
    monthlySales: price * monthlyVolume,
    monthlyGP,
    gpVelocity: avgCycle > 0 ? safeDiv(gpPerUnit, avgCycle) : gpPerUnit,
    mixContributionPct: 0, // filled after total is known
    closeRate: clamp(rate(p.avgCloseRate), 0, 1),
    rewardPriority: false, // filled after medians are known
    flags: {
      easyPriceCompare: p.easyPriceCompare === true,
      easyUpsell: p.easyUpsell === true,
      easyRepeat: p.easyRepeat === true,
      easyReferral: p.easyReferral === true,
      goodForAds: p.goodForAds === true,
      goodForReward: p.goodForReward === true,
    },
  }
}

function median(xs: number[]): number {
  const a = xs.filter((x) => isFinite(x)).sort((p, qv) => p - qv)
  if (a.length === 0) return 0
  const mid = Math.floor(a.length / 2)
  return a.length % 2 ? a[mid]! : (a[mid - 1]! + a[mid]!) / 2
}

function argmax(items: ProductMetric[], score: (m: ProductMetric) => number): ProductMetric | undefined {
  let best: ProductMetric | undefined
  let bestVal = -Infinity
  for (const it of items) {
    const v = score(it)
    if (isFinite(v) && v > bestVal) {
      bestVal = v
      best = it
    }
  }
  return best
}

function detectLadderGaps(present: Set<ProductTag>, perProduct: ProductMetric[]): LadderGap[] {
  const gaps: LadderGap[] = []
  if (!present.has('引流品'))
    gaps.push({ code: 'NO_LEAD_MAGNET', missingTag: '引流品', severity: 'degraded', message: 'No lead-magnet product — traffic has nothing cheap to convert on, so acquisition cost stays high.' })
  if (!present.has('复购品'))
    gaps.push({ code: 'NO_REPEAT_PRODUCT', missingTag: '复购品', severity: 'degraded', message: 'No repeat/subscription product — customers have no reason to come back, so LTV stays low.' })
  if (!present.has('利润品') && !present.has('大鲸鱼'))
    gaps.push({ code: 'NO_PROFIT_PRODUCT', missingTag: '利润品', severity: 'degraded', message: 'No profit or high-ticket product — every sale rides on thin core margins.' })
  const anyUpsell = perProduct.some((m) => m.flags.easyUpsell)
  if (!anyUpsell)
    gaps.push({ code: 'NO_UPSELL', severity: 'degraded', message: 'No product is flagged as an upsell — average basket value has no lever.' })
  if (!present.has('核心品'))
    gaps.push({ code: 'NO_CORE_PRODUCT', missingTag: '核心品', severity: 'cosmetic', message: 'No clearly-defined core product to anchor the offer.' })
  return gaps
}

export function analyzeProducts(input: TCVRInput): ProductAnalysis {
  const q = new QualityBuilder()
  if (input.products.length === 0) q.add('NO_PRODUCTS', 'degraded', 'No products entered.')

  const totalGpRef = { value: 0 }
  const perProduct = input.products.map((p) => metricFor(p, totalGpRef))
  const totalMonthlyGP = sum(perProduct.map((m) => m.monthlyGP))

  const volMedian = median(perProduct.map((m) => m.monthlyVolume))
  for (const m of perProduct) {
    m.mixContributionPct = safeDiv(m.monthlyGP, totalMonthlyGP)
    // Reward priority: explicit flag, OR a high-margin product that isn't selling much yet.
    m.rewardPriority = m.flags.goodForReward || (m.gpMargin >= 0.5 && m.monthlyVolume <= volMedian)
  }

  const present = new Set<ProductTag>()
  for (const m of perProduct) if (m.tag) present.add(m.tag)

  const nonLeadMagnet = perProduct.filter((m) => m.tag !== '引流品')
  const abvProducts = (() => {
    const w = sum(nonLeadMagnet.map((m) => m.price * m.monthlyVolume))
    const v = sum(nonLeadMagnet.map((m) => m.monthlyVolume))
    return safeDiv(w, v)
  })()

  const leadMagnets = perProduct.filter((m) => m.tag === '引流品')
  const bestLeadMagnet =
    (leadMagnets.length ? argmax(leadMagnets, (m) => m.monthlyVolume) : undefined) ??
    argmax(perProduct, (m) => -m.price) // cheapest as a fallback entry product

  const upsellCandidates = perProduct.filter((m) => m.flags.easyUpsell)
  const bestUpsell =
    (upsellCandidates.length ? argmax(upsellCandidates, (m) => m.gpPerUnit) : undefined) ??
    argmax(perProduct, (m) => m.gpMargin)

  return {
    perProduct,
    abvProducts,
    totalMonthlyGP,
    bestGpProduct: argmax(perProduct, (m) => m.monthlyGP)?.name,
    bestCashflowProduct: argmax(perProduct, (m) => m.gpVelocity)?.name,
    bestLeadMagnetProduct: bestLeadMagnet?.name,
    bestUpsellProduct: bestUpsell?.name,
    ladderPresent: PRODUCT_TAGS.filter((t) => present.has(t)),
    ladderGaps: detectLadderGaps(present, perProduct),
    recommendedLadder: ['引流品', '爆品', '核心品', '利润品', '大鲸鱼', '复购品'],
    quality: q.build(),
  }
}
