// ─────────────────────────────────────────────────────────────────────────────
// Welcome registration gate. After the password, the student registers (name +
// WhatsApp + company + class) before using the app. Data syncs quietly in the
// background (debounced on change; report snapshot on first sync and whenever a
// PDF is exported). Demo data is NEVER synced. No sync UI is shown.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/store/useStore'
import { useInput } from '@/store/selectors'
import { useT } from '@/i18n/useT'
import { Button, Card } from '@/components/ui'
import { DEMO_NAME } from '@/store/demo'
import { sampleInput } from '@/store/sample'

async function postSubmit(snapshot: boolean): Promise<boolean> {
  const s = useStore.getState()
  if (!s.student) return false
  // Never push demo/sample data into the analysis database.
  if (s.activeProfileName === DEMO_NAME || s.activeProfileName === sampleInput.profile.name) return false
  try {
    const res = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student: s.student,
        pageId: s.notionPageId,
        snapshot,
        syncs: s.syncCount + 1,
        input: s.getInput(),
      }),
    })
    if (!res.ok) return false
    const json = (await res.json()) as { pageId?: string }
    s.setNotionSync(json.pageId ?? s.notionPageId, s.syncCount + 1)
    return true
  } catch {
    return false
  }
}

export function CheckInCard() {
  const { t } = useT()
  const student = useStore((s) => s.student)
  const setStudent = useStore((s) => s.setStudent)
  const setProfile = useStore((s) => s.setProfile)
  const profileName = useStore((s) => s.profile.name)
  const input = useInput()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState(profileName ?? '')
  const [classCode, setClassCode] = useState('')
  const timer = useRef<number | null>(null)
  const retry = useRef<number | null>(null)
  const firstRun = useRef(true)

  const sync = async (snapshot = false) => {
    const ok = await postSubmit(snapshot)
    if (!ok && retry.current === null) {
      // Quiet retry a bit later; never surface anything.
      retry.current = window.setTimeout(() => {
        retry.current = null
        void postSubmit(snapshot)
      }, 120000)
    }
  }

  // Background sync on data changes (debounced 60s).
  useEffect(() => {
    if (!student) return
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => void sync(false), 60000)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, student])

  // Whenever a PDF is exported (print dialog), capture a report snapshot too.
  useEffect(() => {
    if (!student) return
    const onPrint = () => void sync(true)
    window.addEventListener('beforeprint', onPrint)
    return () => window.removeEventListener('beforeprint', onPrint)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student])

  const ready = name.trim() !== '' && phone.trim() !== '' && company.trim() !== ''

  const start = () => {
    if (!ready) return
    setStudent({ name: name.trim(), phone: phone.trim(), classCode: classCode.trim() || undefined })
    setProfile({ name: company.trim() })
    void sync(true)
  }

  // ── Registered: a small friendly greeting, nothing else ─────────────────────
  if (student) {
    return (
      <Card className="flex items-center justify-between gap-3 px-4 py-2.5">
        <div className="text-sm text-slate-700">
          👋 <span className="font-semibold">{student.name}</span>
          {profileName && <span className="text-slate-400"> · {profileName}</span>}
          {student.classCode && <span className="text-slate-400"> · {student.classCode}</span>}
        </div>
        <button
          type="button"
          onClick={() => setStudent(null)}
          title={t('checkin.edit')}
          className="rounded-md px-2 py-1 text-xs text-slate-300 transition hover:bg-slate-100 hover:text-slate-500"
        >
          ✎
        </button>
      </Card>
    )
  }

  // ── Not registered: full-screen welcome gate ────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md p-6 sm:p-8">
        <div className="mb-1 flex items-center gap-2 text-lg font-bold text-slate-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-accent text-base font-bold text-white">V</span>
          {t('checkin.title')}
        </div>
        <p className="mb-5 text-sm leading-relaxed text-slate-500">{t('checkin.lead')}</p>

        <div className="space-y-3">
          <label className="block">
            <span className="field-label">{t('checkin.name')} *</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-base" autoFocus />
          </label>
          <label className="block">
            <span className="field-label">{t('checkin.phone')} *</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-base" placeholder="+60…" inputMode="tel" />
          </label>
          <label className="block">
            <span className="field-label">{t('checkin.company')} *</span>
            <input value={company} onChange={(e) => setCompany(e.target.value)} className="input-base" />
          </label>
          <label className="block">
            <span className="field-label">{t('checkin.class')}</span>
            <input value={classCode} onChange={(e) => setClassCode(e.target.value)} className="input-base" placeholder={t('checkin.classPlaceholder')} />
          </label>
        </div>

        <Button onClick={start} disabled={!ready} className="mt-5 w-full">
          {t('checkin.start')} →
        </Button>
      </Card>
    </div>
  )
}
