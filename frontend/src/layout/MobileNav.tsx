import { NavLink } from 'react-router-dom'
import { inputNav, dashNav } from './nav'
import { useT } from '@/i18n/useT'
import { cn } from '@/components/ui'

export function MobileNav() {
  const { t } = useT()
  const items = [...inputNav, ...dashNav]
  return (
    <div className="sticky top-[49px] z-20 overflow-x-auto border-b border-slate-200 bg-white px-2 py-2 lg:hidden">
      <div className="flex gap-1">
        {items.map((it) => (
          <NavLink
            key={it.id}
            to={it.path}
            className={({ isActive }) =>
              cn(
                'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition',
                isActive ? 'bg-brand-accent text-white' : 'bg-slate-100 text-slate-600',
              )
            }
          >
            {t(it.labelKey)}
          </NavLink>
        ))}
      </div>
    </div>
  )
}
