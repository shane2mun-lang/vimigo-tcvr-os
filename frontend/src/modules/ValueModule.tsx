import { PRODUCT_TAGS } from '@/engine'
import type { ProductMetric, ProductTag } from '@/engine/types'
import { useStore } from '@/store/useStore'
import { useEngine } from '@/store/selectors'
import { useT } from '@/i18n/useT'
import { Card, SectionHeader, Button, Tag } from '@/components/ui'
import { NumberCell, TextCell, SelectCell, ToggleCell } from '@/components/fields'
import { TableShell, Th, Td, RemoveRowButton } from '@/components/table'
import { HelpTip } from '@/components/HelpTip'
import { AIPanel } from '@/components/AIPanel'
import { useCategorize } from '@/ai/useAI'
import { formatRM, formatPct, formatPctRaw } from '@/lib/format'

const DASH = '—'

const FLAGS = [
  { key: 'easyUpsell', label: 'value.upsell' },
  { key: 'easyRepeat', label: 'value.repeat' },
  { key: 'easyReferral', label: 'value.referral' },
  { key: 'goodForAds', label: 'value.ads' },
  { key: 'goodForReward', label: 'value.reward' },
  { key: 'easyPriceCompare', label: 'value.priceCompare' },
] as const

export function ValueModule() {
  const { t, d, lang } = useT()
  const products = useStore((s) => s.products)
  const addProduct = useStore((s) => s.addProduct)
  const updateProduct = useStore((s) => s.updateProduct)
  const removeProduct = useStore((s) => s.removeProduct)
  const { products: analysis } = useEngine()
  const byId = new Map<string, ProductMetric>(analysis.perProduct.map((m) => [m.id, m]))

  const cat = useCategorize()
  const tagOptions = PRODUCT_TAGS.map((v) => ({ value: v, label: d('tag', v) }))

  const applyAll = () => {
    if (!cat.data) return
    for (const s of cat.data.tags) updateProduct(s.id, { tag: s.tag })
  }

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6">
        <SectionHeader
          title={t('value.heading')}
          subtitle={t('value.lead')}
          right={
            <Button size="sm" variant="outline" onClick={() => addProduct()}>
              ＋ {t('common.addRow')}
            </Button>
          }
        />

        <TableShell
          head={
            <tr>
              <Th>{t('value.product')}</Th>
              <Th><span className="inline-flex items-center gap-1">{t('value.type')}<HelpTip k="productTag" side="bottom" align="right" /></span></Th>
              <Th className="text-right">{t('value.price')}</Th>
              <Th className="text-right">{t('value.cost')}</Th>
              <Th className="text-right">{t('value.cycle')}</Th>
              <Th className="text-right">{t('value.closeRate')}</Th>
              <Th className="text-right">{t('value.volume')}</Th>
              <Th className="text-right"><span className="inline-flex items-center gap-1">{t('value.gpUnit')}<HelpTip k="gpUnit" side="bottom" align="right" /></span></Th>
              <Th className="text-right"><span className="inline-flex items-center gap-1">{t('value.margin')}<HelpTip k="productMargin" side="bottom" align="right" /></span></Th>
              <Th />
            </tr>
          }
        >
          {products.map((p) => {
            const m = byId.get(p.id)
            return (
              <tr key={p.id} className="hover:bg-slate-50/60">
                <Td className="min-w-[150px]">
                  <TextCell value={p.name} placeholder={t('value.product')} onChange={(v) => updateProduct(p.id, { name: v })} />
                </Td>
                <Td className="min-w-[120px]">
                  <SelectCell<ProductTag>
                    value={p.tag}
                    placeholder={DASH}
                    options={tagOptions}
                    onChange={(v) => updateProduct(p.id, { tag: v })}
                  />
                </Td>
                <Td>
                  <NumberCell value={p.price} onChange={(v) => updateProduct(p.id, { price: v })} />
                </Td>
                <Td>
                  <NumberCell value={p.cost} onChange={(v) => updateProduct(p.id, { cost: v })} />
                </Td>
                <Td>
                  <NumberCell value={p.avgCycle} onChange={(v) => updateProduct(p.id, { avgCycle: v })} />
                </Td>
                <Td>
                  <NumberCell value={p.avgCloseRate} onChange={(v) => updateProduct(p.id, { avgCloseRate: v })} />
                </Td>
                <Td>
                  <NumberCell value={p.monthlyVolume} onChange={(v) => updateProduct(p.id, { monthlyVolume: v })} />
                </Td>
                <Td className="text-right tabular-nums text-slate-500">{m ? formatRM(m.gpPerUnit, lang) : DASH}</Td>
                <Td className="text-right tabular-nums text-slate-500">{m ? formatPct(m.gpMargin) : DASH}</Td>
                <Td className="text-center">
                  <RemoveRowButton onClick={() => removeProduct(p.id)} title={t('common.remove')} />
                </Td>
              </tr>
            )
          })}
        </TableShell>

        {products.length > 0 && (
          <div className="mt-4 space-y-3">
            {products.map((p) => (
              <div key={p.id} className="rounded-xl ring-1 ring-slate-100 p-3">
                <div className="mb-2 text-xs font-medium text-slate-500">{p.name || t('value.product')}</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {FLAGS.map((f) => (
                    <label key={f.key} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5">
                      <span className="text-xs text-slate-600">{t(f.label)}</span>
                      <ToggleCell
                        checked={Boolean(p[f.key])}
                        onChange={(v) => updateProduct(p.id, { [f.key]: v })}
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5 sm:p-6">
        <AIPanel
          title={t('ai.categorize')}
          status={cat.state.status}
          onRun={() =>
            void cat.run(products.map((p) => ({ id: p.id, name: p.name, price: p.price, cost: p.cost })))
          }
          runLabel={t('ai.categorize')}
          error={cat.state.error}
          fallback={t('value.lead')}
          extraControls={
            cat.state.status === 'ok' && cat.data && cat.data.tags.length > 0 ? (
              <div className="mb-2 flex justify-end">
                <Button size="sm" variant="primary" onClick={applyAll}>
                  {t('common.add')} · {t('value.type')}
                </Button>
              </div>
            ) : undefined
          }
        >
          {cat.data ? (
            <div className="space-y-2">
              {cat.data.tags.map((s) => {
                const p = products.find((x) => x.id === s.id)
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 ring-1 ring-slate-100"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-slate-700">{p?.name ?? s.id}</span>
                        <Tag color="violet">{d('tag', s.tag)}</Tag>
                        <span className="shrink-0 text-xs text-slate-400 tabular-nums">{formatPctRaw(s.confidence * 100)}</span>
                      </div>
                      {s.reason && <p className="mt-0.5 truncate text-xs text-slate-500">{s.reason}</p>}
                    </div>
                    <Button size="sm" variant="outline" onClick={() => updateProduct(s.id, { tag: s.tag })}>
                      {t('common.add')}
                    </Button>
                  </div>
                )
              })}
            </div>
          ) : null}
        </AIPanel>
      </Card>
    </div>
  )
}
