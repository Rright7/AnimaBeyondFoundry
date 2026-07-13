/**
 * Parser de una hoja de "Grimorio de Vía" FANDOM del Excel comunitario (vías no oficiales,
 * p. ej. "AdAstra (Primigenia)"). Los conjuros fandom NO están en el compendio oficial, así
 * que se leen directamente de su hoja.
 *
 * Layout (verificado contra "Lif Litterae_2.xlsm" → hoja "AdAstra (Primigenia)"): DOS
 * columnas de conjuros por página (izquierda offset 0, derecha offset +19). Cada conjuro es
 * un bloque anclado por una fila cuya col 2 = "Grado":
 *   fila-1 (cabecera):  col 2 nombre · col 8 nivel · col 12 vía/subvía
 *   fila 0 (grados):    col 2 "Grado" · col 8 Tipo · col 12 Acción · col 16 Diario
 *   filas +1..+4:       Base/Intermedio/Avanzado/Arcano → col4 Int.R · col5 Zeón · col6 Mant · col7 efecto
 *
 * Devuelve datos LIMPIOS (no items Foundry): el llamador construye el item de hechizo.
 */

// Columnas de la COLUMNA IZQUIERDA (la derecha = estas + 19).
const COL = {
  name: 2,
  level: 8,
  type: 8,
  action: 12,
  daily: 16,
  gradeName: 2,
  intR: 4,
  zeon: 5,
  mant: 6,
  effect: 7
};
const RIGHT_OFFSET = 19;
const GRADE_KEYS = ['base', 'intermediate', 'advanced', 'arcane'];

const SPELL_TYPE_MAP = {
  ataque: 'attack',
  anímico: 'animatic',
  animico: 'animatic',
  efecto: 'effect',
  defensa: 'defense',
  detección: 'detection',
  deteccion: 'detection',
  automático: 'automatic',
  automatico: 'automatic',
  escudo: 'defense'
};

const cell = (r, c) => String(r?.[c] ?? '').trim();
const numOr0 = v => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

function mapSpellType(raw) {
  const first = String(raw).split(',')[0].trim().toLowerCase();
  return SPELL_TYPE_MAP[first] ?? 'effect';
}
function mapCombatType(raw) {
  const t = String(raw).toLowerCase();
  if (t.includes('ataque')) return 'attack';
  if (t.includes('defensa') || t.includes('escudo')) return 'defense';
  return 'none';
}

function parseSpellAt(grid, i, off, viaKey) {
  const header = grid[i - 1] || [];
  const gradeHeader = grid[i] || [];
  const name = cell(header, COL.name + off);
  if (!name) return null;

  const grade = k => {
    const gr = grid[i + 1 + GRADE_KEYS.indexOf(k)] || [];
    return {
      intRequired: numOr0(cell(gr, COL.intR + off)),
      zeon: numOr0(cell(gr, COL.zeon + off)),
      maintenanceCost: numOr0(cell(gr, COL.mant + off)), // "No" → 0
      description: cell(gr, COL.effect + off)
    };
  };

  const typeRaw = cell(gradeHeader, COL.type + off);
  return {
    name,
    level: numOr0(cell(header, COL.level + off)),
    viaKey,
    spellType: mapSpellType(typeRaw),
    combatType: mapCombatType(typeRaw),
    actionType: /^pas/i.test(cell(gradeHeader, COL.action + off)) ? 'passive' : 'active',
    hasDailyMaintenance: /^s/i.test(cell(gradeHeader, COL.daily + off)),
    grades: {
      base: grade('base'),
      intermediate: grade('intermediate'),
      advanced: grade('advanced'),
      arcane: grade('arcane')
    }
  };
}

/**
 * @param {any[][]} rows  Filas de la hoja (sheet_to_json header:1).
 * @param {{viaKey:string}} opts  Clave de la vía custom a la que pertenecen.
 * @returns {Array<object>} conjuros parseados (name, level, viaKey, spellType, ... grades).
 */
export function parseFanmadeGrimoire(rows, { viaKey = '' } = {}) {
  const grid = Array.isArray(rows) ? rows : [];
  const spells = [];
  for (let i = 1; i < grid.length; i++) {
    const row = grid[i] || [];
    for (const off of [0, RIGHT_OFFSET]) {
      if (cell(row, COL.gradeName + off).toLowerCase() !== 'grado') continue;
      const spell = parseSpellAt(grid, i, off, viaKey);
      if (spell) spells.push(spell);
    }
  }
  return spells;
}
