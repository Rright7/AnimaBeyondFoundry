import { EquipmentQualityDefinition } from '../EquipmentQualityDefinition.js';

/**
 * Arma a dos manos
 * RAW: se usan necesariamente con ambas manos. Permite al personaje doblar
 * el bono de Fuerza para calcular su daño final.
 *
 * No hook yet — the damage engine will gain a `modifyDamage` consumer when
 * we wire the STR doubling pathway. Until then the quality is purely
 * declarative: it shows up on the weapon card so players and GMs see it.
 */
export const twoHanded = new EquipmentQualityDefinition({
  slug: 'twoHanded',
  nameKey: 'anima.weaponQuality.twoHanded.name',
  descriptionKey: 'anima.weaponQuality.twoHanded.description',
  icon: 'icons/weapons/swords/greatsword-blue.webp',

  appliesTo: ['weapon'],
  aliases: ['arma a dos manos', 'two-handed', 'à deux mains']
});
