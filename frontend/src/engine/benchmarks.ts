// ─────────────────────────────────────────────────────────────────────────────
// Benchmarks — per-sales-model reference values that drive health scoring and
// "industry benchmark" comparisons. Fully overridable via EngineConfig.benchmarks.
// Money figures (cplCeiling) are market-dependent placeholders meant to be tuned.
// ─────────────────────────────────────────────────────────────────────────────

import type { BenchmarkSet, BenchmarkTable, ResolvedBenchmarks, SalesModel } from './types'

export const DEFAULT_BENCHMARKS: BenchmarkTable = {
  Retail:       { closeRate: 0.25, gpMargin: 0.45, repeatRate: 0.30, referralRate: 0.10, cplCeiling: 15,  roasFloor: 4,   salesCycleDays: 1,  repeatUplift: 0.6, referralUplift: 0.15, reactivationRate: 0.12 },
  Online:       { closeRate: 0.02, gpMargin: 0.55, repeatRate: 0.25, referralRate: 0.08, cplCeiling: 8,   roasFloor: 3,   salesCycleDays: 1,  repeatUplift: 0.5, referralUplift: 0.12, reactivationRate: 0.10 },
  Service:      { closeRate: 0.30, gpMargin: 0.55, repeatRate: 0.40, referralRate: 0.20, cplCeiling: 40,  roasFloor: 3,   salesCycleDays: 7,  repeatUplift: 0.8, referralUplift: 0.25, reactivationRate: 0.15 },
  B2B:          { closeRate: 0.20, gpMargin: 0.40, repeatRate: 0.50, referralRate: 0.15, cplCeiling: 80,  roasFloor: 3,   salesCycleDays: 30, repeatUplift: 1.0, referralUplift: 0.20, reactivationRate: 0.18 },
  Project:      { closeRate: 0.15, gpMargin: 0.35, repeatRate: 0.20, referralRate: 0.25, cplCeiling: 120, roasFloor: 2.5, salesCycleDays: 45, repeatUplift: 0.3, referralUplift: 0.30, reactivationRate: 0.10 },
  Distributor:  { closeRate: 0.35, gpMargin: 0.20, repeatRate: 0.60, referralRate: 0.10, cplCeiling: 50,  roasFloor: 4,   salesCycleDays: 14, repeatUplift: 1.2, referralUplift: 0.10, reactivationRate: 0.20 },
  Subscription: { closeRate: 0.05, gpMargin: 0.70, repeatRate: 0.70, referralRate: 0.15, cplCeiling: 25,  roasFloor: 3,   salesCycleDays: 3,  repeatUplift: 2.0, referralUplift: 0.18, reactivationRate: 0.25 },
}

/** Shallow per-field merge of defaults with optional overrides for one model. */
export function resolveBenchmarks(
  model: SalesModel,
  overrides?: Partial<BenchmarkTable>,
): ResolvedBenchmarks {
  const base: BenchmarkSet = DEFAULT_BENCHMARKS[model]
  const ov = overrides?.[model]
  return { model, ...base, ...(ov ?? {}) }
}
