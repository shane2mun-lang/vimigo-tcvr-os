// React hooks wrapping the AI client; results cache in the store's `ai` slice so
// they survive navigation. Status drives the AIPanel chrome.

import { useStore } from '@/store/useStore'
import type { AIFeature } from '@/store/useStore'
import { ai } from './client'
import type {
  AIResult,
  CategorizeResult,
  ExplainResult,
  PainPointsResult,
  ScanResult,
  VimiGoalResult,
} from './client'

function statusFromReason(reason: string): 'unavailable' | 'error' {
  return reason === 'offline' || reason === 'no_key' ? 'unavailable' : 'error'
}

function useFeature<T, A extends unknown[]>(
  feature: AIFeature,
  caller: (lang: ReturnType<typeof useStore.getState>['lang'], ...args: A) => Promise<AIResult<T>>,
) {
  const state = useStore((s) => s.ai[feature])
  const setAI = useStore((s) => s.setAI)

  const run = async (...args: A): Promise<AIResult<T>> => {
    setAI(feature, { status: 'loading' })
    const lang = useStore.getState().lang
    const res = await caller(lang, ...args)
    if (res.ok) setAI(feature, { status: 'ok', data: res.data })
    else setAI(feature, { status: statusFromReason(res.reason), error: res.message ?? res.reason, data: res })
    return res
  }

  return { state, run, data: state.data as T | undefined }
}

export const useScan = () =>
  useFeature<ScanResult, [url?: string, pasted?: string]>('scan', (lang, url, pasted) => ai.scan(lang, url, pasted))

export const useCategorize = () =>
  useFeature<CategorizeResult, [products: { id: string; name: string; price?: number; cost?: number }[]]>(
    'categorize',
    (lang, products) => ai.categorize(lang, products),
  )

export const usePainPoints = () =>
  useFeature<PainPointsResult, [industry?: string, customerType?: string, reviews?: string[]]>(
    'painpoints',
    (lang, industry, customerType, reviews) => ai.painpoints(lang, industry, customerType, reviews),
  )

export const useExplain = () =>
  useFeature<ExplainResult, [metrics: Record<string, number>, scenario?: Record<string, number>]>(
    'explain',
    (lang, metrics, scenario) => ai.explain(lang, metrics, scenario),
  )

export const useVimiGoal = () =>
  useFeature<VimiGoalResult, [levers: { lever: string; expectedGpImpact: number }[], metrics: Record<string, number>]>(
    'vimigoal',
    (lang, levers, metrics) => ai.vimigoal(lang, levers, metrics),
  )
