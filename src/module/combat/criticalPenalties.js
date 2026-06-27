// Volcado de los penalizadores de un critico a los buckets del defensor: la parte
// `painPenalty` -> Dolor (allActions.painPenalty.base) y `physicalPenalty` -> Carencias
// (allActions.physicalLack.base). Aqui la aritmetica pura (testeada); el actor.update y
// los permisos viven en el chatActionHandler.

/**
 * Acumula un penalizador de critico (magnitud >= 0) sobre un bucket existente
 * (<= 0), dejandolo mas negativo. Varios criticos apilan.
 * @param {number} currentBase penalizador actual (<= 0).
 * @param {number} amount magnitud del critico (painPenalty o physicalPenalty, >= 0).
 * @returns {number} nuevo penalizador (<= currentBase).
 */
export function accumulatePenalty(currentBase, amount) {
  const cur = Number(currentBase) || 0;
  const amt = Math.max(0, Number(amount) || 0);
  return cur - amt;
}
