import { config as loadEnv } from 'dotenv';
import path from 'node:path';

// The backend lives in <root>/backend, and the .env file lives in the repo root.
// Load the root .env first (explicit path), then fall back to a default lookup so
// the backend also works if run standalone with its own local .env.
loadEnv({ path: path.resolve(process.cwd(), '../.env') });
loadEnv();

function readString(name: string, fallback: string): string {
  const value = process.env[name];
  return value !== undefined && value.trim() !== '' ? value : fallback;
}

function readInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const anthropicKey = (process.env.ANTHROPIC_API_KEY ?? '').trim();

export interface AppConfig {
  port: number;
  anthropicKey: string;
  modelSmart: string;
  modelFast: string;
  scanTimeoutMs: number;
  hasKey: boolean;
}

export const config: AppConfig = {
  port: readInt('PORT', 3001),
  anthropicKey,
  modelSmart: readString('MODEL_SMART', 'claude-opus-4-8'),
  modelFast: readString('MODEL_FAST', 'claude-sonnet-4-6'),
  scanTimeoutMs: readInt('SCAN_FETCH_TIMEOUT_MS', 8000),
  hasKey: anthropicKey.length > 0,
};
