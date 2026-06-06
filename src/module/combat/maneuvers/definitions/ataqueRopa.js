import { ManeuverDefinition } from '../ManeuverDefinition.js';

/**
 * Ataque apuntado, Ropa (maniobra MAESTRA).
 * Core Exxet: corta o desgarra las ropas del adversario sin dañar su cuerpo.
 * Penalizador -150 con arma convencional, o -100 si el arma tiene Precisa.
 *
 * Simplificación (decisión del usuario): solo se automatiza el penalizador
 * (-150 / -100 según la cualidad Precisa del arma SELECCIONADA) y que no cause
 * daño al cuerpo por defecto. El control de Rotura/Entereza contra la armadura
 * y la combinación con otras maniobras (p.ej. Área) se hacen MANUALMENTE.
 */
export const ataqueRopa = new ManeuverDefinition({
  slug: 'ataque-ropa',
  nameKey: 'anima.maneuvers.ataque-ropa.name',
  descriptionKey: 'anima.maneuvers.ataque-ropa.description',
  icon: 'icons/svg/item-bag.svg',

  predicate: ['self:mastery:attack'],

  // -150 con arma convencional; -100 si el arma seleccionada tiene Precisa.
  attackPenalty: -150,
  precisePenalty: -100,

  // No daña el cuerpo: por defecto sin daño (damageAllowed + "Causar daño" OFF →
  // finalDamage 0). El jugador puede marcar "Causar daño" si lo desea.
  damageAllowed: true,
  damageHalvedIfApplied: false,

  noOpposedCheck: true,
  resolveEffects() {
    return [];
  }
});
