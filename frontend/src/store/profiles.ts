// Named company profiles (localStorage) + JSON import/export — the durable backup.

import { nanoid } from 'nanoid'
import type { TCVRInput } from '@/engine/types'
import { emptyFunnel } from './sample'
import { downloadJSON, slugify } from '@/lib/download'

const KEY = 'tcvr-os-profiles-v1'

export interface SavedProfile {
  id: string
  name: string
  savedAt: number
  input: TCVRInput
}

export function listProfiles(): SavedProfile[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const arr = JSON.parse(raw) as SavedProfile[]
    return Array.isArray(arr) ? arr.sort((a, b) => b.savedAt - a.savedAt) : []
  } catch {
    return []
  }
}

function writeAll(profiles: SavedProfile[]): void {
  localStorage.setItem(KEY, JSON.stringify(profiles))
}

export function saveProfile(name: string, input: TCVRInput, now: number): SavedProfile {
  const profiles = listProfiles()
  const existing = profiles.find((p) => p.name === name)
  const record: SavedProfile = { id: existing?.id ?? nanoid(8), name, savedAt: now, input }
  const next = existing
    ? profiles.map((p) => (p.id === existing.id ? record : p))
    : [record, ...profiles]
  writeAll(next)
  return record
}

export function deleteProfile(id: string): void {
  writeAll(listProfiles().filter((p) => p.id !== id))
}

export function exportProfileJSON(input: TCVRInput, name: string, now: number): void {
  downloadJSON({ version: 1, savedAt: now, name, input }, `tcvr-${slugify(name)}.json`)
}

/** Parse + validate an imported file into a TCVRInput, coercing missing pieces. */
export async function importProfileJSON(file: File): Promise<{ input: TCVRInput; name?: string }> {
  const text = await file.text()
  const data = JSON.parse(text) as Record<string, unknown>
  const raw = (data.input ?? data) as Record<string, unknown>

  const profile = raw.profile as TCVRInput['profile'] | undefined
  if (!profile || typeof profile !== 'object') throw new Error('Invalid file: missing company profile.')
  if (!profile.salesModel) profile.salesModel = 'Retail'

  const input: TCVRInput = {
    profile,
    channels: Array.isArray(raw.channels) ? (raw.channels as TCVRInput['channels']) : [],
    funnel: Array.isArray(raw.funnel) && raw.funnel.length ? (raw.funnel as TCVRInput['funnel']) : emptyFunnel(),
    products: Array.isArray(raw.products) ? (raw.products as TCVRInput['products']) : [],
    recurring: (raw.recurring as TCVRInput['recurring']) ?? {},
    costs: (raw.costs as TCVRInput['costs']) ?? {},
  }
  return { input, name: typeof data.name === 'string' ? data.name : profile.name }
}
