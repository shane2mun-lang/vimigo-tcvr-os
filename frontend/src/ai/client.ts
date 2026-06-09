// Frontend AI client. Talks to the Express backend (/api/ai/*). Never throws —
// returns a tagged result so the UI degrades to rule-based output gracefully.

import type { ProductTag, TCVRPillar } from '@/engine/types'
import type { Lang } from '@/i18n/strings'

export interface ScanResult {
  model: string
  source: 'fetched' | 'pasted'
  positioning: string
  products: string[]
  cta: string
  painPointsAddressed: string[]
  toneNotes: string
  warnings: string[]
}
export interface CategorizeResult {
  model: string
  tags: { id: string; tag: ProductTag; confidence: number; reason: string }[]
}
export interface PainPointsResult {
  model: string
  painPoints: { title: string; evidence: string; tcvrArea: TCVRPillar }[]
}
export interface ExplainResult {
  model: string
  narrative: string
}
export interface VimiGoalResult {
  model: string
  goalTitle: string
  metric: string
  target: string
  cadence: string
  narrative: string
  rewardSuggestion: string
}

export type AIResult<T> =
  | { ok: true; data: T }
  | { ok: false; degraded: true; reason: string; needsPaste?: boolean; message?: string }

async function callAI<T>(path: string, body: Record<string, unknown>): Promise<AIResult<T>> {
  try {
    const r = await fetch(`/api/ai/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = (await r.json().catch(() => null)) as (Record<string, unknown> & { degraded?: boolean }) | null
    if (!r.ok) {
      return { ok: false, degraded: true, reason: (json?.code as string) ?? 'server', message: json?.message as string | undefined }
    }
    if (json && json.degraded) {
      return {
        ok: false,
        degraded: true,
        reason: (json.reason as string) ?? 'degraded',
        needsPaste: json.needsPaste as boolean | undefined,
        message: json.message as string | undefined,
      }
    }
    return { ok: true, data: json as T }
  } catch {
    return { ok: false, degraded: true, reason: 'offline' }
  }
}

export const ai = {
  scan: (lang: Lang, url?: string, pastedContent?: string) =>
    callAI<ScanResult>('scan', { lang, url, pastedContent: pastedContent ?? null }),
  categorize: (lang: Lang, products: { id: string; name: string; price?: number; cost?: number }[]) =>
    callAI<CategorizeResult>('categorize', { lang, products }),
  painpoints: (lang: Lang, industry?: string, customerType?: string, reviews?: string[]) =>
    callAI<PainPointsResult>('painpoints', { lang, industry, customerType, reviews }),
  explain: (lang: Lang, metrics: Record<string, number>, scenario?: Record<string, number>) =>
    callAI<ExplainResult>('explain', { lang, metrics, scenario, tone: 'boss-friendly' }),
  vimigoal: (lang: Lang, topLevers: { lever: string; expectedGpImpact: number }[], metrics: Record<string, number>, horizonDays = 90) =>
    callAI<VimiGoalResult>('vimigoal', { lang, topLevers, metrics, horizonDays }),
}
