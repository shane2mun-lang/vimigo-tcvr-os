import type { StringKey } from '@/i18n/strings'
import type { Completeness } from '@/store/selectors'

export interface NavItem {
  id: string
  path: string
  labelKey: StringKey
  completion?: keyof Completeness
  output?: boolean
}

export const inputNav: NavItem[] = [
  { id: 'company', path: '/inputs/company', labelKey: 'nav.company', completion: 'company' },
  { id: 'traffic', path: '/inputs/traffic', labelKey: 'nav.traffic', completion: 'traffic' },
  { id: 'conversion', path: '/inputs/conversion', labelKey: 'nav.conversion', completion: 'conversion' },
  { id: 'value', path: '/inputs/value', labelKey: 'nav.value', completion: 'value' },
  { id: 'recurring', path: '/inputs/recurring', labelKey: 'nav.recurring', completion: 'recurring' },
  { id: 'costs', path: '/inputs/costs', labelKey: 'nav.costs', completion: 'costs' },
  { id: 'reward', path: '/inputs/reward', labelKey: 'nav.reward', output: true },
]

export const dashNav: NavItem[] = [
  { id: 'xray', path: '/dashboards/xray', labelKey: 'nav.xray' },
  { id: 'funnelmap', path: '/dashboards/funnelmap', labelKey: 'nav.funnelmap' },
  { id: 'product', path: '/dashboards/product', labelKey: 'nav.productgp' },
  { id: 'simulator', path: '/dashboards/simulator', labelKey: 'nav.simulator' },
  { id: 'plan', path: '/dashboards/plan', labelKey: 'nav.actionplan' },
]
