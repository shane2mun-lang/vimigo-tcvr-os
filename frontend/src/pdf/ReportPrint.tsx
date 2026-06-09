// Print-only TCVR report. Hidden on screen; revealed under @media print (see index.css).
// Mounted once in AppShell so it always reflects live engine output.

import type { ReactNode } from 'react'
import { useEngine, useInput } from '@/store/selectors'
import { useT } from '@/i18n/useT'
import { formatRM, formatPct } from '@/lib/format'
import type { Health } from '@/engine/types'

function bandLabel(t: ReturnType<typeof useT>['t'], h: Health): string {
  return h === 'green' ? t('health.green') : h === 'yellow' ? t('health.yellow') : t('health.red')
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-5 break-inside-avoid">
      <h2 className="mb-2 border-b border-slate-300 pb-1 text-base font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  )
}

export function ReportPrint() {
  const { t, d, lang } = useT()
  const r = useEngine()
  const input = useInput()
  const rev = r.revenue
  const gap = Math.max(0, (input.profile.targetMonthlyRevenue ?? 0) - rev.revenue)
  const today = new Date().toLocaleDateString(lang === 'zh' ? 'zh-MY' : 'en-MY', { year: 'numeric', month: 'long', day: 'numeric' })

  const kpis: { label: string; value: string }[] = [
    { label: t('kpi.currentSales'), value: formatRM(rev.revenue, lang) },
    { label: t('kpi.targetSales'), value: formatRM(input.profile.targetMonthlyRevenue ?? 0, lang) },
    { label: t('kpi.salesGap'), value: formatRM(gap, lang) },
    { label: t('kpi.gp'), value: formatRM(rev.grossProfit, lang) },
    { label: t('kpi.gpMargin'), value: formatPct(rev.gpMargin) },
    { label: t('kpi.cac'), value: formatRM(rev.cac, lang) },
    { label: t('traffic.paidCac'), value: formatRM(r.channels.paidCAC, lang) },
    { label: t('kpi.abv'), value: formatRM(rev.averageBasketValue, lang) },
    { label: t('kpi.ltv'), value: formatRM(rev.ltv, lang) },
    { label: t('kpi.convRate'), value: formatPct(rev.conversionRate) },
    { label: t('kpi.repeatRate'), value: formatPct(r.retention.repeatPurchaseRate) },
  ]

  return (
    <div className="report-print mx-auto max-w-3xl bg-white p-8 text-slate-900">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between border-b-2 border-slate-800 pb-3">
        <div>
          <div className="text-xl font-bold">{t('app.title')}</div>
          <div className="text-sm text-slate-500">{t('app.subtitle')}</div>
        </div>
        <div className="text-right text-sm">
          <div className="font-semibold">{input.profile.name ?? t('profile.untitled')}</div>
          <div className="text-slate-500">{today}</div>
        </div>
      </div>

      {/* Executive summary */}
      <Section title={t('xray.heading')}>
        <div className="grid grid-cols-3 gap-3">
          {kpis.map((k) => (
            <div key={k.label} className="rounded border border-slate-200 px-3 py-2">
              <div className="text-[10px] uppercase text-slate-500">{k.label}</div>
              <div className="text-base font-semibold tabular-nums">{k.value}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* Pillar health */}
      <Section title={t('xray.healthHeading')}>
        <table className="w-full border-collapse text-sm">
          <tbody>
            {r.insights.pillarHealth.map((p) => (
              <tr key={p.pillar} className="border-b border-slate-100">
                <td className="py-1 font-medium">{d('pillar', p.pillar)}</td>
                <td className="py-1 text-right tabular-nums">{Math.round(p.score)}/100</td>
                <td className="py-1 pl-3 text-right">{bandLabel(t, p.band)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* Bottleneck */}
      <Section title={t('actionplan.bottleneck')}>
        <p className="text-sm">
          <span className="font-semibold">{d('bottleneck', r.insights.primaryBottleneck.computed)}</span>
          {r.insights.primaryBottleneck.evidence[0] && (
            <span className="text-slate-500"> — {r.insights.primaryBottleneck.evidence[0]}</span>
          )}
        </p>
      </Section>

      {/* Top levers */}
      <Section title={t('actionplan.topLevers')}>
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {r.insights.topGrowthLevers.map((i) => (
            <li key={i.code}>
              {i.detail} <span className="font-semibold">(+{formatRM(i.moneyImpact ?? 0, lang)} GP)</span>
            </li>
          ))}
        </ol>
      </Section>

      {/* Top leaks */}
      <Section title={t('actionplan.topLeaks')}>
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {r.insights.topLeaks.map((i) => (
            <li key={i.code}>
              {i.title}: {i.detail} <span className="font-semibold">({formatRM(i.moneyImpact ?? 0, lang)})</span>
            </li>
          ))}
        </ol>
      </Section>

      {/* Reward design */}
      <Section title={t('actionplan.rewardDesign')}>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-300 text-left text-xs text-slate-500">
              <th className="py-1">{t('reward.metric')}</th>
              <th className="py-1">{t('reward.role')}</th>
              <th className="py-1">{t('reward.type')}</th>
            </tr>
          </thead>
          <tbody>
            {r.insights.rewardSuggestions.map((s, i) => (
              <tr key={i} className="border-b border-slate-100">
                <td className="py-1">{s.suggestedKpi}</td>
                <td className="py-1">{d('role', s.role)}</td>
                <td className="py-1">{d('reward', s.rewardType)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* vimiGoal drafts */}
      <Section title={t('actionplan.vimigoal')}>
        <div className="space-y-2">
          {r.insights.vimiGoalDrafts.map((g, i) => (
            <div key={i} className="rounded border border-slate-200 p-2 text-sm">
              <div className="font-semibold">{g.goal}</div>
              <div className="text-slate-600">
                {t('reward.kpi')}: {g.measure} · {d('role', g.accountability)} · {d('reward', g.reward.type)} ({g.reward.basis})
              </div>
              <div className="text-slate-500">
                {t('kpi.gp')}: +{formatRM(g.expectedGpImpact, lang)}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* 90-day plan */}
      <Section title={t('actionplan.heading')}>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded border border-slate-200 p-2">
            <div className="font-semibold text-tcvr-traffic">{t('actionplan.day30')}</div>
          </div>
          <div className="rounded border border-slate-200 p-2">
            <div className="font-semibold text-tcvr-conversion">{t('actionplan.day60')}</div>
          </div>
          <div className="rounded border border-slate-200 p-2">
            <div className="font-semibold text-tcvr-value">{t('actionplan.day90')}</div>
          </div>
        </div>
      </Section>

      <div className="mt-6 border-t border-slate-200 pt-2 text-center text-[10px] text-slate-400">
        Generated by vimigo TCVR Revenue OS · {today}
      </div>
    </div>
  )
}
