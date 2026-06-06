import { EFFECT_CATALOG, DISADVANTAGE_CATALOG } from './effects/effectCatalog.data';

/** Las 6 características que pueden pagar Ki en una Técnica. */
export const KI_CHARACTERISTICS = [
  'agility',
  'constitution',
  'dexterity',
  'strength',
  'power',
  'willPower'
];

const indexById = arr => {
  const map = {};
  for (const entry of arr) map[entry.id] = entry;
  return map;
};

const indexByName = arr => {
  const map = {};
  for (const entry of arr) map[entry.name] = entry;
  return map;
};

export const EFFECTS_BY_ID = indexById(EFFECT_CATALOG);
export const DISADVANTAGES_BY_ID = indexById(DISADVANTAGE_CATALOG);
const EFFECTS_BY_NAME = indexByName(EFFECT_CATALOG);
const DISADVANTAGES_BY_NAME = indexByName(DISADVANTAGE_CATALOG);

export const getEffect = id => EFFECTS_BY_ID[id];
export const getDisadvantage = id => DISADVANTAGES_BY_ID[id];

/** Mapeo de item de compendio (techniqueEffect) -> entrada del catálogo, por nombre. */
export const getEffectByName = name => EFFECTS_BY_NAME[name];
export const getDisadvantageByName = name => DISADVANTAGES_BY_NAME[name];

/** Efectos agrupados por categoría (offensive/defensive/...), preservando el orden del catálogo. */
export const getEffectsByCategory = () => {
  const groups = {};
  for (const effect of EFFECT_CATALOG) {
    (groups[effect.category] ??= []).push(effect);
  }
  return groups;
};

/** Los 6 elementos (clave del catálogo -> etiqueta ES). */
export const ELEMENTS = [
  { key: 'air', label: 'Aire' },
  { key: 'water', label: 'Agua' },
  { key: 'fire', label: 'Fuego' },
  { key: 'earth', label: 'Tierra' },
  { key: 'light', label: 'Luz' },
  { key: 'dark', label: 'Oscuridad' }
];

const ELEMENT_LABEL = Object.fromEntries(ELEMENTS.map(e => [e.key, e.label]));
export const getElementLabel = key => ELEMENT_LABEL[key] ?? key;

/** Desventajas que la ID identifica como "de elemento" (su detalle es 1-2 elementos). */
export const ELEMENT_DISADVANTAGES = new Set([
  'atadura-elemental',
  'requerimientos-elementales'
]);

/**
 * Configuración del "detalle" por desventaja: parámetro libre que NO altera el
 * coste pero hay que anotar. kind:'element' -> desplegable(s) de elemento (con
 * aviso de afinidad); kind:'text' -> texto libre; sin entrada -> no necesita.
 */
export const DISADVANTAGE_DETAIL = {
  'atadura-elemental': { kind: 'element' }, // count: 1 ó 2 según la opción
  'requerimientos-elementales': { kind: 'element', count: 1 },
  'atada-a-un-arma': { kind: 'text', placeholder: 'arma' },
  exterminador: { kind: 'text', placeholder: 'clase de ser' },
  'sacrificio-de-caracteristicas': { kind: 'text', placeholder: 'característica' }
};

/**
 * Efectos cuyo resultado es un bono persistente y mecánico-limpio que se puede
 * auto-aplicar mientras la técnica está activa (F6 entrega 2).
 *
 * - kind 'characteristic': suma a `primaries.<target>.special.value` (los typed
 *   ops del tipo Characteristic recalculan final/mod y cascada a derivados).
 * - kind 'bucket': alimenta `kiBonus` vía applyKiSkillsModifiers; `target` es la
 *   clave que espera RESISTANCE_TARGET (resistancePhysical/Magic/Psychic).
 *
 * El resto de efectos (combate por tirada, multiplicadores, estados, escudos de
 * PV, etc.) NO están aquí a propósito: se aplican de forma narrativa o en
 * entregas posteriores.
 */
export const PERSISTENT_EFFECT_MAP = {
  'capacidad-incrementada-agi': { target: 'agility', kind: 'characteristic' },
  'capacidad-incrementada-fue': { target: 'strength', kind: 'characteristic' },
  'capacidad-incrementada-des': { target: 'dexterity', kind: 'characteristic' },
  'incremento-de-resistencia-fisica': { target: 'resistancePhysical', kind: 'bucket' },
  'incremento-de-resistencia-magica': { target: 'resistanceMagic', kind: 'bucket' },
  'incremento-de-resistencia-psiquica': { target: 'resistancePsychic', kind: 'bucket' }
};

/**
 * Extrae el primer entero de una opción del catálogo ("+50 RF" -> 50, "+3" -> 3).
 * Devuelve 0 si la opción no contiene número (p.ej. "Incremento también a RE").
 * @param {string} option
 * @returns {number}
 */
export const parseOptionNumber = option => {
  const m = typeof option === 'string' ? option.match(/\d+/) : null;
  return m ? Number(m[0]) : 0;
};

export { EFFECT_CATALOG, DISADVANTAGE_CATALOG };
