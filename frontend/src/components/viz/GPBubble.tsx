// ─────────────────────────────────────────────────────────────────────────────
// GPBubble — Recharts scatter/bubble chart of the product portfolio.
//   x = GP margin (%),  y = monthly sales (RM),  z (bubble area) = monthly GP.
// One point per product; the tooltip surfaces name + localized tag + GP. Helps spot
// the high-margin / high-volume sweet spot and the price-compared low-margin tail.
// Self-contained (engine + i18n).
// ─────────────────────────────────────────────────────────────────────────────

import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import type { TooltipProps } from 'recharts'
import type { Lang } from '@/i18n/strings'
import { useEngine } from '@/store/selectors'
import { useT } from '@/i18n/useT'
import { EmptyState } from '@/components/ui'
import { formatPctRaw, formatRM, formatRMShort } from '@/lib/format'

interface Point {
  x: number // gp margin %
  y: number // monthly sales
  z: number // monthly GP
  name: string
  tag: string
}

/** Custom tooltip so a single hover surfaces name + tag + GP + sales + margin. */
function bubbleTooltip(t: ReturnType<typeof useT>['t'], lang: Lang) {
  return function Tip({ active, payload }: TooltipProps<number, string>) {
    const raw = active && payload && payload.length ? payload[0]?.payload : undefined
    const p = raw as Point | undefined
    if (!p) return null
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
        <div className="font-semibold text-slate-800">
          {p.name} <span className="font-normal text-slate-400">· {p.tag}</span>
        </div>
        <div className="mt-1 space-y-0.5 tabular-nums text-slate-600">
          <div>
            {t('traffic.gp')}: <span className="font-medium text-slate-800">{formatRM(p.z, lang)}</span>
          </div>
          <div>
            {t('traffic.sales')}: {formatRM(p.y, lang)}
          </div>
          <div>
            {t('value.margin')}: {formatPctRaw(p.x, 1)}
          </div>
        </div>
      </div>
    )
  }
}

export function GPBubble() {
  const { t, d, lang } = useT()
  const { products } = useEngine()

  const points: Point[] = products.perProduct
    .filter((p) => p.price > 0)
    .map((p) => ({
      x: Math.round(p.gpMargin * 100 * 10) / 10,
      y: Math.round(p.monthlySales),
      z: Math.max(Math.round(p.monthlyGP), 1),
      name: p.name,
      tag: p.tag ? d('tag', p.tag) : '—',
    }))

  if (points.length === 0) {
    return <EmptyState message={t('empty.fillData')} />
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ScatterChart margin={{ top: 16, right: 20, left: 8, bottom: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
        <XAxis
          type="number"
          dataKey="x"
          name={t('value.margin')}
          unit="%"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          label={{ value: t('value.margin'), position: 'insideBottom', offset: -12, fontSize: 11, fill: '#64748b' }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name={t('traffic.sales')}
          tickFormatter={(v: number) => formatRMShort(v, lang)}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <ZAxis type="number" dataKey="z" range={[80, 900]} name={t('traffic.gp')} />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} content={bubbleTooltip(t, lang)} />
        <Scatter data={points} fill="#6366f1" fillOpacity={0.65} stroke="#4f46e5" strokeWidth={1} isAnimationActive />
      </ScatterChart>
    </ResponsiveContainer>
  )
}
