import { Router } from 'express';
import { aiGuard, validateBody } from '../guard';
import { callClaudeChat, extractJson, type ChatTurn } from '../anthropic';
import { interviewRequestSchema } from '../schema';
import { buildInterviewSystemPrompt } from '../prompts';

const router = Router();

interface InterviewModelResult {
  reply: string;
  done: boolean;
  data: Record<string, unknown> | null;
}

/**
 * POST /api/ai/interview — one turn of the data-collection interview.
 * Request:  { lang, messages: [{role:'user'|'assistant', content}] }  (full history,
 *           first message is the user's opener, e.g. "START").
 * Response: { degraded:false, model, reply, done, data|null }
 */
router.post(
  '/',
  aiGuard(async (req, res) => {
    const body = validateBody(interviewRequestSchema, req, res);
    if (body === null) return;

    const system = buildInterviewSystemPrompt(body.lang);

    // The Anthropic API requires the first message to be from the user and roles to
    // alternate; the frontend always sends a user opener, so pass history through.
    const messages: ChatTurn[] = body.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const first = await callClaudeChat({ tier: 'smart', system, messages, maxTokens: 3000 });

    let parsed: InterviewModelResult;
    try {
      parsed = extractJson<InterviewModelResult>(first.text);
    } catch {
      // One repair retry: demand valid JSON only.
      const repair = await callClaudeChat({
        tier: 'smart',
        system,
        messages: [
          ...messages,
          { role: 'assistant', content: first.text },
          {
            role: 'user',
            content:
              'Your previous reply could not be parsed. Respond again with ONLY valid ' +
              'minified JSON of the form {"reply":string,"done":boolean,"data":object|null}.',
          },
        ],
        maxTokens: 3000,
      });
      parsed = extractJson<InterviewModelResult>(repair.text);
    }

    res.status(200).json({
      degraded: false,
      model: first.model,
      reply: typeof parsed.reply === 'string' ? parsed.reply : '',
      done: parsed.done === true,
      data: parsed.done === true && parsed.data && typeof parsed.data === 'object' ? parsed.data : null,
    });
  }),
);

export default router;
