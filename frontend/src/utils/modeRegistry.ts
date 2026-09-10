// ─────────────────────────────────────────────────────────────────────────────
//  Mode Registry — centralized management of the Game Mode Registry.
//
//  The registry is persisted in localStorage under GTF_REGISTRY_KEY.
//  DEFAULT_MODES (from constants/game.ts) seed the registry on first run.
//
//  V1 → V2 Migration:
//  - Non-destructive: old 'gtf_questions_level_X' keys are NOT deleted.
//  - A migration flag 'gtf_v2_migration_done' is set only after successful verify.
//  - Old keys continue to work as the fallback after migration.
// ─────────────────────────────────────────────────────────────────────────────

import type { GameMode, ModeId, LevelId } from '../types';
import { DEFAULT_MODES, LEVEL_ID_TO_MODE_ID } from '../constants/game';

// ─── Storage keys ─────────────────────────────────────────────────────────────

const GTF_REGISTRY_KEY      = 'gtf_mode_registry';
const GTF_MIGRATION_FLAG    = 'gtf_v2_migration_done';

// ─── Migration ────────────────────────────────────────────────────────────────

/**
 * Idempotent V1→V2 migration.
 *
 * Checks whether we have already migrated. If not, builds the new V2 registry
 * from DEFAULT_MODES and verifies it can be read back cleanly.
 * The old 'gtf_questions_level_X' keys are preserved untouched.
 * Sets the migration flag only when verification succeeds.
 */
export function runMigrationIfNeeded(): void {
  if (localStorage.getItem(GTF_MIGRATION_FLAG) === 'done') return;

  try {
    // Build a fresh registry if none exists
    const existing = localStorage.getItem(GTF_REGISTRY_KEY);
    if (!existing) {
      const registry = buildDefaultRegistry();
      localStorage.setItem(GTF_REGISTRY_KEY, JSON.stringify(registry));
    }

    // Verify: read it back and ensure all DEFAULT_MODES are present
    const verify = getRegistry();
    const ids = new Set(verify.map(m => m.id));
    const allPresent = DEFAULT_MODES.every(m => ids.has(m.id));
    if (!allPresent) {
      // Something went wrong; re-seed
      localStorage.setItem(GTF_REGISTRY_KEY, JSON.stringify(buildDefaultRegistry()));
    }

    // Migration complete — set flag
    localStorage.setItem(GTF_MIGRATION_FLAG, 'done');
    console.info('[GTF] V2 mode registry migration complete.');
  } catch (e) {
    console.warn('[GTF] Mode registry migration encountered an error:', e);
    // Do NOT set the flag — will retry on next load
  }
}

