import {
  MARTIAL_ARTS,
  MARTIAL_ART_IDS,
  MARTIAL_ART_GRADES
} from './martialArtCatalog.data.js';
import { MARTIAL_ART_REQUIREMENTS } from './martialArtRequirements.data.js';

export { MARTIAL_ARTS, MARTIAL_ART_IDS, MARTIAL_ART_GRADES };

export const GRADE_LABELS = {
  base: 'Base',
  advanced: 'Avanzado',
  supreme: 'Supremo',
  arcane: 'Arcano'
};

const CHAR_ABBR = { strength: 'FUE', power: 'POD' };

/** @returns {object|null} definicion del arte por id */
export function getMartialArt(id) {
  return id ? MARTIAL_ARTS[id] ?? null : null;
}

/** @returns {object|null} datos del grado (acumulados) de un arte */
export function getGradeData(id, grade) {
  const def = getMartialArt(id);
  return def?.grades?.[grade] ?? null;
}

/** Requisitos (texto del manual) de un arte/grado, o '' si no hay. */
export function getRequirements(id, grade) {
  return MARTIAL_ART_REQUIREMENTS?.[id]?.[grade] ?? '';
}

function normalizeName(s) {
  return String(s || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

const NAME_TO_ID = (() => {
  const map = new Map();
  for (const id of MARTIAL_ART_IDS) {
    const def = MARTIAL_ARTS[id];
    if (def?.name) map.set(normalizeName(def.name), id);
  }
  return map;
})();

/** Resuelve un nombre de arte (p.ej. del Excel) a su canonicalId, o null. */
export function findMartialArtByName(name) {
  return NAME_TO_ID.get(normalizeName(name)) ?? null;
}

/** Grado del Excel (espanol) -> clave del catalogo. */
export const GRADE_ES_TO_KEY = {
  base: 'base',
  avanzado: 'advanced',
  supremo: 'supreme',
  arcano: 'arcane'
};

/** Opciones de grado para el desplegable de la fila, segun el tipo de arte. */
export function gradeOptionsFor(type, current) {
  const seq = MARTIAL_ART_GRADES[type] ?? [];
  return seq.map(gr => ({ value: gr, label: GRADE_LABELS[gr] ?? gr, selected: gr === current }));
}

/** Resuelve el grado de un inner item (acepta grade.value o grade string). */
export function gradeOf(art) {
  return art?.system?.grade?.value ?? art?.system?.grade ?? null;
}

/**
 * Valor numerico del Daño Base de un grado dado los modificadores del actor.
 * Devuelve null si es especial (Exelion) o no tiene caracteristica.
 * @param {object} damageBase { base, characteristic, mult, special? }
 * @param {{strength:number, power:number}} mods
 */
export function damageBaseValue(damageBase, mods) {
  if (!damageBase || damageBase.special || !damageBase.characteristic) return null;
  const mod = damageBase.characteristic === 'power' ? mods.power : mods.strength;
  return (damageBase.base || 0) + (damageBase.mult || 0) * (Number(mod) || 0);
}

/** Texto del Daño Base para la ficha: "20 + FUE", "20 + 2xFUE", "Especial". */
export function damageBaseString(damageBase) {
  if (!damageBase) return '';
  if (damageBase.special) return 'Especial';
  if (!damageBase.characteristic) return damageBase.base ? String(damageBase.base) : '';
  const abbr = CHAR_ABBR[damageBase.characteristic] ?? damageBase.characteristic;
  const mult = damageBase.mult || 0;
  if (mult === 0) return String(damageBase.base || 0);
  const m = mult === 1 ? '' : `${mult}x`;
  return `${damageBase.base || 0} + ${m}${abbr}`;
}

/**
 * Daño desarmado que aportan las Artes Marciales del actor: el MAYOR Daño Base
 * entre las artes conocidas (no se combinan) + la suma de bonos de daño de las
 * Avanzadas. Devuelve { base: number|null, bonus: number }.
 * @param {object} actor documento del actor (system preparado)
 */
export function martialArtUnarmedDamage(actor) {
  const arts = actor?.system?.domine?.martialArts ?? [];
  const mods = {
    strength: Number(actor?.system?.characteristics?.primaries?.strength?.mod) || 0,
    power: Number(actor?.system?.characteristics?.primaries?.power?.mod) || 0
  };
  let base = null;
  let bonus = 0;
  for (const art of arts) {
    const g = getGradeData(art?.system?.canonicalId, gradeOf(art));
    if (!g) continue;
    const v = damageBaseValue(g.damageBase, mods);
    if (v !== null && (base === null || v > base)) base = v;
    bonus += g.damageBonus || 0;
  }
  return { base, bonus };
}

/**
 * View-model de un Arte Marcial para la ficha (solo lectura). Incluye un
 * `summary` compacto con los bonos del grado.
 * @param {object} art inner item type 'martialArt'
 */
export function buildMartialArtView(art) {
  const id = art?.system?.canonicalId;
  const grade = gradeOf(art);
  const def = getMartialArt(id);
  const g = getGradeData(id, grade);
  if (!def || !g) {
    return {
      canonicalId: id ?? null,
      name: art?.name ?? '',
      gradeLabel: grade ? GRADE_LABELS[grade] ?? grade : '',
      known: false,
      gradeOptions: [],
      special: '',
      requirements: '',
      summary: '(sin datos — recrear)'
    };
  }

  const parts = [];
  if (g.attack) parts.push(`HA +${g.attack}`);
  if (g.block && g.block === g.dodge) parts.push(`Par/Esq +${g.block}`);
  else {
    if (g.block) parts.push(`Par +${g.block}`);
    if (g.dodge) parts.push(`Esq +${g.dodge}`);
  }
  if (g.turn) parts.push(`Turno +${g.turn}`);
  if (g.masterAttack) parts.push(`Maestro At +${g.masterAttack}`);
  if (g.masterDefense) parts.push(`Maestro Def +${g.masterDefense}`);
  const dmg = damageBaseString(g.damageBase);
  if (dmg && dmg !== '0') parts.push(`Daño ${dmg}`);
  if (g.damageBonus) parts.push(`Daño extra +${g.damageBonus}`);
  if (g.cm) parts.push(`CM +${g.cm}`);

  return {
    canonicalId: id,
    name: def.name,
    type: def.type,
    grade,
    gradeLabel: GRADE_LABELS[grade] ?? grade,
    known: true,
    attack: g.attack,
    block: g.block,
    dodge: g.dodge,
    turn: g.turn,
    masterAttack: g.masterAttack,
    masterDefense: g.masterDefense,
    cm: g.cm,
    damageBaseStr: dmg,
    damageBonus: g.damageBonus,
    special: def.special?.[grade] ?? '',
    requirements: getRequirements(id, grade),
    gradeOptions: gradeOptionsFor(def.type, grade),
    summary: parts.join(' · ')
  };
}
