import { useStore } from '@/store/useStore'
import { useInput, useEngine } from '@/store/selectors'
import { useT } from '@/i18n/useT'
import { Card, SectionHeader } from '@/components/ui'
import { KPICard, MetricRow } from '@/components/cards'
import { NumberCell, TextCell, ToggleCell } from '@/components/fields'
import { TableShell, Th, Td } from '@/components/table'
import { formatRM, formatPct } from '@/lib/format'

const DASH = '—'

export function ConversionModule() {
  const { t, d, lang } = useT()
  const input = useInput()
  const updateStage = useStore((s) => s.updateStage)
  const { funnel } = useEngine()

  const drop = funnel.biggestDropStage

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <SectionHeader title={t('conversion.heading')} subtitle={t('conversion.lead')} />

        <TableShell
          head={
            <tr>
              <Th>{t('conversion.stage')}</Th>
              <Th className="text-right">{t('conversion.count')}</Th>
              <Th className="text-right">{t('conversion.waitTime')}</Th>
              <Th>{t('common.owner')}</Th>
              <Th>{t('conversion.lostReason')}</Th>
              <Th>{t('conversion.nextAction')}</Th>
              <Th className="text-center">{t('conversion.hasSop')}</Th>
            </tr>
          }
        >
          {input.funnel.map((stage) => (
            <tr key={stage.key} className="hover:bg-slate-50/60">
              <Td className="whitespace-nowrap font-medium text-slate-700">{d('stage', stage.key)}</Td>
              <Td>
                <NumberCell value={stage.count} onChange={(v) => updateStage(stage.key, { count: v })} />
              </Td>
              <Td>
                <NumberCell value={stage.avgWaitTime} onChange={(v) => updateStage(stage.key, { avgWaitTime: v })} />
              </Td>
              <Td className="min-w-[120px]">
                <TextCell value={stage.owner} onChange={(v) => updateStage(stage.key, { owner: v })} />
              </Td>
              <Td className="min-w-[160px]">
                <TextCell value={stage.lostReason} onChange={(v) => updateStage(stage.key, { lostReason: v })} />
              </Td>
              <Td className="min-w-[160px]">
                <TextCell value={stage.nextAction} onChange={(v) => updateStage(stage.key, { nextAction: v })} />
              </Td>
              <Td className="text-center">
                <ToggleCell checked={Boolean(stage.hasSOP)} onChange={(v) => updateStage(stage.key, { hasSOP: v })} />
              </Td>
            </tr>
          ))}
        </TableShell>
      </Card>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KPICard label={t('conversion.overall')} value={formatPct(funnel.overallConversion)} accentColor="#8b5cf6" />
        <KPICard
          label={t('conversion.biggestDrop')}
          value={drop ? `${d('stage', drop.from)} → ${d('stage', drop.to)}` : DASH}
          sub={drop ? formatPct(drop.rate) : undefined}
          tone="bad"
        />
        <KPICard label={t('conversion.lostValue')} value={formatRM(funnel.lostSalesValue, lang)} tone="bad" />
        <KPICard label={t('conversion.followupLeak')} value={formatRM(funnel.followUpLeakageValue, lang)} tone="bad" />
      </div>

      <Card className="p-5 sm:p-6">
        <SectionHeader title={t('conversion.stage')} />
        <div>
          {funnel.stepRates.map((step) => (
            <MetricRow
              key={`${step.from}-${step.to}`}
              label={`${d('stage', step.from)} → ${d('stage', step.to)}`}
              value={formatPct(step.rate)}
              hint={step.bridged ? '~' : undefined}
            />
          ))}
        </div>
      </Card>
    </div>
  )
}
