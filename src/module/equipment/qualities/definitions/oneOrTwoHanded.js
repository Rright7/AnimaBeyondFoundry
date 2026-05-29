import { EquipmentQualityDefinition } from '../EquipmentQualityDefinition.js';

/**
 * Arma a una o dos manos
 * RAW: pueden utilizarse indistintamente con una o ambas manos. Con dos
 * manos también doblan el bono de Fuerza para el daño. La FUE requerida
 * tiene dos valores: el primero para dos manos, el segundo para una.
 *
 * Hook pending — bound to the same damage subsystem that will handle
 * `twoHanded`; reads the grip the player chose at the dialog.
 */
export const oneOrTwoHanded = new EquipmentQualityDefinition({
  slug: 'oneOrTwoHanded',
  nameKey: 'anima.weaponQuality.oneOrTwoHanded.name',
  descriptionKey: 'anima.weaponQuality.oneOrTwoHanded.description',
  icon: 'icons/weapons/swords/sword-broad.webp',

  appliesTo: ['weapon'],
  aliases: ['arma a una o dos manos', 'one or two-handed', 'à une ou deux mains']
});
