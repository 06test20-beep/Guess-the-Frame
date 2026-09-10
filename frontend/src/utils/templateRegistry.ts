// ─────────────────────────────────────────────────────────────────────────────
//  Template Registry — source of truth for all supported question templates.
//
//  HOW TO ADD A FUTURE TEMPLATE:
//  1. Add a new entry to TEMPLATE_REGISTRY with a unique key.
//  2. TemplateId automatically expands to include it (no manual union changes).
//  3. Add any template-specific question schema fields to StoredQuestion.
//  4. Add a renderer case in AdminPage and GameplayPage.
//
//  Current supported templates: frame, eye, dialogue, year.
//  Future templates (audio, emoji, choice, poster-duel, etc.) can be added
//  to this registry without another major architectural migration.
// ─────────────────────────────────────────────────────────────────────────────

export interface TemplateDefinition {
  /** Stable unique template identifier */
  id: string;
  /** Human-readable template name shown in Admin UI */
  name: string;
  /** Short description of what kind of questions this template supports */
  description: string;
  /**
   * Which question fields are relevant for this template.
   * Used by the Admin question editor to show/hide fields.
   */
  fields: {
    image?: boolean;          // primary image (frame crop / eye crop)
    fullImage?: boolean;      // secondary reveal image (eye only)
    dialogue?: boolean;       // text dialogue/quote input
    hint?: boolean;           // optional hint text
    year?: boolean;           // release year numeric input
    answer: true;             // always required
  };
  /** Default timer in seconds for modes using this template */
  defaultTimerSeconds: number;
}

/**
 * Centralized template registry.
 *
 * TemplateId is derived from the keys of this object, providing strong
 * type safety for all currently supported templates while allowing
 * future templates to be added by simply inserting a new key here.
 */
export const TEMPLATE_REGISTRY = {
  frame: {
    id: 'frame',
    name: 'Image Frame',
    description: 'Show a movie frame / image and guess the film.',
    fields: { image: true, hint: false, year: true, answer: true },
    defaultTimerSeconds: 30,
  },
  eye: {
    id: 'eye',
    name: 'Dual Image (Guess The Eyes)',
    description: 'Show a cropped eye image during the question; reveal the full face image on answer.',
    fields: { image: true, fullImage: true, hint: true, year: false, answer: true },
    defaultTimerSeconds: 25,
  },
  dialogue: {
    id: 'dialogue',
    name: 'Dialogue / Quote',
    description: 'Display a movie dialogue or quote and guess the film.',
    fields: { dialogue: true, hint: true, year: true, answer: true },
    defaultTimerSeconds: 30,
  },
  year: {
    id: 'year',
    name: 'Numeric / Year',
    description: 'Show a frame and guess the release year of the movie.',
    fields: { image: true, year: true, answer: true },
    defaultTimerSeconds: 20,
  },
} as const satisfies Record<string, TemplateDefinition>;

/** Strongly typed union of all currently registered template IDs. */
export type TemplateId = keyof typeof TEMPLATE_REGISTRY;

/** Type-guard to check if a string is a registered TemplateId. */
export function isKnownTemplateId(id: string): id is TemplateId {
  return id in TEMPLATE_REGISTRY;
}

/** Get a template definition by ID, or undefined if not found. */
export function getTemplate(id: string): TemplateDefinition | undefined {
  return (TEMPLATE_REGISTRY as Record<string, TemplateDefinition>)[id];
}

/** Get all templates as an array, sorted by their ID. */
export function getAllTemplates(): TemplateDefinition[] {
  return Object.values(TEMPLATE_REGISTRY) as TemplateDefinition[];
}
