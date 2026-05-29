import { EquipmentQualityDefinition } from './EquipmentQualityDefinition.js';

/**
 * Registry of equipment qualities. Definitions register themselves at
 * module load time. Exposed at runtime as `game.animabf.equipmentQualities`
 * so any subsystem (combat, damage resolver, fumble engine, sheets...) can
 * look one up by slug.
 *
 * The registry intentionally exposes no business logic. The shape of each
 * quality (which hooks it owns, what it does) lives in the definition. The
 * orchestrator that consumes a quality lives in the subsystem that owns
 * the hook (e.g. composeWeaponEffects for combat).
 */
class EquipmentQualityRegistry {
  constructor() {
    /** @type {Map<string, EquipmentQualityDefinition>} */
    this._defs = new Map();
  }

  /** @param {EquipmentQualityDefinition} definition */
  register(definition) {
    if (!(definition instanceof EquipmentQualityDefinition)) {
      throw new Error('register: expected EquipmentQualityDefinition instance');
    }
    if (this._defs.has(definition.slug)) {
      console.warn(
        `[ABF] EquipmentQuality "${definition.slug}" already registered, overwriting`
      );
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

  /** @returns {EquipmentQualityDefinition[]} */
  all() {
    return Array.from(this._defs.values());
  }

  /**
   * @param {('weapon'|'armor'|'shield'|'ammo')} slot
   * @returns {EquipmentQualityDefinition[]}
   */
  allForSlot(slot) {
    return this.all().filter(d => d.appliesToSlot(slot));
  }
}

export const equipmentQualityRegistry = new EquipmentQualityRegistry();
