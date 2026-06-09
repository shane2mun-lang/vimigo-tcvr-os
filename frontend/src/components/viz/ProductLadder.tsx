// ─────────────────────────────────────────────────────────────────────────────
// ProductLadder — a stepped ladder of the recommended product rungs
// (引流品 → 爆品 → 核心品 → 利润品 → 大鲸鱼 → 复购品). Each rung shows the localized
// tag and either the matching product names (present) or a greyed MISSING marker.
// Self-contained: pulls recommendedLadder + perProduct straight from the engine.
// ─────────────────────────────────────────────────────────────────────────────

import { useEngine } from '@/store/selectors'
import { useT } from '@/i18n/useT'
import type { ProductTag } from '@/engine/types'
import { cn } from '@/components/ui'
import { EmptyState } from '@/components/ui'

interface Rung {
  tag: ProductTag
  present: boolean
  products: string[]
}

export function ProductLadder() {
  const { t, d } = useT()
  const { products } = useEngine()

  const ladder: ProductTag[] = products.recommendedLadder.length
    ? products.recommendedLadder
    : ['引流品', '爆品', '核心品', '利润品', '大鲸鱼', '复购品']

  const rungs: Rung[] = ladder.map((tag) => {
    const matching = products.perProduct.filter((p) => p.tag === tag).map((p) => p.name)
    return { tag, present: matching.length > 0, products: matching }
  })

  if (products.perProduct.length === 0) {
    return <EmptyState message={t('empty.fillData')} />
  }

  const total = rungs.length

  return (
    <div className="flex flex-col gap-2">
      {rungs.map((rung, i) => {
        // Stepped indent: each higher rung is offset a little to give a staircase feel.
        const indent = (i / Math.max(total - 1, 1)) * 28
        return (
          <div
            key={rung.tag}
            className="flex items-stretch gap-3"
            style={{ marginLeft: `${indent}px` }}
          >
            <div className="flex w-6 shrink-0 items-center justify-center text-xs font-semibold tabular-nums text-slate-400">
              {i + 1}
            </div>
            <div
              className={cn(
                'flex flex-1 items-center justify-between gap-3 rounded-xl px-4 py-3 ring-1 transition',
                rung.present
                  ? 'bg-white ring-slate-200 shadow-sm'
                  : 'border border-dashed border-slate-300 bg-slate-50/60 ring-transparent',
              )}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    'inline-flex h-7 min-w-[3.5rem] items-center justify-center rounded-lg px-2 text-xs font-semibold',
                    rung.present ? 'bg-indigo-50 text-brand-accent' : 'bg-slate-200 text-slate-400',
                  )}
                >
                  {d('tag', rung.tag)}
                </span>
                {rung.present ? (
                  <span className="text-sm text-slate-700">{rung.products.join('、')}</span>
                ) : (
                  <span className="text-sm font-medium text-slate-400">
                    {t('productgp.missing')} · {d('tag', rung.tag)}
                  </span>
                )}
              </div>
              <span
                className={cn(
                  'h-2.5 w-2.5 shrink-0 rounded-full',
                  rung.present ? 'bg-emerald-500' : 'bg-slate-300',
                )}
                aria-hidden
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
