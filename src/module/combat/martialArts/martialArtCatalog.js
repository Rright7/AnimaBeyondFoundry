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
  // OJO: characteristics.primaries.{strength,power}.mod es un objeto {value}, NO un
  // numero (igual que calculateWeaponStrengthModifier usa .mod.value). Leer .mod a
  // secas daba NaN->0 y anulaba el multiplicador del Dano Base (p.ej. Moai Thai x2 FUE).
  const sMod = actor?.system?.characteristics?.primaries?.strength?.mod;
  const pMod = actor?.system?.characteristics?.primaries?.power?.mod;
  const mods = {
    strength: Number(sMod?.value ?? sMod) || 0,
    power: Number(pMod?.value ?? pMod) || 0
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
 * Artes con BONO VARIABLE configurable (estilo Kung Fu): +X a UNA de HA/Parada/
 * Esquiva/Turno/Dano a elegir (system.variableBonus). A HA/Parada/Esquiva es EXENTO
 * del tope +50. Cantidad por arte y grado. Asakusen funciona igual (Base +10 /
 * Arcano +40), ademas de su bono general +10 (ese va en columnas numericas).
 */
export const MARTIAL_ART_VARIABLE_BONUS = {
  kungFu: { advanced: 10, supreme: 20 },
  asakusen: { base: 10, arcane: 40 }
};

/** Cantidad del bono variable de un arte en un grado (0 si no aplica). */
export function variableBonusAmount(canonicalId, grade) {
  return MARTIAL_ART_VARIABLE_BONUS[canonicalId]?.[grade] ?? 0;
}

/**
 * Artes que modifican los ATAQUES ADICIONALES cuando se combate con Artes Marciales:
 *  - `penalty`: penalizador por ataque adicional (SUSTITUYE al de tamano del arma).
 *  - `extraAttacks`: ataques adicionales extra concedidos (como +100 HA teorica).
 * Kempo (Dominus Exxet): Base -15, Avanzado -10, Supremo -10 + 1 ataque extra.
 */
export const MARTIAL_ART_ADDITIONAL_ATTACK = {
  kempo: { penalty: { base: 15, advanced: 10, supreme: 10 }, extraAttacks: { supreme: 1 } }
};

/**
 * Recorre las Artes Marciales del actor y devuelve el MEJOR penalizador por ataque
 * adicional (el menor) y la suma de ataques extra, para combate con Artes Marciales.
 * @param {object} actor documento del actor
 * @returns {{ penalty: number|null, extraAttacks: number }} penalty null = sin override
 */
export function martialArtsAdditionalAttack(actor) {
  const arts = actor?.system?.domine?.martialArts ?? [];
  let penalty = null;
  let extraAttacks = 0;
  for (const art of arts) {
    const cfg = MARTIAL_ART_ADDITIONAL_ATTACK[art?.system?.canonicalId];
    if (!cfg) continue;
    const grade = art?.system?.grade?.value ?? art?.system?.grade;
    const p = cfg.penalty?.[grade];
    if (p != null && (penalty === null || p < penalty)) penalty = p;
    extraAttacks += cfg.extraAttacks?.[grade] ?? 0;
  }
  return { penalty, extraAttacks };
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

  // Bono variable configurable (Kung Fu / Asakusen): +X a una stat a elegir,
  // exento del +50 si va a HA/Parada/Esquiva. Se configura en system.variableBonus.
  const vbAmount = variableBonusAmount(id, grade);
  const vbCurrent = art?.system?.variableBonus ?? '';
  const variableBonus = vbAmount
    ? {
        applicable: true,
        amount: vbAmount,
        current: vbCurrent,
        options: [
          { value: '', label: '(sin asignar)' },
          { value: 'attack', label: 'Ataque' },
          { value: 'block', label: 'Parada' },
          { value: 'dodge', label: 'Esquiva' },
          { value: 'turn', label: 'Turno' },
          { value: 'damage', label: 'Daño' }
        ].map(o => ({ ...o, selected: o.value === vbCurrent }))
      }
    : { applicable: false };

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
    summary: parts.join(' · '),
    variableBonus
  };
}
