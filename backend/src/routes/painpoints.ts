import { Router } from 'express';
import { aiGuard, validateBody, callClaudeJson } from '../guard';
import { painPointsRequestSchema } from '../schema';
import { buildPainPointsPrompt, TCVR_AREAS } from '../prompts';

const router = Router();

type TcvrArea = (typeof TCVR_AREAS)[number];

interface RawPainPoint {
  title?: unknown;
  evidence?: unknown;
  tcvrArea?: unknown;
}

interface PainPointsModelResult {
  painPoints: RawPainPoint[];
}

const AREA_SET = new Set<string>(TCVR_AREAS);

function coerceArea(value: unknown): TcvrArea {
  if (typeof value === 'string' && AREA_SET.has(value)) {
    return value as TcvrArea;
  }
  return 'conversion';
}

router.post(
  '/',
  aiGuard(async (req, res) => {
    const body = validateBody(painPointsRequestSchema, req, res);
    if (body === null) return;

    const { system, user } = buildPainPointsPrompt({
      industry: body.industry,
      customerType: body.customerType,
      reviews: body.reviews,
      lang: body.lang,
    });

    const { data, model } = await callClaudeJson<PainPointsModelResult>({
      tier: 'fast',
      system,
      user,
      maxTokens: 1536,
    });

    const raw = Array.isArray(data.painPoints) ? data.painPoints : [];
    const painPoints = raw.map((p) => ({
      title: typeof p.title === 'string' ? p.title : '',
      evidence: typeof p.evidence === 'string' ? p.evidence : '',
      tcvrArea: coerceArea(p.tcvrArea),
    }));

    res.status(200).json({
      degraded: false,
      model,
      painPoints,
    });
  }),
);

export default router;
