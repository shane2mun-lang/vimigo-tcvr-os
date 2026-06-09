import { cn } from './ui'
import type { ReactNode } from 'react'

export function parseNum(str: string): number | undefined {
  const s = str.trim()
  if (s === '') return undefined
  const n = Number(s)
  return isFinite(n) ? n : undefined
}

// ── Full-width labeled fields (used in stacked forms) ──────────────────────────

export function NumberField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
  step,
  hint,
}: {
  label?: string
  value: number | undefined
  onChange: (v: number | undefined) => void
  prefix?: string
  suffix?: string
  placeholder?: string
  step?: number
  hint?: string
}) {
  return (
    <label className="block">
      {label && <span className="field-label">{label}</span>}
      <div className="relative">
        {prefix && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          step={step}
          value={value ?? ''}
          placeholder={placeholder ?? '0'}
          onChange={(e) => onChange(parseNum(e.target.value))}
          className={cn('input-base', prefix && 'pl-10', suffix && 'pr-9')}
        />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{suffix}</span>}
      </div>
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  )
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label?: string
  value: string | undefined
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      {label && <span className="field-label">{label}</span>}
      <input
        type="text"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="input-base"
      />
    </label>
  )
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
  placeholder,
}: {
  label?: string
  value: T | undefined
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      {label && <span className="field-label">{label}</span>}
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value as T)}
        className="input-base appearance-none bg-white"
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

export function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition',
        checked ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
      )}
    >
      <span>{label}</span>
      <span className={cn('inline-flex h-5 w-9 items-center rounded-full', checked ? 'bg-emerald-500' : 'bg-slate-300')}>
        <span className={cn('h-4 w-4 transform rounded-full bg-white shadow transition', checked ? 'translate-x-4' : 'translate-x-0.5')} />
      </span>
    </button>
  )
}

export function LabeledSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  display,
  accent = '#6366f1',
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  display?: ReactNode
  accent?: string
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-semibold tabular-nums" style={{ color: accent }}>
          {display ?? `${value > 0 ? '+' : ''}${value}%`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: accent }}
      />
    </div>
  )
}

// ── Compact cell inputs (used inside EditableTable) ────────────────────────────

export function NumberCell({
  value,
  onChange,
  align = 'right',
}: {
  value: number | undefined
  onChange: (v: number | undefined) => void
  align?: 'left' | 'right'
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      value={value ?? ''}
      onChange={(e) => onChange(parseNum(e.target.value))}
      className={cn(
        'w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm tabular-nums outline-none hover:border-slate-200 focus:border-brand-accent focus:bg-white',
        align === 'right' ? 'text-right' : 'text-left',
      )}
      placeholder="—"
    />
  )
}

export function TextCell({
  value,
  onChange,
  placeholder,
  list,
}: {
  value: string | undefined
  onChange: (v: string) => void
  placeholder?: string
  list?: string
}) {
  return (
    <input
      type="text"
      value={value ?? ''}
      list={list}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm outline-none hover:border-slate-200 focus:border-brand-accent focus:bg-white"
    />
  )
}

export function SelectCell<T extends string>({
  value,
  options,
  onChange,
  placeholder,
}: {
  value: T | undefined
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  placeholder?: string
}) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value as T)}
      className="w-full rounded-md border border-transparent bg-transparent px-1 py-1 text-sm outline-none hover:border-slate-200 focus:border-brand-accent focus:bg-white"
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
}

export function ToggleCell({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'mx-auto flex h-5 w-9 items-center rounded-full transition',
        checked ? 'bg-emerald-500' : 'bg-slate-300',
      )}
    >
      <span className={cn('h-4 w-4 transform rounded-full bg-white shadow transition', checked ? 'translate-x-4' : 'translate-x-0.5')} />
    </button>
  )
}
