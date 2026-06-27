// Tabla 15 (Resistir el dolor): el total de la tirada determina cuanto penalizador
// por dolor/cansancio se cancela. Cada fila es el UMBRAL minimo para esa reduccion;
// se devuelve la mayor reduccion alcanzada. Por debajo de 80 no reduce nada.
const TABLE_15 = [
  { min: 440, reduction: 80 }, // Zen
  { min: 320, reduction: 70 }, // Inhumano
  { min: 280, reduction: 60 }, // Imposible
  { min: 240, reduction: 50 }, // Casi Imposible
  { min: 180, reduction: 40 }, // Absurdo
  { min: 140, reduction: 30 }, // Muy Dificil
  { min: 120, reduction: 20 }, // Dificil
  { min: 80, reduction: 10 } //  Media
];

/**
 * Penalizador (por dolor/cansancio) que cancela una tirada de Resistir el dolor.
 * @param {number} rollTotal total de la tirada.
 * @returns {number} reduccion en positivo (0 si no llega al umbral minimo de 80).
 */
export function withstandPainReduction(rollTotal) {
  const total = Number(rollTotal) || 0;
  for (const row of TABLE_15) {
    if (total >= row.min) return row.reduction;
  }
  return 0;
}
