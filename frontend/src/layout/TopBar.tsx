import { useStore } from '@/store/useStore'
import { useT } from '@/i18n/useT'
import { Segmented } from '@/components/ui'
import { ProfileManager } from './ProfileManager'
import type { Lang } from '@/i18n/strings'

export function TopBar() {
  const { t } = useT()
  const lang = useStore((s) => s.lang)
  const setLang = useStore((s) => s.setLang)

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-slate-200 bg-white/90 px-4 py-2.5 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-accent text-sm font-bold text-white">V</div>
        <div className="leading-tight">
          <div className="text-sm font-semibold text-slate-900">{t('app.title')}</div>
          <div className="hidden text-[11px] text-slate-400 sm:block">{t('app.subtitle')}</div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1 text-xs text-emerald-600 sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {t('common.saved')}
        </span>
        <Segmented<Lang>
          value={lang}
          onChange={setLang}
          size="sm"
          options={[
            { value: 'zh', label: '中文' },
            { value: 'en', label: 'EN' },
          ]}
        />
        <ProfileManager />
      </div>
    </header>
  )
}
