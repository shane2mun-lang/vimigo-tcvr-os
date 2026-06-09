// ─────────────────────────────────────────────────────────────────────────────
// FunnelMap — the projector-ready Traffic × Conversion × Value × Recurring picture.
// The signature <FunnelRing/> sits in the middle (center = target revenue), each
// quadrant a pillar tinted by its color and outlined by its health band. Around it,
// one card per pillar repeats the key numbers with a HealthBadge.
// ─────────────────────────────────────────────────────────────────────────────

import { useEngine } from '@/store/selectors'
import { useT } from '@/i18n/useT'
import { Card, SectionHeader } from '@/components/ui'
import { HealthBadge, MetricRow } from '@/components/cards'
import { FunnelRing } from '@/components/viz/FunnelRing'
import type { FunnelRingSegment } from '@/components/viz/FunnelRing'
import type { Health, TCVRPillar } from '@/engine/types'
import { formatNumber, formatPct, formatRM, formatRMShort } from '@/lib/format'

const PILLAR_ACCENT: Record<TCVRPillar, string> = {
  traffic: '#3b82f6',
  conversion: '#8b5cf6',
  value: '#f59e0b',
  recurring: '#10b981',
}

export function FunnelMap() {
  const { t, d, lang } = useT()
  const { revenue, channels, funnel, retention, insights } = useEngine()

  const band = (p: TCVRPillar): Health =>
    insights.pillarHealth.find((ph) => ph.pillar === p)?.band ?? 'yellow'

  const targetRevenue = channels.trafficGap.targetRevenue ?? revenue.revenue

  const leads = channels.totals.leads || revenue.traffic
  const segments: FunnelRingSegment[] = [
    {
      pillar: d('pillar', 'traffic'),
      color: PILLAR_ACCENT.traffic,
      health: band('traffic'),
      label: t('traffic.leads'),
      value: formatNumber(leads, lang),
    },
    {
      pillar: d('pillar', 'conversion'),
      color: PILLAR_ACCENT.conversion,
      health: band('conversion'),
      label: t('conversion.overall'),
      value: formatPct(funnel.overallConversion),
    },
    {
      pillar: d('pillar', 'value'),
      color: PILLAR_ACCENT.value,
      health: band('value'),
      label: t('kpi.abv'),
      value: formatRMShort(revenue.averageBasketValue, lang),
    },
    {
      pillar: d('pillar', 'recurring'),
      color: PILLAR_ACCENT.recurring,
      health: band('recurring'),
      label: t('kpi.repeatRate'),
      value: formatPct(retention.repeatPurchaseRate),
    },
  ]

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <SectionHeader title={t('funnelmap.heading')} subtitle={t('app.subtitle')} />
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,360px)_1fr]">
          <FunnelRing centerLabel={t('funnelmap.center')} centerValue={formatRMShort(targetRevenue, lang)} segments={segments} />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Traffic */}
            <PillarCard pillar="traffic" accent={PILLAR_ACCENT.traffic} band={band('traffic')} title={d('pillar', 'traffic')}>
              <MetricRow label={t('traffic.leads')} value={formatNumber(leads, lang)} />
              <MetricRow label={t('traffic.paidCpl')} value={formatRM(channels.paid.cpl, lang)} />
              <MetricRow label={t('traffic.gapToTarget')} value={formatNumber(channels.trafficGap.gapLeads ?? 0, lang)} />
            </PillarCard>

            {/* Conversion */}
            <PillarCard pillar="conversion" accent={PILLAR_ACCENT.conversion} band={band('conversion')} title={d('pillar', 'conversion')}>
              <MetricRow label={t('conversion.overall')} value={formatPct(funnel.overallConversion)} />
              <MetricRow
                label={t('conversion.biggestDrop')}
                value={funnel.biggestDropStage ? d('stage', funnel.biggestDropStage.to) : '—'}
              />
              <MetricRow label={t('conversion.lostValue')} value={formatRM(funnel.lostGPValue, lang)} />
            </PillarCard>

            {/* Value */}
            <PillarCard pillar="value" accent={PILLAR_ACCENT.value} band={band('value')} title={d('pillar', 'value')}>
              <MetricRow label={t('kpi.abv')} value={formatRM(revenue.averageBasketValue, lang)} />
              <MetricRow label={t('kpi.gpMargin')} value={formatPct(revenue.gpMargin)} />
              <MetricRow label={t('kpi.gp')} value={formatRM(revenue.grossProfit, lang)} />
            </PillarCard>

            {/* Recurring */}
            <PillarCard pillar="recurring" accent={PILLAR_ACCENT.recurring} band={band('recurring')} title={d('pillar', 'recurring')}>
              <MetricRow label={t('kpi.repeatRate')} value={formatPct(retention.repeatPurchaseRate)} />
              <MetricRow label={t('kpi.referralRate')} value={formatPct(retention.referralRate)} />
              <MetricRow label={t('kpi.ltv')} value={formatRM(retention.ltv, lang)} />
            </PillarCard>
          </div>
        </div>
      </Card>
    </div>
  )
}

function PillarCard({
  accent,
  band,
  title,
  children,
}: {
  pillar: TCVRPillar
  accent: string
  band: Health
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color: accent }}>
          {title}
        </span>
        <HealthBadge health={band} />
      </div>
      {children}
    </div>
  )
}
