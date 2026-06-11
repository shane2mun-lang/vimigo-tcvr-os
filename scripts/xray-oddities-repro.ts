// THROWAWAY repro for the tester's "X-Ray math oddities".
// Run: pnpm -C backend exec tsx ../scripts/xray-oddities-repro.ts
//
// Retail-like shop: ABV ≈ RM93 (cheap items), GP margin 25%, ~1100 customers/mo,
// purchaseFrequency = 1 (no lifespan/cycle/repeat-count data).
//   Test A: marketingCost = 0
//   Test B: marketingCost = 800  (CAC ≈ 0.727)
//   Test C: marketingCost = 200  (CAC ≈ 0.182 — the "×125 next to RM 0" zone)

import { analyze } from '../frontend/src/engine/index'
import { simulate, baseFromRevenue } from '../frontend/src/engine/scenarios'
import { resolveBenchmarks } from '../frontend/src/engine/benchmarks'
import type { TCVRInput } from '../frontend/src/engine/types'

// ── Exact replica of lib/format.ts formatRM (en locale, default digits=0) ────
function formatRM(value: number | undefined | null, digits = 0): string {
  const v = typeof value === 'number' && isFinite(value) ? value : 0
  return (
    'RM ' +
    new Intl.NumberFormat('en-MY', { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(v)
  )
}
// Exact replica of formatMultiplier (digits=1 as used by RevenueXRay)
function formatMultiplier(value: number | undefined | null, digits = 1): string {
  const v = typeof value === 'number' && isFinite(value) ? value : 1
  return '×' + v.toFixed(digits)
}

function makeInput(marketingCost: number): TCVRInput {
  return {
    profile: {
      salesModel: 'Retail',
      currentMonthlyRevenue: 102300, // 1100 customers × RM93 ABV
      currentGPMargin: 25,
    },
    channels: [
      // single walk-in style channel; ABV falls back to sales/closedDeals = 93
      { id: 'w', name: 'Walk-in', monthlyLeads: 2200, monthlySpend: marketingCost, closedDeals: 1100, sales: 102300 },
    ],
    funnel: [],
    products: [],
    recurring: {}, // NO lifespan / cycle / repeat count → purchaseFrequency = 1
    costs: { marketingCost },
  }
}

function report(label: string, marketingCost: number) {
  const r = analyze(makeInput(marketingCost))
  const rev = r.revenue
  console.log(`\n══ ${label} (marketingCost = RM ${marketingCost}) ══`)
  console.log('  ABV                 =', rev.averageBasketValue)
  console.log('  gpMargin            =', rev.gpMargin)
  console.log('  purchaseFrequency   =', rev.purchaseFrequency)
  console.log('  newCustomers        =', rev.newCustomers)
  console.log('  LTV  (raw)          =', rev.ltv, ' → displays as', formatRM(rev.ltv))
  console.log('  CAC  (raw)          =', rev.cac, ' → displays as', formatRM(rev.cac))
  console.log('  blendedCAC (raw)    =', r.channels.blendedCAC, ' → displays as', formatRM(r.channels.blendedCAC))
  console.log('  paidCAC    (raw)    =', r.channels.paidCAC, ' → displays as', formatRM(r.channels.paidCAC))
  console.log('  ltvToCac   (raw)    =', rev.ltvToCac, ' → displays as', formatMultiplier(rev.ltvToCac, 1))
  return r
}

const a = report('TEST A', 0)
const b = report('TEST B', 800)
report('TEST C', 200)

// What CAC produces exactly ×125 with this LTV?
const ltv = a.revenue.ltv
console.log(`\n  CAC that yields exactly ×125 with LTV ${ltv}: RM ${ltv / 125}`)

// ── formatRM rounding behaviour on sub-RM1 values ─────────────────────────────
console.log('\n══ formatRM (Intl.NumberFormat en-MY, maximumFractionDigits: 0) rounding ══')
for (const v of [0, 0.182, 0.186, 0.4999, 0.5, 0.7, 0.727272, 0.99, 23.25]) {
  console.log(`  formatRM(${v}) = "${formatRM(v)}"`)
}

// ── Simulator closesNeeded ────────────────────────────────────────────────────
// UI formula (ScenarioSimulator.tsx:53):
//   closesNeeded = revenue.newCustomers * (1 + trafficPct/100) * (1 + conversionPct/100)
console.log('\n══ Simulator closesNeeded (NC from engine) ══')
const cases: Array<[number, number, number]> = [
  [1800, 50, 0],
  [1800, 0, 50],
  [1100, 100, 20],
  [1200, 50, 50],
  [1100, 145, 0],
]
for (const [nc, tPct, cPct] of cases) {
  const closes = nc * (1 + tPct / 100) * (1 + cPct / 100)
  console.log(`  NC=${nc} traffic+${tPct}% conversion+${cPct}%  → closesNeeded = ${closes}`)
}

// Cross-check: does the engine's scenario revenue scale the same way (i.e. is
// closesNeeded consistent with the simulated revenue), including the conv cap?
const bm = resolveBenchmarks('Retail')
const base = baseFromRevenue(b.revenue)
console.log('\n  base.conversionRate =', base.conversionRate, '(1100/2200)')
const sim = simulate(base, { trafficPct: 50, conversionPct: 50 }, bm)
console.log('  sim revenue (traffic+50, conv+50) =', sim.revenue, 'vs base', base.revenue)
console.log('  UI closesNeeded for same levers   =', b.revenue.newCustomers * 1.5 * 1.5)
const simCapped = simulate(base, { trafficPct: 0, conversionPct: 100 }, bm)
console.log('  sim revenue (conv+100, rate would exceed 100% → capped at ×2.0 here) =', simCapped.revenue)
console.log('  UI closesNeeded (conv+100, uncapped) =', b.revenue.newCustomers * 2)
