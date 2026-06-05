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

export const EFFECTS_BY_ID = indexById(EFFECT_CATALOG);
export const DISADVANTAGES_BY_ID = indexById(DISADVANTAGE_CATALOG);

export const getEffect = id => EFFECTS_BY_ID[id];
export const getDisadvantage = id => DISADVANTAGES_BY_ID[id];

/** Efectos agrupados por categoría (offensive/defensive/...), preservando el orden del catálogo. */
export const getEffectsByCategory = () => {
  const groups = {};
  for (const effect of EFFECT_CATALOG) {
    (groups[effect.category] ??= []).push(effect);
  }
  return groups;
};

export { EFFECT_CATALOG, DISADVANTAGE_CATALOG };
