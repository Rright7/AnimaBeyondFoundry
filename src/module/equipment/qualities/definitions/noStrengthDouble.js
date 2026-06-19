import { EquipmentQualityDefinition } from '../EquipmentQualityDefinition.js';

/**
 * No dobla la Fuerza a dos manos
 * Excepción RAW: ciertas armas a dos manos (Kusari-Gama, Katana de doble hoja…) NO
 * duplican el bono de Fuerza pese a empuñarse con ambas manos. Marcador leído por
 * calculateWeaponStrengthModifier (vía hasWeaponQuality); sustituye al antiguo
 * checkbox `doublesStrengthTwoHanded`.
 */
export const noStrengthDouble = new EquipmentQualityDefinition({
  slug: 'noStrengthDouble',
  nameKey: 'anima.weaponQuality.noStrengthDouble.name',
  descriptionKey: 'anima.weaponQuality.noStrengthDouble.description',
  icon: 'icons/svg/downgrade.svg',

  appliesTo: ['weapon'],
  aliases: ['no dobla fuerza', 'no strength double']
});
