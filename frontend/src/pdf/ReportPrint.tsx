// Print-only FULL TCVR diagnostic report. Hidden on screen; revealed under
// @media print (Export PDF → browser print → Save as PDF). Two parts:
//   1. Executive overview — one visual page the boss can read at a glance.
//   2. Detailed analysis — every module's numbers, for discussion with the
//      vimigo CSM team or the boss's internal team.

import type { ReactNode } from 'react'
import { useEngine, useInput } from '@/store/selectors'
import { useT } from '@/i18n/useT'
import { formatRM, formatPct, formatNumber, formatMultiplier, formatDeltaRM } from '@/lib/format'
import type { Health, TCVRPillar } from '@/engine/types'

const PILLAR_COLOR: Record<TCVRPillar, string> = {
  traffic: '#3b82f6',
  conversion: '#8b5cf6',
  value: '#f59e0b',
  recurring: '#10b981',
}
const HEALTH_COLOR: Record<Health, string> = { green: '#16a34a', yellow: '#ca8a04', red: '#dc2626' }
const HEALTH_BG: Record<Health, string> = { green: '#f0fdf4', yellow: '#fefce8', red: '#fef2f2' }

function bandLabel(t: ReturnType<typeof useT>['t'], h: Health): string {
  return h === 'green' ? t('health.green') : h === 'yellow' ? t('health.yellow') : t('health.red')
}

