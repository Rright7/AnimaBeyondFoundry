/**
 * Declarative definition of an equipment quality (Cualidad).
 *
 * Each canonical quality (Precisa, Compleja, Lanzable, ...) is described
 * as a data object with a stable slug and a set of typed hooks the combat
 * engine consumes. The engine never knows the specific quality — it only
 * iterates the qualities a piece of equipment carries and calls the hooks
 * each one declares.
 *
 * Hooks are intentionally NARROW (modifyAimedPenalty, modifyManeuverPenalty,
 * modifyDamage...) instead of a generic `apply(ctx)`. That way the code
 * that orchestrates combat reads like prose ("for each quality, if it has
 * modifyAimedPenalty, apply it"), there is no magic, and an LSP user can
 * find every place a quality can intervene.
 *
 * A quality without functional hooks is still legal: it just renders its
 * description in the item's sheet (and on the equipment) until the matching
 * engine subsystem is built. This lets us declare the FULL catalogue from
 * the start without blocking on every subsystem being ready.
 *
 * Qualities can OPTIONALLY auto-attach an Active Effect (`attachedEffectName`)
 * so passive modifiers (e.g. "Defensiva +5 a parar") can be wired without
 * code, just by referencing an existing AE in the effects compendium. For
 * Precisa this is not used — the discount is active logic.
 */

/**
 * @typedef {'weapon'|'armor'|'shield'|'ammo'} EquipmentSlot
 *
 * @typedef {object} EquipmentQualityContext
 * @property {Item} weapon           — the equipment currently being evaluated
 * @property {Actor} [actor]         — owner actor when known
 * @property {string} [maneuverSlug] — when context is a maneuver execution
 * @property {string} [aimedZone]    — when context is an aimed attack
 *
 * @typedef {object} EquipmentQualityDefinitionData
 * @property {string} slug — stable id in English (e.g. 'precise', 'twoHanded')
 * @property {string} nameKey — i18n key for the display name
 * @property {string} descriptionKey — i18n key for the rules description
 * @property {string} [icon] — Foundry icon path
 *
 * @property {EquipmentSlot[]} appliesTo — which equipment types may carry it
 * @property {boolean} [meleeOnly] — RAW gate: skip when weapon.isRanged
 * @property {string[]} [aliases] — extra label tokens for legacy migration
 *   (e.g. Precisa accepts ['precisa', 'precise', 'précise'])
 * @property {string} [attachedEffectName] — name of an AE in the effects
 *   compendium to auto-apply when this quality is present on equipped gear
 *
 * @property {(penalty: number, ctx: EquipmentQualityContext) => number} [modifyAimedPenalty]
 *   — Return the new aimed-attack penalty. Called only when ctx.aimedZone
 *     is set.
 * @property {(penalty: number, ctx: EquipmentQualityContext) => number} [modifyManeuverPenalty]
 *   — Return the new maneuver penalty. ctx.maneuverSlug identifies which
 *     maneuver is being executed.
 * @property {(damage: number, ctx: EquipmentQualityContext) => number} [modifyDamage]
 * @property {(parry: number, ctx: EquipmentQualityContext) => number} [modifyParry]
 * @property {(threshold: number, ctx: EquipmentQualityContext) => number} [modifyFumbleThreshold]
 */

export class EquipmentQualityDefinition {
  /** @param {EquipmentQualityDefinitionData} data */
  constructor(data) {
    if (!data?.slug) {
      throw new Error('EquipmentQualityDefinition: slug is required');
    }
    if (!Array.isArray(data.appliesTo) || data.appliesTo.length === 0) {
      throw new Error(
        `EquipmentQualityDefinition[${data.slug}]: appliesTo is required and non-empty`
      );
    }

    this.slug = String(data.slug);
    this.nameKey = String(data.nameKey ?? '');
    this.descriptionKey = String(data.descriptionKey ?? '');
    this.icon = data.icon ?? 'icons/svg/upgrade.svg';

    this.appliesTo = data.appliesTo.slice();
    this.meleeOnly = !!data.meleeOnly;
    this.aliases = Array.isArray(data.aliases) ? data.aliases.slice() : [];
    this.attachedEffectName = String(data.attachedEffectName ?? '');

    // Optional hooks. Stored as-is so callers can `if (def.modifyAimedPenalty)`.
    this.modifyAimedPenalty = data.modifyAimedPenalty;
    this.modifyManeuverPenalty = data.modifyManeuverPenalty;
    this.modifyDamage = data.modifyDamage;
    this.modifyParry = data.modifyParry;
    this.modifyFumbleThreshold = data.modifyFumbleThreshold;
  }

  /**
   * @param {EquipmentSlot} slot
   * @returns {boolean}
   */
  appliesToSlot(slot) {
    return this.appliesTo.includes(slot);
  }

  /**
   * True if this quality's mechanical effects must be skipped for the given
   * weapon. RAW gate so the engine doesn't have to re-check meleeOnly
   * scattered across hook callers.
   *
   * @param {Item|object|undefined|null} weapon
   * @returns {boolean}
   */
  isGatedOutFor(weapon) {
    if (!weapon) return true;
    if (this.meleeOnly && !!weapon.system?.isRanged?.value) return true;
    return false;
  }

  /**
   * @returns {string[]} a flat list of every label token (slug + aliases)
   *   the legacy migration may match against `system.special.value`. All
   *   tokens are lowercased.
   */
  getMigrationTokens() {
    const out = new Set();
    out.add(this.slug.toLowerCase());
    for (const a of this.aliases) out.add(String(a).toLowerCase());
    return Array.from(out);
  }
}
