// Memoized pure-engine selectors. Inputs are the only state; these derive everything.

import { useMemo } from 'react'
import { useStore } from './useStore'
import { analyze, baseFromRevenue, simulate } from '@/engine'
import type { EngineResult, ScenarioResult, TCVRInput } from '@/engine/types'
import { num } from '@/engine'

export function useInput(): TCVRInput {
  const profile = useStore((s) => s.profile)
  const channels = useStore((s) => s.channels)
  const funnel = useStore((s) => s.funnel)
  const products = useStore((s) => s.products)
  const recurring = useStore((s) => s.recurring)
  const costs = useStore((s) => s.costs)
  return useMemo(
    () => ({ profile, channels, funnel, products, recurring, costs }),
    [profile, channels, funnel, products, recurring, costs],
  )
}

export function useEngine(): EngineResult {
  const input = useInput()
  return useMemo(() => analyze(input), [input])
}

/** Live scenario forecast driven by the store's slider levers. */
export function useSimResult(): ScenarioResult {
  const engine = useEngine()
  const levers = useStore((s) => s.levers)
  return useMemo(
    () => simulate(baseFromRevenue(engine.revenue), levers, engine.benchmarksUsed),
    [engine, levers],
  )
}

export type Completion = 'empty' | 'partial' | 'full'

export interface Completeness {
  company: Completion
  traffic: Completion
  conversion: Completion
  value: Completion
  recurring: Completion
  costs: Completion
}

export function useCompleteness(): Completeness {
  const input = useInput()
  return useMemo(() => {
    const p = input.profile
    const companyFilled = [p.currentMonthlyRevenue, p.targetMonthlyRevenue, p.currentGPMargin].filter(
      (x) => num(x) > 0,
    ).length
    const company: Completion = companyFilled >= 3 ? 'full' : companyFilled > 0 ? 'partial' : 'empty'

    const chLeads = input.channels.filter((c) => num(c.monthlyLeads) > 0).length
    const traffic: Completion =
      input.channels.length === 0 ? 'empty' : chLeads >= input.channels.length ? 'full' : 'partial'

    const stagesFilled = input.funnel.filter((s) => num(s.count) > 0).length
    const conversion: Completion = stagesFilled === 0 ? 'empty' : stagesFilled >= 5 ? 'full' : 'partial'

    const prodFilled = input.products.filter((pr) => num(pr.price) > 0).length
    const value: Completion =
      input.products.length === 0 ? 'empty' : prodFilled >= input.products.length ? 'full' : 'partial'

    const r = input.recurring
    const recFilled = [r.newCustomers, r.repeatCustomers, r.avgReferralsPerCustomer].filter(
      (x) => num(x) > 0,
    ).length
    const recurring: Completion = recFilled >= 2 ? 'full' : recFilled > 0 ? 'partial' : 'empty'

    const cFilled = [input.costs.marketingCost, input.costs.operationalCost].filter((x) => num(x) > 0).length
    const costs: Completion = cFilled >= 2 ? 'full' : cFilled > 0 ? 'partial' : 'empty'

    return { company, traffic, conversion, value, recurring, costs }
  }, [input])
}
