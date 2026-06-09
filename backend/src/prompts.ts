// Prompt builders for each AI feature. Every builder returns { system, user }.
//
// Conventions shared across features:
//  - `lang` controls the OUTPUT language: 'zh' => reply in Simplified Chinese,
//    'en' => reply in English. JSON *keys* are always the fixed English/Chinese
//    tokens defined by the endpoint contract; only the human-readable *values*
//    follow `lang`.
//  - Structured features instruct the model to return ONLY minified JSON.

export type Lang = 'zh' | 'en';

export interface Prompt {
  system: string;
  user: string;
}

function langDirective(lang: Lang): string {
  return lang === 'zh'
    ? 'Reply in Simplified Chinese (简体中文). All human-readable string values must be in Chinese.'
    : 'Reply in English. All human-readable string values must be in English.';
}

// The TCVR model framing reused across features.
const TCVR_CONTEXT =
  'You are an analyst for the "vimigo TCVR Revenue OS". TCVR is a revenue diagnostic ' +
  'with four levers: Traffic (引流/流量), Conversion (成交/转化), Value (客单价/价值), and ' +
  'Recurring (复购/回头客). You help small-business bosses grow revenue by improving these levers.';

function jsonOnly(shape: string): string {
  return (
    'Respond with ONLY valid minified JSON matching this shape (no markdown, no code ' +
    'fences, no commentary before or after the JSON):\n' +
    shape
  );
}

// ── 1. Website / content scan ────────────────────────────────────────────────

export interface ScanPromptInput {
  content: string;
  source: 'fetched' | 'pasted';
  lang: Lang;
}

export function buildScanPrompt(input: ScanPromptInput): Prompt {
  const { content, source, lang } = input;

  const shape =
    '{"positioning":string,"products":string[],"cta":string,' +
    '"painPointsAddressed":string[],"toneNotes":string,"warnings":string[]}';

  const system =
    `${TCVR_CONTEXT}\n\n` +
    'TASK: A boss pasted (or we fetched) the text of a customer-facing web page ' +
    '(landing page, product page, or social profile). Analyze it as a marketing ' +
    'diagnostician.\n' +
    '- positioning: one or two sentences describing how this business positions itself.\n' +
    '- products: the concrete products/services/offers mentioned (short labels).\n' +
    '- cta: the main call-to-action you can identify (or your best inference of it).\n' +
    '- painPointsAddressed: customer pain points the copy speaks to.\n' +
    '- toneNotes: a short note on the voice/tone of the copy.\n' +
    '- warnings: concrete issues that may hurt Traffic/Conversion/Value/Recurring ' +
    '(e.g. weak CTA, no pricing, no social proof). Empty array if none.\n' +
    'Base every field strictly on the provided text. Do not invent products or claims ' +
    'that are not supported by the text.\n\n' +
    `${langDirective(lang)}\n${jsonOnly(shape)}`;

  const user =
    `Source: ${source}\n` +
    '--- BEGIN PAGE TEXT ---\n' +
    content +
    '\n--- END PAGE TEXT ---';

  return { system, user };
}

// ── 2. Product categorization ────────────────────────────────────────────────

export interface ProductInput {
  id: string;
  name: string;
  price?: number;
  cost?: number;
}

export interface CategorizePromptInput {
  products: ProductInput[];
  lang: Lang;
}

// The exact Chinese tag tokens the contract requires.
export const PRODUCT_TAGS = [
  '引流品',
  '爆品',
  '核心品',
  '利润品',
  '现金流品',
  '大鲸鱼',
  '复购品',
] as const;

