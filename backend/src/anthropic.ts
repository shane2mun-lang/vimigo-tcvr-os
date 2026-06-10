import Anthropic from '@anthropic-ai/sdk';
import { config } from './config';

export type Tier = 'fast' | 'smart';

export interface CallClaudeParams {
  tier: Tier;
  system: string;
  user: string;
  maxTokens?: number;
}

export interface CallClaudeResult {
  text: string;
  model: string;
}

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client === null) {
    client = new Anthropic({ apiKey: config.anthropicKey });
  }
  return client;
}

function modelForTier(tier: Tier): string {
  return tier === 'smart' ? config.modelSmart : config.modelFast;
}

/**
 * Calls Claude with a system + single user message and returns the concatenated
 * text from all text content blocks. Throws on SDK errors so callers can map them
 * to a 502 response.
 */
export async function callClaude(params: CallClaudeParams): Promise<CallClaudeResult> {
  const { tier, system, user, maxTokens = 2048 } = params;
  const model = modelForTier(tier);

  const response = await getClient().messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();

  return { text, model: response.model };
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface CallClaudeChatParams {
  tier: Tier;
  system: string;
  messages: ChatTurn[];
  maxTokens?: number;
}

/**
 * Multi-turn variant of callClaude — passes a full conversation history. Used by
 * the interview agent. Throws on SDK errors so callers can map them to a 502.
 */
export async function callClaudeChat(params: CallClaudeChatParams): Promise<CallClaudeResult> {
  const { tier, system, messages, maxTokens = 2048 } = params;
  const model = modelForTier(tier);

  const response = await getClient().messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages,
  });

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();

  return { text, model: response.model };
}

/**
 * Strips ```json (or bare ```) fences from a model response and parses the JSON.
 * Also tolerates leading/trailing prose by extracting the outermost {...} or [...]
 * span. Throws if the result is not valid JSON.
 */
export function extractJson<T>(text: string): T {
  let cleaned = text.trim();

  // Remove a leading fence (```json / ``` ) and a trailing fence if present.
  const fenceMatch = cleaned.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i);
  if (fenceMatch && fenceMatch[1] !== undefined) {
    cleaned = fenceMatch[1].trim();
  } else {
    // No wrapping fence; strip any stray fence markers.
    cleaned = cleaned.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  }

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Fall back to extracting the outermost JSON object/array span.
    const firstObj = cleaned.indexOf('{');
    const firstArr = cleaned.indexOf('[');
    const candidates: number[] = [firstObj, firstArr].filter((i) => i >= 0);
    if (candidates.length > 0) {
      const start = Math.min(...candidates);
      const openChar = cleaned[start];
      const closeChar = openChar === '{' ? '}' : ']';
      const end = cleaned.lastIndexOf(closeChar);
      if (end > start) {
        const span = cleaned.slice(start, end + 1);
        return JSON.parse(span) as T;
      }
    }
    throw new Error('Failed to parse JSON from model response');
  }
}
