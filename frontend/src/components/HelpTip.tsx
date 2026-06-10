// The "?" hover explainer. Shows: what the metric means + how it's calculated.
// Works on hover (desktop) and tap/focus (touch). Bilingual via the help dictionary.

import { helpStrings } from '@/i18n/help'
import type { HelpKey } from '@/i18n/help'
import { useLang } from '@/i18n/useT'
import { cn } from './ui'

export function HelpTip({
  k,
  align = 'center',
  side = 'top',
}: {
  k: HelpKey
  /** Horizontal anchor of the bubble relative to the icon. */
  align?: 'left' | 'right' | 'center'
  /** Put the bubble below the icon (use inside scrollable tables). */
  side?: 'top' | 'bottom'
}) {
  const lang = useLang()
  const entry = helpStrings[k]
  if (!entry) return null

  const pos = cn(
    'absolute z-50 w-72 max-w-[80vw]',
    side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
    align === 'center' && 'left-1/2 -translate-x-1/2',
    align === 'left' && 'left-0',
    align === 'right' && 'right-0',
  )

  return (
    <span className="group/help relative inline-flex" tabIndex={0}>
      <span
        aria-label="help"
        className="flex h-3.5 w-3.5 cursor-help select-none items-center justify-center rounded-full bg-slate-200 text-[9px] font-bold text-slate-500 transition group-hover/help:bg-brand-accent group-hover/help:text-white group-focus/help:bg-brand-accent group-focus/help:text-white"
      >
        ?
      </span>
      <span
        className={cn(
          pos,
          'pointer-events-none invisible rounded-xl bg-slate-800 px-3.5 py-3 text-left opacity-0 shadow-xl transition-opacity duration-150',
          'group-hover/help:visible group-hover/help:opacity-100 group-focus/help:visible group-focus/help:opacity-100',
        )}
      >
        <span className="block text-xs font-medium leading-relaxed text-white">{entry.what[lang]}</span>
        <span className="mt-1.5 block border-t border-slate-600 pt-1.5 text-[11px] leading-relaxed text-slate-300">
          <span className="font-semibold text-amber-300">{lang === 'zh' ? '计算' : 'Formula'}: </span>
          {entry.how[lang]}
        </span>
      </span>
    </span>
  )
}
