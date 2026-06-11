// ─────────────────────────────────────────────────────────────────────────────
// RevenueXRay — the "see the whole business at a glance" dashboard. A responsive
// grid of KPIs decomposed from the revenue + retention blocks, followed by the four
// TCVR pillar-health tiles. Everything is read straight from the engine; no inputs.
// ─────────────────────────────────────────────────────────────────────────────

import { useEngine } from '@/store/selectors'
import { useT } from '@/i18n/useT'
import { Card, SectionHeader } from '@/components/ui'
import { KPICard, PillarHealthTile } from '@/components/cards'
import type { TCVRPillar } from '@/engine/types'
import {
  formatMultiplier,
  formatNumber,
  formatPct,
  formatRM,
} from '@/lib/format'

const PILLAR_ACCENT: Record<TCVRPillar, string> = {
  traffic: '#3b82f6',
  conversion: '#8b5cf6',
  value: '#f59e0b',
  recurring: '#10b981',
}

export function RevenueXRay() {
  const { t, d, lang } = useT()
  const { revenue, retention, insights, channels } = useEngine()

  const targetSales = channels.trafficGap.targetRevenue ?? 0
  const salesGap = Math.max(targetSales - revenue.revenue, 0)

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <SectionHeader title={t('xray.heading')} subtitle={t('app.subtitle')} />

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <KPICard label={t('kpi.currentSales')} value={formatRM(revenue.revenue, lang)} accentColor="#6366f1" helpKey="currentSales" />
          <KPICard label={t('kpi.targetSales')} value={targetSales > 0 ? formatRM(targetSales, lang) : '—'} helpKey="targetSales" />
          <KPICard
            label={t('kpi.salesGap')}
            value={salesGap > 0 ? formatRM(salesGap, lang) : '—'}
            tone={salesGap > 0 ? 'bad' : 'default'}
            helpKey="salesGap"
          />
          <KPICard label={t('kpi.gp')} value={formatRM(revenue.grossProfit, lang)} tone="good" helpKey="gp" />

          <KPICard label={t('kpi.gpMargin')} value={formatPct(revenue.gpMargin)} helpKey="gpMargin" />
          <KPICard label={t('kpi.abv')} value={formatRM(revenue.averageBasketValue, lang)} helpKey="abv" />
          {/* Sub-RM1 CAC shows 2 decimals (rounding to "RM 0" beside a big LTV:CAC reads
              as a contradiction); LTV:CAC is meaningless without marketing cost → "—". */}
          <KPICard
            label={t('kpi.cac')}
            value={formatRM(channels.blendedCAC, lang, channels.blendedCAC > 0 && channels.blendedCAC < 1 ? 2 : 0)}
            helpKey="blendedCac"
          />
          <KPICard
            label={t('kpi.paidCac')}
            value={formatRM(channels.paidCAC, lang, channels.paidCAC > 0 && channels.paidCAC < 1 ? 2 : 0)}
            accentColor={PILLAR_ACCENT.traffic}
            helpKey="paidCac"
          />
          <KPICard label={t('kpi.ltv')} value={formatRM(revenue.ltv, lang)} helpKey="ltv" />

          <KPICard
            label={t('kpi.ltvCac')}
            value={revenue.cac > 0 ? formatMultiplier(revenue.ltvToCac, 1) : '—'}
            tone={revenue.cac > 0 && revenue.ltvToCac >= 3 ? 'good' : revenue.cac > 0 && revenue.ltvToCac < 1 ? 'bad' : 'default'}
            helpKey="ltvCac"
          />
          <KPICard label={t('kpi.convRate')} value={formatPct(revenue.conversionRate)} accentColor={PILLAR_ACCENT.conversion} helpKey="convRate" />
          <KPICard label={t('kpi.repeatRate')} value={formatPct(retention.repeatPurchaseRate)} accentColor={PILLAR_ACCENT.recurring} helpKey="repeatRate" />
          <KPICard label={t('kpi.referralRate')} value={formatPct(retention.referralRate)} accentColor={PILLAR_ACCENT.recurring} helpKey="referralRate" />

          <KPICard
            label={t('kpi.netProfit')}
            value={formatRM(revenue.netProfitImpact, lang)}
            tone={revenue.netProfitImpact > 0 ? 'good' : revenue.netProfitImpact < 0 ? 'bad' : 'default'}
            helpKey="netProfit"
            sub={
              <span className="tabular-nums">
                {formatNumber(revenue.newCustomers, lang)} {t('recurring.newCustomers')}
              </span>
            }
          />
        </div>

        {revenue.reconciliation.note && (
          <p className="mt-4 text-xs leading-relaxed text-slate-400">{revenue.reconciliation.note}</p>
        )}
      </Card>

      <Card className="p-5 sm:p-6">
        <SectionHeader title={t('xray.healthHeading')} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {insights.pillarHealth.map((ph) => {
            const driver = ph.drivers[0]
            const detail = driver
              ? `${driver.code} ${formatNumber(driver.actual, lang, 2)} / ${formatNumber(driver.benchmark, lang, 2)}`
              : undefined
            return (
              <PillarHealthTile
                key={ph.pillar}
                pillar={d('pillar', ph.pillar)}
                health={ph.band}
                score={ph.score}
                detail={detail}
                accent={PILLAR_ACCENT[ph.pillar]}
                helpKey="pillarHealth"
              />
            )
          })}
        </div>
      </Card>
    </div>
  )
}
