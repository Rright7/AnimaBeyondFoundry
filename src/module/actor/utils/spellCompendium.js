/**
 * Acceso cacheado al compendio de hechizos del sistema (`animabf.magic`) y
 * helpers compartidos por el import del Excel y la sincronización por esfera.
 */
import { ABFItems } from '../../items/ABFItems.js';

const SPELL_PACK = 'animabf.magic';
let cache = null;

/** Para tests; sin uso en producción. */
export function _clearSpellCache() {
  cache = null;
}

export const normalizeSpellName = s =>
  String(s ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

export const spellLevel = spell => {
  const v = spell?.system?.level?.value;
  return v == null ? 0 : Number(v) || 0;
};

export async function loadSpellPack() {
  if (cache) return cache;
  const pack = game.packs.get(SPELL_PACK);
  if (!pack) {
    console.warn(`animabf | [spells] Pack no encontrado: ${SPELL_PACK}`);
    cache = [];
    return cache;
  }
  const all = await pack.getDocuments();
  cache = all.filter(d => d.type === ABFItems.SPELL);
  return cache;
}
