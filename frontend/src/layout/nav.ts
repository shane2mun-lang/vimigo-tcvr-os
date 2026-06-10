import type { StringKey } from '@/i18n/strings'
import type { Completeness } from '@/store/selectors'

export interface NavItem {
  /** Section anchor id on the single scroll page. */
  id: string
  labelKey: StringKey
  completion?: keyof Completeness
  output?: boolean
}

export const inputNav: NavItem[] = [
  { id: 'company', labelKey: 'nav.company', completion: 'company' },
  { id: 'traffic', labelKey: 'nav.traffic', completion: 'traffic' },
  { id: 'conversion', labelKey: 'nav.conversion', completion: 'conversion' },
  { id: 'value', labelKey: 'nav.value', completion: 'value' },
  { id: 'recurring', labelKey: 'nav.recurring', completion: 'recurring' },
  { id: 'costs', labelKey: 'nav.costs', completion: 'costs' },
  { id: 'reward', labelKey: 'nav.reward', output: true },
]

export const dashNav: NavItem[] = [
  { id: 'xray', labelKey: 'nav.xray' },
  { id: 'funnelmap', labelKey: 'nav.funnelmap' },
  { id: 'product', labelKey: 'nav.productgp' },
  { id: 'simulator', labelKey: 'nav.simulator' },
  { id: 'plan', labelKey: 'nav.actionplan' },
]

export const allSectionIds: string[] = [...inputNav, ...dashNav].map((i) => i.id)

/** Smooth-scroll a section into view (accounts for the sticky top bar via scroll-mt). */
export function scrollToSection(id: string): void {
  document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
