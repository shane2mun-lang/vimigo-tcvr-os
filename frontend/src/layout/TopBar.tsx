import { useStore } from '@/store/useStore'
import { useT } from '@/i18n/useT'
import { Button, Segmented } from '@/components/ui'
import { ProfileManager } from './ProfileManager'
import { exportTcvrReport } from '@/pdf/exportReport'
import { demoElectricalChain, DEMO_NAME } from '@/store/demo'
import { saveProfile } from '@/store/profiles'
import { scrollToSection } from './nav'
import type { Lang } from '@/i18n/strings'

export function TopBar() {
  const { t } = useT()
  const lang = useStore((s) => s.lang)
  const setLang = useStore((s) => s.setLang)
  const loadInput = useStore((s) => s.loadInput)
  const getInput = useStore((s) => s.getInput)
  const activeProfileName = useStore((s) => s.activeProfileName)

  const loadDemo = () => {
    // Protect the customer's work: auto-backup whatever is on screen (if any),
    // THEN swap in the demo. The backup appears in the profile menu.
    const current = getInput()
    const hasData =
      Boolean(current.profile.name) ||
      current.channels.length > 0 ||
      current.products.length > 0 ||
      Boolean(current.profile.currentMonthlyRevenue)
    if (hasData && activeProfileName !== DEMO_NAME) {
      saveProfile(activeProfileName ?? t('demo.backupName'), current, Date.now())
    }
    if (!window.confirm(t('demo.confirm'))) return
    loadInput(demoElectricalChain, DEMO_NAME)
    scrollToSection('company')
  }

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
        <span className="hidden items-center gap-1 text-xs text-emerald-600 md:inline-flex">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {t('common.saved')}
        </span>
        <Button size="sm" onClick={loadDemo} className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600">
          🎬 {t('demo.button')}
        </Button>
        <Button variant="outline" size="sm" onClick={exportTcvrReport} className="hidden sm:inline-flex">
          ⤓ {t('profile.exportPdf')}
        </Button>
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
