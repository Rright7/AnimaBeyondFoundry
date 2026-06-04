// /module/combat/breakage.js
//
// Lógica pura de la regla opcional "Rotura y entereza" (Core Exxet).
// Sin dependencias de Foundry; la capa de runtime (item.update/daño) vive en
// breakageEffect.js. Todo gateado por el ajuste USE_BREAKAGE_RULE.
//
// Conceptos: ROTURA = capacidad de romper lo del rival (ofensivo, breaking.final,
// ya incluye bono de Fuerza y calidad). ENTEREZA = resistencia a ser roto
// (defensivo, integrity.final). Control: D10 + rotura vs entereza rival.

/** Claves de TA de una armadura, en orden estable. */
export const ARMOR_TA_KEYS = [
  'cut',
  'impact',
  'thrust',
  'heat',
  'electricity',
  'cold',
  'energy'
];

const toInt = n => {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
};

/**
 * Control de rotura básico: ¿(D10 + rotura) supera la entereza rival?
 * @param {number} d10
 * @param {number} rotura
 * @param {number} enterezaRival
 * @returns {boolean} true si rompe el objeto rival
 */
export function clashBreaks(d10, rotura, enterezaRival) {
  return toInt(d10) + toInt(rotura) > toInt(enterezaRival);
}

/**
 * Resultado de un golpe de rotura sobre un arma que se rompería. Las armas con
 * calidad >= +5 no se destruyen: bajan un grado (-5). Las de calidad < 5 se
 * destruyen.
 * @param {number} quality bono de calidad actual (+0, +5, +10, ...)
 * @returns {{destroyed: boolean, newQuality: number}}
 */
export function resolveQualityHit(quality) {
  const q = toInt(quality);
  if (q >= 5) return { destroyed: false, newQuality: q - 5 };
  return { destroyed: true, newQuality: q };
}

/**
 * Entereza corporal para la parada sin armas: la mayor de Constitución o
 * Destreza.
 * @param {number} constitution
 * @param {number} dexterity
 * @returns {number}
 */
export function bodyEntereza(constitution, dexterity) {
  return Math.max(toInt(constitution), toInt(dexterity));
}

/**
 * Daño de la parada sin armas: 5 puntos por cada unidad en que (D10 + rotura del
 * arma) supera la entereza corporal. La maestría en parada desarmada ignora el
 * control (0 daño).
 * @param {{d10:number, rotura:number, entereza:number, mastery?:boolean}} p
 * @returns {number} daño en PV
 */
export function unarmedParryDamage({ d10, rotura, entereza, mastery = false }) {
  if (mastery) return 0;
  const margin = toInt(d10) + toInt(rotura) - toInt(entereza);
  return margin > 0 ? margin * 5 : 0;
}

/**
 * Degrada las TA de una armadura al romperse: cada TA baja 1 punto (mínimo 0).
 * La armadura queda inservible cuando TODAS sus TA han llegado a 0 (sin
 * protección restante).
 * @param {Record<string, number>} values mapa claveTA → valor actual
 * @returns {{values: Record<string, number>, useless: boolean}}
 */
export function degradeArmorTA(values) {
  const out = {};
  for (const k of ARMOR_TA_KEYS) {
    out[k] = Math.max(0, toInt(values?.[k]) - 1);
  }
  const useless = ARMOR_TA_KEYS.every(k => out[k] === 0);
  return { values: out, useless };
}
