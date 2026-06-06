import { ManeuverDefinition } from '../ManeuverDefinition.js';

/**
 * Montar (estado)
 * Core — el personaje declara que está montado sobre un corcel. Estado,
 * no acción puntual: aplica un Active Effect que el motor reconoce. Los
 * modificadores RAW se calculan en `mutateMounted` (prepareActor) según
 * el valor actual de la habilidad de Montar:
 *
 *   - Montar < 0 (incluye no tener la habilidad):
 *       -20 a ataque y parar
 *   - Montar > 40:
 *       +20 a ataque (posición superior)
 *   - Esquiva final:
 *       limitada a min(esquiva, Montar)
 *
 * Pre-condiciones RAW (no automatizables):
 *   - Tener una montura disponible en escena.
 *   - El personaje está realmente subido a ella.
 *
 * NOTA: La carga con arma de asta (doble bono FUE de la montura al daño)
 * pertenece a Fase B y se implementará cuando llegue la composición
 * Cargando + Montado + arma con cualidad de asta.
 */
export const mounted = new ManeuverDefinition({
  slug: 'mounted',
  nameKey: 'anima.maneuvers.mounted.name',
  descriptionKey: 'anima.maneuvers.mounted.description',
  icon: 'icons/environment/creatures/horse-white.webp',

  // Status-toggle: el motor aplica/quita el AE en vez de abrir un dialog
  // de ataque.
  isStatusToggle: true,
  statusEffectName: 'Montado',

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
