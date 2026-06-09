import type { ReactNode } from 'react'
import { Button, cn } from './ui'
import { useT } from '@/i18n/useT'
import type { AIStatus } from '@/store/useStore'

/**
 * Wraps any AI feature with consistent chrome: a run button, loading state, a
 * graceful "AI unavailable — rule-based results shown" fallback, and the result.
 */
export function AIPanel({
  title,
  status,
  onRun,
  runLabel,
  error,
  children,
  fallback,
  extraControls,
}: {
  title?: string
  status: AIStatus
  onRun: () => void
  runLabel?: string
  error?: string
  children?: ReactNode
  fallback?: ReactNode
  extraControls?: ReactNode
}) {
  const { t } = useT()
  const unavailable = status === 'unavailable' || status === 'error'

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-brand-accent">
          <span className="text-base">✨</span>
          {title ?? t('ai.panelTitle')}
        </div>
        {status !== 'loading' && (
          <Button size="sm" variant="outline" onClick={onRun}>
            {status === 'ok' ? '↻' : ''} {runLabel ?? t('ai.run')}
          </Button>
        )}
      </div>

      {extraControls}

      {status === 'loading' && (
        <div className="flex items-center gap-2 py-3 text-sm text-slate-500">
          <span className="h-3 w-3 animate-ping rounded-full bg-brand-accent" />
          {t('ai.running')}
        </div>
      )}

      {unavailable && (
        <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 ring-1 ring-amber-200">
          {t('ai.unavailable')}
          {error && <span className="ml-1 opacity-60">({error})</span>}
        </div>
      )}

      {status === 'ok' && children}

      {(status === 'idle' || unavailable) && fallback && (
        <div className={cn('text-sm text-slate-600', unavailable && 'mt-2')}>{fallback}</div>
      )}
    </div>
  )
}