function buildDefaultRegistry(): GameMode[] {
  return DEFAULT_MODES.map((m, i) => ({ ...m, order: i + 1 }));
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Return the current registry, sorted by order.
 * Falls back to DEFAULT_MODES if the registry cannot be parsed.
 */
export function getRegistry(): GameMode[] {
  try {
    const raw = localStorage.getItem(GTF_REGISTRY_KEY);
    if (!raw) return buildDefaultRegistry();
    const parsed = JSON.parse(raw) as GameMode[];
    if (!Array.isArray(parsed) || parsed.length === 0) return buildDefaultRegistry();
    return [...parsed].sort((a, b) => a.order - b.order);
  } catch {
    return buildDefaultRegistry();
  }
}

/** Return only enabled modes, sorted by order. */
export function getEnabledModes(): GameMode[] {
  return getRegistry().filter(m => m.enabled);
}

/** Find a mode by its string ID, or undefined. */
export function getModeById(id: ModeId): GameMode | undefined {
  return getRegistry().find(m => m.id === id);
}

/**
 * Adaptation helper: look up a mode by its V1 numeric LevelId.
 * Returns the built-in GameMode that maps to this level, or undefined.
 */
export function getModeByLevelId(levelId: LevelId): GameMode | undefined {
  const modeId = LEVEL_ID_TO_MODE_ID[levelId];
  if (!modeId) return undefined;
  return getModeById(modeId);
}

// ─── Write ────────────────────────────────────────────────────────────────────

export function saveRegistry(modes: GameMode[]): void {
  try {
    localStorage.setItem(GTF_REGISTRY_KEY, JSON.stringify(modes));
  } catch (e) {
    console.error('[GTF Registry] Save failed:', e);
    alert('Could not save mode registry to localStorage. Storage may be full.');
  }
}

// ─── CRUD Operations ─────────────────────────────────────────────────────────

/** Enable or disable a mode. */
export function toggleModeEnabled(id: ModeId): void {
  const modes = getRegistry();
  const idx = modes.findIndex(m => m.id === id);
  if (idx === -1) return;
  modes[idx] = { ...modes[idx], enabled: !modes[idx].enabled };
  saveRegistry(modes);
}

/** Update metadata fields for a mode (name, description, icon, iconBg, timerSeconds, subtitle, countdownLabel). */
export function updateModeMetadata(id: ModeId, updates: Partial<Pick<GameMode,
  'name' | 'description' | 'icon' | 'iconBg' | 'timerSeconds' | 'subtitle' | 'countdownLabel'
>>): void {
  const modes = getRegistry();
  const idx = modes.findIndex(m => m.id === id);
  if (idx === -1) return;
  modes[idx] = { ...modes[idx], ...updates };
  saveRegistry(modes);
}

/** Reorder modes. Accepts a new ordered array of mode IDs. */
export function reorderModes(orderedIds: ModeId[]): void {
  const modes = getRegistry();
  const modeMap = new Map(modes.map(m => [m.id, m]));
  const reordered: GameMode[] = [];

  orderedIds.forEach((id, i) => {
    const mode = modeMap.get(id);
    if (mode) reordered.push({ ...mode, order: i + 1 });
  });

  // Re-append any modes not in orderedIds (shouldn't happen, but safety net)
  modes.forEach(m => {
    if (!orderedIds.includes(m.id)) {
      reordered.push({ ...m, order: reordered.length + 1 });
    }
  });

  saveRegistry(reordered);
}

/** Create a new custom mode from an existing template. Returns the new ModeId. */
export function createCustomMode(
  partial: Pick<GameMode, 'name' | 'description' | 'templateId' | 'icon' | 'iconBg' | 'timerSeconds' | 'subtitle' | 'countdownLabel'>
): ModeId {
  const modes = getRegistry();
  const id: ModeId = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const maxOrder = modes.reduce((max, m) => Math.max(max, m.order), 0);

  const newMode: GameMode = {
    ...partial,
    id,
    enabled: true,
    order: maxOrder + 1,
    source: 'CUSTOM',
  };

  saveRegistry([...modes, newMode]);
  return id;
}

/**
 * Duplicate an existing mode (built-in or custom).
 * The duplicate gets a new unique ID, copies all settings, and is marked CUSTOM.
 * Questions are NOT copied here — caller must copy question data separately.
 * Returns the new ModeId.
 */
export function duplicateMode(sourceId: ModeId): ModeId | null {
  const source = getModeById(sourceId);
  if (!source) return null;

  const modes = getRegistry();
  const newId: ModeId = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const maxOrder = modes.reduce((max, m) => Math.max(max, m.order), 0);

  const duplicate: GameMode = {
    ...source,
    id: newId,
    name: `${source.name} (Copy)`,
    source: 'CUSTOM',
    enabled: true,
    order: maxOrder + 1,
    legacyLevelId: undefined,  // duplicates never inherit numeric level IDs
  };

  saveRegistry([...modes, duplicate]);
  return newId;
}

/** Delete a custom mode permanently. Built-in modes cannot be deleted. */
export function deleteCustomMode(id: ModeId): boolean {
  const modes = getRegistry();
  const mode = modes.find(m => m.id === id);
  if (!mode || mode.source !== 'CUSTOM') return false;

  saveRegistry(modes.filter(m => m.id !== id));
  return true;
}

/**
 * Reset a built-in mode to its default settings.
 * Does NOT touch question data — only resets the GameMode definition.
 */
export function resetBuiltInMode(id: ModeId): void {
  const defaultMode = DEFAULT_MODES.find(m => m.id === id);
  if (!defaultMode) return; // not a built-in ID

  const modes = getRegistry();
  const idx = modes.findIndex(m => m.id === id);
  if (idx === -1) return;

  // Keep the current order position; restore everything else
  const currentOrder = modes[idx].order;
  modes[idx] = { ...defaultMode, order: currentOrder };
  saveRegistry(modes);
}
