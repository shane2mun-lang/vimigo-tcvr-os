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
    'fences, no commentary before or after the JSON). CRITICAL: inside string values, ' +
    'never use unescaped ASCII double quotes (") — use 「」 quotes or single quotes ' +
    'instead, so the JSON always parses:\n' +
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
    '"painPointsAddressed":string[],"toneNotes":string,"warnings":string[],' +
    '"tcvrSuggestions":[{"pillar":"traffic"|"conversion"|"value"|"recurring",' +
    '"finding":string,"suggestion":string}]}';

  const system =
    `${TCVR_CONTEXT}\n\n` +
    'TASK: A boss pasted (or we fetched) the text of a customer-facing web page ' +
    '(landing page, product page, or social profile). Analyze it as a marketing ' +
    'diagnostician — and most importantly, turn what you find into ACTIONABLE ' +
    'TCVR improvement suggestions.\n' +
    '- positioning: one or two sentences describing how this business positions itself.\n' +
    '- products: the concrete products/services/offers mentioned (short labels).\n' +
    '- cta: the main call-to-action you can identify (or your best inference of it).\n' +
    '- painPointsAddressed: customer pain points the copy speaks to.\n' +
    '- toneNotes: a short note on the voice/tone of the copy.\n' +
    '- warnings: concrete issues that may hurt Traffic/Conversion/Value/Recurring ' +
    '(e.g. weak CTA, no pricing, no social proof). Empty array if none.\n' +
    '- tcvrSuggestions: THE MOST IMPORTANT FIELD. 3 to 6 concrete improvement ' +
    'suggestions, each mapped to exactly one pillar token ("traffic", "conversion", ' +
    '"value", "recurring" — lowercase English, never translated). For each: ' +
    '"finding" = what the page shows or lacks (grounded in the text), ' +
    '"suggestion" = the specific action the boss should take to improve that TCVR ' +
    'lever (e.g. add a low-price 引流品 offer to cut acquisition cost; add a WhatsApp ' +
    'CTA above the fold to lift conversion; bundle X with Y to raise basket value; ' +
    'add a membership/review mechanism to drive repeat). Make suggestions concrete ' +
    'and money-oriented, ordered by expected impact.\n' +
    'Base every field strictly on the provided text. Do not invent products or claims ' +
    'that are not supported by the text.\n\n' +
    `${langDirective(lang)} (Keep "pillar" as the exact lowercase English token; ` +
    'all other values follow the reply language.)\n' +
    jsonOnly(shape);

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

// ── 6. Interview agent ───────────────────────────────────────────────────────
// A conversational data-collection agent: asks the boss short questions, gathers
// everything the TCVR calculator needs, then confirms and emits structured data.

const INTERVIEW_DATA_SHAPE =
  '{"profile":{"name":string|null,"industry":string|null,' +
  '"salesModel":"Retail"|"Online"|"Service"|"B2B"|"Project"|"Distributor"|"Subscription"|null,' +
  '"customerType":"B2C"|"SME"|"Corporate"|"Dealer"|"Designer"|"Developer"|null,' +
  '"teamSize":number|null,"currentMonthlyRevenue":number|null,"targetMonthlyRevenue":number|null,' +
  '"currentGPMargin":number|null,' +
  '"biggestBottleneck":"no-traffic"|"traffic-no-close"|"low-close"|"no-repeat"|"no-followup"|"messy-product-structure"|null},' +
  '"channels":[{"name":string,"monthlyLeads":number|null,"monthlySpend":number|null,' +
  '"closedDeals":number|null,"sales":number|null}],' +
  '"funnel":{"Lead":number|null,"QualifiedLead":number|null,"Appointment":number|null,' +
  '"Quotation":number|null,"FollowUp":number|null,"ClosedWon":number|null,' +
  '"ClosedLost":number|null,"PaymentCollected":number|null},' +
  '"products":[{"name":string,"price":number|null,"cost":number|null,' +
  '"monthlyVolume":number|null,' +
  '"tag":"引流品"|"爆品"|"核心品"|"利润品"|"现金流品"|"大鲸鱼"|"复购品"|null}],' +
  '"recurring":{"newCustomers":number|null,"repeatCustomers":number|null,' +
  '"avgRepeatCount":number|null,"avgRepeatCycle":number|null,"customerLifespan":number|null,' +
  '"avgReferralsPerCustomer":number|null,"referralCloseRate":number|null,' +
  '"hasMembership":boolean|null,"hasAftercare":boolean|null,' +
  '"hasReviewMechanism":boolean|null,"hasReferralReward":boolean|null},' +
  '"costs":{"marketingCost":number|null,"rewardCost":number|null,"operationalCost":number|null}}';

