import type { Request, Response } from 'express';
import type { ZodType } from 'zod';
import { config } from './config';
import { callClaude, extractJson, type CallClaudeParams } from './anthropic';

/**
 * Shared envelope helpers + the aiGuard wrapper.
 *
 * Every /api/ai route returns a JSON body that always includes `degraded:boolean`
 * and `model:string|null`. aiGuard centralizes the two cross-cutting concerns:
 *   1. If no API key is configured -> 503 { degraded:true, model:null, code:'no_key' }.
 *   2. Any error thrown by the handler -> 502 { degraded:true, model:null, code:'ai_failed' }.
 *
 * A handler that wants different non-error behavior (e.g. the scan endpoint's
 * 200 + needsPaste fetch-failure path) simply returns normally; only THROWN
 * errors are mapped to 502.
 */

export interface NoKeyBody {
  degraded: true;
  model: null;
  code: 'no_key';
  message: string;
}

export interface AiFailedBody {
  degraded: true;
  model: null;
  code: 'ai_failed';
  message: string;
}

export type AiGuardHandler = (req: Request, res: Response) => Promise<void>;

export function aiGuard(handler: AiGuardHandler): (req: Request, res: Response) => void {
  return (req: Request, res: Response): void => {
    if (!config.hasKey) {
      const body: NoKeyBody = {
        degraded: true,
        model: null,
        code: 'no_key',
        message: 'AI key not configured',
      };
      res.status(503).json(body);
      return;
    }

    handler(req, res).catch((err: unknown) => {
      // If the handler already sent a response, don't try to send another.
      if (res.headersSent) return;
      const message = err instanceof Error ? err.message : 'AI request failed';
      const body: AiFailedBody = {
        degraded: true,
        model: null,
        code: 'ai_failed',
        message,
      };
      res.status(502).json(body);
    });
  };
}

/**
 * Validates a request body against a zod schema. On failure, sends a 400 with a
 * helpful message and returns null so the caller can early-return. On success
 * returns the parsed, typed value.
 */
export function validateBody<T>(
  schema: ZodType<T>,
  req: Request,
  res: Response,
): T | null {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.') || '(body)'}: ${i.message}`)
      .join('; ');
    res.status(400).json({
      degraded: true,
      model: null,
      code: 'bad_request',
      message: issues || 'Invalid request body',
    });
    return null;
  }
  return result.data;
}

/**
 * Calls Claude expecting a JSON response, parses it, and does ONE repair retry
 * (re-prompting "return valid JSON only") if the first parse fails. Throws if the
 * repair attempt also fails — aiGuard maps that to a 502.
 */
export async function callClaudeJson<T>(params: CallClaudeParams): Promise<{ data: T; model: string }> {
  const first = await callClaude(params);
  try {
    return { data: extractJson<T>(first.text), model: first.model };
  } catch {
    // One repair attempt: feed back the bad output and demand valid JSON only.
    const repair = await callClaude({
      ...params,
      user:
        params.user +
        '\n\nYour previous reply could not be parsed as JSON. ' +
        'Return valid JSON only — no markdown, no code fences, no commentary. ' +
        'Previous reply was:\n' +
        first.text,
    });
    return { data: extractJson<T>(repair.text), model: repair.model };
  }
}
