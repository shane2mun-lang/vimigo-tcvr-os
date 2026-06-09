// Number / currency / percent formatting. Currency is Malaysian Ringgit (RM).

import type { Lang } from '@/i18n/strings'

const locale = (lang: Lang) => (lang === 'zh' ? 'zh-MY' : 'en-MY')

/** "RM 300,000" — no decimals by default. */
export function formatRM(value: number | undefined | null, lang: Lang = 'en', digits = 0): string {
  const v = typeof value === 'number' && isFinite(value) ? value : 0
  return 'RM ' + new Intl.NumberFormat(locale(lang), { maximumFractionDigits: digits, minimumFractionDigits: 0 }).format(v)
}

/** Compact money for tight cards: RM 1.2k / RM 3.4M. */
export function formatRMShort(value: number | undefined | null, lang: Lang = 'en'): string {
  const v = typeof value === 'number' && isFinite(value) ? value : 0
  const abs = Math.abs(v)
  if (abs >= 1_000_000) return 'RM ' + (v / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1) + 'M'
  if (abs >= 1_000) return 'RM ' + (v / 1_000).toFixed(abs >= 10_000 ? 0 : 1) + 'k'
  return formatRM(v, lang)
}

export function formatNumber(value: number | undefined | null, lang: Lang = 'en', digits = 0): string {
  const v = typeof value === 'number' && isFinite(value) ? value : 0
  return new Intl.NumberFormat(locale(lang), { maximumFractionDigits: digits }).format(v)
}

/** Takes a DECIMAL (0.34) and renders "34%". */
export function formatPct(decimal: number | undefined | null, digits = 0): string {
  const v = typeof decimal === 'number' && isFinite(decimal) ? decimal : 0
  return (v * 100).toFixed(digits) + '%'
}

/** Already-percent value (34) → "34%". */
export function formatPctRaw(value: number | undefined | null, digits = 0): string {
  const v = typeof value === 'number' && isFinite(value) ? value : 0
  return v.toFixed(digits) + '%'
}

export function formatMultiplier(value: number | undefined | null, digits = 2): string {
  const v = typeof value === 'number' && isFinite(value) ? value : 1
  return '×' + v.toFixed(digits)
}

/** Signed money delta, e.g. "+RM 9,000" / "−RM 2,500". */
export function formatDeltaRM(value: number | undefined | null, lang: Lang = 'en'): string {
  const v = typeof value === 'number' && isFinite(value) ? value : 0
  const sign = v > 0 ? '+' : v < 0 ? '−' : ''
  return sign + formatRM(Math.abs(v), lang)
}
