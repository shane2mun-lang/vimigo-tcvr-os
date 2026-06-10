// ─────────────────────────────────────────────────────────────────────────────
// ScenarioSimulator — the live "what if" screen. Six sliders write the store's
// scenario levers; the right column reads a live ScenarioResult from the engine and
// renders forecast Sales / GP / ΔGP plus the reward budget and the leads & closes
// implied by the traffic/conversion moves. ΔGP is deliberately large and color-
// flipping. Below: the A–E comparison bars, the highest-ROI lever callout, and an
// AI explainer that degrades to the on-screen rule-based numbers.
// ─────────────────────────────────────────────────────────────────────────────

import { useEngine, useSimResult } from '@/store/selectors'
import { useStore } from '@/store/useStore'
import { useT } from '@/i18n/useT'
import { Card, SectionHeader, Button } from '@/components/ui'
import { KPICard } from '@/components/cards'
import { LabeledSlider } from '@/components/fields'
import { HelpTip } from '@/components/HelpTip'
import { AIPanel } from '@/components/AIPanel'
import { ScenarioBars } from '@/components/viz/ScenarioBars'
import { useExplain } from '@/ai/useAI'
import type { LeverKey } from '@/engine/types'
import { formatDeltaRM, formatNumber, formatPct, formatRM } from '@/lib/format'

const PILLAR_ACCENT = {
  traffic: '#3b82f6',
  conversion: '#8b5cf6',
  value: '#f59e0b',
  recurring: '#10b981',
} as const

