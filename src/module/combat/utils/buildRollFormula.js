/**
 * Arma una formula de tirada legible para el chat: el dado primero y luego solo los
 * sumandos distintos de 0, para evitar el ruido de "+ 0" en el desglose. Los terminos
 * negativos se muestran como "- N". El resultado numerico es identico (un 0 no aporta).
 * Cada termino debe traer ya su signo (un penalizador se pasa negativo).
 * @param {string} die   expresion del dado (p.ej. "1d100xa")
 * @param {Array<number>} terms sumandos; los que valgan 0 se omiten
 * @returns {string}
 */
export function buildRollFormula(die, terms = []) {
  let formula = String(die);
  for (const term of terms) {
    const n = Number(term) || 0;
    if (n === 0) continue;
    formula += n < 0 ? ` - ${Math.abs(n)}` : ` + ${n}`;
  }
  return formula;
}
