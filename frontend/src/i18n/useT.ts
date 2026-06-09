import { useStore } from '@/store/useStore'
import { strings, domainStrings } from './strings'
import type { DomainGroup, Lang, StringKey } from './strings'

export function useLang(): Lang {
  return useStore((s) => s.lang)
}

export interface Translator {
  t: (key: StringKey, vars?: Record<string, string | number>) => string
  /** Localize a domain enum token, e.g. d('tag','引流品') or d('role','Sales'). */
  d: (group: DomainGroup, token: string) => string
  lang: Lang
}

export function useT(): Translator {
  const lang = useStore((s) => s.lang)

  const t = (key: StringKey, vars?: Record<string, string | number>): string => {
    let out: string = strings[key][lang]
    if (vars) for (const k of Object.keys(vars)) out = out.replaceAll(`{${k}}`, String(vars[k]))
    return out
  }

  const d = (group: DomainGroup, token: string): string => {
    const g = domainStrings[group] as Record<string, { zh: string; en: string }>
    return g[token]?.[lang] ?? token
  }

  return { t, d, lang }
}
