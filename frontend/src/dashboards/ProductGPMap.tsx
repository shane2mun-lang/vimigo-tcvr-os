// ─────────────────────────────────────────────────────────────────────────────
// ProductGPMap — the product-structure dashboard. Top: the <ProductLadder/> showing
// which rungs of the lead-magnet→repeat ladder exist. Then the <GPBubble/> portfolio
// scatter. Then a per-product table (GP, GP%, mix%, reward flag) and the ladder-gap
// insights. High-GP / low-volume products are flagged as Sales-Challenge candidates.
// ─────────────────────────────────────────────────────────────────────────────

import { useEngine } from '@/store/selectors'
import { useT } from '@/i18n/useT'
import { Card, SectionHeader, Tag, EmptyState } from '@/components/ui'
import { InsightCard } from '@/components/cards'
import { ProductLadder } from '@/components/viz/ProductLadder'
import { GPBubble } from '@/components/viz/GPBubble'
import type { ProductTag } from '@/engine/types'
import { formatNumber, formatPct, formatRM } from '@/lib/format'

const TAG_COLOR: Record<ProductTag, 'blue' | 'red' | 'violet' | 'amber' | 'emerald' | 'green' | 'slate'> = {
  引流品: 'blue',
  爆品: 'red',
  核心品: 'violet',
  利润品: 'amber',
  现金流品: 'emerald',
  大鲸鱼: 'green',
  复购品: 'emerald',
}

export function ProductGPMap() {
  const { t, d, lang } = useT()
  const { products, insights } = useEngine()

  const rows = products.perProduct
  const gapMessages = insights.ladderGapMessages

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <SectionHeader title={t('productgp.heading')} subtitle={t('value.lead')} />
        <div className="mb-2 text-sm font-semibold text-slate-700">{t('productgp.ladder')}</div>
        <ProductLadder />
      </Card>

      <Card className="p-5 sm:p-6">
        <SectionHeader title={t('value.heading')} />
        <GPBubble />
      </Card>

      <Card className="p-5 sm:p-6">
        <SectionHeader title={t('nav.value')} />
        {rows.length === 0 ? (
          <EmptyState message={t('empty.fillData')} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500">
                  <th className="py-2 pr-3">{t('value.product')}</th>
                  <th className="py-2 pr-3">{t('value.type')}</th>
                  <th className="py-2 pr-3 text-right">{t('kpi.gp')}</th>
                  <th className="py-2 pr-3 text-right">{t('value.margin')}</th>
                  <th className="py-2 pr-3 text-right">Mix %</th>
                  <th className="py-2 pl-3 text-right">{t('nav.reward')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    <td className="py-2 pr-3 font-medium text-slate-800">{p.name}</td>
                    <td className="py-2 pr-3">
                      {p.tag ? <Tag color={TAG_COLOR[p.tag]}>{d('tag', p.tag)}</Tag> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums text-slate-700">{formatRM(p.monthlyGP, lang)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-slate-600">{formatPct(p.gpMargin)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums text-slate-600">{formatPct(p.mixContributionPct)}</td>
                    <td className="py-2 pl-3 text-right">
                      {p.rewardPriority ? (
                        <Tag color="amber">★ Challenge</Tag>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-xs text-slate-400">
              ★ Challenge — {formatNumber(rows.filter((p) => p.rewardPriority).length, lang)} ·{' '}
              {lang === 'zh' ? '高 GP、低销量产品适合做 Sales Challenge' : 'High-GP, low-volume products suit a Sales Challenge'}
            </p>
          </div>
        )}
      </Card>

      {gapMessages.length > 0 && (
        <Card className="p-5 sm:p-6">
          <SectionHeader title={t('productgp.missing')} />
          <div className="space-y-3">
            {gapMessages.map((gap) => (
              <InsightCard key={gap.code} title={gap.title} detail={gap.detail} severity={gap.severity} />
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
