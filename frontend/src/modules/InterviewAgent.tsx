// AI interview agent: collects the boss's data conversationally, confirms it, then
// fills the whole store so every module/dashboard lights up — user fine-tunes after.

import { useEffect, useRef, useState } from 'react'
import { nanoid } from 'nanoid'
import { ai } from '@/ai/client'
import type { ChatTurn, InterviewData } from '@/ai/client'
import { useStore } from '@/store/useStore'
import { useT } from '@/i18n/useT'
import { Button, Card, cn } from '@/components/ui'
import { scrollToSection } from '@/layout/nav'
import { emptyFunnel } from '@/store/sample'
import { PRODUCT_TAGS } from '@/engine/types'
import type {
  Bottleneck,
  CustomerType,
  FunnelStageKey,
  ProductTag,
  SalesModel,
  TCVRInput,
} from '@/engine/types'

// ── Defensive mapping: loose AI payload → strict TCVRInput ─────────────────────

const SALES_MODELS = new Set<string>(['Retail', 'Online', 'Service', 'B2B', 'Project', 'Distributor', 'Subscription'])
const CUSTOMER_TYPES = new Set<string>(['B2C', 'SME', 'Corporate', 'Dealer', 'Designer', 'Developer'])
const BOTTLENECKS = new Set<string>(['no-traffic', 'traffic-no-close', 'low-close', 'no-repeat', 'no-followup', 'messy-product-structure'])
const TAGS = new Set<string>(PRODUCT_TAGS)
const FUNNEL_KEYS: FunnelStageKey[] = ['Lead', 'QualifiedLead', 'Appointment', 'Quotation', 'FollowUp', 'ClosedWon', 'ClosedLost', 'PaymentCollected']

function asNum(x: unknown): number | undefined {
  if (typeof x === 'number' && isFinite(x)) return x
  if (typeof x === 'string') {
    const n = Number(x.replace(/[, ]/g, ''))
    if (isFinite(n)) return n
  }
  return undefined
}
function asStr(x: unknown): string | undefined {
  return typeof x === 'string' && x.trim() !== '' ? x.trim() : undefined
}
function asBool(x: unknown): boolean | undefined {
  return typeof x === 'boolean' ? x : undefined
}

export function mapInterviewData(data: InterviewData): TCVRInput {
  const p = data.profile ?? {}
  const salesModelRaw = asStr(p.salesModel)
  const customerTypeRaw = asStr(p.customerType)
  const bottleneckRaw = asStr(p.biggestBottleneck)

  const funnel = emptyFunnel()
  const f = data.funnel ?? {}
  for (const stage of funnel) {
    const c = asNum((f as Record<string, unknown>)[stage.key])
    if (c != null) stage.count = c
  }
  // Sanity: only keep funnel keys we know.
  void FUNNEL_KEYS

  const r = data.recurring ?? {}
  const c = data.costs ?? {}

  return {
    profile: {
      name: asStr(p.name),
      industry: asStr(p.industry),
      salesModel: (salesModelRaw && SALES_MODELS.has(salesModelRaw) ? salesModelRaw : 'Retail') as SalesModel,
      customerType: customerTypeRaw && CUSTOMER_TYPES.has(customerTypeRaw) ? (customerTypeRaw as CustomerType) : undefined,
      teamSize: asNum(p.teamSize),
      currentMonthlyRevenue: asNum(p.currentMonthlyRevenue),
      targetMonthlyRevenue: asNum(p.targetMonthlyRevenue),
      currentGPMargin: asNum(p.currentGPMargin),
      biggestBottleneck: bottleneckRaw && BOTTLENECKS.has(bottleneckRaw) ? (bottleneckRaw as Bottleneck) : undefined,
    },
    channels: (data.channels ?? [])
      .filter((ch) => asStr(ch.name))
      .map((ch) => ({
        id: nanoid(8),
        name: asStr(ch.name) ?? '',
        monthlyLeads: asNum(ch.monthlyLeads),
        monthlySpend: asNum(ch.monthlySpend),
        closedDeals: asNum(ch.closedDeals),
        sales: asNum(ch.sales),
      })),
    funnel,
    products: (data.products ?? [])
      .filter((pr) => asStr(pr.name))
      .map((pr) => {
        const tagRaw = asStr(pr.tag)
        return {
          id: nanoid(8),
          name: asStr(pr.name) ?? '',
          price: asNum(pr.price),
          cost: asNum(pr.cost),
          monthlyVolume: asNum(pr.monthlyVolume),
          tag: tagRaw && TAGS.has(tagRaw) ? (tagRaw as ProductTag) : undefined,
        }
      }),
    recurring: {
      newCustomers: asNum(r.newCustomers),
      repeatCustomers: asNum(r.repeatCustomers),
      avgRepeatCount: asNum(r.avgRepeatCount),
      avgRepeatCycle: asNum(r.avgRepeatCycle),
      customerLifespan: asNum(r.customerLifespan),
      avgReferralsPerCustomer: asNum(r.avgReferralsPerCustomer),
      referralCloseRate: asNum(r.referralCloseRate),
      hasMembership: asBool(r.hasMembership),
      hasAftercare: asBool(r.hasAftercare),
      hasReviewMechanism: asBool(r.hasReviewMechanism),
      hasReferralReward: asBool(r.hasReferralReward),
    },
    costs: {
      marketingCost: asNum(c.marketingCost),
      rewardCost: asNum(c.rewardCost),
      operationalCost: asNum(c.operationalCost),
    },
  }
}

