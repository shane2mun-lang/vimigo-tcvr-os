import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from './config';

import scanRouter from './routes/scan';
import categorizeRouter from './routes/categorize';
import painpointsRouter from './routes/painpoints';
import explainRouter from './routes/explain';
import vimigoalRouter from './routes/vimigoal';
import { passwordGate } from './gate';

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Health check — always works, even when the AI key is absent, so the server can
// boot and report readiness in any environment.
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, hasKey: config.hasKey });
});

// Password gate — active ONLY when SITE_PASSWORD is set (the public deploy). Health
// stays open above for monitoring; everything else (the app + the API) is gated.
const SITE_PASSWORD = (process.env.SITE_PASSWORD ?? '').trim();
if (SITE_PASSWORD) {
  app.use(passwordGate(SITE_PASSWORD));
}

// AI routes. Each router guards itself (no-key -> 503, errors -> 502).
app.use('/api/ai/scan', scanRouter);
app.use('/api/ai/categorize', categorizeRouter);
app.use('/api/ai/painpoints', painpointsRouter);
app.use('/api/ai/explain', explainRouter);
app.use('/api/ai/vimigoal', vimigoalRouter);

// In production, serve the built frontend and SPA-fallback to index.html for any
// non-/api route. The repo layout is <root>/frontend/dist and <root>/backend/src,
// so dist sits at ../../frontend/dist relative to this file.
if (process.env.NODE_ENV === 'production') {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const distDir = path.resolve(here, '../../frontend/dist');

  app.use(express.static(distDir));

  // SPA fallback: anything that isn't an /api/* path returns index.html.
  // Use a RegExp (not '*') so Express 4's path parser doesn't choke, and exclude
  // /api so unknown API routes still 404 as JSON-less 404s rather than the SPA.
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(
    `[vimigo-tcvr-os] backend listening on http://localhost:${config.port} ` +
      `(hasKey=${config.hasKey}, NODE_ENV=${process.env.NODE_ENV ?? 'development'})`,
  );
});

export { app };
