// ─────────────────────────────────────────────────────────────────────────────
// Retention & referral analysis — repeat rate, referral rate, LTV, and the
// "money left on the table" from weak retention/referral.
// ─────────────────────────────────────────────────────────────────────────────

import { QualityBuilder, clamp, num, rate, safeDiv } from './util'
import type { RetentionAnalysis, ResolvedBenchmarks, RevenueModel, TCVRInput } from './types'

export function analyzeRetention(
  input: TCVRInput,
  revenue: RevenueModel,
  benchmarks: ResolvedBenchmarks,
): RetentionAnalysis {
  const q = new QualityBuilder()
  const r = input.recurring
  const abv = revenue.averageBasketValue
  const gpMargin = revenue.gpMargin

  const newCustomers = num(r.newCustomers)
  const repeatCustomers = num(r.repeatCustomers)
  const totalCustomers = newCustomers + repeatCustomers

  const repeatPurchaseRate = clamp(safeDiv(repeatCustomers, totalCustomers), 0, 1)
  const referralsPerCustomer = Math.max(0, num(r.avgReferralsPerCustomer))
  const referralCloseRate = clamp(rate(r.referralCloseRate), 0, 1)
  const referralRate = clamp(referralsPerCustomer * referralCloseRate, 0, 1)

  if (totalCustomers <= 0) q.add('NO_RETENTION_DATA', 'degraded', 'No customer counts entered.')
  if (referralsPerCustomer <= 0) q.add('NO_REFERRAL_DATA', 'cosmetic', 'No referral data entered.')

  const ltv = revenue.ltv
  const referralLtv = ltv * referralsPerCustomer * referralCloseRate

  const rpf = revenue.repeatPurchaseFactor
  const rm = revenue.referralMultiplier

  // Revenue attributable to repeat behavior (the (RPF−1)/RPF slice).
  const retentionRevenue = revenue.revenue * safeDiv(rpf - 1, rpf)

  // If repeat behavior reached the benchmark uplift, how much more revenue?
  const targetRpf = 1 + benchmarks.repeatUplift
  const lostRetentionValue =
    rpf < targetRpf ? Math.max(0, revenue.revenue * (safeDiv(targetRpf, rpf) - 1)) : 0

  const comebackForecast = repeatCustomers * abv
  const referralSalesForecast = newCustomers * referralsPerCustomer * referralCloseRate * abv
  const referralGpForecast = referralSalesForecast * gpMargin

  const mechanisms = {
    membership: r.hasMembership === true,
    aftercare: r.hasAftercare === true,
    review: r.hasReviewMechanism === true,
    referralReward: r.hasReferralReward === true,
  }
  const retentionInfraScore = Object.values(mechanisms).filter(Boolean).length
  const missingMechanisms = (
    Object.keys(mechanisms) as (keyof typeof mechanisms)[]
  ).filter((k) => !mechanisms[k])

  return {
    repeatPurchaseRate,
    referralRate,
    ltv,
    referralLtv,
    retentionRevenue,
    lostRetentionValue,
    comebackForecast,
    referralSalesForecast,
    referralGpForecast,
    retentionInfraScore,
    missingMechanisms,
    quality: q.build(),
  }
}
