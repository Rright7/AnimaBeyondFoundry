/**
 * Import de hechizos del grimorio desde el Excel comunitario.
 *
 * A partir del campo `VíasDeMagiaSeleccionadas` (vías + subvías + nivel), añade desde el
 * compendio `animabf.magic` los hechizos de cada vía/subvía ESTÁNDAR con `level <= nivel`.
 * Las vías FANDOM (no oficiales, p. ej. "AdAstra") no están en el compendio: se leen de su
 * hoja de grimorio del propio Excel y se registran como vías custom. Evita duplicados por
 * nombre frente a lo ya presente.
 */
import { ABFItems } from '../../../../items/ABFItems.js';
import { cloneCompendiumItem } from '../combatEquipment/compendiumMatch.js';
import { loadSpellPack, normalizeSpellName } from '../../spellCompendium.js';
import { parseViaLevels } from './parseViaLevels.js';
import { parseFanmadeGrimoire } from './parseFanmadeGrimoire.js';
import { selectSpells } from './selectSpells.js';
import { slugifyVia, ensureCustomVias } from '../../../../mystic/customVias.js';
import { utils } from 'xlsx';

/**
 * @param {Actor} actor
 * @param {string} viasString  Contenido de `VíasDeMagiaSeleccionadas`.
 * @param {object} [workbook]  Workbook xlsx completo (para las hojas de grimorio fandom).
 * @returns {Promise<{imported:number}>}
 */
export async function importSpells(actor, viasString, workbook) {
  try {
    const viaLevels = parseViaLevels(viasString);
    if (!viaLevels.length) {
      console.warn('animabf | [spells] sin vías detectadas; no se importan hechizos');
      return { imported: 0 };
    }

    const pack = (await loadSpellPack()) ?? [];
    const selected = pack.length
      ? selectSpells(pack, viaLevels, { includeFreeAccess: false })
      : [];

    const existing = new Set(
      actor.items
        .filter(i => i.type === ABFItems.SPELL)
        .map(i => normalizeSpellName(i.name))
    );
    const seen = new Set();
    const toCreate = [];

    // Vías ESTÁNDAR: hechizos del compendio oficial.
    for (const doc of selected) {
      const key = normalizeSpellName(doc.name);
      if (existing.has(key) || seen.has(key)) continue;
      seen.add(key);
      const data = cloneCompendiumItem(doc);
      delete data._key;
      delete data.folder;
      delete data.sort;
      toCreate.push(data);
    }

    // Vías FANDOM: leer su hoja de grimorio del Excel + registrar las vías custom.
    if (workbook) {
      for (const item of buildFanmadeSpellItems(viaLevels, workbook)) {
        const key = normalizeSpellName(item.name);
        if (existing.has(key) || seen.has(key)) continue;
        seen.add(key);
        toCreate.push(item);
      }
      await registerFanmadeVias(viaLevels);
    }

    if (toCreate.length) {
      await actor.createEmbeddedDocuments('Item', toCreate);
    }

    ui.notifications?.info(
      game.i18n.format('anima.ui.excelImporter.spells.notifSummary', {
        count: toCreate.length
      })
    );

    return { imported: toCreate.length };
  } catch (err) {
    console.error('animabf | [spells] error importando hechizos:', err);
    return { imported: 0 };
  }
}

const normalizeSheet = s =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/** Lee las hojas de grimorio de las vías fandom y devuelve items de hechizo (level <= nivel). */
function buildFanmadeSpellItems(viaLevels, workbook) {
  const out = [];
  const fanmade = viaLevels.filter(v => v.custom);
  if (!fanmade.length) return out;

  const sheetNames = workbook.SheetNames ?? [];
  for (const via of fanmade) {
    const key = slugifyVia(via.viaKey);
    // Hoja del grimorio: su nombre empieza por el de la vía (ej. "AdAstra (Primigenia)").
    const sheetName = sheetNames.find(n =>
      normalizeSheet(n).startsWith(normalizeSheet(via.viaKey))
    );
    if (!sheetName) continue;

    const rows = utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      blankrows: false,
      defval: ''
    });
    const spells = parseFanmadeGrimoire(rows, { viaKey: key }).filter(
      s => s.level <= via.level
    );
    for (const s of spells) out.push(toSpellItemData(s));
  }
  return out;
}

/** Registra las vías fandom como vías custom (solo DJ). */
async function registerFanmadeVias(viaLevels) {
  const fanmade = viaLevels.filter(v => v.custom);
  if (!fanmade.length) return;
  await ensureCustomVias(
    fanmade.map(v => ({ key: slugifyVia(v.viaKey), label: v.viaKey }))
  );
}

function toSpellItemData(s) {
  const grade = g => ({
    intRequired: { value: g.intRequired },
    zeon: { value: g.zeon },
    maintenanceCost: { value: g.maintenanceCost },
    description: { value: g.description }
  });
  return {
    name: s.name,
    type: ABFItems.SPELL,
    system: {
      level: { value: s.level },
      via: { value: s.viaKey },
      spellType: { value: s.spellType },
      combatType: { value: s.combatType },
      actionType: { value: s.actionType },
      hasDailyMaintenance: { value: s.hasDailyMaintenance },
      grades: {
        base: grade(s.grades.base),
        intermediate: grade(s.grades.intermediate),
        advanced: grade(s.grades.advanced),
        arcane: grade(s.grades.arcane)
      }
    }
  };
}
