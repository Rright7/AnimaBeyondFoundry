import { ManeuverDefinition } from './ManeuverDefinition.js';

/**
 * Registry of combat maneuvers. Definitions register themselves at module
 * load time. Look up a maneuver by slug to use it.
 *
 * Exposed at runtime as `game.animabf.maneuvers` so macros and inline chat
 * links can dispatch by slug:
 *   game.animabf.maneuvers.get('derribo')
 */
class ManeuverRegistry {
  constructor() {
    /** @type {Map<string, ManeuverDefinition>} */
    this._defs = new Map();
  }

  /** @param {ManeuverDefinition} definition */
  register(definition) {
    if (!(definition instanceof ManeuverDefinition)) {
      throw new Error('register: expected ManeuverDefinition instance');
    }
    if (this._defs.has(definition.slug)) {
      console.warn(`[ABF] Maneuver "${definition.slug}" already registered, overwriting`);
    }
    this._defs.set(definition.slug, definition);
  }

  /** @param {string} slug */
  get(slug) {
    return this._defs.get(slug) ?? null;
  }

  has(slug) {
    return this._defs.has(slug);
  }

  /** @returns {ManeuverDefinition[]} */
  all() {
    return Array.from(this._defs.values());
  }
}

export const maneuverRegistry = new ManeuverRegistry();
