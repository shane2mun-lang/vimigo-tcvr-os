// ─────────────────────────────────────────────────────────────────────────────
// ActionPlan — the boss-facing 90-day plan. Opens with the computed primary
// bottleneck (and whether it matches the owner's stated read), then a 30/60/90
// roadmap ordered worst-pillar-first, the top growth levers and leakage points,
// the metrics to track, a reward-design table, and vimiGoal drafts with an AI
// goal-writer that degrades to the rule-based drafts. Exports to PDF via print.
// ─────────────────────────────────────────────────────────────────────────────

import { useEngine } from '@/store/selectors'
import { useT } from '@/i18n/useT'
import { Card, SectionHeader, Button, Tag, EmptyState } from '@/components/ui'
import { InsightCard, HealthBadge } from '@/components/cards'
import { AIPanel } from '@/components/AIPanel'
import { useVimiGoal } from '@/ai/useAI'
// NOTE: provided by the lead. If this import errors at typecheck time, the module
// is being added separately — keep the call site exactly as specified.
import { exportTcvrReport } from '@/pdf/exportReport'
import type { StringKey } from '@/i18n/strings'
import type { TCVRPillar } from '@/engine/types'
import { formatRM } from '@/lib/format'

const PILLAR_ACCENT: Record<TCVRPillar, string> = {
  traffic: '#3b82f6',
  conversion: '#8b5cf6',
  value: '#f59e0b',
  recurring: '#10b981',
}

const DAY_KEYS: StringKey[] = ['actionplan.day30', 'actionplan.day60', 'actionplan.day90']