export function buildCategorizePrompt(input: CategorizePromptInput): Prompt {
  const { products, lang } = input;

  const shape =
    '{"tags":[{"id":string,"tag":string,"confidence":number,"reason":string}]}';

  const system =
    `${TCVR_CONTEXT}\n\n` +
    'TASK: Classify each product into ONE product-portfolio role. The role ("tag") ' +
    'MUST be exactly one of these Chinese tokens (do not translate them, do not invent ' +
    `new ones): ${PRODUCT_TAGS.join('、')}.\n` +
    'Meanings:\n' +
    '- 引流品 (loss-leader / traffic product): low price, pulls new customers in.\n' +
    '- 爆品 (hero / hit product): high-demand, high-volume signature item.\n' +
    '- 核心品 (core product): the main offer the business is built around.\n' +
    '- 利润品 (profit product): high gross-margin item that makes the money.\n' +
    '- 现金流品 (cash-flow product): steady, frequent sales that keep cash moving.\n' +
    '- 大鲸鱼 (whale / big-ticket): premium, high-price, low-volume offer.\n' +
    '- 复购品 (repeat-purchase product): consumable/subscription driving recurring revenue.\n' +
    'Use price and cost (and therefore margin) when provided to inform the choice. ' +
    'Return one entry per input product, preserving its id. confidence is a number ' +
    'from 0 to 1. reason is one short sentence justifying the tag.\n\n' +
    `${langDirective(lang)} (Keep the "tag" value as the exact Chinese token above ` +
    'regardless of language; only "reason" follows the reply language.)\n' +
    jsonOnly(shape);

  const lines = products.map((p) => {
    const parts: string[] = [`id=${p.id}`, `name=${p.name}`];
    if (typeof p.price === 'number') parts.push(`price=${p.price}`);
    if (typeof p.cost === 'number') parts.push(`cost=${p.cost}`);
    return `- ${parts.join(', ')}`;
  });

  const user = 'Products to classify:\n' + lines.join('\n');

  return { system, user };
}

// ── 3. Pain points ───────────────────────────────────────────────────────────

export interface PainPointsPromptInput {
  industry?: string;
  customerType?: string;
  reviews?: string[];
  lang: Lang;
}

export const TCVR_AREAS = ['traffic', 'conversion', 'value', 'recurring'] as const;

export function buildPainPointsPrompt(input: PainPointsPromptInput): Prompt {
  const { industry, customerType, reviews, lang } = input;

  const shape =
    '{"painPoints":[{"title":string,"evidence":string,' +
    '"tcvrArea":"traffic"|"conversion"|"value"|"recurring"}]}';

  const system =
    `${TCVR_CONTEXT}\n\n` +
    'TASK: Identify the most important customer pain points for this business and map ' +
    'each to the single TCVR lever it most affects.\n' +
    '- title: a short, concrete pain point.\n' +
    '- evidence: why you believe it — cite the review text when reviews are provided, ' +
    'otherwise explain the industry/customer reasoning.\n' +
    '- tcvrArea: exactly one of "traffic", "conversion", "value", "recurring" (lowercase ' +
    'English tokens, never translated).\n' +
    'Return 3 to 6 pain points, most impactful first. If reviews are provided, ground ' +
    'the pain points in them rather than inventing generic ones.\n\n' +
    `${langDirective(lang)} (Keep "tcvrArea" as the exact lowercase English token; ` +
    'only "title" and "evidence" follow the reply language.)\n' +
    jsonOnly(shape);

  const ctx: string[] = [];
  ctx.push(`Industry: ${industry && industry.trim() !== '' ? industry : '(not provided)'}`);
  ctx.push(
    `Customer type: ${customerType && customerType.trim() !== '' ? customerType : '(not provided)'}`,
  );
  if (reviews && reviews.length > 0) {
    ctx.push('Customer reviews / feedback:');
    for (const r of reviews) ctx.push(`- ${r}`);
  } else {
    ctx.push('Customer reviews / feedback: (none provided — reason from industry & customer type)');
  }

  const user = ctx.join('\n');

  return { system, user };
}

// ── 4. Explain / narrate the forecast ────────────────────────────────────────

export interface ExplainPromptInput {
  metrics: Record<string, unknown>;
  scenario?: Record<string, unknown>;
  lang: Lang;
  tone?: string;
}

