/**
 * Declarative definition of a combat maneuver.
 *
 * Maneuvers come in different shapes (active attack-based, persistent modes,
 * sub-maneuvers of an existing grapple, ...). This base class covers the
 * common "active maneuver with opposed characteristic check" pattern used
 * by Derribo, Desarme and Presa.
 *
 * Future iterations will add subclasses for the other shapes (persistent
 * modes, sub-maneuvers, modifier-only maneuvers). Keeping the data model
 * declarative so each definition file is small and the engine logic lives
 * in one place.
 */

/**
 * @typedef {'strength'|'dexterity'|'agility'|'constitution'} CharacteristicSlug
 *
 * @typedef {object} ManeuverDefinitionData
 * @property {string} slug — stable id (e.g. 'derribo')
 * @property {string} nameKey — i18n key for the display name
 * @property {string} descriptionKey — i18n key for the rules description
 * @property {string} [icon] — Foundry icon path
 *
 * @property {number} attackPenalty — base penalty to attack roll (e.g. -30)
 * @property {{ small: number }} [attackPenaltyByWeaponSize]
 *   — extra penalty by weapon size when relevant (e.g. Derribo: small=-30 more)
 *
 * @property {boolean} forceTAZero — true → defender's TA forced to 0
 * @property {boolean} damageAllowed — true → attacker can choose to deal damage
 * @property {boolean} damageHalvedIfApplied — true → if damage dealt, base /= 2 and TA applies normally
 *
 * @property {number} damageThresholdPercent — min damage % required to trigger the opposed check (default 10)
 *
 * @property {CharacteristicSlug[]} attackerStats — characteristics the attacker can choose from
 * @property {CharacteristicSlug[]} defenderStats — characteristics the defender can choose from
 *
 * @property {number} attackerPenaltyUnder100 — modifier applied when damage% < 100 (e.g. -3)
 * @property {number} attackerBonusOver200 — modifier applied when damage% >= 200 (e.g. +3)
 *
 * @property {boolean} grantsQuadrupedBonus — true → defender gets +3 if quadruped (Derribo)
 *
 * @property {string[]} [weaponRestrictions] — e.g. ['unarmed', 'allowsPresa'] — Presa
 *
 * @property {(result: ManeuverResolution) => Effect[]} resolveEffects
 *   — given the resolved maneuver result, returns the AE slugs to apply
 *     and to whom (defender / attacker)
 */

/**
 * @typedef {object} ManeuverResolution
 * @property {boolean} attackHit — true if attack roll caused at least the threshold damage
 * @property {number} damagePercent — % damage dealt
 * @property {boolean} opposedSuccess — true → attacker won the opposed check
 * @property {number} opposedDifference — positive number = how much attacker beat defender
 * @property {Actor} attacker
 * @property {Actor} defender
 */

/**
 * @typedef {object} Effect
 * @property {'attacker'|'defender'} target
 * @property {string} effectSlug — pack entry name (e.g. 'Derribado')
 * @property {string} [reason] — short text shown in chat
 */

export class ManeuverDefinition {
  /** @param {ManeuverDefinitionData} data */
  constructor(data) {
    this.slug = data.slug;
    this.nameKey = data.nameKey;
    this.descriptionKey = data.descriptionKey ?? '';
    this.icon = data.icon ?? 'icons/svg/sword.svg';

    this.attackPenalty = Number(data.attackPenalty ?? 0);
    this.attackPenaltyByWeaponSize = data.attackPenaltyByWeaponSize ?? null;

    this.forceTAZero = !!data.forceTAZero;
    this.damageAllowed = !!data.damageAllowed;
    this.damageHalvedIfApplied = !!data.damageHalvedIfApplied;

    this.damageThresholdPercent = Number(data.damageThresholdPercent ?? 10);

    this.attackerStats = Array.isArray(data.attackerStats) ? data.attackerStats : [];
    this.defenderStats = Array.isArray(data.defenderStats) ? data.defenderStats : [];

    this.attackerPenaltyUnder100 = Number(data.attackerPenaltyUnder100 ?? 0);
    this.attackerBonusOver200 = Number(data.attackerBonusOver200 ?? 0);

    this.grantsQuadrupedBonus = !!data.grantsQuadrupedBonus;

    this.weaponRestrictions = data.weaponRestrictions ?? [];

    this.resolveEffects = typeof data.resolveEffects === 'function'
      ? data.resolveEffects
      : () => [];
  }

  /**
   * Compute the actual attack penalty given the weapon used.
   * @param {Item|null} weapon
   * @returns {number}
   */
  getAttackPenalty(weapon) {
    let penalty = this.attackPenalty;
    if (this.attackPenaltyByWeaponSize && weapon?.system?.size?.value) {
      const extra = this.attackPenaltyByWeaponSize[weapon.system.size.value];
      if (typeof extra === 'number') penalty += extra;
    }
    return penalty;
  }

  /**
   * Compute the modifier applied to the attacker's opposed characteristic
   * check based on the damage % dealt by the attack roll.
   * @param {number} damagePercent
   * @returns {number}
   */
  getOpposedCheckModifierFromDamage(damagePercent) {
    if (damagePercent >= 200) return this.attackerBonusOver200;
    if (damagePercent < 100) return this.attackerPenaltyUnder100;
    return 0;
  }

  /**
   * @param {Item|null} weapon
   * @returns {boolean} true if this weapon may be used for the maneuver
   */
  isWeaponAllowed(weapon) {
    if (this.weaponRestrictions.length === 0) return true;
    for (const r of this.weaponRestrictions) {
      if (r === 'unarmed') {
        if (!weapon || weapon.system?.unarmed?.value) return true;
      } else if (r === 'allowsPresa') {
        if (weapon?.system?.allowsPresa?.value) return true;
      }
    }
    return false;
  }
}
