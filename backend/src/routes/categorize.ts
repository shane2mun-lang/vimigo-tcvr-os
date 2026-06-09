import { Router } from 'express';
import { aiGuard, validateBody, callClaudeJson } from '../guard';
import { categorizeRequestSchema } from '../schema';
import { buildCategorizePrompt, PRODUCT_TAGS } from '../prompts';

const router = Router();

type ProductTag = (typeof PRODUCT_TAGS)[number];

interface RawTag {
  id?: unknown;
  tag?: unknown;
  confidence?: unknown;
  reason?: unknown;
}

interface CategorizeModelResult {
  tags: RawTag[];
}

const TAG_SET = new Set<string>(PRODUCT_TAGS);

function coerceTag(value: unknown): ProductTag {
  if (typeof value === 'string' && TAG_SET.has(value)) {
    return value as ProductTag;
  }
  // Fall back to a sensible default if the model returned an off-list token.
  return '核心品';
}

function clampConfidence(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0.5;
  return Math.min(1, Math.max(0, n));
}

router.post(
  '/',
  aiGuard(async (req, res) => {
    const body = validateBody(categorizeRequestSchema, req, res);
    if (body === null) return;

    const { system, user } = buildCategorizePrompt({
      products: body.products,
      lang: body.lang,
    });

    const { data, model } = await callClaudeJson<CategorizeModelResult>({
      tier: 'fast',
      system,
      user,
      maxTokens: 1536,
    });

    const rawTags = Array.isArray(data.tags) ? data.tags : [];
    const tags = rawTags.map((t) => ({
      id: typeof t.id === 'string' ? t.id : String(t.id ?? ''),
      tag: coerceTag(t.tag),
      confidence: clampConfidence(t.confidence),
      reason: typeof t.reason === 'string' ? t.reason : '',
    }));

    res.status(200).json({
      degraded: false,
      model,
      tags,
    });
  }),
);

export default router;
