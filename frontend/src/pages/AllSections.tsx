// The single continuous-scroll page: AI-agent hero → all 7 input modules → all 5
// dashboards, each wrapped in an anchored <section> the sidebar scrolls to.

import type { ReactNode } from 'react'
import { useT } from '@/i18n/useT'
import { InterviewAgent } from '@/modules/InterviewAgent'
import { CompanyModule } from '@/modules/CompanyModule'
import { TrafficModule } from '@/modules/TrafficModule'
import { ConversionModule } from '@/modules/ConversionModule'
import { ValueModule } from '@/modules/ValueModule'
import { RecurringModule } from '@/modules/RecurringModule'
import { CostsModule } from '@/modules/CostsModule'
import { RewardModule } from '@/modules/RewardModule'
import { RevenueXRay } from '@/dashboards/RevenueXRay'
import { FunnelMap } from '@/dashboards/FunnelMap'
import { ProductGPMap } from '@/dashboards/ProductGPMap'
import { ScenarioSimulator } from '@/dashboards/ScenarioSimulator'
import { ActionPlan } from '@/dashboards/ActionPlan'

function Section({ id, children }: { id: string; children: ReactNode }) {
  return (
    <section id={`section-${id}`} className="scroll-mt-24 lg:scroll-mt-16">
      {children}
    </section>
  )
}

function GroupDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <div className="h-px flex-1 bg-slate-200" />
      <div className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</div>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  )
}

export function AllSections() {
  const { t } = useT()
  return (
    <div className="space-y-10">
      <InterviewAgent />

      <GroupDivider label={t('nav.inputs')} />
      <Section id="company"><CompanyModule /></Section>
      <Section id="traffic"><TrafficModule /></Section>
      <Section id="conversion"><ConversionModule /></Section>
      <Section id="value"><ValueModule /></Section>
      <Section id="recurring"><RecurringModule /></Section>
      <Section id="costs"><CostsModule /></Section>
      <Section id="reward"><RewardModule /></Section>

      <GroupDivider label={t('nav.dashboards')} />
      <Section id="xray"><RevenueXRay /></Section>
      <Section id="funnelmap"><FunnelMap /></Section>
      <Section id="product"><ProductGPMap /></Section>
      <Section id="simulator"><ScenarioSimulator /></Section>
      <Section id="plan"><ActionPlan /></Section>
    </div>
  )
}
