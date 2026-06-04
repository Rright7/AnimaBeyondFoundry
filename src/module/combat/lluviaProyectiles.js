// /module/combat/lluviaProyectiles.js
//
// Lógica pura de la maniobra maestra "Lluvia de proyectiles" (ataque en área a
// distancia). Sin dependencias de Foundry; la colocación de plantilla y la
// detección de tokens viven en maneuvers/areaTemplate.js (runtime).

/** Multiplicador al Daño Base del arma (RAW: dobla). */
export const DAMAGE_MULTIPLIER = 2;
/** Penalizador opcional a la Habilidad al elegir blancos dentro del área. */
export const SELECT_TARGETS_PENALTY = -50;
/** Mínimo de proyectiles por asalto que exige la maniobra (informativo). */
export const MIN_PROJECTILES = 5;

const toInt = n => {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
};

/**
 * Radio del área en metros: 1 m por cada 20 de Habilidad de Ataque si la
 * Cadencia de Fuego es ≤ 50, o por cada 40 si es > 50.
 * @param {number} attackAbility Habilidad de Ataque del atacante
 * @param {boolean} cfOver50 true si la Cadencia de Fuego del arma es > 50
 * @returns {number} radio en metros (entero, ≥ 0)
 */
export function areaRadiusMeters(attackAbility, cfOver50) {
  const ability = Math.max(0, toInt(attackAbility));
  const divisor = cfOver50 ? 40 : 20;
  return Math.floor(ability / divisor);
}
