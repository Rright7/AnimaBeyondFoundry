/**
 * Parser de Tecnicas de Ki del Excel comunitario (Ficha Anima v8.6.x/8.7.0).
 *
 * Las tecnicas viven en la hoja "Creacion de Tecnicas": 10 bloques de 34 filas.
 * El bloque N empieza en la fila (1-based) base = 12 + (N-1)*34. Por bloque hay
 * celdas de ENTRADA del jugador (nombre, nivel, combinable, 5 filas de efectos,
 * 3 de desventajas, la rejilla de opciones de escalon y la descripcion libre).
 * Reconstruimos system.build mapeando los NOMBRES de efecto/desventaja al
 * catalogo del sistema (que se genero desde este mismo Excel, asi que coinciden).
 *
 * La hoja se resuelve por NOMBRE (en fichas reales su fichero interno no es
 * siempre sheet9). Si no existe (Excel no estandar / version vieja) -> null.
 */
import { utils } from 'xlsx';
import {
  getEffectByName,
  getDisadvantageByName,
  ELEMENTS,
  ELEMENT_DISADVANTAGES
} from '../../../../domine/techniques/effectCatalog.js';
import {
  newTechniqueEffectRow,
  newTechniqueDisadvantageRow
} from '../../../../types/domine/TechniqueItemConfig.js';

const SHEET_NAME = 'Creación de Técnicas';
const BLOCK_COUNT = 10;
const BLOCK_HEIGHT = 34;
const FIRST_BLOCK_ROW = 12; // 1-based

// Offsets de fila relativos a la cabecera del bloque (1-based).
const DESCRIPTION_ROW_OFFSET = 25; // D{base+25}
const EFFECT_ROW_OFFSET = 4; // efectos en base+4..base+8
const EFFECT_ROWS = 5;
const DISADV_ROW_OFFSET = 9; // desventajas en base+9..base+11
const DISADV_ROWS = 3;
const TIER_ROW_OFFSET = 17; // opciones de escalon en base+17..base+23
const TIER_ROWS = 7;

// Columnas (0-based) de las celdas de entrada del jugador.
const COL = {
  name: 3, // D
  level: 15, // P
  combinable: 18, // S
  role: 3, // D (filas de efecto)
  itemName: 5, // F (nombre de efecto / desventaja)
  modeOrOption: 10, // K (modo en efectos / opcion en desventajas)
  kiReduction: 24, // Y (fila base+9)
  cmReduction: 28, // AC (fila base+9)
  detail1: 14, // O (1er elemento / detalle de texto)
  detail2: 16 // Q (2o elemento)
};

// Reparto de Ki por caracteristica: [clave del modelo, col activo, col mant.].
const KI_COLUMNS = [
  ['agility', 21, 22], // V / W
  ['constitution', 23, 24], // X / Y
  ['dexterity', 25, 26], // Z / AA
  ['strength', 27, 28], // AB / AC
  ['power', 29, 30], // AD / AE
  ['willPower', 31, 32] // AF / AG
];

// Columna (0-based) de la opcion de escalon por efecto (1..5): D, J, P, V, AB.
const TIER_OPTION_COLS = [3, 9, 15, 21, 27];

const MAINT_MODE = {
  '': 'none',
  '-': 'none',
  Mantenido: 'maintained',
  'Sostenimiento Menor': 'sustainMinor',
  'Sostenimiento Mayor': 'sustainMajor'
};

const ELEMENT_BY_LABEL = Object.fromEntries(ELEMENTS.map(e => [e.label, e.key]));

function cellValue(sheet, row0, col0) {
  const cell = sheet[utils.encode_cell({ r: row0, c: col0 })];
  if (!cell) return null;
  return cell.v !== undefined ? cell.v : cell.w;
}

const str = v => (v === null || v === undefined ? '' : String(v).trim());

/** Resuelve la hoja "Creacion de Tecnicas" por NOMBRE (no por indice). */
function resolveSheet(workbook) {
  const names = workbook?.SheetNames ?? [];
  let name = names.find(n => n === SHEET_NAME);
  if (!name) {
    const norm = s =>
      String(s)
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim();
    name = names.find(n => norm(n) === norm(SHEET_NAME));
  }
  return name ? workbook.Sheets[name] : null;
}

