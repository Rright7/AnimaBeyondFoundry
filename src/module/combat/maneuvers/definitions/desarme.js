import { ManeuverDefinition } from '../ManeuverDefinition.js';

/**
 * Desarme (Disarm)
 * Core Exxet p.92.
 *
 * Penalizador -40 a HA, vs TA 0. Si daño ≥ 10% → control enfrentado
 * FUE/DES vs FUE/DES. No produce daño. Si gana, defensor queda desarmado.
 */
export const desarme = new ManeuverDefinition({
  slug: 'desarme',
  nameKey: 'anima.maneuvers.desarme.name',
  descriptionKey: 'anima.maneuvers.desarme.description',
  icon: 'icons/svg/sword.svg',

  attackPenalty: -40,

  forceTAZero: true,
  damageAllowed: false,
  damageHalvedIfApplied: false,

  damageThresholdPercent: 10,

  attackerStats: ['strength', 'dexterity'],
  defenderStats: ['strength', 'dexterity'],

  attackerPenaltyUnder100: -3,
  attackerBonusOver200: 3,

  grantsQuadrupedBonus: false,

  resolveEffects(result) {
    if (!result.opposedSuccess) return [];
    // Disarm doesn't apply an Active Effect; the GM should drop the weapon
    // manually. We surface the narrative effect via the chat card.
    return [{ target: 'defender', effectSlug: null, reason: 'disarmed' }];
  }
});