export function ScenarioSimulator() {
  const { t, d, dOne, lang } = useT()
  const { revenue, scenarios } = useEngine()
  const sim = useSimResult()
  const levers = useStore((s) => s.levers)
  const setLevers = useStore((s) => s.setLevers)
  const resetLevers = useStore((s) => s.resetLevers)
  const rewardSharePct = useStore((s) => s.rewardSharePct)
  const setRewardSharePct = useStore((s) => s.setRewardSharePct)
  const explain = useExplain()

  const trafficPct = levers.trafficPct ?? 0
  const conversionPct = levers.conversionPct ?? 0
  const abvPct = levers.abvPct ?? 0
  const gpMarginPct = levers.gpMarginPct ?? 0
  const repeatPct = levers.repeatPct ?? 0
  const referralPct = levers.referralPct ?? 0

  const deltaGp = sim.deltaGp
  const rewardBudget = (Math.max(0, deltaGp) * rewardSharePct) / 100
  const leadsNeeded = revenue.traffic * (1 + trafficPct / 100)
  // Closes scale with BOTH levers: more leads (traffic) and a better close rate
  // (conversion) each increase the deals the team must actually close.
  const closesNeeded = revenue.newCustomers * (1 + trafficPct / 100) * (1 + conversionPct / 100)

  const topLever = scenarios.topLever
  const leverName = (k: LeverKey): string => {
    switch (k) {
      case 'trafficPct':
        return dOne('pillar', 'traffic')
      case 'conversionPct':
        return dOne('pillar', 'conversion')
      case 'abvPct':
        return t('kpi.abv')
      case 'gpMarginPct':
        return t('kpi.gpMargin')
      case 'repeatPct':
        return t('kpi.repeatRate')
      case 'referralPct':
        return t('kpi.referralRate')
      default:
        return k
    }
  }

  const runExplain = () => {
    void explain.run(
      {
        leads: Math.round(revenue.traffic),
        closeRatePct: Math.round(revenue.conversionRate * 1000) / 10,
        abv: Math.round(revenue.averageBasketValue),
        gpMarginPct: Math.round(revenue.gpMargin * 1000) / 10,
        sales: Math.round(revenue.revenue),
      },
      {
        trafficPct,
        conversionPct,
        abvPct,
        gpMarginPct,
        repeatPct,
        referralPct,
        forecastGp: Math.round(sim.gp),
        deltaGp: Math.round(deltaGp),
      },
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <SectionHeader
          title={t('simulator.heading')}
          subtitle={t('simulator.lead')}
          right={
            <Button size="sm" variant="outline" onClick={resetLevers}>
              ↺ {t('simulator.reset')}
            </Button>
          }
        />

        <div className="grid gap-8 lg:grid-cols-2">
          {/* ── Levers ───────────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Slider ceilings are deliberate teaching points: traffic/repeat/referral
                scale with money & systems (×3); conversion/ABV have skill ceilings (×2);
                GP margin moves in hard-won points. */}
            <LabeledSlider
              label={d('pillar', 'traffic')}
              value={trafficPct}
              min={0}
              max={200}
              step={5}
              accent={PILLAR_ACCENT.traffic}
              onChange={(v) => setLevers({ trafficPct: v })}
              helpKey="sliderTraffic"
            />
            <LabeledSlider
              label={d('pillar', 'conversion')}
              value={conversionPct}
              min={0}
              max={100}
              step={5}
              accent={PILLAR_ACCENT.conversion}
              onChange={(v) => setLevers({ conversionPct: v })}
              helpKey="sliderConversion"
            />
            <LabeledSlider
              label={t('kpi.abv')}
              value={abvPct}
              min={0}
              max={100}
              step={5}
              accent={PILLAR_ACCENT.value}
              onChange={(v) => setLevers({ abvPct: v })}
              helpKey="sliderAbv"
            />
            <LabeledSlider
              label={t('kpi.gpMargin')}
              value={gpMarginPct}
              min={0}
              max={20}
              step={1}
              accent={PILLAR_ACCENT.value}
              display={`${Math.round(revenue.gpMargin * 100)}% → ${Math.round(revenue.gpMargin * 100) + gpMarginPct}%  (+${gpMarginPct} pts)`}
              onChange={(v) => setLevers({ gpMarginPct: v })}
              helpKey="sliderGpMargin"
            />
            <LabeledSlider
              label={t('kpi.repeatRate')}
              value={repeatPct}
              min={0}
              max={200}
              step={5}
              accent={PILLAR_ACCENT.recurring}
              onChange={(v) => setLevers({ repeatPct: v })}
              helpKey="sliderRepeat"
            />
            <LabeledSlider
              label={t('kpi.referralRate')}
              value={referralPct}
              min={0}
              max={200}
              step={5}
              accent={PILLAR_ACCENT.recurring}
              onChange={(v) => setLevers({ referralPct: v })}
              helpKey="sliderReferral"
            />
          </div>

          {/* ── Live outputs ─────────────────────────────────────────── */}
          <div className="space-y-4">
            <div
              key={Math.round(deltaGp)}
              className="animate-popdelta rounded-2xl bg-gradient-to-br from-indigo-50 to-white p-5 ring-1 ring-indigo-100"
            >
              <div className="text-xs font-medium uppercase tracking-wide text-slate-500"><span className="inline-flex items-center gap-1">Δ GP<HelpTip k="deltaGp" align="left" /></span></div>
              <div
                className="mt-1 text-4xl font-bold tabular-nums sm:text-5xl"
                style={{ color: deltaGp > 0 ? '#059669' : deltaGp < 0 ? '#dc2626' : '#475569' }}
              >
                {formatDeltaRM(deltaGp, lang)}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {sim.deltaGpPct >= 0 ? '+' : ''}
                {formatPct(sim.deltaGpPct, 1)} {t('common.perMonth')}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <KPICard label={t('simulator.forecastSales')} value={formatRM(sim.revenue, lang)} accentColor="#6366f1" />
              <KPICard label={t('simulator.forecastGp')} value={formatRM(sim.gp, lang)} tone="good" />
              <KPICard
                label={t('simulator.rewardBudget')}
                value={formatRM(rewardBudget, lang)}
                accentColor={PILLAR_ACCENT.recurring}
                helpKey="rewardBudget"
                sub={
                  <span className="inline-flex items-center gap-1">
                    Δ GP ×
                    <input
                      type="number"
                      min={5}
                      max={50}
                      value={rewardSharePct}
                      onChange={(e) => setRewardSharePct(Number(e.target.value))}
                      className="w-12 rounded border border-slate-200 px-1 py-0.5 text-center text-xs tabular-nums outline-none focus:border-brand-accent"
                    />
                    %
                  </span>
                }
              />
              <KPICard
                label={t('simulator.topLever')}
                value={leverName(topLever.lever)}
                sub={formatDeltaRM(topLever.deltaGp, lang)}
                helpKey="topLever"
              />
              <KPICard label={t('simulator.requiredLeads')} value={formatNumber(leadsNeeded, lang)} accentColor={PILLAR_ACCENT.traffic} helpKey="leadsNeeded" />
              <KPICard
                label={t('simulator.requiredCloses')}
                value={formatNumber(closesNeeded, lang)}
                accentColor={PILLAR_ACCENT.conversion}
                helpKey="closesNeeded"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <SectionHeader title={t('simulator.compare')} />
        <ScenarioBars />
        <div className="mt-3 rounded-xl bg-indigo-50/60 px-4 py-3 text-sm text-slate-700 ring-1 ring-indigo-100">
          <span className="font-semibold text-brand-accent">{t('simulator.topLever')}:</span>{' '}
          {leverName(topLever.lever)} · {formatDeltaRM(topLever.deltaGp, lang)}
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <AIPanel
          title={t('ai.explain')}
          status={explain.state.status}
          onRun={runExplain}
          runLabel={t('ai.explain')}
          error={explain.state.error}
          fallback={
            <span>
              {t('simulator.topLever')}: <span className="font-medium">{leverName(topLever.lever)}</span> ·{' '}
              {formatDeltaRM(topLever.deltaGp, lang)}. {t('kpi.gp')} {formatRM(sim.gp, lang)} (Δ{' '}
              {formatDeltaRM(deltaGp, lang)}).
            </span>
          }
        >
          {explain.data?.narrative && <p className="text-sm leading-relaxed text-slate-700">{explain.data.narrative}</p>}
        </AIPanel>
      </Card>
    </div>
  )
}
