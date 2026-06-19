import { WeaponEquippedHandType } from '../../../../../../../types/combat/WeaponItemConfig';
import { getCurrentEquippedHand } from './getCurrentEquippedHand';
import { hasWeaponQuality } from '../../../../utils/getCombatHandWeapons';
import { calculateAttributeModifier } from '../../../util/calculateAttributeModifier';

/**
 * @param {import('../../../../../../../types/Items').WeaponDataSource} weapon
 * @param {import('../../../../../../../types/Actor').ABFActorDataSourceData} data
 */
export const calculateWeaponStrengthModifier = (weapon, data) => {
  const isTwoHanded =
    getCurrentEquippedHand(weapon) === WeaponEquippedHandType.TWO_HANDED;

  // Regla general: a dos manos se dobla el bono de Fuerza. Excepción por arma
  // (Kusari-Gama, Katana de doble hoja…): la cualidad "noStrengthDouble" lo desactiva.
  const doublesStrength = !hasWeaponQuality(weapon, 'noStrengthDouble');
  const equippedHandMultiplier = isTwoHanded && doublesStrength ? 2 : 1;

  if (weapon.system.hasOwnStr?.value) {
    return calculateAttributeModifier(weapon.system.weaponStrength.final.value);
  }

  return data.characteristics.primaries.strength.mod.value * equippedHandMultiplier;
};
