import { useEngine } from '@/store/selectors'
import { useT } from '@/i18n/useT'
import { Card, SectionHeader, Tag, EmptyState } from '@/components/ui'
import { InsightCard } from '@/components/cards'
import { TableShell, Th, Td } from '@/components/table'
import { formatRM } from '@/lib/format'

export function RewardModule() {
  const { t, d, lang } = useT()
  const { insights } = useEngine()
  const { rewardSuggestions, vimiGoalDrafts } = insights

  const empty = rewardSuggestions.length === 0 && vimiGoalDrafts.length === 0

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <SectionHeader title={t('reward.heading')} subtitle={t('reward.lead')} />

        {empty ? (
          <EmptyState message={t('empty.fillData')} />
        ) : (
          <TableShell
            head={
              <tr>
                <Th>{t('nav.reward')}</Th>
                <Th>{t('reward.metric')}</Th>
                <Th>{t('reward.role')}</Th>
                <Th>{t('reward.type')}</Th>
                <Th>{t('reward.kpi')}</Th>
              </tr>
            }
          >
            {rewardSuggestions.map((r, i) => (
              <tr key={`${r.pillar}-${r.metricCode}-${i}`} className="hover:bg-slate-50/60">
                <Td className="whitespace-nowrap font-medium text-slate-700">{d('pillar', r.pillar)}</Td>
                <Td className="text-slate-600">{r.suggestedKpi}</Td>
                <Td className="whitespace-nowrap text-slate-600">{d('role', r.role)}</Td>
                <Td>
                  <Tag color="violet">{d('reward', r.rewardType)}</Tag>
                </Td>
                <Td className="text-slate-500">{r.rationale}</Td>
              </tr>
            ))}
          </TableShell>
        )}
      </Card>

      {vimiGoalDrafts.length > 0 && (
        <Card className="p-5 sm:p-6">
          <SectionHeader title={t('actionplan.vimigoal')} />
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {vimiGoalDrafts.map((g, i) => (
              <InsightCard
                key={`${g.goal}-${i}`}
                title={g.goal}
                detail={g.measure}
                money={formatRM(g.expectedGpImpact, lang)}
                badge={
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Tag color="slate">{d('role', g.accountability)}</Tag>
                    <Tag color="violet">{d('reward', g.reward.type)}</Tag>
                    <span className="text-xs text-slate-400">{g.reward.basis}</span>
                    <Tag color="blue">{d('pillar', g.linkedPillar)}</Tag>
                  </div>
                }
              />
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
