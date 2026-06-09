import { useStore } from '@/store/useStore'
import { useEngine } from '@/store/selectors'
import { useT } from '@/i18n/useT'
import { Card, SectionHeader } from '@/components/ui'
import { MetricRow } from '@/components/cards'
import { NumberField, ToggleField } from '@/components/fields'
import { formatRM, formatPct } from '@/lib/format'

export function RecurringModule() {
  const { t, lang } = useT()
  const recurring = useStore((s) => s.recurring)
  const setRecurring = useStore((s) => s.setRecurring)
  const { retention } = useEngine()

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <SectionHeader title={t('recurring.heading')} subtitle={t('recurring.lead')} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <NumberField
            label={t('recurring.newCustomers')}
            value={recurring.newCustomers}
            onChange={(v) => setRecurring({ newCustomers: v })}
          />
          <NumberField
            label={t('recurring.repeatCustomers')}
            value={recurring.repeatCustomers}
            onChange={(v) => setRecurring({ repeatCustomers: v })}
          />
          <NumberField
            label={t('recurring.avgRepeatCount')}
            value={recurring.avgRepeatCount}
            onChange={(v) => setRecurring({ avgRepeatCount: v })}
            step={0.1}
          />
          <NumberField
            label={t('recurring.avgRepeatCycle')}
            value={recurring.avgRepeatCycle}
            onChange={(v) => setRecurring({ avgRepeatCycle: v })}
          />
          <NumberField
            label={t('recurring.lifespan')}
            value={recurring.customerLifespan}
            onChange={(v) => setRecurring({ customerLifespan: v })}
          />
          <NumberField
            label={t('recurring.referralsPer')}
            value={recurring.avgReferralsPerCustomer}
            onChange={(v) => setRecurring({ avgReferralsPerCustomer: v })}
            step={0.1}
          />
          <NumberField
            label={t('recurring.referralClose')}
            value={recurring.referralCloseRate}
            onChange={(v) => setRecurring({ referralCloseRate: v })}
            suffix="%"
          />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <ToggleField
            label={t('recurring.membership')}
            checked={Boolean(recurring.hasMembership)}
            onChange={(v) => setRecurring({ hasMembership: v })}
          />
          <ToggleField
            label={t('recurring.aftercare')}
            checked={Boolean(recurring.hasAftercare)}
            onChange={(v) => setRecurring({ hasAftercare: v })}
          />
          <ToggleField
            label={t('recurring.review')}
            checked={Boolean(recurring.hasReviewMechanism)}
            onChange={(v) => setRecurring({ hasReviewMechanism: v })}
          />
          <ToggleField
            label={t('recurring.referralReward')}
            checked={Boolean(recurring.hasReferralReward)}
            onChange={(v) => setRecurring({ hasReferralReward: v })}
          />
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <SectionHeader title={t('nav.recurring')} />
        <div>
          <MetricRow label={t('recurring.repeatRate')} value={formatPct(retention.repeatPurchaseRate)} />
          <MetricRow label={t('recurring.referralRate')} value={formatPct(retention.referralRate)} />
          <MetricRow label={t('kpi.ltv')} value={formatRM(retention.ltv, lang)} />
          <MetricRow label={t('conversion.lostValue')} value={formatRM(retention.lostRetentionValue, lang)} />
          <MetricRow
            label={`${t('recurring.referralRate')} · ${t('traffic.sales')}`}
            value={formatRM(retention.referralSalesForecast, lang)}
          />
        </div>
      </Card>
    </div>
  )
}
