import { useStore } from '@/store/useStore'
import { strings, domainStrings, BI_KEYS } from './strings'
import type { DomainGroup, Lang, StringKey } from './strings'

export function useLang(): Lang {
  return useStore((s) => s.lang)
}

export interface Translator {
  /**
   * Translate a UI string. IMPORTANT labels (BI_KEYS) render BILINGUALLY —
   * "中文 · English" (primary language first) — so mixed-language audiences can
   * read every key number on the dashboard without touching the toggle.
   */
  t: (key: StringKey, vars?: Record<string, string | number>) => string
  /** Localize a domain enum token bilingually, e.g. d('tag','引流品') → "引流品 · Lead Magnet". */
  d: (group: DomainGroup, token: string) => string
  /** Single-language variant for tight layouts (SVG rings, chart axes, big KPI values). */
  dOne: (group: DomainGroup, token: string) => string
  lang: Lang
}

function combine(zh: string, en: string, lang: Lang): string {
  if (zh === en) return zh
  return lang === 'zh' ? `${zh} · ${en}` : `${en} · ${zh}`
}

export function useT(): Translator {
  const lang = useStore((s) => s.lang)

  const t = (key: StringKey, vars?: Record<string, string | number>): string => {
    const entry = strings[key]
    let out: string = BI_KEYS.has(key) ? combine(entry.zh, entry.en, lang) : entry[lang]
    if (vars) for (const k of Object.keys(vars)) out = out.replaceAll(`{${k}}`, String(vars[k]))
    return out
  }

  const d = (group: DomainGroup, token: string): string => {
    const g = domainStrings[group] as Record<string, { zh: string; en: string }>
    const e = g[token]
    if (!e) return token
    return combine(e.zh, e.en, lang)
  }

  const dOne = (group: DomainGroup, token: string): string => {
    const g = domainStrings[group] as Record<string, { zh: string; en: string }>
    return g[token]?.[lang] ?? token
  }

  return { t, d, dOne, lang }
}
