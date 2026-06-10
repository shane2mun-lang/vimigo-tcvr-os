import { useState } from 'react'
import type { Bottleneck, CustomerType, SalesModel } from '@/engine/types'
import { useStore } from '@/store/useStore'
import { useT } from '@/i18n/useT'
import { Card, SectionHeader, Tag } from '@/components/ui'
import { NumberField, TextField, SelectField } from '@/components/fields'
import { AIPanel } from '@/components/AIPanel'
import { useScan } from '@/ai/useAI'
import type { ScanResult } from '@/ai/client'

const SALES_MODELS: SalesModel[] = [
  'Retail',
  'Online',
  'Service',
  'B2B',
  'Project',
  'Distributor',
  'Subscription',
]
const CUSTOMER_TYPES: CustomerType[] = ['B2C', 'SME', 'Corporate', 'Dealer', 'Designer', 'Developer']
const BOTTLENECKS: Bottleneck[] = [
  'no-traffic',
  'traffic-no-close',
  'low-close',
  'no-repeat',
  'no-followup',
  'messy-product-structure',
]

export function CompanyModule() {
  const { t, d } = useT()
  const profile = useStore((s) => s.profile)
  const setProfile = useStore((s) => s.setProfile)
  const scan = useScan()
  const [pasted, setPasted] = useState('')

  const degraded =
    scan.state.status !== 'ok' && scan.state.data && typeof scan.state.data === 'object'
      ? (scan.state.data as { needsPaste?: boolean })
      : undefined
  const needsPaste = Boolean(degraded?.needsPaste)

  // No website to fetch? Drop straight into paste-mode instead of firing an invalid
  // request (the backend needs a non-empty url OR pasted content).
  const hasWebsite = Boolean(profile.website && profile.website.trim())
  const pasteMode = needsPaste || !hasWebsite

  const runScan = () => {
    const content = pasted.trim()
    if (pasteMode) {
      if (content) void scan.run(undefined, content) // no-op if nothing pasted yet
    } else {
      // Normalize what the boss typed ("vimigo.com" → "https://vimigo.com").
      const raw = (profile.website ?? '').trim()
      const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
      void scan.run(url)
    }
  }

  // "Please paste your content" is a normal recoverable state — never present it as
  // an AI failure. Only real failures (no key / server error) show the banner.
  const displayStatus =
    needsPaste && (scan.state.status === 'error' || scan.state.status === 'unavailable')
      ? 'idle'
      : scan.state.status

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <SectionHeader title={t('company.heading')} subtitle={t('company.lead')} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField
            label={t('company.name')}
            value={profile.name}
            onChange={(v) => setProfile({ name: v })}
            placeholder={t('profile.untitled')}
          />
          <TextField
            label={t('company.industry')}
            value={profile.industry}
            onChange={(v) => setProfile({ industry: v })}
          />
          <div className="sm:col-span-2">
            <TextField
              label={t('company.website')}
              value={profile.website}
              onChange={(v) => setProfile({ website: v })}
              placeholder="https://"
            />
          </div>

          <NumberField
            label={t('company.teamSize')}
            value={profile.teamSize}
            onChange={(v) => setProfile({ teamSize: v })}
          />
          <NumberField
            label={t('company.gpMargin')}
            value={profile.currentGPMargin}
            onChange={(v) => setProfile({ currentGPMargin: v })}
            suffix="%"
          />
          <NumberField
            label={t('company.currentRevenue')}
            value={profile.currentMonthlyRevenue}
            onChange={(v) => setProfile({ currentMonthlyRevenue: v })}
            prefix="RM"
          />
          <NumberField
            label={t('company.targetRevenue')}
            value={profile.targetMonthlyRevenue}
            onChange={(v) => setProfile({ targetMonthlyRevenue: v })}
            prefix="RM"
          />

          <SelectField<SalesModel>
            label={t('company.salesModel')}
            value={profile.salesModel}
            onChange={(v) => setProfile({ salesModel: v })}
            options={SALES_MODELS.map((v) => ({ value: v, label: d('model', v) }))}
          />
          <SelectField<CustomerType>
            label={t('company.customerType')}
            value={profile.customerType}
            onChange={(v) => setProfile({ customerType: v })}
            placeholder="—"
            options={CUSTOMER_TYPES.map((v) => ({ value: v, label: d('customer', v) }))}
          />
          <div className="sm:col-span-2">
            <SelectField<Bottleneck>
              label={t('company.bottleneck')}
              value={profile.biggestBottleneck}
              onChange={(v) => setProfile({ biggestBottleneck: v })}
              placeholder="—"
              options={BOTTLENECKS.map((v) => ({ value: v, label: d('bottleneck', v) }))}
            />
          </div>
        </div>
      </Card>

      <Card className="p-5 sm:p-6">
        <AIPanel
          title={t('company.aiScan')}
          status={displayStatus}
          onRun={runScan}
          runLabel={t('company.aiScan')}
          error={needsPaste ? undefined : scan.state.error}
          fallback={t('company.lead')}
          extraControls={
            pasteMode ? (
              <div className="mb-3 space-y-2">
                <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 ring-1 ring-amber-200">
                  {needsPaste ? t('ai.needPaste') : t('company.scanHint')}
                </div>
                <textarea
                  value={pasted}
                  onChange={(e) => setPasted(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-accent focus:ring-2 focus:ring-indigo-100"
                  placeholder={t('company.scanPastePlaceholder')}
                />
              </div>
            ) : undefined
          }
        >
          {scan.data ? <ScanSummary data={scan.data} /> : null}
        </AIPanel>
      </Card>
    </div>
  )
}

const PILLAR_TAG_COLOR: Record<string, 'blue' | 'violet' | 'amber' | 'emerald'> = {
  traffic: 'blue',
  conversion: 'violet',
  value: 'amber',
  recurring: 'emerald',
}

function ScanSummary({ data }: { data: ScanResult }) {
  const { t, d } = useT()
  const suggestions = data.tcvrSuggestions ?? []
  return (
    <div className="space-y-4 text-sm text-slate-700">
      {/* THE point of the scan: actionable TCVR improvement suggestions, first. */}
      {suggestions.length > 0 && (
        <div>
          <div className="mb-2 text-sm font-semibold text-brand-accent">💡 {t('ai.scanSuggestions')}</div>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div key={i} className="rounded-xl bg-white px-3.5 py-2.5 ring-1 ring-indigo-100">
                <div className="mb-1 flex items-center gap-2">
                  <Tag color={PILLAR_TAG_COLOR[s.pillar] ?? 'slate'}>{d('pillar', s.pillar)}</Tag>
                  <span className="text-xs text-slate-400">{s.finding}</span>
                </div>
                <div className="font-medium text-slate-800">→ {s.suggestion}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Supporting findings */}
      <details className="rounded-lg bg-white/60 px-3 py-2 ring-1 ring-slate-100" open={suggestions.length === 0}>
        <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t('ai.scanFindings')}
        </summary>
        <div className="mt-2 space-y-3">
          <Field label={t('company.industry')} value={data.positioning} />
          {data.products.length > 0 && (
            <div>
              <div className="field-label">{t('value.product')}</div>
              <div className="flex flex-wrap gap-1.5">
                {data.products.map((p, i) => (
                  <Tag key={i} color="violet">
                    {p}
                  </Tag>
                ))}
              </div>
            </div>
          )}
          <Field label={t('reward.kpi')} value={data.cta} />
          {data.painPointsAddressed.length > 0 && (
            <ul className="list-disc space-y-0.5 pl-5 text-slate-600">
              {data.painPointsAddressed.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          )}
        </div>
      </details>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div>
      <div className="field-label">{label}</div>
      <div className="text-slate-700">{value}</div>
    </div>
  )
}
