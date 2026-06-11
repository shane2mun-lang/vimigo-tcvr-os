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
    // Fall back to the FIRST balanced JSON object/array. A first-{ to last-}
    // span breaks when the model emits two JSON objects back-to-back or trailing
    // prose containing braces — a balanced scan (string-aware) handles both.
    const balanced = firstBalancedJson(cleaned);
    if (balanced !== null) {
      return JSON.parse(balanced) as T;
    }
    throw new Error('Failed to parse JSON from model response');
  }
}

/** Returns the first balanced {...} or [...] span in `s`, respecting strings/escapes. */
function firstBalancedJson(s: string): string | null {
  const firstObj = s.indexOf('{');
  const firstArr = s.indexOf('[');
  const starts = [firstObj, firstArr].filter((i) => i >= 0);
  if (starts.length === 0) return null;
  const start = Math.min(...starts);

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{' || ch === '[') depth++;
    else if (ch === '}' || ch === ']') {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
}
