import { ManeuverDefinition } from '../ManeuverDefinition.js';

/**
 * Cargar (En carga o corriendo)
 * Core — el personaje declara que carga contra un enemigo. Estado, no
 * acción puntual: aplica un Active Effect que durante el asalto otorga
 * +10 Ataque, -10 Parada, -20 Esquiva. La maniobra no dispara tirada.
 *
 * Pre-condiciones RAW (no automatizables, responsabilidad del jugador):
 *   - Llevar corriendo hacia el enemigo desde el asalto anterior.
 *   - Declarar antes de calcular la iniciativa.
 *   - No estar trabado en combate físico con el objetivo.
 *
 * Excepción RAW: este asalto NO se aplica el penalizador por moverse por
 * encima de ¼ del Tipo de Movimiento. El motor no rastrea ese
 * penalizador, así que el jugador debe recordar no aplicárselo a mano.
 */
export const carga = new ManeuverDefinition({
  slug: 'charging',
  nameKey: 'anima.maneuvers.charging.name',
  descriptionKey: 'anima.maneuvers.charging.description',
  icon: 'icons/svg/lightning.svg',

  // Status-toggle: el motor aplica/quita el AE en vez de abrir un dialog
  // de ataque.
  isStatusToggle: true,
  statusEffectName: 'Cargando',

  // Campos comunes inertes para esta maniobra (no dispara tirada).
  attackPenalty: 0,
  forceTAZero: false,
  damageAllowed: false,
  damageHalvedIfApplied: false,
  damageThresholdPercent: 0,
  noOpposedCheck: false,
  attackerStats: [],
  defenderStats: [],
  attackerPenaltyUnder100: 0,
  attackerBonusOver200: 0,
  grantsQuadrupedBonus: false,

  resolveEffects() {
    return [];
  }
});
