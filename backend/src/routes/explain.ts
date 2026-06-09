import { Router } from 'express';
import { aiGuard, validateBody } from '../guard';
import { callClaude } from '../anthropic';
import { explainRequestSchema } from '../schema';
import { buildExplainPrompt } from '../prompts';

const router = Router();

// Explain returns a plain-text narrative (not JSON), so it calls Claude directly
// rather than going through the JSON-repair path.
router.post(
  '/',
  aiGuard(async (req, res) => {
    const body = validateBody(explainRequestSchema, req, res);
    if (body === null) return;

    const { system, user } = buildExplainPrompt({
      metrics: body.metrics,
      scenario: body.scenario,
      lang: body.lang,
      tone: body.tone,
    });

    const { text, model } = await callClaude({
      tier: 'smart',
      system,
      user,
      maxTokens: 1024,
    });

    res.status(200).json({
      degraded: false,
      model,
      narrative: text,
    });
  }),
);

export default router;
