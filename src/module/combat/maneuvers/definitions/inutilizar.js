import { ManeuverDefinition } from '../ManeuverDefinition.js';

/**
 * Inutilizar
 * Core Exxet — pretende inutilizar a un individuo rompiéndole una
 * extremidad. Es un golpe apuntado (brazo o pierna, -20 por Tabla 45).
 * Reduce el daño final a la mitad, pero el cálculo de crítico usa el daño
 * pleno y la extremidad cuenta como punto vulnerable. Fuerza que el
 * crítico se localice en la extremidad apuntada. No funciona contra
 * criaturas con acumulación de daño.
 *
 * NO aplica ningún AE directamente: el efecto en la ficha del defensor
 * lo da el sistema de críticos cuando resuelve un crítico fallido en la
 * extremidad. La maniobra solo modifica cómo se calcula el crítico.
 */
export const inutilizar = new ManeuverDefinition({
  slug: 'inutilizar',
  nameKey: 'anima.maneuvers.inutilizar.name',
  descriptionKey: 'anima.maneuvers.inutilizar.description',
  icon: 'icons/svg/blood.svg',

  // Penalty comes from the aimed-zone of Tabla 45 (-20 for arm or thigh).
  // We leave attackPenalty at 0 because the real penalty is computed from
  // the chosen zone at execute-time.
  attackPenalty: 0,

  forceTAZero: false,
  damageAllowed: true,
  // Damage is halved on application; crit calculation uses the full base.
  // Because forceTAZero is false, ManeuverDefinition.dealsMandatoryDamage is
  // true → the halved damage is applied always (not an opt-in checkbox).
  damageHalvedIfApplied: true,

  damageThresholdPercent: 1,
  noOpposedCheck: true,

  attackerStats: [],
  defenderStats: [],

  attackerPenaltyUnder100: 0,
  attackerBonusOver200: 0,

  grantsQuadrupedBonus: false,

  // Player picks the limb at the card level.
  aimedZoneOptions: ['arm', 'thigh'],

  // No direct AE: the disabling effect is delivered by the critical
  // resolution pipeline. The maneuver just sets aim + halved damage +
  // forces critical to localize on the targeted limb.
  forcesCriticalToAimedZone: true,
  treatsAimedZoneAsVulnerable: true,

  resolveEffects() {
    return [];
  }
});
