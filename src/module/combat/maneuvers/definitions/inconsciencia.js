import { ManeuverDefinition } from '../ManeuverDefinition.js';

/**
 * Inconsciencia
 * Core Exxet — golpe apuntado a la cabeza con un arma contundente para
 * dejar al adversario inconsciente. Daño final / 2, crítico cuenta pleno.
 * Si el nivel de crítico supera 50, el defensor queda inconsciente. Con
 * arma no-contundente, el penalizador aumenta en -40 adicional.
 */
export const inconsciencia = new ManeuverDefinition({
  slug: 'inconsciencia',
  nameKey: 'anima.maneuvers.inconsciencia.name',
  descriptionKey: 'anima.maneuvers.inconsciencia.description',
  icon: 'icons/svg/sleep.svg',

  // Penalty comes from the aimed-head entry of Tabla 45 (-60). The extra
  // -40 for non-impact weapons is added at execute-time via the flag below.
  attackPenalty: 0,

  forceTAZero: false,
  damageAllowed: true,
  // forceTAZero is false → ManeuverDefinition.dealsMandatoryDamage is true, so
  // the halved damage is applied always (not an opt-in checkbox).
  damageHalvedIfApplied: true,

  damageThresholdPercent: 1,
  noOpposedCheck: true,

  attackerStats: [],
  defenderStats: [],

  attackerPenaltyUnder100: 0,
  attackerBonusOver200: 0,

  grantsQuadrupedBonus: false,

  aimedZone: 'head',
  requiresImpactCritic: true,
  nonImpactCriticExtraPenalty: -40,

  // No automatic effect on resolveEffects: unconsciousness is triggered by
  // the critical resolution (when failureLevel > 50). The maneuver card just
  // sets the aim and the penalty; the actual AE "Inconsciente" is applied by
  // the critical pipeline when applicable.
  resolveEffects() {
    return [];
  }
});
