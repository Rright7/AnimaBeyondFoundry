import { ManeuverDefinition } from '../ManeuverDefinition.js';

/**
 * Aplastar (sub-Presa)
 * Core — el personaje que ya ha apresado (sin armas) a un enemigo en
 * Parálisis total o completa puede triturarlo con su fuerza física.
 *
 * - Sin tirada de ataque previa: se ejecuta como control enfrentado FUE
 *   vs FUE.
 * - Cada punto de Armadura Contundente del defensor suma +1 al control
 *   del defensor.
 * - Daño automático = 10 por punto de diferencia, o 20 por punto si la
 *   diferencia es mayor de 6.
 * - El control de Aplastar es DISTINTO del control para liberarse: la
 *   víctima puede seguir intentando escapar en su asalto.
 *
 * RAW excluye:
 *   - Parálisis parcial (insuficiente para sujetar al rival).
 *   - Apresar con armas (la maniobra requiere "fuerza física").
 */
export const crush = new ManeuverDefinition({
  slug: 'crush',
  nameKey: 'anima.maneuvers.crush.name',
  descriptionKey: 'anima.maneuvers.crush.description',
  icon: 'icons/skills/melee/strike-fists-grappling-orange.webp',

  // No attack roll, no aimed: pure opposed STR check.
  noAttackPhase: true,
  requiresGrappling: true,
  requiresUnarmedGrapple: true,
  requiredDefenderStates: ['Parálisis total', 'Parálisis completa'],

  // Inert fields the framework expects.
  attackPenalty: 0,
  forceTAZero: false,
  damageAllowed: false,
  damageHalvedIfApplied: false,
  damageThresholdPercent: 0,
  noOpposedCheck: false,

  // Opposed check: STR vs STR. The defender's impact armor (TA cont.)
  // adds +1 per point to his side of the check; that's applied by the
  // engine when it reads `defenderArmorBonusType` below.
  attackerStats: ['strength'],
  defenderStats: ['strength'],

  attackerPenaltyUnder100: 0,
  attackerBonusOver200: 0,
  grantsQuadrupedBonus: false,

  // Defender's impact armor adds +1 per point to his roll.
  defenderArmorBonusType: 'impact',

  computeAutoDamage(diff) {
    if (diff <= 0) return 0;
    const perPoint = diff > 6 ? 20 : 10;
    return diff * perPoint;
  },

  resolveEffects() {
    // Crush does not apply an Active Effect on success — the damage IS
    // the effect, applied directly by the engine.
    return [];
  }
});
