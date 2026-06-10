import { inputNav, dashNav, allSectionIds, scrollToSection } from './nav'
import { useScrollSpy } from './useScrollSpy'
import { useT } from '@/i18n/useT'
import { cn } from '@/components/ui'

export function MobileNav() {
  const { t } = useT()
  const items = [...inputNav, ...dashNav]
  const activeId = useScrollSpy(allSectionIds)
  return (
    <div className="sticky top-0 z-20 overflow-x-auto border-b border-slate-200 bg-white px-2 py-2 lg:hidden">
      <div className="flex gap-1">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => scrollToSection(it.id)}
            className={cn(
              'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition',
              activeId === it.id ? 'bg-brand-accent text-white' : 'bg-slate-100 text-slate-600',
            )}
          >
            {t(it.labelKey)}
          </button>
        ))}
      </div>
    </div>
  )
}
