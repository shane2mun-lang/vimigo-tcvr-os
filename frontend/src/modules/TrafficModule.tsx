import type { ChannelMetric } from '@/engine/types'
import type { ReactNode } from 'react'
import { useStore } from '@/store/useStore'
import { useEngine } from '@/store/selectors'
import { useT } from '@/i18n/useT'
import { Card, SectionHeader, Button, EmptyState, Tag } from '@/components/ui'
import { KPICard } from '@/components/cards'
import { NumberCell, TextCell, ToggleCell } from '@/components/fields'
import { TableShell, Th, Td, RemoveRowButton } from '@/components/table'
import { HelpTip } from '@/components/HelpTip'
import type { HelpKey } from '@/i18n/help'
import { formatRM, formatPct, formatNumber, formatMultiplier } from '@/lib/format'

const CHANNEL_PRESETS = [
  'Facebook Ads', 'TikTok Ads', 'Google Ads', 'Xiaohongshu', 'Website SEO',
  'Walk-in', 'Referral', 'Event', 'Roadshow', 'Cold Call', 'WhatsApp Broadcast',
  'Database Reactivation', 'Dealer/Partner', 'Designer/Agent', 'B2B Sales Visit',
  'Organic Content', 'Live Streaming',
]

const DASH = '—'

function Stat({
  label,
  value,
  accent,
  helpKey,
}: {
  label: string
  value: ReactNode
  accent?: string
  helpKey?: HelpKey
}) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <div className="flex items-center gap-1 text-[11px] text-slate-500">
        <span>{label}</span>
        {helpKey && <HelpTip k={helpKey} align="left" />}
      </div>
      <div className="mt-0.5 text-sm font-semibold tabular-nums" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
    </div>
  )
}

