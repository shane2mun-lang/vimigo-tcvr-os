import { inputNav, dashNav, allSectionIds, scrollToSection } from './nav'
import type { NavItem } from './nav'
import { useScrollSpy } from './useScrollSpy'
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

function Group({
  title,
  items,
  completeness,
  activeId,
}: {
  title: string
  items: NavItem[]
  completeness: ReturnType<typeof useCompleteness>
  activeId: string
}) {
  const { t } = useT()
  return (
    <div className="mb-5">
      <div className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{title}</div>
      <nav className="space-y-0.5">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => scrollToSection(it.id)}
            className={cn(
              'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition',
              activeId === it.id ? 'bg-brand-soft font-medium text-brand-accent' : 'text-slate-600 hover:bg-slate-100',
              it.output && 'italic',
            )}
          >
            <span>{t(it.labelKey)}</span>
            <Glyph c={it.completion ? completeness[it.completion] : undefined} />
          </button>
        ))}
      </nav>
    </div>
  )
}

export function SideNav() {
  const { t } = useT()
  const completeness = useCompleteness()
  const activeId = useScrollSpy(allSectionIds)
  return (
    <aside className="hidden w-60 shrink-0 overflow-y-auto border-r border-slate-200 bg-white px-3 py-5 lg:block">
      <Group title={t('nav.inputs')} items={inputNav} completeness={completeness} activeId={activeId} />
      <Group title={t('nav.dashboards')} items={dashNav} completeness={completeness} activeId={activeId} />
    </aside>
  )
}