// One-shot example that encodes the exact "boss-friendly" voice: plain, concrete,
// money-first, no jargon. The model must narrate the numbers it is GIVEN.
const EXPLAIN_ONESHOT =
  '你现在每月300个leads，成交率8%，ABV RM1,250，GP 30%。如果成交率提升到12%，不加广告，' +
  '每月Sales可以增加RM30,000，GP增加RM9,000。';

export function buildExplainPrompt(input: ExplainPromptInput): Prompt {
  const { metrics, scenario, lang, tone } = input;

  const toneLine =
    tone && tone.trim() !== ''
      ? `Additional tone guidance from the caller: ${tone}\n`
      : '';

  const system =
    `${TCVR_CONTEXT}\n\n` +
    'TASK: Narrate the provided revenue numbers for a busy small-business boss. Write ' +
    'in a plain, concrete, money-first voice with NO jargon. Lead with the money impact. ' +
    'Keep it short and punchy — the kind of explanation a boss instantly "gets".\n\n' +
    'STRICT RULE: You may ONLY use the numbers provided in the input. Do NOT invent, ' +
    'estimate, or add any figures that are not given. If a number is needed but missing, ' +
    'speak qualitatively instead of guessing.\n\n' +
    'Match this exact tone (one-shot example of the target voice):\n' +
    `"${EXPLAIN_ONESHOT}"\n\n` +
    toneLine +
    `${langDirective(lang)}\n` +
    'Respond with PLAIN TEXT only — a single short narrative. No JSON, no markdown, no ' +
    'bullet points unless they make the money clearer.';

  const parts: string[] = [];
  parts.push('Current metrics (use these exact numbers, do not change them):');
  parts.push(JSON.stringify(metrics));
  if (scenario && Object.keys(scenario).length > 0) {
    parts.push('Scenario / proposed change (narrate the impact of this):');
    parts.push(JSON.stringify(scenario));
  }
  const user = parts.join('\n');

  return { system, user };
}

// ── 5. vimiGoal draft ────────────────────────────────────────────────────────

export interface LeverInput {
  lever: string;
  expectedGpImpact: number;
}

export interface VimigoalPromptInput {
  topLevers: LeverInput[];
  metrics: Record<string, unknown>;
  horizonDays?: number;
  lang: Lang;
}

export function buildVimigoalPrompt(input: VimigoalPromptInput): Prompt {
  const { topLevers, metrics, horizonDays, lang } = input;

  const shape =
    '{"goalTitle":string,"metric":string,"target":string,"cadence":string,' +
    '"narrative":string,"rewardSuggestion":string}';

  const horizon = typeof horizonDays === 'number' ? horizonDays : 30;

  const system =
    `${TCVR_CONTEXT}\n\n` +
    'TASK: Turn the highest-impact TCVR lever(s) into ONE concrete, motivating team goal ' +
    'in the style of a "vimiGoal" (a gamified sales/performance goal a boss assigns to ' +
    'their team).\n' +
    '- goalTitle: a short, punchy goal title.\n' +
    '- metric: the single metric the team should move (e.g. 成交率 / close rate, leads, ABV).\n' +
    '- target: a concrete numeric target for that metric within the horizon, grounded in ' +
    'the provided metrics and the levers\' expected GP impact.\n' +
    `- cadence: how often progress is checked/reported (daily, weekly, etc.), suited to a ${horizon}-day horizon.\n` +
    '- narrative: 1–3 sentences in the boss-friendly, money-first, no-jargon voice that ' +
    'explains why this goal matters (tie it to the GP impact).\n' +
    '- rewardSuggestion: a motivating reward idea for the team if they hit the goal.\n\n' +
    'Base the target on the numbers provided; do not invent unrelated figures.\n\n' +
    `${langDirective(lang)}\n${jsonOnly(shape)}`;

  const leverLines = topLevers.map(
    (l) => `- lever=${l.lever}, expectedGpImpact=${l.expectedGpImpact}`,
  );

  const user =
    `Horizon (days): ${horizon}\n` +
    'Top levers (highest GP impact first):\n' +
    leverLines.join('\n') +
    '\nCurrent metrics:\n' +
    JSON.stringify(metrics);

  return { system, user };
}