function readEffectRow(sheet, base, i) {
  const row0 = base + EFFECT_ROW_OFFSET + i - 1;
  const name = str(cellValue(sheet, row0, COL.itemName));
  if (!name || name === '-') return null;
  const def = getEffectByName(name);
  if (!def) return { notFound: name };

  const row = newTechniqueEffectRow();
  row.effectId = def.id;
  row.role = str(cellValue(sheet, row0, COL.role)) === 'Primario' ? 'primary' : 'secondary';
  row.maintMode = MAINT_MODE[str(cellValue(sheet, row0, COL.modeOrOption))] ?? 'none';
  for (const [key, kiCol, maintCol] of KI_COLUMNS) {
    row.kiByCharacteristic[key] = Number(cellValue(sheet, row0, kiCol)) || 0;
    row.maintKiByCharacteristic[key] = Number(cellValue(sheet, row0, maintCol)) || 0;
  }
  const optCol = TIER_OPTION_COLS[i];
  const opts = [];
  for (let r = 0; r < TIER_ROWS; r++) {
    const v = str(cellValue(sheet, base + TIER_ROW_OFFSET + r - 1, optCol));
    if (v && v !== '-' && v.toLowerCase() !== 'none') opts.push(v);
  }
  row.tierOptions = opts;
  return { row };
}

function readDisadvantageRow(sheet, base, i) {
  const row0 = base + DISADV_ROW_OFFSET + i - 1;
  const name = str(cellValue(sheet, row0, COL.itemName));
  if (!name || name === '-') return null;
  const def = getDisadvantageByName(name);
  if (!def) return { notFound: name };

  const row = newTechniqueDisadvantageRow();
  row.disadvantageId = def.id;
  row.option = str(cellValue(sheet, row0, COL.modeOrOption));
  if (ELEMENT_DISADVANTAGES.has(def.id)) {
    row.detailElements = [
      str(cellValue(sheet, row0, COL.detail1)),
      str(cellValue(sheet, row0, COL.detail2))
    ]
      .map(label => ELEMENT_BY_LABEL[label])
      .filter(Boolean);
  } else {
    const detail = str(cellValue(sheet, row0, COL.detail1));
    if (detail) row.detail = detail;
  }
  return { row };
}

/**
 * Lee la hoja "Creacion de Tecnicas" y devuelve un array por tecnica:
 * { name, level, combinable, description, kiReductionLine, cmReductionLine,
 *   effects[], disadvantages[], notFound[] }. Devuelve null si la hoja no existe.
 *
 * @param {object} workbook  Workbook xlsx ya leido.
 * @returns {Array<object>|null}
 */
export function readTechniquesFromWorkbook(workbook) {
  const sheet = resolveSheet(workbook);
  if (!sheet) return null;

  const techniques = [];
  for (let b = 0; b < BLOCK_COUNT; b++) {
    const base = FIRST_BLOCK_ROW + b * BLOCK_HEIGHT;
    const baseRow0 = base - 1;
    const name = str(cellValue(sheet, baseRow0, COL.name));
    // Saltar bloques vacíos y el placeholder por defecto de la plantilla.
    if (!name || name === '-' || name === 'Nombre de la técnica') continue;

    const notFound = [];
    const effects = [];
    for (let i = 0; i < EFFECT_ROWS; i++) {
      const r = readEffectRow(sheet, base, i);
      if (!r) continue;
      if (r.notFound) notFound.push(r.notFound);
      else effects.push(r.row);
    }
    const disadvantages = [];
    for (let i = 0; i < DISADV_ROWS; i++) {
      const r = readDisadvantageRow(sheet, base, i);
      if (!r) continue;
      if (r.notFound) notFound.push(r.notFound);
      else disadvantages.push(r.row);
    }

    const combinable = str(cellValue(sheet, baseRow0, COL.combinable)).toLowerCase();
    techniques.push({
      name,
      level: Number(cellValue(sheet, baseRow0, COL.level)) || 1,
      combinable: combinable === 'sí' || combinable === 'si',
      description: str(cellValue(sheet, baseRow0 + DESCRIPTION_ROW_OFFSET, COL.name)),
      kiReductionLine: Number(cellValue(sheet, base + DISADV_ROW_OFFSET - 1, COL.kiReduction)) || 0,
      cmReductionLine: Number(cellValue(sheet, base + DISADV_ROW_OFFSET - 1, COL.cmReduction)) || 0,
      effects,
      disadvantages,
      notFound
    });
  }
  return techniques;
}