export function ActionPlan() {
  const { t, d, lang } = useT()
  const { insights, scenarios } = useEngine()
  const vimiGoal = useVimiGoal()

  const bottleneck = insights.primaryBottleneck
  const confirmed = bottleneck.agreement === 'confirmed'

  // Worst pillar first → drives the 30/60/90 ordering.
  const orderedPillars = [...insights.pillarHealth].sort((a, b) => a.score - b.score)

  const metrics = insights.rewardSuggestions.map((r) => r.suggestedKpi).slice(0, 5)

  const runGoal = () => {
    void vimiGoal.run(
      scenarios.leverRanking.slice(0, 3).map((l) => ({
        lever: String(l.lever),
        expectedGpImpact: Math.round(l.deltaGpAt10Pct),
      })),
      {
        overallHealth: insights.pillarHealth.length,
        topLeverGp: Math.round(scenarios.topLever.deltaGp),
      },
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <SectionHeader
          title={t('actionplan.heading')}
          subtitle={t('app.subtitle')}
          right={
            <Button variant="primary" size="sm" onClick={() => exportTcvrReport()}>
              ⬇ {t('profile.exportPdf')}
            </Button>
          }
        />

        {/* Primary bottleneck banner */}
        <div
          className={cnBanner(confirmed)}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{t('actionplan.bottleneck')}</span>
            <span className="text-lg font-bold text-slate-900">{d('bottleneck', bottleneck.computed)}</span>
            <Tag color={confirmed ? 'emerald' : 'amber'}>
              {confirmed ? t('actionplan.bottleneckConfirmed') : t('actionplan.bottleneckDiffers')}
            </Tag>
          </div>
          {bottleneck.evidence.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
              {bottleneck.evidence.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      {/* 30 / 60 / 90 roadmap, worst pillar first */}
      <div className="grid gap-4 lg:grid-cols-3">
        {DAY_KEYS.map((dayKey, i) => {
          const ph = orderedPillars[i]
          return (
            <Card key={dayKey} className="p-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-900">{t(dayKey)}</h3>
                {ph && <HealthBadge health={ph.band} score={ph.score} />}
              </div>
              {ph ? (
                <div className="space-y-2">
                  <div className="text-sm font-semibold" style={{ color: PILLAR_ACCENT[ph.pillar] }}>
                    {d('pillar', ph.pillar)}
                  </div>
                  <ul className="space-y-1.5 text-sm text-slate-600">
                    {ph.drivers.slice(0, 3).map((dr) => (
                      <li key={dr.code} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 last:border-0">
                        <span className="text-slate-500">{dr.code}</span>
                        <span className="tabular-nums text-slate-700">
                          {dr.actual.toFixed(2)} / {dr.benchmark.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <EmptyState message={t('empty.fillData')} />
              )}
            </Card>
          )
        })}
      </div>

      {/* Growth levers + leaks */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5 sm:p-6">
          <SectionHeader title={t('actionplan.topLevers')} />
          {insights.topGrowthLevers.length === 0 ? (
            <EmptyState message={t('empty.fillData')} />
          ) : (
            <div className="space-y-3">
              {insights.topGrowthLevers.map((ins) => (
                <InsightCard
                  key={ins.code}
                  title={ins.title}
                  detail={ins.detail}
                  severity={ins.severity}
                  money={ins.moneyImpact != null ? formatRM(ins.moneyImpact, lang) : undefined}
                />
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionHeader title={t('actionplan.topLeaks')} />
          {insights.topLeaks.length === 0 ? (
            <EmptyState message={t('empty.fillData')} />
          ) : (
            <div className="space-y-3">
              {insights.topLeaks.map((ins) => (
                <InsightCard
                  key={ins.code}
                  title={ins.title}
                  detail={ins.detail}
                  severity={ins.severity}
                  money={ins.moneyImpact != null ? formatRM(ins.moneyImpact, lang) : undefined}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Metrics to track */}
      {metrics.length > 0 && (
        <Card className="p-5 sm:p-6">
          <SectionHeader title={t('actionplan.metrics')} />
          <div className="flex flex-wrap gap-2">
            {metrics.map((m, i) => (
              <Tag key={`${m}-${i}`} color="violet">
                {i + 1}. {m}
              </Tag>
            ))}
          </div>
        </Card>
      )}

      {/* Reward design table */}
      <Card className="p-5 sm:p-6">
        <SectionHeader title={t('actionplan.rewardDesign')} />
        {insights.rewardSuggestions.length === 0 ? (
          <EmptyState message={t('empty.fillData')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500">
                  <th className="py-2 pr-3">{t('nav.value')}</th>
                  <th className="py-2 pr-3">{t('reward.metric')}</th>
                  <th className="py-2 pr-3">{t('reward.role')}</th>
                  <th className="py-2 pr-3">{t('reward.type')}</th>
                  <th className="py-2 pl-3">{t('reward.kpi')}</th>
                </tr>
              </thead>
              <tbody>
                {insights.rewardSuggestions.map((r, i) => (
                  <tr key={`${r.metricCode}-${i}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    <td className="py-2 pr-3">
                      <span className="font-medium" style={{ color: PILLAR_ACCENT[r.pillar] }}>
                        {d('pillar', r.pillar)}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-slate-600">{r.metricCode}</td>
                    <td className="py-2 pr-3">
                      <Tag color="slate">{d('role', r.role)}</Tag>
                    </td>
                    <td className="py-2 pr-3">
                      <Tag color="emerald">{d('reward', r.rewardType)}</Tag>
                    </td>
                    <td className="py-2 pl-3 text-slate-700">{r.suggestedKpi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* vimiGoal drafts + AI goal writer */}
      <Card className="p-5 sm:p-6">
        <SectionHeader title={t('actionplan.vimigoal')} />
        <div className="grid gap-3 sm:grid-cols-2">
          {insights.vimiGoalDrafts.map((g, i) => (
            <div key={`${g.goal}-${i}`} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-slate-900">{g.goal}</span>
                <Tag color="slate">{d('pillar', g.linkedPillar)}</Tag>
              </div>
              <p className="mt-1 text-sm text-slate-600">{g.measure}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <Tag color="slate">{d('role', g.accountability)}</Tag>
                <Tag color="emerald">{d('reward', g.reward.type)}</Tag>
                <span className="text-slate-400">{g.reward.basis}</span>
                <span className="ml-auto font-semibold tabular-nums text-emerald-600">{formatRM(g.expectedGpImpact, lang)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <AIPanel
            status={vimiGoal.state.status}
            onRun={runGoal}
            error={vimiGoal.state.error}
            fallback={
              <span>
                {insights.vimiGoalDrafts[0]
                  ? `${insights.vimiGoalDrafts[0].goal} — ${insights.vimiGoalDrafts[0].measure}`
                  : t('empty.fillData')}
              </span>
            }
          >
            {vimiGoal.data && (
              <div className="space-y-1.5 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">{vimiGoal.data.goalTitle}</div>
                <p className="leading-relaxed">{vimiGoal.data.narrative}</p>
                <div className="flex flex-wrap gap-2 pt-1 text-xs text-slate-500">
                  <span>{vimiGoal.data.metric}</span>
                  <span>· {vimiGoal.data.target}</span>
                  <span>· {vimiGoal.data.cadence}</span>
                </div>
                <p className="text-xs text-slate-500">{vimiGoal.data.rewardSuggestion}</p>
              </div>
            )}
          </AIPanel>
        </div>
      </Card>
    </div>
  )
}

function cnBanner(confirmed: boolean): string {
  return [
    'mt-1 rounded-2xl px-4 py-4 ring-1',
    confirmed ? 'bg-emerald-50/60 ring-emerald-200' : 'bg-amber-50/60 ring-amber-200',
  ].join(' ')
}
