import { Router } from 'express';
import { config } from '../config';
import { aiGuard, validateBody, callClaudeJson } from '../guard';
import { scanRequestSchema } from '../schema';
import { fetchReadableText, type FetchFailReason } from '../extract';
import { buildScanPrompt } from '../prompts';

const router = Router();

interface ScanModelResult {
  positioning: string;
  products: string[];
  cta: string;
  painPointsAddressed: string[];
  toneNotes: string;
  warnings: string[];
}

const FETCH_FAIL_MESSAGE: Record<FetchFailReason, string> = {
  timeout: 'The page took too long to respond. Paste the page content instead.',
  blocked: 'We could not access the page (it may be blocked). Paste the page content instead.',
  js_heavy: 'This page renders with JavaScript and has no readable text to fetch. Paste the page content instead.',
  too_short: 'There was not enough readable text on the page. Paste the full page content instead.',
  bad_url: 'That does not look like a valid URL. Check it or paste the page content instead.',
};

router.post(
  '/',
  aiGuard(async (req, res) => {
    const body = validateBody(scanRequestSchema, req, res);
    if (body === null) return;

    let content: string;
    let source: 'fetched' | 'pasted';

    const pasted = typeof body.pastedContent === 'string' ? body.pastedContent.trim() : '';
    if (pasted !== '') {
      content = pasted;
      source = 'pasted';
    } else {
      // body validation guarantees url is present & non-empty when pastedContent is empty.
      const url = (body.url ?? '').trim();
      const fetched = await fetchReadableText(url, config.scanTimeoutMs);
      if (!fetched.ok || fetched.text === undefined) {
        const reason: FetchFailReason = fetched.reason ?? 'blocked';
        res.status(200).json({
          degraded: true,
          needsPaste: true,
          reason,
          model: null,
          message: FETCH_FAIL_MESSAGE[reason],
        });
        return;
      }
      content = fetched.text;
      source = 'fetched';
    }

    const { system, user } = buildScanPrompt({ content, source, lang: body.lang });
    const { data, model } = await callClaudeJson<ScanModelResult>({
      tier: 'fast',
      system,
      user,
      maxTokens: 1536,
    });

    res.status(200).json({
      degraded: false,
      model,
      source,
      positioning: data.positioning ?? '',
      products: Array.isArray(data.products) ? data.products : [],
      cta: data.cta ?? '',
      painPointsAddressed: Array.isArray(data.painPointsAddressed) ? data.painPointsAddressed : [],
      toneNotes: data.toneNotes ?? '',
      warnings: Array.isArray(data.warnings) ? data.warnings : [],
    });
  }),
);

export default router;
