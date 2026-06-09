import { Router } from 'express';
import { aiGuard, validateBody, callClaudeJson } from '../guard';
import { vimigoalRequestSchema } from '../schema';
import { buildVimigoalPrompt } from '../prompts';

const router = Router();

interface VimigoalModelResult {
  goalTitle?: unknown;
  metric?: unknown;
  target?: unknown;
  cadence?: unknown;
  narrative?: unknown;
  rewardSuggestion?: unknown;
}

function asString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return '';
}

router.post(
  '/',
  aiGuard(async (req, res) => {
    const body = validateBody(vimigoalRequestSchema, req, res);
    if (body === null) return;

    const { system, user } = buildVimigoalPrompt({
      topLevers: body.topLevers,
      metrics: body.metrics,
      horizonDays: body.horizonDays,
      lang: body.lang,
    });

    const { data, model } = await callClaudeJson<VimigoalModelResult>({
      tier: 'smart',
      system,
      user,
      maxTokens: 1024,
    });

    res.status(200).json({
      degraded: false,
      model,
      goalTitle: asString(data.goalTitle),
      metric: asString(data.metric),
      target: asString(data.target),
      cadence: asString(data.cadence),
      narrative: asString(data.narrative),
      rewardSuggestion: asString(data.rewardSuggestion),
    });
  }),
);

export default router;