// ── Chat UI ────────────────────────────────────────────────────────────────────

interface ShownMsg {
  role: 'user' | 'assistant'
  content: string
}

export function InterviewAgent() {
  const { t, lang } = useT()
  const loadInput = useStore((s) => s.loadInput)

  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState<ChatTurn[]>([]) // full history incl. bootstrap
  const [shown, setShown] = useState<ShownMsg[]>([]) // what the user sees
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [unavailable, setUnavailable] = useState<string | null>(null)
  const [doneData, setDoneData] = useState<InterviewData | null>(null)
  const [applied, setApplied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [shown, loading])

  const callTurn = async (nextHistory: ChatTurn[]) => {
    setLoading(true)
    setUnavailable(null)
    const res = await ai.interview(lang, nextHistory)
    setLoading(false)
    if (!res.ok) {
      setUnavailable(res.message ?? res.reason)
      return
    }
    const reply = res.data.reply
    setHistory([...nextHistory, { role: 'assistant', content: JSON.stringify({ reply, done: res.data.done, data: res.data.done ? res.data.data : null }) }])
    setShown((s) => [...s, { role: 'assistant', content: reply }])
    setDoneData(res.data.done ? res.data.data : null)
  }

  const start = () => {
    setOpen(true)
    setApplied(false)
    if (history.length === 0) {
      const boot: ChatTurn[] = [{ role: 'user', content: 'START' }]
      void callTurn(boot)
    }
  }

  const restart = () => {
    setHistory([])
    setShown([])
    setDoneData(null)
    setApplied(false)
    setInput('')
    const boot: ChatTurn[] = [{ role: 'user', content: 'START' }]
    void callTurn(boot)
  }

  const send = () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')
    setShown((s) => [...s, { role: 'user', content: text }])
    const next: ChatTurn[] = [...history, { role: 'user', content: text }]
    setHistory(next)
    void callTurn(next)
  }

  const apply = () => {
    if (!doneData) return
    const mapped = mapInterviewData(doneData)
    loadInput(mapped, mapped.profile.name)
    setApplied(true)
    setOpen(false)
    scrollToSection('company')
  }

  return (
    <Card className="overflow-hidden">
      {/* Hero */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-white p-5 sm:p-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <span className="text-xl">✨</span>
              {t('agent.heroTitle')}
            </div>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500">{t('agent.heroLead')}</p>
            <p className="mt-1 text-xs text-slate-400">{t('agent.orManual')}</p>
          </div>
          {!open && (
            <Button onClick={start} className="shrink-0">
              ✨ {t('agent.start')}
            </Button>
          )}
        </div>

        {applied && (
          <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-200">
            {t('agent.applied')}
          </div>
        )}
      </div>

      {/* Chat panel */}
      {open && (
        <div className="border-t border-slate-200">
          <div className="flex items-center justify-between bg-slate-50 px-4 py-2">
            <div className="text-sm font-semibold text-slate-700">🤖 {t('agent.title')}</div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" onClick={restart}>↺ {t('agent.restart')}</Button>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>✕</Button>
            </div>
          </div>

          <div ref={scrollRef} className="max-h-96 space-y-3 overflow-y-auto px-4 py-4">
            {shown.map((m, i) => (
              <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
                    m.role === 'user'
                      ? 'rounded-br-sm bg-brand-accent text-white'
                      : 'rounded-bl-sm bg-slate-100 text-slate-800',
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span className="h-2.5 w-2.5 animate-ping rounded-full bg-brand-accent" />
                {t('agent.thinking')}
              </div>
            )}
            {unavailable && (
              <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 ring-1 ring-amber-200">
                {t('ai.unavailable')} <span className="opacity-60">({unavailable})</span>
              </div>
            )}
          </div>

          {/* Confirm bar when the agent finished collecting */}
          {doneData && !loading && (
            <div className="border-t border-emerald-200 bg-emerald-50/60 px-4 py-3">
              <div className="mb-2 text-sm font-semibold text-emerald-800">{t('agent.confirmTitle')}</div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={apply}>✓ {t('agent.apply')}</Button>
                <Button variant="outline" onClick={() => setDoneData(null)}>
                  {t('agent.keepEditing')}
                </Button>
              </div>
            </div>
          )}

          {/* Composer */}
          <div className="flex items-center gap-2 border-t border-slate-200 px-3 py-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) send()
              }}
              placeholder={t('agent.placeholder')}
              className="input-base flex-1"
              disabled={loading}
            />
            <Button onClick={send} disabled={loading || input.trim() === ''}>
              {t('agent.send')}
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
