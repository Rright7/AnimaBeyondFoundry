/**
 * Sincroniza el grimorio del actor con el nivel de una vía (las esferas de la
 * pestaña Magia). Al cambiar el nivel de una vía a N:
 *   - se BORRAN los hechizos del actor de esa vía con nivel > N,
 *   - se AÑADEN del compendio los de esa vía con nivel <= N que falten.
 * Solo toca la vía indicada; el resto del grimorio queda intacto.
 */
import { ABFItems } from '../../items/ABFItems.js';
import { cloneCompendiumItem } from './excelImporter/combatEquipment/compendiumMatch.js';
import { loadSpellPack, normalizeSpellName, spellLevel } from './spellCompendium.js';

/**
 * Cálculo puro del diff (testeable sin Foundry).
 * @returns {{toRemoveIds: string[], toAdd: any[]}}
 */
export function diffViaSpells(currentSpellItems, packSpells, viaKey, level) {
  const max = Number(level) || 0;

  const currentOfVia = (currentSpellItems ?? []).filter(
    i => i?.system?.via?.value === viaKey
  );

  const toRemoveIds = currentOfVia
    .filter(i => spellLevel(i) > max)
    .map(i => i.id ?? i._id)
    .filter(Boolean);

  // Nombres que se quedan (<= nivel): no los volvemos a añadir.
  const keepNames = new Set(
    currentOfVia
      .filter(i => spellLevel(i) <= max)
      .map(i => normalizeSpellName(i.name))
  );

  const toAdd = (packSpells ?? []).filter(
    s =>
      s?.system?.via?.value === viaKey &&
      spellLevel(s) <= max &&
      !keepNames.has(normalizeSpellName(s.name))
  );

  return { toRemoveIds, toAdd };
}

/**
 * @param {Actor} actor
 * @param {string} viaKey  Clave de vía (= clave de esfera).
 * @param {number} level   Nuevo nivel de la vía.
 */
export async function syncViaSpells(actor, viaKey, level) {
  if (!actor || !viaKey) return { added: 0, removed: 0 };
  try {
    const pack = await loadSpellPack();
    const current = actor.items.filter(i => i.type === ABFItems.SPELL);
    const { toRemoveIds, toAdd } = diffViaSpells(current, pack, viaKey, level);

    if (toRemoveIds.length) {
      await actor.deleteEmbeddedDocuments('Item', toRemoveIds);
    }
    if (toAdd.length) {
      const docs = toAdd.map(d => {
        const data = cloneCompendiumItem(d);
        delete data._key;
        delete data.folder;
        delete data.sort;
        return data;
      });
      await actor.createEmbeddedDocuments('Item', docs);
    }

    return { added: toAdd.length, removed: toRemoveIds.length };
  } catch (err) {
    console.error('animabf | [spells] error sincronizando vía:', err);
    return { added: 0, removed: 0 };
  }
}