export function TrafficModule() {
  const { t, lang } = useT()
  const channels = useStore((s) => s.channels)
  const addChannel = useStore((s) => s.addChannel)
  const updateChannel = useStore((s) => s.updateChannel)
  const removeChannel = useStore((s) => s.removeChannel)
  const { channels: analysis } = useEngine()
  const byId = new Map<string, ChannelMetric>(analysis.perChannel.map((m) => [m.id, m]))

  const bestName = analysis.bestByRoi
  const worstName = analysis.worstByRoi
  const gapLeads = analysis.trafficGap.gapLeads ?? 0
  const { paid, organic } = analysis

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <SectionHeader
          title={t('traffic.heading')}
          subtitle={t('traffic.lead')}
          right={
            <Button size="sm" variant="outline" onClick={() => addChannel()}>
              ＋ {t('common.addRow')}
            </Button>
          }
        />

        <datalist id="channel-presets">
          {CHANNEL_PRESETS.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>

        {channels.length === 0 ? (
          <EmptyState message={t('empty.fillTraffic')} />
        ) : (
          <TableShell
            head={
              <tr>
                <Th>
                  <span className="inline-flex items-center gap-1">{t('traffic.channel')}<HelpTip k="channelType" side="bottom" align="left" /></span>
                </Th>
                <Th className="text-right">{t('traffic.impressions')}</Th>
                <Th className="text-right">{t('traffic.leads')}</Th>
                <Th className="text-right">{t('traffic.spend')}</Th>
                <Th className="text-right">
                  <span className="inline-flex items-center gap-1">{t('traffic.quality')}<HelpTip k="leadQuality" side="bottom" align="right" /></span>
                </Th>
                <Th className="text-center">
                  <span className="inline-flex items-center gap-1">{t('traffic.followup')}<HelpTip k="channelFollowup" side="bottom" align="right" /></span>
                </Th>
                <Th className="text-right">{t('traffic.closed')}</Th>
                <Th className="text-right">{t('traffic.sales')}</Th>
                <Th className="text-right">{t('traffic.gp')}</Th>
                <Th className="text-right">
                  <span className="inline-flex items-center gap-1">{t('traffic.cpl')}<HelpTip k="cpl" side="bottom" align="right" /></span>
                </Th>
                <Th className="text-right">
                  <span className="inline-flex items-center gap-1">{t('traffic.convRate')}<HelpTip k="channelConv" side="bottom" align="right" /></span>
                </Th>
                <Th className="text-right">
                  <span className="inline-flex items-center gap-1">{t('traffic.roi')}<HelpTip k="roi" side="bottom" align="right" /></span>
                </Th>
                <Th className="text-right">
                  <span className="inline-flex items-center gap-1">{t('traffic.contribution')}<HelpTip k="contribution" side="bottom" align="right" /></span>
                </Th>
                <Th />
              </tr>
            }
            footer={
              <tr>
                <Td className="font-medium text-slate-600">{t('common.total')}</Td>
                <Td className="text-right tabular-nums">{formatNumber(analysis.totals.impressions, lang)}</Td>
                <Td className="text-right tabular-nums">{formatNumber(analysis.totals.leads, lang)}</Td>
                <Td className="text-right tabular-nums">{formatRM(analysis.totals.spend, lang)}</Td>
                <Td />
                <Td />
                <Td className="text-right tabular-nums">{formatNumber(analysis.totals.closedDeals, lang)}</Td>
                <Td className="text-right tabular-nums">{formatRM(analysis.totals.sales, lang)}</Td>
                <Td className="text-right tabular-nums">{formatRM(analysis.totals.gp, lang)}</Td>
                <Td />
                <Td />
                <Td />
                <Td className="text-right tabular-nums">{formatPct(1)}</Td>
                <Td />
              </tr>
            }
          >
            {channels.map((c) => {
              const m = byId.get(c.id)
              return (
                <tr key={c.id} className="hover:bg-slate-50/60">
                  <Td className="min-w-[160px]">
                    <div className="flex items-center gap-1.5">
                      <TextCell
                        value={c.name}
                        list="channel-presets"
                        placeholder={t('traffic.channel')}
                        onChange={(v) => updateChannel(c.id, { name: v })}
                      />
                      {m && (
                        <span className="shrink-0 cursor-help" title={t('traffic.channelTypeHint')}>
                          <Tag color={m.isOrganic ? 'emerald' : 'blue'}>
                            {m.isOrganic ? t('traffic.organicLabel') : t('traffic.paidLabel')}
                          </Tag>
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td><NumberCell value={c.monthlyImpressions} onChange={(v) => updateChannel(c.id, { monthlyImpressions: v })} /></Td>
                  <Td><NumberCell value={c.monthlyLeads} onChange={(v) => updateChannel(c.id, { monthlyLeads: v })} /></Td>
                  <Td><NumberCell value={c.monthlySpend} onChange={(v) => updateChannel(c.id, { monthlySpend: v })} /></Td>
                  <Td><NumberCell value={c.leadQualityScore} onChange={(v) => updateChannel(c.id, { leadQualityScore: v })} /></Td>
                  <Td className="text-center">
                    <ToggleCell checked={Boolean(c.hasFollowUp)} onChange={(v) => updateChannel(c.id, { hasFollowUp: v })} />
                  </Td>
                  <Td><NumberCell value={c.closedDeals} onChange={(v) => updateChannel(c.id, { closedDeals: v })} /></Td>
                  <Td><NumberCell value={c.sales} onChange={(v) => updateChannel(c.id, { sales: v })} /></Td>
                  <Td><NumberCell value={c.gp} onChange={(v) => updateChannel(c.id, { gp: v })} /></Td>
                  <Td className="text-right tabular-nums text-slate-500">{m && m.cpl != null ? formatRM(m.cpl, lang) : DASH}</Td>
                  <Td className="text-right tabular-nums text-slate-500">{m ? formatPct(m.conversionRate) : DASH}</Td>
                  <Td className="text-right tabular-nums text-slate-500">{m && m.roi != null ? formatPct(m.roi) : DASH}</Td>
                  <Td className="text-right tabular-nums text-slate-500">{m ? formatPct(m.contributionPct) : DASH}</Td>
                  <Td className="text-center">
                    <RemoveRowButton onClick={() => removeChannel(c.id)} title={t('common.remove')} />
                  </Td>
                </tr>
              )
            })}
          </TableShell>
        )}
      </Card>

      {channels.length > 0 && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KPICard label={t('traffic.bestChannel')} value={bestName ?? DASH} tone="good" accentColor="#3b82f6" helpKey="bestChannel" />
            <KPICard label={t('traffic.worstChannel')} value={worstName ?? DASH} tone="bad" helpKey="worstChannel" />
            <KPICard label={t('traffic.blendedCac')} value={formatRM(analysis.blendedCAC, lang)} helpKey="blendedCac" />
            <KPICard label={t('traffic.gapToTarget')} value={formatNumber(gapLeads, lang)} sub={t('traffic.leads')} helpKey="trafficGap" />
          </div>

          {/* Paid Channel Efficiency — ad performance, undiluted by free traffic */}
          <Card className="p-5 sm:p-6 ring-2 ring-blue-100">
            <SectionHeader title={t('traffic.paidEfficiency')} subtitle={t('traffic.paidEfficiencyLead')} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label={t('traffic.paidCpl')} value={formatRM(paid.cpl, lang)} accent="#3b82f6" helpKey="paidCpl" />
              <Stat label={t('traffic.paidRoas')} value={formatMultiplier(paid.roas, 1)} accent="#3b82f6" helpKey="paidRoas" />
              <Stat label={t('traffic.paidGpRoas')} value={formatMultiplier(paid.gpRoas, 1)} accent="#3b82f6" helpKey="paidGpRoas" />
              <Stat label={t('traffic.paidCac')} value={formatRM(paid.cac, lang)} accent="#3b82f6" helpKey="paidCac" />
              <Stat label={t('traffic.leads')} value={formatNumber(paid.leads, lang)} />
              <Stat label={t('traffic.customers')} value={formatNumber(paid.customers, lang)} />
              <Stat label={t('traffic.sales')} value={formatRM(paid.sales, lang)} />
              <Stat label={t('traffic.contribution')} value={formatPct(paid.contributionPct)} helpKey="contribution" />
            </div>
          </Card>

          {/* Organic / Free channels — shown, excluded from paid efficiency */}
          <Card className="p-5 sm:p-6 ring-2 ring-emerald-100">
            <SectionHeader title={t('traffic.organicChannels')} subtitle={t('traffic.organicLead')} />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <Stat label={t('traffic.leads')} value={formatNumber(organic.leads, lang)} />
              <Stat label={t('traffic.customers')} value={formatNumber(organic.customers, lang)} />
              <Stat label={t('traffic.sales')} value={formatRM(organic.sales, lang)} accent="#10b981" />
              <Stat label={t('traffic.gp')} value={formatRM(organic.gp, lang)} accent="#10b981" />
              <Stat label={t('traffic.convRate')} value={formatPct(organic.conversionRate)} helpKey="channelConv" />
              <Stat label={t('traffic.contribution')} value={formatPct(organic.contributionPct)} accent="#10b981" helpKey="organicPanel" />
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
