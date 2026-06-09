import { num, safeDiv } from '@/engine'
import { useStore } from '@/store/useStore'
import { useEngine } from '@/store/selectors'
import { useT } from '@/i18n/useT'
import { Card, SectionHeader } from '@/components/ui'
import { MetricRow } from '@/components/cards'
import { NumberField } from '@/components/fields'
import { formatRM, formatPct } from '@/lib/format'

export function CostsModule() {
  const { t, lang } = useT()
  const costs = useStore((s) => s.costs)
  const setCosts = useStore((s) => s.setCosts)
  const { revenue } = useEngine()

  const totalCost = num(costs.marketingCost) + num(costs.rewardCost) + num(costs.operationalCost)
  const rewardShareOfGp = safeDiv(num(costs.rewardCost), revenue.grossProfit)
  const netNegative = revenue.netProfitImpact < 0

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <SectionHeader title={t('costs.heading')} subtitle={t('costs.lead')} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <NumberField
            label={t('costs.marketing')}
            value={costs.marketingCost}
            onChange={(v) => setCosts({ marketingCost: v })}
            prefix="RM"
          />
          <NumberField
            label={t('costs.reward')}
            value={costs.rewardCost}
            onChange={(v) => setCosts({ rewardCost: v })}
            prefix="RM"
          />
          <NumberField
            label={t('costs.operational')}
            value={costs.operationalCost}
            onChange={(v) => setCosts({ operationalCost: v })}
            prefix="RM"
          />
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <SectionHeader title={t('kpi.netProfit')} />
        <div>
          <MetricRow label={t('kpi.gp')} value={formatRM(revenue.grossProfit, lang)} />
          <MetricRow label={t('common.total')} value={formatRM(totalCost, lang)} />
          <MetricRow
            label={t('kpi.netProfit')}
            value={
              <span className={netNegative ? 'text-red-600' : 'text-emerald-600'}>
                {formatRM(revenue.netProfitImpact, lang)}
              </span>
            }
          />
          <MetricRow
            label={`${t('costs.reward')} · ${t('kpi.gpMargin')}`}
            value={formatPct(rewardShareOfGp)}
          />
        </div>
      </Card>
    </div>
  )
}
