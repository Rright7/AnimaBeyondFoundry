/** @param {number} value */
const roundCounterAttack = value => Math.floor(value / 5) * 5;

/**
 * Bono de contraataque RAW: la MITAD del margen (Defensa-Ataque) redondeada a la baja
 * en multiplos de 5, con tope `cap` (+150 por defecto). Las Artes Marciales pueden
 * modificarlo ANTES del tope: `multiplier` (Selene dobla el bono de margen) y `flat`
 * (Boxeo +10, plano). Formula: min(margen½ × multiplier + flat, cap).
 * @param {number} attack
 * @param {number} defense
 * @param {{multiplier?:number, flat?:number, cap?:number}} [opts]
 */
export const calculateCounterAttackBonus = (
  attack,
  defense,
  { multiplier = 1, flat = 0, cap = 150 } = {}
) => {
  const halfMargin = roundCounterAttack((defense - attack) / 2);
  return Math.min(halfMargin * multiplier + flat, cap);
};
