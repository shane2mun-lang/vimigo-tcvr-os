// ─────────────────────────────────────────────────────────────────────────────
// FunnelStageBar — the funnel main path rendered as stacked SVG trapezoids whose
// width is proportional to the count at each stage. Each band is labeled with the
// localized stage, its count, and the step rate into it. The biggest drop stage is
// highlighted in red. Self-contained: reads funnel analysis from the engine.
// ─────────────────────────────────────────────────────────────────────────────

import { useEngine } from '@/store/selectors'
import { useT } from '@/i18n/useT'
import { EmptyState } from '@/components/ui'
import { formatNumber, formatPct } from '@/lib/format'
import { FUNNEL_MAIN_PATH } from '@/engine/types'
import type { FunnelStageKey } from '@/engine/types'

const WIDTH = 640
const ROW_H = 46
const ROW_GAP = 6

interface Row {
  key: FunnelStageKey
  count: number
  /** rate INTO this stage from the previous one (undefined for the first stage) */
  rateIn?: number
  isWorst: boolean
}

export function FunnelStageBar() {
  const { t, d, lang } = useT()
  const { funnel } = useEngine()

  // Build per-stage counts from the step rates (fromCount/toCount carry the path).
  const counts = new Map<FunnelStageKey, number>()
  for (const sr of funnel.stepRates) {
    counts.set(sr.from, sr.fromCount)
    counts.set(sr.to, sr.toCount)
  }
  const rateInto = new Map<FunnelStageKey, number>()
  for (const sr of funnel.stepRates) rateInto.set(sr.to, sr.rate)

  const worst = funnel.biggestDropStage
  const rows: Row[] = FUNNEL_MAIN_PATH.filter((k) => counts.has(k)).map((key) => ({
    key,
    count: counts.get(key) ?? 0,
    rateIn: rateInto.get(key),
    isWorst: worst ? worst.to === key : false,
  }))

  const maxCount = rows.reduce((m, r) => Math.max(m, r.count), 0)
  if (rows.length === 0 || maxCount <= 0) {
    return <EmptyState message={t('empty.fillData')} />
  }

  const height = rows.length * ROW_H + (rows.length - 1) * ROW_GAP
  const minRatio = 0.18 // keep narrow bands readable

  const widthFor = (count: number) => {
    const ratio = Math.max(count / maxCount, count > 0 ? minRatio : 0.06)
    return ratio * WIDTH
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${WIDTH} ${height}`} className="h-auto w-full min-w-[420px]" role="img" aria-label="Funnel">
        {rows.map((row, i) => {
          const y = i * (ROW_H + ROW_GAP)
          const wTop = widthFor(row.count)
          const next = rows[i + 1]
          const wBot = next ? widthFor(next.count) : wTop * 0.82
          const xTop = (WIDTH - wTop) / 2
          const xBot = (WIDTH - wBot) / 2
          const fill = row.isWorst ? '#fee2e2' : '#eef2ff'
          const stroke = row.isWorst ? '#dc2626' : '#c7d2fe'
          const textColor = row.isWorst ? '#b91c1c' : '#334155'
          // trapezoid: top edge wTop, bottom edge wBot
          const d2 = [
            `M ${xTop} ${y}`,
            `L ${xTop + wTop} ${y}`,
            `L ${xBot + wBot} ${y + ROW_H}`,
            `L ${xBot} ${y + ROW_H}`,
            'Z',
          ].join(' ')
          return (
            <g key={row.key}>
              <path d={d2} fill={fill} stroke={stroke} strokeWidth={1.5}>
                <title>{`${d('stage', row.key)} · ${formatNumber(row.count, lang)}`}</title>
              </path>
              <text x={WIDTH / 2} y={y + ROW_H / 2 - 3} textAnchor="middle" className="text-[12px] font-semibold" fill={textColor}>
                {d('stage', row.key)}
              </text>
              <text x={WIDTH / 2} y={y + ROW_H / 2 + 13} textAnchor="middle" className="text-[11px] tabular-nums" fill={textColor}>
                {formatNumber(row.count, lang)}
                {row.rateIn != null ? `  ·  ${formatPct(row.rateIn)}` : ''}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
