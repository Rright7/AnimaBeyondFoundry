// Reduccion del penalizador SUFRIDO por dolor/cansancio por habilidades de Ki/Nemesis.
// UNICA fuente de verdad del factor: la usan el valor mostrado (mutateAllActionsModifier)
// y el ritmo de recuperacion (recoverPainStep), para que no puedan descuadrar.

/**
 * Divisor del penalizador SUFRIDO segun las habilidades activas:
 *   - "Esencia de Vacio" (painImmune) -> Infinity (lo elimina; el sufrido es 0).
 *   - "Eliminacion de penalizadores" -> cada "mitad" divide por 2. El valor de
 *     `kiBonus.painHalf` es el numero de mitades (1 = mitad, 2 = cuarto, ...), asi que
 *     una reduccion a un CUARTO solo necesita que painHalf llegue a 2; el resto del
 *     sistema (display y recuperacion) se ajusta solo.
 *   - sin habilidades -> 1.
 * @param {object} kiBonus  system.general.modifiers.kiBonus
 * @returns {number} 1 | 2 | 4 | ... | Infinity
 */
export function painReductionDivisor(kiBonus = {}) {
  if (Number(kiBonus?.painImmune?.value) > 0) return Infinity;
  const halvings = Math.max(0, Number(kiBonus?.painHalf?.value) || 0);
  return 2 ** halvings;
}

/**
 * Aplica el divisor a un penalizador SUFRIDO (<= 0). Infinity -> 0 (inmune); el ceil
 * acerca a 0 (el penalizador es negativo).
 * @param {number} painFinal penalizador antes de reducir (<= 0)
 * @param {number} divisor   de painReductionDivisor
 * @returns {number} penalizador reducido (<= 0)
 */
export function applyPainReduction(painFinal, divisor) {
  const p = Math.min(0, Number(painFinal) || 0);
  if (!isFinite(divisor)) return 0;
  if (divisor <= 1) return p;
  return Math.ceil(p / divisor);
}