function Section({ title, children, breakBefore }: { title: string; children: ReactNode; breakBefore?: boolean }) {
  return (
    <section className={`mb-6 ${breakBefore ? 'break-before-page' : 'break-inside-avoid'}`}>
      <h2 className="mb-2 border-b-2 border-slate-800 pb-1 text-base font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  )
}

function Sub({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-4 break-inside-avoid">
      <h3 className="mb-1.5 text-sm font-bold text-slate-700">{title}</h3>
      {children}
    </div>
  )
}

function KpiBox({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded border border-slate-200 px-2.5 py-1.5">
      <div className="text-[9px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-sm font-bold tabular-nums" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
    </div>
  )
}

function Bar({ pct, color, label }: { pct: number; color: string; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-3 flex-1 overflow-hidden rounded-sm bg-slate-100">
        <div className="h-full rounded-sm" style={{ width: `${Math.max(2, Math.min(100, pct))}%`, backgroundColor: color }} />
      </div>
      {label && <div className="w-24 shrink-0 text-right text-[10px] tabular-nums text-slate-600">{label}</div>}
    </div>
  )
}

const th = 'border-b border-slate-300 py-1 pr-2 text-left text-[9px] font-semibold uppercase tracking-wide text-slate-500'
const td = 'border-b border-slate-100 py-1 pr-2 tabular-nums'

export function ReportPrint() {
  const { t, d, lang } = useT()
  const r = useEngine()
  const input = useInput()
  const rev = r.revenue
  const ch = r.channels
  const fu = r.funnel
  const pr = r.products
  const re = r.retention
  const sc = r.scenarios
  const ins = r.insights

  const targetSales = ch.trafficGap.targetRevenue ?? 0
  const gap = Math.max(0, targetSales - rev.revenue)
  const today = new Date().toLocaleDateString(lang === 'zh' ? 'zh-MY' : 'en-MY', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const kpis: { label: string; value: string; accent?: string }[] = [
    { label: t('kpi.currentSales'), value: formatRM(rev.revenue, lang) },
    { label: t('kpi.targetSales'), value: targetSales > 0 ? formatRM(targetSales, lang) : '—' },
    { label: t('kpi.salesGap'), value: gap > 0 ? formatRM(gap, lang) : '—', accent: gap > 0 ? '#dc2626' : undefined },
    { label: t('kpi.gp'), value: formatRM(rev.grossProfit, lang), accent: '#059669' },
    { label: t('kpi.gpMargin'), value: formatPct(rev.gpMargin) },
    { label: t('kpi.abv'), value: formatRM(rev.averageBasketValue, lang) },
    { label: t('kpi.cac'), value: formatRM(ch.blendedCAC, lang) },
    { label: t('traffic.paidCac'), value: formatRM(ch.paidCAC, lang), accent: PILLAR_COLOR.traffic },
    { label: t('kpi.ltv'), value: formatRM(rev.ltv, lang) },
    { label: t('kpi.ltvCac'), value: formatMultiplier(rev.ltvToCac, 1) },
    { label: t('kpi.convRate'), value: formatPct(rev.conversionRate), accent: PILLAR_COLOR.conversion },
    { label: t('kpi.repeatRate'), value: formatPct(re.repeatPurchaseRate), accent: PILLAR_COLOR.recurring },
    { label: t('kpi.referralRate'), value: formatPct(re.referralRate), accent: PILLAR_COLOR.recurring },
    { label: t('kpi.netProfit'), value: formatRM(rev.netProfitImpact, lang), accent: rev.netProfitImpact >= 0 ? '#059669' : '#dc2626' },
  ]

  const maxFunnelCount = Math.max(1, ...fu.stepRates.map((s) => s.fromCount), ...fu.stepRates.map((s) => s.toCount))
  const maxScenarioGp = Math.max(1, ...sc.scenarios.map((s) => s.gp))

  const pillarSummary: { pillar: TCVRPillar; lines: string[] }[] = [
    { pillar: 'traffic', lines: [`${t('traffic.leads')}: ${formatNumber(ch.totals.leads, lang)}`, `${t('traffic.paidCpl')}: ${formatRM(ch.paid.cpl, lang)}`, `${t('traffic.paidRoas')}: ${formatMultiplier(ch.paid.roas, 1)}`] },
    { pillar: 'conversion', lines: [`${t('conversion.overall')}: ${formatPct(fu.overallConversion)}`, `${t('conversion.lostValue')}: ${formatRM(fu.lostSalesValue, lang)}`] },
    { pillar: 'value', lines: [`${t('kpi.abv')}: ${formatRM(rev.averageBasketValue, lang)}`, `${t('kpi.gpMargin')}: ${formatPct(rev.gpMargin)}`] },
    { pillar: 'recurring', lines: [`${t('kpi.repeatRate')}: ${formatPct(re.repeatPurchaseRate)}`, `${t('kpi.ltv')}: ${formatRM(re.ltv, lang)}`] },
  ]

  return (
    <div className="report-print mx-auto max-w-4xl bg-white p-8 text-slate-900">
      {/* ════ Header ════ */}
      <div className="mb-5 flex items-end justify-between border-b-4 border-slate-900 pb-3">
        <div>
          <div className="text-xl font-extrabold">{t('app.title')}</div>
          <div className="text-sm font-semibold text-slate-600">{t('report.fullTitle')}</div>
          <div className="text-[10px] text-slate-400">{t('report.discussNote')}</div>
        </div>
        <div className="text-right text-sm">
          <div className="text-base font-bold">{input.profile.name ?? t('profile.untitled')}</div>
          <div className="text-slate-500">{input.profile.industry}</div>
          <div className="text-[10px] text-slate-400">{today}</div>
        </div>
      </div>

      {/* ════ PART 1 — Executive overview ════ */}
      <Section title={`① ${t('report.overview')}`}>
        <div className="mb-3 grid grid-cols-5 gap-1.5">
          {kpis.map((k) => (
            <KpiBox key={k.label} {...k} />
          ))}
        </div>

        {/* TCVR quadrant visual */}
        <div className="mb-3 grid grid-cols-4 gap-1.5">
          {ins.pillarHealth.map((p) => (
            <div key={p.pillar} className="rounded-lg border-2 p-2" style={{ borderColor: PILLAR_COLOR[p.pillar], backgroundColor: HEALTH_BG[p.band] }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold" style={{ color: PILLAR_COLOR[p.pillar] }}>{d('pillar', p.pillar)}</span>
                <span className="text-[10px] font-bold" style={{ color: HEALTH_COLOR[p.band] }}>● {bandLabel(t, p.band)}</span>
              </div>
              <div className="mt-0.5 text-lg font-extrabold tabular-nums" style={{ color: HEALTH_COLOR[p.band] }}>
                {Math.round(p.score)}<span className="text-[10px] font-medium text-slate-400">/100</span>
              </div>
              <div className="mt-0.5 space-y-px text-[9px] leading-tight text-slate-600">
                {pillarSummary.find((x) => x.pillar === p.pillar)?.lines.map((l, i) => <div key={i}>{l}</div>)}
              </div>
            </div>
          ))}
        </div>

        {/* Bottleneck */}
        <div className="rounded-lg border-l-4 border-red-500 bg-red-50 px-3 py-2">
          <span className="text-xs font-bold text-red-700">{t('actionplan.bottleneck')}: {d('bottleneck', ins.primaryBottleneck.computed)}</span>
          <span className="ml-2 text-[10px] text-slate-500">
            ({ins.primaryBottleneck.agreement === 'confirmed' ? t('actionplan.bottleneckConfirmed') : t('actionplan.bottleneckDiffers')})
            {ins.primaryBottleneck.evidence[0] ? ` — ${ins.primaryBottleneck.evidence[0]}` : ''}
          </span>
        </div>

        {/* Top levers & leaks side by side */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <h3 className="mb-1 text-xs font-bold text-emerald-700">▲ {t('actionplan.topLevers')}</h3>
            {ins.topGrowthLevers.map((i) => (
              <div key={i.code} className="mb-1 rounded border border-emerald-100 bg-emerald-50/50 px-2 py-1 text-[10px] leading-snug">
                <span className="font-semibold text-emerald-700">{formatDeltaRM(i.moneyImpact ?? 0, lang)} GP</span> · {i.detail}
              </div>
            ))}
          </div>
          <div>
            <h3 className="mb-1 text-xs font-bold text-red-700">▼ {t('actionplan.topLeaks')}</h3>
            {ins.topLeaks.map((i) => (
              <div key={i.code} className="mb-1 rounded border border-red-100 bg-red-50/50 px-2 py-1 text-[10px] leading-snug">
                <span className="font-semibold text-red-700">{formatRM(i.moneyImpact ?? 0, lang)}</span> · {i.title}: {i.detail}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2 text-[9px] italic text-slate-400">{rev.reconciliation.note}</div>
      </Section>

      {/* ════ PART 2 — Detail ════ */}
      <Section title={`② ${t('report.detail')} — ${d('pillar', 'traffic')}`} breakBefore>
        <Sub title={t('traffic.paidEfficiency')}>
          <div className="grid grid-cols-6 gap-1.5">
            <KpiBox label={t('traffic.spend')} value={formatRM(ch.paid.spend, lang)} />
            <KpiBox label={t('traffic.paidCpl')} value={formatRM(ch.paid.cpl, lang)} accent={PILLAR_COLOR.traffic} />
            <KpiBox label={t('traffic.paidRoas')} value={formatMultiplier(ch.paid.roas, 1)} accent={PILLAR_COLOR.traffic} />
            <KpiBox label={t('traffic.paidGpRoas')} value={formatMultiplier(ch.paid.gpRoas, 1)} accent={PILLAR_COLOR.traffic} />
            <KpiBox label={t('traffic.paidCac')} value={formatRM(ch.paidCAC, lang)} accent={PILLAR_COLOR.traffic} />
            <KpiBox label={t('traffic.contribution')} value={formatPct(ch.paid.contributionPct)} />
          </div>
        </Sub>
        <Sub title={t('traffic.organicChannels')}>
          <div className="grid grid-cols-6 gap-1.5">
            <KpiBox label={t('traffic.leads')} value={formatNumber(ch.organic.leads, lang)} />
            <KpiBox label={t('traffic.customers')} value={formatNumber(ch.organic.customers, lang)} />
            <KpiBox label={t('traffic.sales')} value={formatRM(ch.organic.sales, lang)} accent={PILLAR_COLOR.recurring} />
            <KpiBox label={t('traffic.gp')} value={formatRM(ch.organic.gp, lang)} accent={PILLAR_COLOR.recurring} />
            <KpiBox label={t('traffic.convRate')} value={formatPct(ch.organic.conversionRate)} />
            <KpiBox label={t('traffic.contribution')} value={formatPct(ch.organic.contributionPct)} />
          </div>
        </Sub>
        <Sub title={t('report.channelTable')}>
          <table className="w-full border-collapse text-[10px]">
            <thead>
              <tr>
                <th className={th}>{t('traffic.channel')}</th>
                <th className={th}></th>
                <th className={th}>{t('traffic.leads')}</th>
                <th className={th}>{t('traffic.spend')}</th>
                <th className={th}>{t('traffic.closed')}</th>
                <th className={th}>{t('traffic.sales')}</th>
                <th className={th}>{t('traffic.gp')}</th>
                <th className={th}>{t('traffic.cpl')}</th>
                <th className={th}>{t('traffic.convRate')}</th>
                <th className={th}>{t('traffic.roi')}</th>
                <th className={th}>{t('traffic.contribution')}</th>
              </tr>
            </thead>
            <tbody>
              {ch.perChannel.map((c) => (
                <tr key={c.id}>
                  <td className={`${td} font-medium`}>{c.name}</td>
                  <td className={td} style={{ color: c.isOrganic ? '#059669' : '#3b82f6' }}>
                    {c.isOrganic ? t('traffic.organicLabel') : t('traffic.paidLabel')}
                  </td>
                  <td className={td}>{formatNumber(c.leads, lang)}</td>
                  <td className={td}>{formatRM(c.spend, lang)}</td>
                  <td className={td}>{formatNumber(c.closedDeals, lang)}</td>
                  <td className={td}>{formatRM(c.sales, lang)}</td>
                  <td className={td}>{formatRM(c.gp, lang)}</td>
                  <td className={td}>{c.cpl != null ? formatRM(c.cpl, lang) : '—'}</td>
                  <td className={td}>{formatPct(c.conversionRate)}</td>
                  <td className={td}>{c.roi != null ? formatPct(c.roi) : '—'}</td>
                  <td className={td}>{formatPct(c.contributionPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-1 text-[10px] text-slate-500">
            {t('traffic.bestChannel')}: <b>{ch.bestByRoi ?? '—'}</b> · {t('traffic.worstChannel')}: <b>{ch.worstByRoi ?? '—'}</b> ·{' '}
            {t('traffic.gapToTarget')}: <b>{formatNumber(ch.trafficGap.gapLeads ?? 0, lang)} {t('traffic.leads')}</b>
          </div>
        </Sub>
      </Section>

      <Section title={`③ ${t('report.funnelDetail')}`}>
        <div className="mb-2 space-y-1">
          {fu.stepRates.map((s) => (
            <div key={`${s.from}-${s.to}`}>
              <div className="mb-0.5 flex justify-between text-[10px] text-slate-600">
                <span>{d('stage', s.from)} → {d('stage', s.to)}</span>
                <span className="font-semibold">{formatPct(s.rate)} ({formatNumber(s.fromCount, lang)} → {formatNumber(s.toCount, lang)})</span>
              </div>
              <Bar pct={(s.toCount / maxFunnelCount) * 100} color={PILLAR_COLOR.conversion} />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          <KpiBox label={t('conversion.overall')} value={formatPct(fu.overallConversion)} accent={PILLAR_COLOR.conversion} />
          <KpiBox label={t('conversion.biggestDrop')} value={fu.biggestDropStage ? `${d('stage', fu.biggestDropStage.from)}→${d('stage', fu.biggestDropStage.to)}` : '—'} />
          <KpiBox label={t('conversion.lostValue')} value={formatRM(fu.lostSalesValue, lang)} accent="#dc2626" />
          <KpiBox label={t('conversion.followupLeak')} value={formatRM(fu.followUpLeakageValue, lang)} accent="#dc2626" />
        </div>
      </Section>

      <Section title={`④ ${t('report.productDetail')}`}>
        <table className="mb-2 w-full border-collapse text-[10px]">
          <thead>
            <tr>
              <th className={th}>{t('value.product')}</th>
              <th className={th}>{t('value.type')}</th>
              <th className={th}>{t('value.price')}</th>
              <th className={th}>{t('value.cost')}</th>
              <th className={th}>{t('value.gpUnit')}</th>
              <th className={th}>{t('value.margin')}</th>
              <th className={th}>{t('value.volume')}</th>
              <th className={th}>{t('traffic.gp')}/mo</th>
              <th className={th}>Mix</th>
            </tr>
          </thead>
          <tbody>
            {pr.perProduct.map((p) => (
              <tr key={p.id}>
                <td className={`${td} font-medium`}>{p.name}{p.rewardPriority ? ' ★' : ''}</td>
                <td className={td}>{p.tag ? d('tag', p.tag) : '—'}</td>
                <td className={td}>{formatRM(p.price, lang)}</td>
                <td className={td}>{formatRM(p.cost, lang)}</td>
                <td className={td}>{formatRM(p.gpPerUnit, lang)}</td>
                <td className={td}>{formatPct(p.gpMargin)}</td>
                <td className={td}>{formatNumber(p.monthlyVolume, lang)}</td>
                <td className={td}>{formatRM(p.monthlyGP, lang)}</td>
                <td className={td}>{formatPct(p.mixContributionPct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Product ladder presence */}
        <div className="mb-2 flex gap-1">
          {pr.recommendedLadder.map((tag) => {
            const present = pr.ladderPresent.includes(tag)
            return (
              <div
                key={tag}
                className="flex-1 rounded border px-1.5 py-1 text-center text-[9px] font-semibold"
                style={present ? { borderColor: PILLAR_COLOR.value, color: PILLAR_COLOR.value, backgroundColor: '#fffbeb' } : { borderColor: '#e2e8f0', color: '#94a3b8' }}
              >
                {present ? '✓' : '✗'} {d('tag', tag)}
              </div>
            )
          })}
        </div>
        {ins.ladderGapMessages.map((g) => (
          <div key={g.code} className="mb-1 rounded border-l-2 border-amber-400 bg-amber-50 px-2 py-1 text-[10px] text-slate-700">{g.detail}</div>
        ))}
      </Section>

      <Section title={`⑤ ${t('report.retentionDetail')}`}>
        <div className="grid grid-cols-4 gap-1.5">
          <KpiBox label={t('recurring.repeatRate')} value={formatPct(re.repeatPurchaseRate)} accent={PILLAR_COLOR.recurring} />
          <KpiBox label={t('recurring.referralRate')} value={formatPct(re.referralRate)} accent={PILLAR_COLOR.recurring} />
          <KpiBox label={t('kpi.ltv')} value={formatRM(re.ltv, lang)} />
          <KpiBox label={t('report.referralLtv')} value={formatRM(re.referralLtv, lang)} />
          <KpiBox label={t('report.retentionRevenue')} value={formatRM(re.retentionRevenue, lang)} />
          <KpiBox label={t('report.lostRetention')} value={formatRM(re.lostRetentionValue, lang)} accent="#dc2626" />
          <KpiBox label={t('report.referralForecast')} value={formatRM(re.referralSalesForecast, lang)} />
          <KpiBox label={t('report.referralGpForecast')} value={formatRM(re.referralGpForecast, lang)} />
        </div>
        {re.missingMechanisms.length > 0 && (
          <div className="mt-2 text-[10px] text-slate-600">
            {t('productgp.missing')}: {re.missingMechanisms.map((m) => (m === 'membership' ? t('recurring.membership') : m === 'aftercare' ? t('recurring.aftercare') : m === 'review' ? t('recurring.review') : t('recurring.referralReward'))).join(' · ')}
          </div>
        )}
      </Section>

      <Section title={`⑥ ${t('report.scenarioDetail')}`}>
        <div className="mb-2 space-y-1">
          {sc.scenarios.map((s) => (
            <div key={s.id}>
              <div className="mb-0.5 flex justify-between text-[10px] text-slate-600">
                <span className="font-medium">{t(`scenario.${s.id}` as 'scenario.A')}</span>
                <span>
                  {t('kpi.gp')}: <b>{formatRM(s.gp, lang)}</b>
                  {s.id !== 'A' && <span style={{ color: s.deltaGp >= 0 ? '#059669' : '#dc2626' }}> ({formatDeltaRM(s.deltaGp, lang)})</span>}
                </span>
              </div>
              <Bar pct={(s.gp / maxScenarioGp) * 100} color={s.id === 'A' ? '#94a3b8' : '#10b981'} />
            </div>
          ))}
        </div>
        <div className="rounded border border-indigo-100 bg-indigo-50 px-2 py-1.5 text-[10px]">
          <b className="text-brand-accent">{t('simulator.topLever')}:</b>{' '}
          {d('pillar', sc.topLever.lever.includes('traffic') ? 'traffic' : sc.topLever.lever.includes('conv') ? 'conversion' : sc.topLever.lever.includes('repeat') || sc.topLever.lever.includes('referral') ? 'recurring' : 'value')} · {formatDeltaRM(sc.topLever.deltaGp, lang)} GP
        </div>
      </Section>

      <Section title={`⑦ ${t('actionplan.rewardDesign')} & ${t('actionplan.vimigoal')}`}>
        <table className="mb-3 w-full border-collapse text-[10px]">
          <thead>
            <tr>
              <th className={th}>{t('reward.metric')}</th>
              <th className={th}>{t('reward.role')}</th>
              <th className={th}>{t('reward.type')}</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody>
            {ins.rewardSuggestions.map((s, i) => (
              <tr key={i}>
                <td className={`${td} font-medium`}>{s.suggestedKpi}</td>
                <td className={td}>{d('role', s.role)}</td>
                <td className={td}>{d('reward', s.rewardType)}</td>
                <td className={`${td} text-slate-500`}>{s.rationale}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {ins.vimiGoalDrafts.map((g, i) => (
          <div key={i} className="mb-1.5 break-inside-avoid rounded border border-slate-200 px-2.5 py-1.5 text-[10px]">
            <div className="font-bold">{g.goal}</div>
            <div className="text-slate-600">
              {g.measure} · {d('role', g.accountability)} · {d('reward', g.reward.type)} ({g.reward.basis}) ·{' '}
              <b style={{ color: '#059669' }}>+{formatRM(g.expectedGpImpact, lang)} GP</b>
            </div>
          </div>
        ))}
      </Section>

      <Section title={`⑧ ${t('actionplan.heading')}`}>
        <div className="grid grid-cols-3 gap-2 text-[10px]">
          {[t('actionplan.day30'), t('actionplan.day60'), t('actionplan.day90')].map((label, idx) => {
            const lever = ins.topGrowthLevers[idx]
            return (
              <div key={label} className="rounded border border-slate-200 p-2">
                <div className="mb-1 font-bold" style={{ color: [PILLAR_COLOR.traffic, PILLAR_COLOR.conversion, PILLAR_COLOR.value][idx] }}>{label}</div>
                {lever && (
                  <div className="leading-snug text-slate-600">
                    {lever.detail}
                    <div className="mt-0.5 font-semibold" style={{ color: '#059669' }}>{formatDeltaRM(lever.moneyImpact ?? 0, lang)} GP</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Section>

      <div className="mt-4 border-t border-slate-200 pt-2 text-center text-[9px] text-slate-400">
        vimigo TCVR Revenue OS · {input.profile.name ?? ''} · {today} · {t('report.discussNote')}
      </div>
    </div>
  )
}
