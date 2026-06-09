// ─────────────────────────────────────────────────────────────────────────────
// Central store. Holds ONLY raw inputs (the engine's TCVRInput) + UI flags + the
// scenario levers + an AI result cache. Everything derived is computed by pure
// engine selectors — never stored, so dashboards can't drift from inputs.
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nanoid } from 'nanoid'
import type {
  CompanyProfile,
  Costs,
  FunnelStage,
  FunnelStageKey,
  LeverDeltas,
  Product,
  RecurringReferral,
  TCVRInput,
  TrafficChannel,
} from '@/engine/types'
import type { Lang } from '@/i18n/strings'
import { emptyInput, sampleInput } from './sample'

export type AIFeature = 'scan' | 'categorize' | 'painpoints' | 'explain' | 'vimigoal'
export type AIStatus = 'idle' | 'loading' | 'ok' | 'unavailable' | 'error'
export interface AIState {
  status: AIStatus
  data?: unknown
  error?: string
}

const ZERO_LEVERS: LeverDeltas = {
  trafficPct: 0,
  conversionPct: 0,
  abvPct: 0,
  gpMarginPct: 0,
  repeatPct: 0,
  referralPct: 0,
}

function freshAI(): Record<AIFeature, AIState> {
  return {
    scan: { status: 'idle' },
    categorize: { status: 'idle' },
    painpoints: { status: 'idle' },
    explain: { status: 'idle' },
    vimigoal: { status: 'idle' },
  }
}

export interface StoreState extends TCVRInput {
  lang: Lang
  levers: LeverDeltas
  activeProfileName?: string
  savedAt?: number
  ai: Record<AIFeature, AIState>

  setLang: (l: Lang) => void
  setProfile: (patch: Partial<CompanyProfile>) => void
  addChannel: (name?: string) => void
  updateChannel: (id: string, patch: Partial<TrafficChannel>) => void
  removeChannel: (id: string) => void
  updateStage: (key: FunnelStageKey, patch: Partial<FunnelStage>) => void
  addProduct: (name?: string) => void
  updateProduct: (id: string, patch: Partial<Product>) => void
  removeProduct: (id: string) => void
  setRecurring: (patch: Partial<RecurringReferral>) => void
  setCosts: (patch: Partial<Costs>) => void
  setLevers: (patch: Partial<LeverDeltas>) => void
  resetLevers: () => void
  setAI: (f: AIFeature, s: AIState) => void
  loadInput: (input: TCVRInput, name?: string) => void
  clearAll: () => void
  loadSample: () => void
  getInput: () => TCVRInput
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...sampleInput,
      lang: 'zh',
      levers: { ...ZERO_LEVERS },
      activeProfileName: sampleInput.profile.name,
      ai: freshAI(),

      setLang: (lang) => set({ lang }),

      setProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),

      addChannel: (name = '') =>
        set((s) => ({ channels: [...s.channels, { id: nanoid(8), name }] })),
      updateChannel: (id, patch) =>
        set((s) => ({ channels: s.channels.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
      removeChannel: (id) => set((s) => ({ channels: s.channels.filter((c) => c.id !== id) })),

      updateStage: (key, patch) =>
        set((s) => ({ funnel: s.funnel.map((st) => (st.key === key ? { ...st, ...patch } : st)) })),

      addProduct: (name = '') =>
        set((s) => ({ products: [...s.products, { id: nanoid(8), name }] })),
      updateProduct: (id, patch) =>
        set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
      removeProduct: (id) => set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

      setRecurring: (patch) => set((s) => ({ recurring: { ...s.recurring, ...patch } })),
      setCosts: (patch) => set((s) => ({ costs: { ...s.costs, ...patch } })),

      setLevers: (patch) => set((s) => ({ levers: { ...s.levers, ...patch } })),
      resetLevers: () => set({ levers: { ...ZERO_LEVERS } }),

      setAI: (f, st) => set((s) => ({ ai: { ...s.ai, [f]: st } })),

      loadInput: (input, name) =>
        set({
          profile: input.profile,
          channels: input.channels,
          funnel: input.funnel,
          products: input.products,
          recurring: input.recurring,
          costs: input.costs,
          activeProfileName: name ?? input.profile.name,
          levers: { ...ZERO_LEVERS },
          ai: freshAI(),
        }),

      clearAll: () => {
        const fresh = emptyInput()
        set({ ...fresh, activeProfileName: undefined, levers: { ...ZERO_LEVERS }, ai: freshAI() })
      },
      loadSample: () =>
        set({ ...sampleInput, activeProfileName: sampleInput.profile.name, levers: { ...ZERO_LEVERS }, ai: freshAI() }),

      getInput: () => {
        const s = get()
        return { profile: s.profile, channels: s.channels, funnel: s.funnel, products: s.products, recurring: s.recurring, costs: s.costs }
      },
    }),
    {
      name: 'tcvr-os-autosave-v1',
      version: 1,
      partialize: (s) => ({
        profile: s.profile,
        channels: s.channels,
        funnel: s.funnel,
        products: s.products,
        recurring: s.recurring,
        costs: s.costs,
        lang: s.lang,
        levers: s.levers,
        activeProfileName: s.activeProfileName,
      }),
    },
  ),
)
