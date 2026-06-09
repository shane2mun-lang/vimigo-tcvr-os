import type { ReactNode } from 'react'
import { cn, healthStyle } from './ui'
import { useT } from '@/i18n/useT'
import type { Health, InsightSeverity } from '@/engine/types'

// ── KPI card ──────────────────────────────────────────────────────────────────
export function KPICard({
  label,
  value,
  sub,
  tone = 'default',
  accentColor,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
  tone?: 'default' | 'good' | 'bad' | 'accent'
  accentColor?: string
}) {
  const tones: Record<string, string> = {
    default: 'text-slate-900',
    good: 'text-emerald-600',
    bad: 'text-red-600',
    accent: 'text-brand-accent',
  }
  return (
    <div className="card p-4">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div
        key={typeof value === 'string' || typeof value === 'number' ? String(value) : undefined}
        className={cn('mt-1 animate-countup text-2xl font-semibold tabular-nums', tones[tone])}
        style={accentColor ? { color: accentColor } : undefined}
      >
        {value}
      </div>
      {sub != null && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
    </div>
  )
}

// ── Health badge ────────────────────────────────────────────────────────────────
export function HealthBadge({ health, score }: { health: Health; score?: number }) {
  const { t } = useT()
  const s = healthStyle(health)
  const label = health === 'green' ? t('health.green') : health === 'yellow' ? t('health.yellow') : t('health.red')
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1', s.bg, s.text)}>
      <span className={cn('h-2 w-2 rounded-full', s.dot)} />
      {label}
      {score != null && <span className="opacity-60">· {Math.round(score)}</span>}
    </span>
  )
}

// ── Pillar health tile (big, for X-Ray) ────────────────────────────────────────
export function PillarHealthTile({
  pillar,
  health,
  score,
  detail,
  accent,
}: {
  pillar: string
  health: Health
  score: number
  detail?: string
  accent: string
}) {
  const s = healthStyle(health)
  return (
    <div className={cn('rounded-2xl p-4 ring-1', s.bg)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold" style={{ color: accent }}>
          {pillar}
        </span>
        <HealthBadge health={health} />
      </div>
      <div className={cn('mt-2 text-3xl font-bold tabular-nums', s.text)}>{Math.round(score)}</div>
      {detail && <div className="mt-1 text-xs text-slate-500 leading-snug">{detail}</div>}
    </div>
  )
}

// ── Insight card ────────────────────────────────────────────────────────────────
const SEV_STYLE: Record<InsightSeverity, string> = {
  critical: 'border-l-red-500 bg-red-50/40',
  warning: 'border-l-amber-500 bg-amber-50/40',
  info: 'border-l-brand-accent bg-indigo-50/40',
}

export function InsightCard({
  title,
  detail,
  severity = 'info',
  money,
  badge,
}: {
  title: string
  detail: string
  severity?: InsightSeverity
  money?: ReactNode
  badge?: ReactNode
}) {
  return (
    <div className={cn('rounded-xl border-l-4 px-4 py-3 ring-1 ring-slate-100', SEV_STYLE[severity])}>
      <div className="flex items-start justify-between gap-3">
        <div className="font-medium text-slate-800">{title}</div>
        {money != null && <div className="shrink-0 text-sm font-semibold text-slate-700 tabular-nums">{money}</div>}
      </div>
      <p className="mt-1 text-sm text-slate-600 leading-relaxed">{detail}</p>
      {badge && <div className="mt-2">{badge}</div>}
    </div>
  )
}

// ── Small metric row (label · value) ───────────────────────────────────────────
export function MetricRow({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 py-2 last:border-0">
      <span className="text-sm text-slate-500">
        {label}
        {hint && <span className="ml-1 text-xs text-slate-300">{hint}</span>}
      </span>
      <span className="text-sm font-semibold tabular-nums text-slate-800">{value}</span>
    </div>
  )
}
