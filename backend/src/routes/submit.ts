// POST /api/submit — sync a student's TCVR data to the teacher's Notion database.
// The backend re-runs the diagnostic engine on the submitted input (single source
// of truth — client math is never trusted) and upserts the student's Notion row.

import { Router } from 'express';
import type { Request, Response } from 'express';
import { validateBody } from '../guard';
import { submitRequestSchema } from '../schema';
import { hasNotion, upsertStudent } from '../notion';
import { analyze } from '../../../frontend/src/engine';
import type { TCVRInput } from '../../../frontend/src/engine/types';

const router = Router();

/** Defensive shaping: the input comes from our own frontend, but never trust shape. */
function coerceInput(raw: Record<string, unknown>): TCVRInput {
  const obj = (x: unknown): Record<string, unknown> =>
    x && typeof x === 'object' && !Array.isArray(x) ? (x as Record<string, unknown>) : {};
  const arr = (x: unknown): unknown[] => (Array.isArray(x) ? x : []);
  const profile = obj(raw.profile);
  if (typeof profile.salesModel !== 'string') profile.salesModel = 'Retail';
  return {
    profile,
    channels: arr(raw.channels),
    funnel: arr(raw.funnel),
    products: arr(raw.products),
    recurring: obj(raw.recurring),
    costs: obj(raw.costs),
  } as unknown as TCVRInput;
}

router.post('/', (req: Request, res: Response): void => {
  if (!hasNotion) {
    res.status(503).json({ ok: false, code: 'no_notion', message: 'Notion sync not configured' });
    return;
  }
  const body = validateBody(submitRequestSchema, req, res);
  if (body === null) return;

  void (async () => {
    try {
      const input = coerceInput(body.input);
      const result = analyze(input);
      const upserted = await upsertStudent({
        pageId: body.pageId ?? null,
        student: body.student,
        input,
        result,
        syncs: body.syncs ?? 1,
        snapshot: body.snapshot === true,
      });
      res.status(200).json({ ok: true, pageId: upserted.pageId, url: upserted.url ?? null });
    } catch (err) {
      if (res.headersSent) return;
      const message = err instanceof Error ? err.message : 'Notion sync failed';
      res.status(502).json({ ok: false, code: 'sync_failed', message });
    }
  })();
});

export default router;
