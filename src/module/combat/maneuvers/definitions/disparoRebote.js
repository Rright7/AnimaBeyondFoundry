import { ManeuverDefinition } from '../ManeuverDefinition.js';

/**
 * Disparo apuntado, Rebote (maniobra MAESTRA).
 * Core Exxet: hace rebotar proyectiles en el entorno (paredes, rocas) para
 * alcanzar blancos fuera de la trayectoria de tiro. Penalizador -20 (un rebote)
 * o -40 (más de uno). El Daño Base se reduce 10 puntos (pierde potencia).
 * Permite evitar coberturas frontales.
 *
 * Simplificación (decisión del usuario): se automatiza el penalizador a elegir
 * (-20 / -40) y el -10 al Daño Base. El penalizador adicional por atacar a un
 * enemigo cubierto (Ceguera parcial -40 / completa -80) se añade MANUALMENTE con
 * el modificador del diálogo de ataque.
 */
export const disparoRebote = new ManeuverDefinition({
  slug: 'disparo-rebote',
  nameKey: 'anima.maneuvers.disparo-rebote.name',
  descriptionKey: 'anima.maneuvers.disparo-rebote.description',
  icon: 'icons/svg/target.svg',

  predicate: ['self:mastery:attack'],

  // Penalizador a elegir en la tarjeta (un rebote / varios).
  attackPenalty: 0,
  penaltyOptions: [
    { value: -20, labelKey: 'anima.ui.combat.combatManeuvers.oneBounce' },
    { value: -40, labelKey: 'anima.ui.combat.combatManeuvers.multiBounce' }
  ],

  // Pierde potencia: -10 al Daño Base.
  damageDelta: -10,

  noOpposedCheck: true,
  resolveEffects() {
    return [];
  }
});
