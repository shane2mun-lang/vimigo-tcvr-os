// ─────────────────────────────────────────────────────────────────────────────
// Notion sync — pushes each student's TCVR data into the teacher's Notion
// database (📊 TCVR 学员诊断 under 🧠 Vimigo HQ Customer Brain).
// One row per student: all key metrics as filterable properties + raw JSON.
// Manual "submit report" appends a timestamped report-snapshot to the page body.
// ─────────────────────────────────────────────────────────────────────────────

import type { EngineResult, TCVRInput } from '../../frontend/src/engine/types';

const NOTION_API = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

export const notionKey = (process.env.NOTION_API_KEY ?? '').trim();
export const notionDbId = (process.env.NOTION_DATABASE_ID ?? '').trim();
export const hasNotion = notionKey.length > 0 && notionDbId.length > 0;

export interface StudentInfo {
  name: string;
  phone?: string;
  classCode?: string;
}

async function notionFetch(path: string, method: string, body?: unknown): Promise<Record<string, unknown>> {
  const res = await fetch(`${NOTION_API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${notionKey}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg = typeof json.message === 'string' ? json.message : `Notion API ${res.status}`;
    throw new Error(msg);
  }
  return json;
}

const BOTTLENECK_OPTION: Record<string, string> = {
  'no-traffic': '没流量 no-traffic',
  'traffic-no-close': '有流量没成交 traffic-no-close',
  'low-close': '成交低 low-close',
  'no-repeat': '客户不复购 no-repeat',
  'no-followup': '团队不跟进 no-followup',
  'messy-product-structure': '产品结构乱 messy-product-structure',
};

const HEALTH_OPTION: Record<string, string> = {
  green: '绿 Green',
  yellow: '黄 Yellow',
  red: '红 Red',
};

const r0 = (x: number): number => (isFinite(x) ? Math.round(x) : 0);
const r1 = (x: number): number => (isFinite(x) ? Math.round(x * 10) / 10 : 0);
const pct1 = (x: number): number => r1(x * 100);

/** Chunk a long string into Notion rich_text objects (≤1900 chars each, ≤60 chunks). */
function chunkedRichText(s: string): { text: { content: string } }[] {
  const out: { text: { content: string } }[] = [];
  for (let i = 0; i < s.length && out.length < 60; i += 1900) {
    out.push({ text: { content: s.slice(i, i + 1900) } });
  }
  return out;
}

function pillarScore(result: EngineResult, pillar: string): number {
  return r0(result.insights.pillarHealth.find((p) => p.pillar === pillar)?.score ?? 0);
}

function buildProperties(student: StudentInfo, input: TCVRInput, result: EngineResult, syncs: number) {
  const rev = result.revenue;
  const company = input.profile.name?.trim() || student.name;
  const props: Record<string, unknown> = {
    '公司 Company': { title: [{ text: { content: company.slice(0, 200) } }] },
    '学员 Student': { rich_text: [{ text: { content: student.name.slice(0, 200) } }] },
    '行业 Industry': { rich_text: [{ text: { content: (input.profile.industry ?? '').slice(0, 200) } }] },
    '销售模式 Model': { select: { name: input.profile.salesModel } },
    '月营业额 Revenue': { number: r0(rev.revenue) },
    '目标 Target': { number: r0(input.profile.targetMonthlyRevenue ?? 0) },
    '毛利 GP': { number: r0(rev.grossProfit) },
    'GP率 %': { number: pct1(rev.gpMargin) },
    综合CAC: { number: r1(result.channels.blendedCAC) },
    付费CAC: { number: r1(result.channels.paidCAC) },
    ABV: { number: r0(rev.averageBasketValue) },
    LTV: { number: r0(rev.ltv) },
    'LTV:CAC': { number: r1(rev.ltvToCac) },
    '转化率 %': { number: pct1(rev.conversionRate) },
    '复购率 %': { number: pct1(result.retention.repeatPurchaseRate) },
    '转介率 %': { number: pct1(result.retention.referralRate) },
    '净利 Net': { number: r0(rev.netProfitImpact) },
    健康T: { number: pillarScore(result, 'traffic') },
    健康C: { number: pillarScore(result, 'conversion') },
    健康V: { number: pillarScore(result, 'value') },
    健康R: { number: pillarScore(result, 'recurring') },
    '整体健康 Health': { select: { name: HEALTH_OPTION[result.insights.overallHealth] ?? '— Insufficient' } },
    '核心瓶颈 Bottleneck': {
      select: { name: BOTTLENECK_OPTION[result.insights.primaryBottleneck.computed] ?? '成交低 low-close' },
    },
    '最后同步 Last Sync': { date: { start: new Date().toISOString() } },
    '同步次数 Syncs': { number: syncs },
    'Raw JSON': { rich_text: chunkedRichText(JSON.stringify(input)) },
  };
  if (student.phone && student.phone.trim() !== '') {
    props.WhatsApp = { phone_number: student.phone.trim() };
  }
  if (student.classCode && student.classCode.trim() !== '') {
    props['班次 Class'] = { select: { name: student.classCode.trim().slice(0, 90) } };
  }
  return props;
}

const fmtRM = (x: number): string => 'RM ' + r0(x).toLocaleString('en-MY');

function snapshotBlocks(result: EngineResult): unknown[] {
  const rev = result.revenue;
  const ins = result.insights;
  const stamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
  const bullet = (text: string) => ({
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: { rich_text: [{ text: { content: text.slice(0, 1900) } }] },
  });

  const blocks: unknown[] = [
    {
      object: 'block',
      type: 'heading_2',
      heading_2: { rich_text: [{ text: { content: `📋 TCVR 报告快照 Report Snapshot · ${stamp} UTC` } }] },
    },
    bullet(
      `营业额 Revenue ${fmtRM(rev.revenue)} → 目标 Target ${fmtRM(result.channels.trafficGap.targetRevenue ?? 0)} · 毛利 GP ${fmtRM(rev.grossProfit)} (${pct1(rev.gpMargin)}%) · 净利 Net ${fmtRM(rev.netProfitImpact)}`,
    ),
    bullet(
      `综合CAC ${fmtRM(result.channels.blendedCAC)} · 付费CAC ${fmtRM(result.channels.paidCAC)} · ABV ${fmtRM(rev.averageBasketValue)} · LTV ${fmtRM(rev.ltv)} (${r1(rev.ltvToCac)}x)`,
    ),
    bullet(
      `转化率 ${pct1(rev.conversionRate)}% · 复购率 ${pct1(result.retention.repeatPurchaseRate)}% · 转介率 ${pct1(result.retention.referralRate)}%`,
    ),
    bullet(
      `健康分 Health — T:${pillarScore(result, 'traffic')} C:${pillarScore(result, 'conversion')} V:${pillarScore(result, 'value')} R:${pillarScore(result, 'recurring')} · 核心瓶颈 Bottleneck: ${BOTTLENECK_OPTION[ins.primaryBottleneck.computed] ?? ins.primaryBottleneck.computed}`,
    ),
  ];

  for (const lever of ins.topGrowthLevers) {
    blocks.push(bullet(`▲ 增长杠杆 Lever (+${fmtRM(lever.moneyImpact ?? 0)} GP): ${lever.detail}`));
  }
  for (const leak of ins.topLeaks) {
    blocks.push(bullet(`▼ 漏钱点 Leak (${fmtRM(leak.moneyImpact ?? 0)}): ${leak.title} — ${leak.detail}`));
  }
  for (const goal of ins.vimiGoalDrafts) {
    blocks.push(bullet(`🎯 vimiGoal: ${goal.goal} · ${goal.measure} · ${goal.accountability} · +${fmtRM(goal.expectedGpImpact)} GP`));
  }
  return blocks;
}

export interface UpsertResult {
  pageId: string;
  url?: string;
}

/**
 * Create or update the student's row. `snapshot=true` (manual submit) also appends
 * a timestamped report snapshot to the page body — history is preserved on purpose.
 */
export async function upsertStudent(opts: {
  pageId?: string | null;
  student: StudentInfo;
  input: TCVRInput;
  result: EngineResult;
  syncs: number;
  snapshot: boolean;
}): Promise<UpsertResult> {
  const { pageId, student, input, result, syncs, snapshot } = opts;
  const properties = buildProperties(student, input, result, syncs);

  if (pageId) {
    const updated = await notionFetch(`/pages/${pageId}`, 'PATCH', { properties });
    if (snapshot) {
      await notionFetch(`/blocks/${pageId}/children`, 'PATCH', { children: snapshotBlocks(result) });
    }
    return { pageId, url: typeof updated.url === 'string' ? updated.url : undefined };
  }

  const created = await notionFetch('/pages', 'POST', {
    parent: { database_id: notionDbId },
    properties,
    children: snapshotBlocks(result),
  });
  return {
    pageId: String(created.id),
    url: typeof created.url === 'string' ? created.url : undefined,
  };
}
