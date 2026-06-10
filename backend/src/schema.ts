import { z } from 'zod';

// Shared language field used by every endpoint.
const langSchema = z.enum(['zh', 'en']);

// ── 1. scan ──────────────────────────────────────────────────────────────────
export const scanRequestSchema = z
  .object({
    url: z.string().optional(),
    pastedContent: z.string().nullable().optional(),
    lang: langSchema,
  })
  .refine(
    (body) => {
      const hasUrl = typeof body.url === 'string' && body.url.trim() !== '';
      const hasPaste =
        typeof body.pastedContent === 'string' && body.pastedContent.trim() !== '';
      return hasUrl || hasPaste;
    },
    { message: 'Provide either a non-empty url or non-empty pastedContent.' },
  );
export type ScanRequest = z.infer<typeof scanRequestSchema>;

// ── 2. categorize ────────────────────────────────────────────────────────────
const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number().optional(),
  cost: z.number().optional(),
});

export const categorizeRequestSchema = z.object({
  products: z.array(productSchema).min(1),
  lang: langSchema,
});
export type CategorizeRequest = z.infer<typeof categorizeRequestSchema>;

// ── 3. painpoints ────────────────────────────────────────────────────────────
export const painPointsRequestSchema = z.object({
  industry: z.string().optional(),
  customerType: z.string().optional(),
  reviews: z.array(z.string()).optional(),
  lang: langSchema,
});
export type PainPointsRequest = z.infer<typeof painPointsRequestSchema>;

// ── 4. explain ───────────────────────────────────────────────────────────────
// metrics is an open bag of numbers (plus possibly other values); scenario is any object.
export const explainRequestSchema = z.object({
  metrics: z.record(z.string(), z.unknown()),
  scenario: z.record(z.string(), z.unknown()).optional(),
  lang: langSchema,
  tone: z.string().optional(),
});
export type ExplainRequest = z.infer<typeof explainRequestSchema>;

// ── 5. vimigoal ──────────────────────────────────────────────────────────────
const leverSchema = z.object({
  lever: z.string(),
  expectedGpImpact: z.number(),
});

export const vimigoalRequestSchema = z.object({
  topLevers: z.array(leverSchema).min(1),
  metrics: z.record(z.string(), z.unknown()),
  horizonDays: z.number().optional(),
  lang: langSchema,
});
export type VimigoalRequest = z.infer<typeof vimigoalRequestSchema>;

// ── 6. interview ─────────────────────────────────────────────────────────────
const chatTurnSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000),
});

export const interviewRequestSchema = z.object({
  messages: z.array(chatTurnSchema).min(1).max(60),
  lang: langSchema,
});
export type InterviewRequest = z.infer<typeof interviewRequestSchema>;
