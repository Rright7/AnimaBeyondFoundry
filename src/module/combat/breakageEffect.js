// /module/combat/breakageEffect.js
//
// Capa de runtime de la regla opcional de rotura (toca Foundry: item.update).
// La aritmética vive en ./breakage.js (pura, testeada). Aquí solo la mutación
// de los items al romperse.

import { ARMOR_TA_KEYS, resolveQualityHit, degradeArmorTA } from './breakage.js';

const num = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

/**
 * Aplica la rotura a un arma. Si tiene calidad >= +5 baja un grado (no se
 * destruye); si no, se destruye → integridad a 0 (RAW "inservible").
 * @param {object} weapon item arma
 * @returns {Promise<{destroyed:boolean,newQuality:number}|null>}
 */
export async function breakWeapon(weapon) {
  try {
    if (!weapon) return null;
    const res = resolveQualityHit(num(weapon.system?.quality?.value));
    if (res.destroyed) {
      await weapon.update({ 'system.integrity.base.value': 0 });
    } else {
      await weapon.update({ 'system.quality.value': res.newQuality });
    }
    return res;
  } catch (err) {
    console.error('[ABF] breakWeapon error:', err);
    return null;
  }
}

/**
 * Aplica la rotura a una armadura: todas las TA bajan 1 punto (mínimo 0). Si
 * todas llegan a 0 queda inservible → integridad a 0.
 * @param {object} armor item armadura
 * @returns {Promise<{values:Record<string,number>,useless:boolean}|null>}
 */
export async function breakArmor(armor) {
  try {
    if (!armor) return null;
    const current = {};
    for (const k of ARMOR_TA_KEYS) current[k] = num(armor.system?.[k]?.base?.value);
    const res = degradeArmorTA(current);
    const update = {};
    for (const k of ARMOR_TA_KEYS) update[`system.${k}.base.value`] = res.values[k];
    if (res.useless) update['system.integrity.base.value'] = 0;
    await armor.update(update);
    return res;
  } catch (err) {
    console.error('[ABF] breakArmor error:', err);
    return null;
  }
}
