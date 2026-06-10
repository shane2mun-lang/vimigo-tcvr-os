// ─────────────────────────────────────────────────────────────────────────────
// Classroom check-in + Notion auto-sync. The student registers once (name +
// WhatsApp + class); after that every data change auto-syncs (debounced 60s) to
// the teacher's Notion database. "提交报告" also appends a full report snapshot.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/store/useStore'
import { useInput } from '@/store/selectors'
import { useT } from '@/i18n/useT'
import { Button, Card, cn } from '@/components/ui'

type SyncState = 'idle' | 'syncing' | 'ok' | 'error' | 'unconfigured'

async function postSubmit(snapshot: boolean): Promise<{ ok: boolean; state: SyncState }> {
  const s = useStore.getState()
  if (!s.student) return { ok: false, state: 'idle' }
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
    if (res.status === 503) return { ok: false, state: 'unconfigured' }
    if (!res.ok) return { ok: false, state: 'error' }
    const json = (await res.json()) as { pageId?: string }
    s.setNotionSync(json.pageId ?? s.notionPageId, s.syncCount + 1)
    return { ok: true, state: 'ok' }
  } catch {
    return { ok: false, state: 'error' }
  }
}

export function CheckInCard() {
  const { t, lang } = useT()
  const student = useStore((s) => s.student)
  const setStudent = useStore((s) => s.setStudent)
  const syncCount = useStore((s) => s.syncCount)
  const input = useInput()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [classCode, setClassCode] = useState('')
  const [sync, setSync] = useState<SyncState>('idle')
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)
  const timer = useRef<number | null>(null)
  const firstRun = useRef(true)

  const runSync = async (snapshot = false) => {
    setSync('syncing')
    const r = await postSubmit(snapshot)
    setSync(r.state)
    if (r.ok) setLastSyncAt(new Date().toTimeString().slice(0, 5))
  }

  // Auto-sync: any input change while checked-in schedules a sync 60s later.
  useEffect(() => {
    if (!student) return
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => void runSync(false), 60000)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, student])

  const checkIn = () => {
    const n = name.trim()
    if (!n) return
    setStudent({ name: n, phone: phone.trim() || undefined, classCode: classCode.trim() || undefined })
    void runSync(false)
  }

  // ── Not checked in: the registration strip ──────────────────────────────────
  if (!student) {
    return (
      <Card className="border-l-4 border-l-brand-accent p-4 sm:p-5">
        <div className="mb-2 text-sm font-semibold text-slate-800">🎓 {t('checkin.title')}</div>
        <p className="mb-3 text-xs text-slate-500">{t('checkin.lead')}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('checkin.name')}
            className="input-base sm:flex-1"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('checkin.phone')}
            className="input-base sm:flex-1"
          />
          <input
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
            placeholder={t('checkin.class')}
            className="input-base sm:w-36"
          />
          <Button onClick={checkIn} disabled={name.trim() === ''}>
            {t('checkin.start')}
          </Button>
        </div>
      </Card>
    )
  }

  // ── Checked in: the slim sync status bar ────────────────────────────────────
  const statusText: Record<SyncState, string> = {
    idle: t('checkin.idle'),
    syncing: t('checkin.syncing'),
    ok: `${t('checkin.synced')}${lastSyncAt ? ' ' + lastSyncAt : ''} · ×${syncCount}`,
    error: t('checkin.error'),
    unconfigured: t('checkin.unconfigured'),
  }
  const dot: Record<SyncState, string> = {
    idle: 'bg-slate-300',
    syncing: 'bg-amber-400 animate-pulse',
    ok: 'bg-emerald-500',
    error: 'bg-red-500',
    unconfigured: 'bg-slate-300',
  }

  return (
    <Card className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="flex items-center gap-2 text-sm">
        <span className={cn('h-2 w-2 rounded-full', dot[sync])} />
        <span className="font-semibold text-slate-800">☁ {student.name}</span>
        {student.classCode && <span className="text-xs text-slate-400">{student.classCode}</span>}
        <span className="text-xs text-slate-500">{statusText[sync]}</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Button size="sm" variant="outline" onClick={() => void runSync(false)} disabled={sync === 'syncing'}>
          ↻ {t('checkin.syncNow')}
        </Button>
        <Button size="sm" onClick={() => void runSync(true)} disabled={sync === 'syncing'}>
          📤 {t('checkin.submitReport')}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setStudent(null)} title={t('checkin.signOut')}>
          ✕
        </Button>
      </div>
    </Card>
  )
}
