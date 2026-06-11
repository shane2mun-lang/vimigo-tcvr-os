import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/store/useStore'
import { useT } from '@/i18n/useT'
import { Button } from '@/components/ui'
import {
  deleteProfile,
  exportProfileJSON,
  importProfileJSON,
  listProfiles,
  saveProfile,
  type SavedProfile,
} from '@/store/profiles'

export function ProfileManager() {
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const [profiles, setProfiles] = useState<SavedProfile[]>([])
  const fileRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  // Close on outside click / Escape. (A fixed-position backdrop can't work here:
  // the header's backdrop-blur makes it the containing block for fixed children,
  // so an inset-0 backdrop would only cover the header strip.)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const activeName = useStore((s) => s.activeProfileName)
  const getInput = useStore((s) => s.getInput)
  const loadInput = useStore((s) => s.loadInput)
  const clearAll = useStore((s) => s.clearAll)
  const loadSample = useStore((s) => s.loadSample)

  const refresh = () => setProfiles(listProfiles())
  const toggle = () => {
    if (!open) refresh()
    setOpen(!open)
  }

  const onSaveAs = () => {
    const name = window.prompt(t('profile.namePrompt'), activeName ?? t('profile.untitled'))
    if (!name) return
    saveProfile(name, getInput(), Date.now())
    useStore.setState({ activeProfileName: name })
    refresh()
  }

  const onExport = () => exportProfileJSON(getInput(), activeName ?? 'company', Date.now())

  const onImportFile = async (file: File | undefined) => {
    if (!file) return
    try {
      const { input, name } = await importProfileJSON(file)
      loadInput(input, name)
      setOpen(false)
    } catch (e) {
      window.alert((e as Error).message || 'Invalid file')
    }
  }

  return (
    <div className="relative" ref={rootRef}>
      <Button variant="outline" size="sm" onClick={toggle}>
        <span className="max-w-[120px] truncate">{activeName ?? t('profile.manage')}</span>
        <span className="text-xs">▾</span>
      </Button>

      {open && (
        <>
          <div className="absolute right-0 z-40 mt-2 w-64 card p-2 text-sm">
            <button className="menu-item" onClick={() => { clearAll(); setOpen(false) }}>
              ＋ {t('profile.new')}
            </button>
            <button className="menu-item" onClick={() => { loadSample(); setOpen(false) }}>
              ✦ {t('common.loadSample')}
            </button>
            <button className="menu-item" onClick={onSaveAs}>💾 {t('profile.saveAs')}</button>
            <button className="menu-item" onClick={onExport}>⤓ {t('profile.export')}</button>
            <button className="menu-item" onClick={() => fileRef.current?.click()}>⤒ {t('profile.import')}</button>

            {profiles.length > 0 && (
              <div className="mt-2 border-t border-slate-100 pt-2">
                <div className="px-2 pb-1 text-[11px] font-semibold uppercase text-slate-400">{t('profile.load')}</div>
                <div className="max-h-48 overflow-y-auto">
                  {profiles.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-1 rounded-md px-2 py-1 hover:bg-slate-50">
                      <button className="flex-1 truncate text-left" onClick={() => { loadInput(p.input, p.name); setOpen(false) }}>
                        {p.name}
                      </button>
                      <button className="text-slate-300 hover:text-red-500" onClick={() => { deleteProfile(p.id); refresh() }}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => { void onImportFile(e.target.files?.[0]); e.target.value = '' }}
      />
    </div>
  )
}
