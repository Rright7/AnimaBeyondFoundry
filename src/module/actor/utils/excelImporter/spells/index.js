/**
 * Import de hechizos del grimorio desde el Excel comunitario.
 *
 * A partir del campo `VíasDeMagiaSeleccionadas` (vías + subvías + nivel), añade
 * desde el compendio `animabf.magic` los hechizos de cada vía/subvía con
 * `level <= nivel`. Los Libre Acceso / individuales se gestionan aparte (no se
 * meten todos). Evita duplicados por nombre frente a lo ya presente.
 */
import { ABFItems } from '../../../../items/ABFItems.js';
import { cloneCompendiumItem } from '../combatEquipment/compendiumMatch.js';
import { loadSpellPack, normalizeSpellName } from '../../spellCompendium.js';
import { parseViaLevels } from './parseViaLevels.js';
import { selectSpells } from './selectSpells.js';

/**
 * @param {Actor} actor
 * @param {string} viasString  Contenido de `VíasDeMagiaSeleccionadas`.
 * @returns {Promise<{imported:number}>}
 */
export async function importSpells(actor, viasString) {
  try {
    const viaLevels = parseViaLevels(viasString);
    if (!viaLevels.length) {
      console.warn('animabf | [spells] sin vías detectadas; no se importan hechizos');
      return { imported: 0 };
    }

    const spells = await loadSpellPack();
    if (!spells.length) return { imported: 0 };

    // Libre Acceso solo si está seleccionado (se gestiona aparte), no todos.
    const selected = selectSpells(spells, viaLevels, { includeFreeAccess: false });

    const existing = new Set(
      actor.items
        .filter(i => i.type === ABFItems.SPELL)
        .map(i => normalizeSpellName(i.name))
    );

    const seen = new Set();
    const toCreate = [];
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
