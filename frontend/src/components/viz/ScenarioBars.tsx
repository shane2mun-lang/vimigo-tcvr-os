// ─────────────────────────────────────────────────────────────────────────────
// ScenarioBars — Recharts bar chart comparing scenarios A–E by gross profit, with
// a ReferenceLine at the current (scenario A) GP. Bars are grey for the baseline
// and green/red elsewhere by the sign of ΔGP. Tooltip surfaces the ΔGP. Each bar is
// labeled with the localized scenario name. Self-contained (engine + i18n).
// ─────────────────────────────────────────────────────────────────────────────

import {
  Bar,
  BarChart,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useEngine } from '@/store/selectors'
import { useT } from '@/i18n/useT'
import type { StringKey } from '@/i18n/strings'
import { EmptyState } from '@/components/ui'
import { formatDeltaRM, formatRM, formatRMShort } from '@/lib/format'

const SCENARIO_IDS = ['A', 'B', 'C', 'D', 'E'] as const

interface Datum {
  id: string
  name: string
  gp: number
  deltaGp: number
  fill: string
}

export function ScenarioBars() {
  const { t, lang } = useT()
  const { scenarios } = useEngine()

  const byId = new Map(scenarios.scenarios.map((s) => [s.id, s]))
  const baseGp = byId.get('A')?.gp ?? scenarios.base.gp

  const data: Datum[] = SCENARIO_IDS.map((id) => byId.get(id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s))
    .map((s) => ({
      id: s.id,
      name: t(`scenario.${s.id}` as StringKey),
      gp: Math.round(s.gp),
      deltaGp: Math.round(s.deltaGp),
      fill: s.id === 'A' ? '#94a3b8' : s.deltaGp >= 0 ? '#10b981' : '#ef4444',
    }))

  if (data.length === 0) {
    return <EmptyState message={t('empty.fillData')} />
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 16, right: 12, left: 4, bottom: 4 }}>
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} interval={0} />
        <YAxis
          tickFormatter={(v: number) => formatRMShort(v, lang)}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          width={56}
        />
        <Tooltip
          cursor={{ fill: 'rgba(99,102,241,0.06)' }}
          formatter={(value: number, _name, item) => {
            const d = item?.payload as Datum | undefined
            return [formatRM(value, lang), d ? `GP · Δ ${formatDeltaRM(d.deltaGp, lang)}` : 'GP']
          }}
          contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }}
        />
        <ReferenceLine
          y={Math.round(baseGp)}
          stroke="#6366f1"
          strokeDasharray="4 4"
          ifOverflow="extendDomain"
          label={{ value: t('common.current'), position: 'right', fontSize: 10, fill: '#6366f1' }}
        />
        <Bar dataKey="gp" radius={[6, 6, 0, 0]} maxBarSize={64} isAnimationActive>
          {data.map((d) => (
            <Cell key={d.id} fill={d.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
