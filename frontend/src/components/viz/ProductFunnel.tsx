// ─────────────────────────────────────────────────────────────────────────────
// ProductFunnel — the layered product-funnel visualization (一层一层流下来):
//   引流品 → 爆品 → 核心品 → 利润品 → 大鲸鱼 → 复购品
// Each layer: a centered trapezoid sized by monthly volume, with the rung name
// (bilingual, always both languages), the products on that rung, and the rung's
// monthly volume / sales / GP. Missing rungs render as dashed "missing" layers —
// the visual gap IS the diagnosis.
// ─────────────────────────────────────────────────────────────────────────────

import { useEngine } from '@/store/selectors'
import { useT, useLang } from '@/i18n/useT'
import { domainStrings } from '@/i18n/strings'
import { EmptyState } from '@/components/ui'
import { formatNumber, formatRM, formatPct } from '@/lib/format'
import type { ProductMetric, ProductTag } from '@/engine/types'

const RUNG_COLOR: Record<ProductTag, string> = {
  引流品: '#3b82f6', // blue — pulls traffic in
  爆品: '#ef4444', // red — hero volume
  核心品: '#8b5cf6', // violet — core revenue
  利润品: '#f59e0b', // amber — profit
  现金流品: '#14b8a6', // teal — cashflow
  大鲸鱼: '#0ea5e9', // sky — whale ticket
  复购品: '#10b981', // emerald — repeat lock-in
}

interface Rung {
  tag: ProductTag
  products: ProductMetric[]
  volume: number
  sales: number
  gp: number
  present: boolean
}

export function ProductFunnel() {
  const { t } = useT()
  const lang = useLang()
  const { products } = useEngine()

  if (products.perProduct.length === 0) {
    return <EmptyState message={t('empty.fillData')} />
  }

  const rungs: Rung[] = products.recommendedLadder.map((tag) => {
    const ps = products.perProduct.filter((p) => p.tag === tag)
    return {
      tag,
      products: ps,
      volume: ps.reduce((s, p) => s + p.monthlyVolume, 0),
      sales: ps.reduce((s, p) => s + p.monthlySales, 0),
      gp: ps.reduce((s, p) => s + p.monthlyGP, 0),
      present: ps.length > 0,
    }
  })

  const maxVolume = Math.max(1, ...rungs.map((r) => r.volume))
  const totalGp = Math.max(1, rungs.reduce((s, r) => s + r.gp, 0))

  // Width % of the funnel area: volume-proportional with a floor so whales stay visible.
  const widthPct = (r: Rung): number => (r.present ? 22 + 78 * (r.volume / maxVolume) : 34)

  return (
    <div className="space-y-1.5">
      {rungs.map((r, i) => {
        const w = widthPct(r)
        const tagStr = domainStrings.tag[r.tag]
        const primary = lang === 'zh' ? tagStr.zh : tagStr.en
        const secondary = lang === 'zh' ? tagStr.en : tagStr.zh
        const names = r.products.map((p) => p.name)
        const shownNames = names.slice(0, 2).join('、') + (names.length > 2 ? ` +${names.length - 2}` : '')

        return (
          <div key={r.tag} className="grid grid-cols-[150px_1fr_128px] items-center gap-3 sm:grid-cols-[180px_1fr_150px]">
            {/* Left: rung name (always bilingual) + products on this rung */}
            <div className="text-right">
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-sm font-bold" style={{ color: r.present ? RUNG_COLOR[r.tag] : '#94a3b8' }}>
                  {primary}
                </span>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: r.present ? RUNG_COLOR[r.tag] : '#cbd5e1' }} />
              </div>
              <div className="text-[10px] text-slate-400">{secondary}</div>
              {r.present && <div className="mt-0.5 truncate text-[11px] text-slate-500" title={names.join('、')}>{shownNames}</div>}
            </div>

            {/* Middle: the funnel layer (trapezoid via clip-path), width ∝ volume */}
            <div className="relative flex h-14 items-center justify-center">
              {r.present ? (
                <div
                  className="flex h-full items-center justify-center text-white shadow-sm"
                  style={{
                    width: `${w}%`,
                    backgroundColor: RUNG_COLOR[r.tag],
                    clipPath: 'polygon(0% 0%, 100% 0%, 91% 100%, 9% 100%)',
                  }}
                >
                  <span className="px-2 text-center text-xs font-semibold leading-tight drop-shadow">
                    {formatNumber(r.volume, lang)} {lang === 'zh' ? '件/月' : 'units/mo'}
                  </span>
                </div>
              ) : (
                <div
                  className="flex h-full items-center justify-center rounded-md border-2 border-dashed border-slate-300 bg-slate-50/60"
                  style={{ width: `${w}%` }}
                >
                  <span className="px-2 text-center text-[11px] font-medium leading-tight text-slate-400">
                    ✗ {t('productgp.missing')}
                  </span>
                </div>
              )}
              {/* Connector arrow between layers */}
              {i < rungs.length - 1 && (
                <span className="pointer-events-none absolute -bottom-2.5 left-1/2 z-10 -translate-x-1/2 text-[10px] text-slate-300">▼</span>
              )}
            </div>

            {/* Right: money on this rung */}
            <div className="text-left text-[11px] leading-snug">
              {r.present ? (
                <>
                  <div className="font-semibold tabular-nums text-slate-700">{formatRM(r.sales, lang)}</div>
                  <div className="tabular-nums text-emerald-600">
                    GP {formatRM(r.gp, lang)} <span className="text-slate-400">({formatPct(r.gp / totalGp)})</span>
                  </div>
                </>
              ) : (
                <div className="text-slate-300">—</div>
              )}
            </div>
          </div>
        )
      })}

      <p className="pt-2 text-center text-[11px] text-slate-400">
        {lang === 'zh'
          ? '层宽 = 月销量 · 引流品把客户带进来，一层层往下买到复购品 — 缺哪一层，钱就从哪里漏。'
          : 'Layer width = monthly volume · customers enter at the lead magnet and buy down to repeat — a missing layer is where money leaks.'}
      </p>
    </div>
  )
}
