import { EquipmentQualityDefinition } from '../EquipmentQualityDefinition.js';

/**
 * Traba el arma
 * RAW: si realizando una parada con una de estas armas se consigue un
 * contraataque, el personaje puede realizar un ataque de Desarme sin
 * ningún tipo de penalizador.
 *
 * Hook pending — will be wired when the counterattack subsystem exposes
 * the "this parry generated a counterattack" event the consumer needs.
 */
export const locksWeapon = new EquipmentQualityDefinition({
  slug: 'locksWeapon',
  nameKey: 'anima.weaponQuality.locksWeapon.name',
  descriptionKey: 'anima.weaponQuality.locksWeapon.description',
  icon: 'icons/weapons/polearms/halberd-crescent-engraved-grey.webp',

  appliesTo: ['weapon'],
  aliases: ['traba el arma', 'locks weapon', "bloque l'arme", 'bloque l arme']
});
