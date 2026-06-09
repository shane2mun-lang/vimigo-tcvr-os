import { NavLink } from 'react-router-dom'
import { inputNav, dashNav } from './nav'
import type { NavItem } from './nav'
import { useT } from '@/i18n/useT'
import { useCompleteness } from '@/store/selectors'
import type { Completion } from '@/store/selectors'
import { cn } from '@/components/ui'

function Glyph({ c }: { c?: Completion }) {
  if (!c) return null
  const map: Record<Completion, { ch: string; cls: string }> = {
    full: { ch: '●', cls: 'text-emerald-500' },
    partial: { ch: '◐', cls: 'text-amber-500' },
    empty: { ch: '○', cls: 'text-slate-300' },
  }
  return <span className={cn('text-[10px]', map[c].cls)}>{map[c].ch}</span>
}

function Group({ title, items, completeness }: { title: string; items: NavItem[]; completeness: ReturnType<typeof useCompleteness> }) {
  const { t } = useT()
  return (
    <div className="mb-5">
      <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</div>
      <nav className="space-y-0.5">
        {items.map((it) => (
          <NavLink
            key={it.id}
            to={it.path}
            className={({ isActive }) =>
              cn(
                'flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition',
                isActive ? 'bg-brand-soft font-medium text-brand-accent' : 'text-slate-600 hover:bg-slate-100',
                it.output && 'italic',
              )
            }
          >
            <span>{t(it.labelKey)}</span>
            <Glyph c={it.completion ? completeness[it.completion] : undefined} />
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

export function SideNav() {
  const { t } = useT()
  const completeness = useCompleteness()
  return (
    <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-slate-200 bg-white px-3 py-5 lg:block">
      <Group title={t('nav.inputs')} items={inputNav} completeness={completeness} />
      <Group title={t('nav.dashboards')} items={dashNav} completeness={completeness} />
    </aside>
  )
}
