import { ManeuverDefinition } from '../ManeuverDefinition.js';

/**
 * Aplastar (sub-Presa)
 * Core — el personaje que ya ha apresado (sin armas) a un enemigo puede
 * triturarlo con su fuerza física.
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
 * Precondiciones (RAW + corrección de mesa):
 *   - El atacante debe estar apresando a alguien.
 *   - La Presa debe haberse hecho sin armas ("fuerza física").
 *   - El defensor debe estar en Parálisis parcial o completa.
 *     (Corrección de mesa: parcial SÍ permite Aplastar. "Total" y "completa"
 *     son el mismo estado; el nombre estándar del sistema es "completa".)
 *
 * Estas precondiciones se declaran como `predicate` (Fase 3) y las evalúa el
 * runner contra el set combinado self:* (atacante) + defender:* (defensor).
 * `requiredDefenderStates` se mantiene por compatibilidad y como dato para los
 * mensajes de aviso del runner.
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
  requiredDefenderStates: ['Parálisis parcial', 'Parálisis completa'],

  // Declarative preconditions (Phase 3). Evaluated against the combined
  // grapple option set (self:* attacker + defender:*). Mirrors the three
  // requirements above; parcial is allowed (table correction). "Total" is
  // not listed because it is the same state as "completa" (standard name).
  predicate: [
    'self:grappling',
    'self:grapple:unarmed',
    {
      or: [
        'defender:condition:paralisis-parcial',
        'defender:condition:paralisis-completa'
      ]
    }
  ],

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
