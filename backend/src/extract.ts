import { Readability } from '@mozilla/readability';
import { JSDOM, VirtualConsole } from 'jsdom';

export type FetchFailReason = 'timeout' | 'blocked' | 'js_heavy' | 'too_short' | 'bad_url';

export interface FetchReadableResult {
  ok: boolean;
  text?: string;
  reason?: FetchFailReason;
}

const MIN_ARTICLE_CHARS = 400;

const DESKTOP_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/**
 * Fetches a URL and extracts readable article text using Readability.
 *
 * Never throws. On any failure returns `{ ok: false, reason }` where reason is:
 *  - 'bad_url'   : the URL is malformed
 *  - 'timeout'   : the request aborted (AbortSignal.timeout)
 *  - 'blocked'   : non-OK HTTP status or a network/fetch error
 *  - 'js_heavy'  : page parsed but yielded almost no extractable text (likely SPA)
 *  - 'too_short' : page parsed but the article is below the minimum length
 *
 * On success returns `{ ok: true, text }`.
 */
export async function fetchReadableText(
  url: string,
  timeoutMs: number,
): Promise<FetchReadableResult> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { ok: false, reason: 'bad_url' };
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { ok: false, reason: 'bad_url' };
  }

  let html: string;
  try {
    const response = await fetch(parsed.toString(), {
      signal: AbortSignal.timeout(timeoutMs),
      redirect: 'follow',
      headers: {
        'User-Agent': DESKTOP_USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,zh;q=0.8',
      },
    });

    if (!response.ok) {
      return { ok: false, reason: 'blocked' };
    }
    html = await response.text();
  } catch (err) {
    if (err instanceof DOMException && err.name === 'TimeoutError') {
      return { ok: false, reason: 'timeout' };
    }
    if (err instanceof Error && err.name === 'TimeoutError') {
      return { ok: false, reason: 'timeout' };
    }
    return { ok: false, reason: 'blocked' };
  }

  // Parse + extract. jsdom can emit noisy errors for malformed pages; silence them.
  try {
    const virtualConsole = new VirtualConsole();
    virtualConsole.on('error', () => {
      /* swallow jsdom resource/parse noise */
    });
    virtualConsole.on('jsdomError', () => {
      /* swallow jsdom internal errors (e.g. unimplemented CSS) */
    });

    const dom = new JSDOM(html, { url: parsed.toString(), virtualConsole });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    const content = (article?.textContent ?? '').replace(/\s+/g, ' ').trim();

    if (content.length === 0) {
      // Nothing extractable at all — almost always a JS-rendered SPA shell.
      return { ok: false, reason: 'js_heavy' };
    }
    if (content.length < MIN_ARTICLE_CHARS) {
      return { ok: false, reason: 'too_short' };
    }

    return { ok: true, text: content };
  } catch {
    return { ok: false, reason: 'blocked' };
  }
}
