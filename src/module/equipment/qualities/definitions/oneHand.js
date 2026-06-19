import { EquipmentQualityDefinition } from '../EquipmentQualityDefinition.js';

/**
 * Arma a una mano
 * RAW: se usan con una sola mano; no doblan el bono de Fuerza por el agarre.
 *
 * Declarativa (como twoHanded / oneOrTwoHanded): es una etiqueta en la tarjeta del
 * arma. El comportamiento real de una/dos manos lo fija el campo `manageabilityType`
 * (y de él se deriva el agarre y "Armas en mano"). Icono SVG del core (seguro).
 */
export const oneHand = new EquipmentQualityDefinition({
  slug: 'oneHand',
  nameKey: 'anima.weaponQuality.oneHand.name',
  descriptionKey: 'anima.weaponQuality.oneHand.description',
  icon: 'icons/svg/sword.svg',

  appliesTo: ['weapon'],
  aliases: ['arma a una mano', 'one-handed', 'one hand', 'à une main']
});
