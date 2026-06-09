// ─────────────────────────────────────────────────────────────────────────────
// Engine orchestrator. Linear, cycle-free pipeline:
//   revenue → {channels, funnel, products, retention} → scenarios → insights
// Never throws: a totally empty input yields a fully-populated result where every
// block is flagged insufficient.
// ─────────────────────────────────────────────────────────────────────────────

import { resolveBenchmarks } from './benchmarks'
import { resolveRevenue } from './revenue'
import { analyzeChannels } from './channels'
import { analyzeFunnel } from './funnel'
import { analyzeProducts } from './products'
import { analyzeRetention } from './retention'
import { analyzeScenarios } from './scenarios'
import { buildInsights } from './insights'
import { rollupQuality } from './util'
import type { EngineConfig, EngineResult, TCVRInput } from './types'

export const ENGINE_VERSION = '1.0.0'

export function analyze(input: TCVRInput, config: EngineConfig = {}): EngineResult {
  const model = input.profile.salesModel
  const benchmarks = resolveBenchmarks(model, config.benchmarks)

  const revenue = resolveRevenue(input, benchmarks, config)
  const channels = analyzeChannels(input, revenue, benchmarks)
  const funnel = analyzeFunnel(input, revenue, benchmarks)
  const products = analyzeProducts(input)
  const retention = analyzeRetention(input, revenue, benchmarks)
  const scenarios = analyzeScenarios(revenue, benchmarks, config.scenarioDeltas)
  const insights = buildInsights(
    { revenue, channels, funnel, products, retention, scenarios },
    benchmarks,
    input.profile,
  )

  const quality = rollupQuality([
    revenue.quality,
    channels.quality,
    funnel.quality,
    products.quality,
    retention.quality,
    scenarios.quality,
    insights.quality,
  ])

  return {
    revenue,
    channels,
    funnel,
    products,
    retention,
    scenarios,
    insights,
    benchmarksUsed: benchmarks,
    quality,
    meta: { engineVersion: ENGINE_VERSION, salesModel: model },
  }
}

// Public surface
export * from './types'
export { analyzeScenarios, simulate, baseFromRevenue, rankLevers, DEFAULT_SCENARIOS } from './scenarios'
export { DEFAULT_BENCHMARKS, resolveBenchmarks } from './benchmarks'
export { safeDiv, clamp, num, round0, round2, toPct, normalizeRate } from './util'