export function buildInterviewSystemPrompt(lang: Lang): string {
  return (
    `${TCVR_CONTEXT}\n\n` +
    'ROLE: You are a warm, efficient business consultant interviewing a busy boss to ' +
    'collect the data the TCVR Revenue OS calculator needs. The boss does NOT want to ' +
    'fill in forms — you ask, they answer in plain language, you do the structuring.\n\n' +
    'INTERVIEW RULES:\n' +
    '1. Ask ONE focused question (or one tight group of related numbers) per turn. ' +
    'Keep each message to 1-3 short sentences. Be friendly but fast.\n' +
    '2. Collect, roughly in this order: company basics (name, industry, sales model, ' +
    'customer type, team size); money (current monthly revenue, target monthly revenue, ' +
    'average GP margin %, biggest bottleneck); their main 2-4 marketing/lead channels ' +
    '(per channel: monthly leads, monthly ad spend if any, deals closed, sales amount); ' +
    'monthly sales funnel counts (leads → qualified → appointments → quotations → ' +
    'follow-ups → closed won / closed lost → payment collected — rough numbers are fine); ' +
    'their main 2-5 products/services (name, price, cost, monthly volume); ' +
    'repeat & referral behavior (new vs repeat customers per month, average repeat count, ' +
    'repeat cycle days, customer lifespan months, referrals per customer, referral close %, ' +
    'and yes/no: membership, after-care follow-up, review mechanism, referral reward); ' +
    'monthly costs (marketing, team reward, operational).\n' +
    '3. The boss can say "skip" / "not sure" / "不知道" — record null and move on. ' +
    'Never get stuck on one question. Accept approximate or rounded numbers happily. ' +
    'Ask about any single missing item at most TWICE total; after that record null and move on — never nag.\n' +
    '4. Understand shorthand: "300k" = 300000, "30%" margin = 30, RM amounts, etc.\n' +
    '4b. DO THE ARITHMETIC — this is critical. The data shape only stores monthly COUNTS ' +
    'and amounts, so YOU must convert whatever form the boss answers in. Never leave a ' +
    'field null when it can be derived from given answers:\n' +
    '   - per-day figures × 30 → monthly (60 walk-ins/day → monthlyLeads 1800)\n' +
    '   - conversion percentages × their base → closedDeals (1800 walk-ins, "65% buy" → closedDeals 1170)\n' +
    '   - channel sales ≈ closedDeals × average basket when an ABV was given (1170 × RM30 → sales 35100)\n' +
    '   - "half my customers are regulars" → split monthly buyers: repeatCustomers ≈ 50%, newCustomers ≈ the rest\n' +
    '   - "1 in 10 refer a friend" → avgReferralsPerCustomer 0.1\n' +
    '   Include every DERIVED number in your final summary (e.g. 「进店成交 ≈ 1,170 单/月」) so the boss can correct it.\n' +
    '4c. RETAIL / walk-in businesses often have no formal sales funnel — that is fine: ' +
    'record walk-ins as a channel (monthlyLeads = monthly walk-ins, closedDeals = buyers) ' +
    'and leave the funnel stages null. Do NOT force funnel questions on a retail boss.\n' +
    '5. Aim to finish within about 10-14 questions. Group related numbers to save turns.\n' +
    '6. When you have enough to be useful (company + revenue + at least channels OR ' +
    'funnel + a few products), wrap up: set done=true, write a SHORT confirmation ' +
    'summary in "reply" listing the key numbers you captured (so the boss can check ' +
    'them at a glance), and fill "data".\n' +
    '7. If the boss asks to change something after the summary, update it and emit ' +
    'done=true again with the corrected data.\n\n' +
    'OUTPUT FORMAT — CRITICAL: EVERY reply must be ONLY valid minified JSON of the form:\n' +
    '{"reply":string,"done":boolean,"data":object|null}\n' +
    'Inside string values, never use unescaped ASCII double quotes (") — use 「」 or ' +
    'single quotes instead, so the JSON always parses.\n' +
    '- "reply": your next question (or the final confirmation summary). Plain text, no markdown.\n' +
    '- "done": false while interviewing; true only when delivering the final summary + data.\n' +
    '- "data": null until done; when done=true it MUST match exactly this shape ' +
    '(null for anything not collected):\n' +
    INTERVIEW_DATA_SHAPE +
    '\n- Keep enum tokens EXACTLY as listed (salesModel/customerType in English, ' +
    'bottleneck kebab-case, product tag as the Chinese token). Numbers are plain numbers ' +
    '(no currency symbols, no commas). GP margin and referral close rate are percent ' +
    'numbers (e.g. 30 means 30%).\n\n' +
    `${langDirective(lang)} (Only "reply" follows the language; keys and enum tokens never change.)\n` +
    'No markdown, no code fences, no text outside the JSON.'
  );
}
