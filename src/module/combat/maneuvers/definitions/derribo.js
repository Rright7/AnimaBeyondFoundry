import { ManeuverDefinition } from '../ManeuverDefinition.js';

/**
 * Derribo (Trip)
 * Core Exxet p.92, Tabla de maniobras de combate.
 *
 * Penalizador -30 (-60 si se usa arma corta que no sea combate desarmado),
 * vs TA 0. Si daño ≥ 10% → control enfrentado FUE/DES vs FUE/AGI.
 * Daño opcional, base/2 con TA. Cuadrúpedos +3 al defensor.
 */
export const derribo = new ManeuverDefinition({
  slug: 'derribo',
  nameKey: 'anima.maneuvers.derribo.name',
  descriptionKey: 'anima.maneuvers.derribo.description',
  icon: 'icons/svg/falling.svg',

  attackPenalty: -30,
  attackPenaltyByWeaponSize: { small: -30 }, // small weapon → total -60

  forceTAZero: true,
  damageAllowed: true,
  damageHalvedIfApplied: true,

  damageThresholdPercent: 10,

  attackerStats: ['strength', 'dexterity'],
  defenderStats: ['strength', 'agility'],

  attackerPenaltyUnder100: -3,
  attackerBonusOver200: 3,

  grantsQuadrupedBonus: true,

  resolveEffects(result) {
    if (!result.opposedSuccess) return [];
    return [{ target: 'defender', effectSlug: 'Derribado' }];
  }
});
