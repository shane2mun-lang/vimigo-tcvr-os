// ─────────────────────────────────────────────────────────────────────────────
// FunnelRing — the signature TCVR visual. A hand-rolled concentric/quadrant SVG
// (~360×360) with one arc per pillar (Traffic × Conversion × Value × Recurring).
// Each arc is filled with its pillar color and stroked with its health-band color,
// carrying a short label + key number. The center shows the target revenue.
// Pure presentational: fed entirely by props so any dashboard can reuse it.
// ─────────────────────────────────────────────────────────────────────────────

import type { Health } from '@/engine/types'
import { healthStyle } from '@/components/ui'

export interface FunnelRingSegment {
  pillar: string
  color: string
  health: Health
  label: string
  value: string
}

const SIZE = 360
const CENTER = SIZE / 2
const HEALTH_STROKE: Record<Health, string> = {
  green: '#16a34a',
  yellow: '#eab308',
  red: '#dc2626',
}

/** Polar (deg, clockwise from 12 o'clock) → cartesian on the SVG canvas. */
function polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

/** A thick arc "band" between innerR and outerR spanning [startDeg, endDeg]. */
function ringBand(innerR: number, outerR: number, startDeg: number, endDeg: number): string {
  const o0 = polar(CENTER, CENTER, outerR, startDeg)
  const o1 = polar(CENTER, CENTER, outerR, endDeg)
  const i1 = polar(CENTER, CENTER, innerR, endDeg)
  const i0 = polar(CENTER, CENTER, innerR, startDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return [
    `M ${o0.x} ${o0.y}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${o1.x} ${o1.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${i0.x} ${i0.y}`,
    'Z',
  ].join(' ')
}

export function FunnelRing({
  centerLabel,
  centerValue,
  segments,
}: {
  centerLabel: string
  centerValue: string
  segments: FunnelRingSegment[]
}) {
  const count = Math.max(segments.length, 1)
  const gap = 6 // deg of breathing room between quadrants
  const sweep = 360 / count
  const outerR = 168
  const innerR = 96
  const labelR = (outerR + innerR) / 2

  return (
    <div className="flex items-center justify-center">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-auto w-full max-w-[360px]"
        role="img"
        aria-label={`${centerLabel}: ${centerValue}`}
      >
        <defs>
          <filter id="ring-soft" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#0f172a" floodOpacity="0.10" />
          </filter>
        </defs>

        {/* faint full track */}
        <circle cx={CENTER} cy={CENTER} r={(outerR + innerR) / 2} fill="none" stroke="#f1f5f9" strokeWidth={outerR - innerR} />

        {segments.map((seg, i) => {
          const start = i * sweep + gap / 2
          const end = (i + 1) * sweep - gap / 2
          const mid = (start + end) / 2
          const labelPos = polar(CENTER, CENTER, labelR, mid)
          const stroke = HEALTH_STROKE[seg.health]
          return (
            <g key={seg.pillar} filter="url(#ring-soft)">
              <path d={ringBand(innerR, outerR, start, end)} fill={seg.color} fillOpacity={0.92} stroke={stroke} strokeWidth={3}>
                <title>{`${seg.pillar} · ${seg.label}: ${seg.value}`}</title>
              </path>
              <text
                x={labelPos.x}
                y={labelPos.y - 8}
                textAnchor="middle"
                className="fill-white text-[11px] font-medium"
                style={{ paintOrder: 'stroke' }}
              >
                {seg.pillar}
              </text>
              <text x={labelPos.x} y={labelPos.y + 11} textAnchor="middle" className="fill-white text-[15px] font-bold tabular-nums">
                {seg.value}
              </text>
            </g>
          )
        })}

        {/* center hub */}
        <circle cx={CENTER} cy={CENTER} r={innerR - 6} fill="white" stroke="#e2e8f0" strokeWidth={1.5} filter="url(#ring-soft)" />
        <text x={CENTER} y={CENTER - 16} textAnchor="middle" className="fill-slate-400 text-[11px] font-medium">
          {centerLabel}
        </text>
        <text x={CENTER} y={CENTER + 12} textAnchor="middle" className="fill-slate-900 text-[26px] font-bold tabular-nums">
          {centerValue}
        </text>
        <text x={CENTER} y={CENTER + 34} textAnchor="middle" className="text-[10px] font-semibold uppercase tracking-wider" fill="#6366f1">
          TCVR
        </text>
      </svg>
    </div>
  )
}

/** Re-exported helper so consumers can resolve a band → swatch if desired. */
export function bandSwatch(health: Health): string {
  return healthStyle(health).dot
}
