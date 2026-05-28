import { ManeuverDefinition } from '../ManeuverDefinition.js';

/**
 * Engatillar
 * Core Exxet — pone al adversario en una situación de desventaja con un
 * arma en contacto, sin causar daño. -100 al ataque, sí aplica TA. Si el
 * resultado podría causar daño, el defensor entra en "Amenazado".
 * No hay control enfrentado.
 */
export const engatillar = new ManeuverDefinition({
  slug: 'engatillar',
  nameKey: 'anima.maneuvers.engatillar.name',
  descriptionKey: 'anima.maneuvers.engatillar.description',
  icon: 'icons/svg/sword.svg',

  attackPenalty: -100,

  // The threat is delivered through the armor: TA applies normally.
  forceTAZero: false,
  damageAllowed: false,
  damageHalvedIfApplied: false,

  // Any damage% > 0 triggers the effect.
  damageThresholdPercent: 1,

  // No opposed check — outcome is decided by the attack itself.
  noOpposedCheck: true,

  attackerStats: [],
  defenderStats: [],

  attackerPenaltyUnder100: 0,
  attackerBonusOver200: 0,

  grantsQuadrupedBonus: false,

  resolveEffects() {
    return [
      { target: 'defender', effectSlug: 'Amenazado', reason: 'engatillado' }
    ];
  }
});
