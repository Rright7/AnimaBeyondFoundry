import { isTwoHandedGrip } from '../../../../utils/getCombatHandWeapons';

/**
 * FUE requerida según el agarre actual (derivado de handSlot/manejabilidad):
 * a dos manos usa strRequired.twoHands; a una mano, strRequired.oneHand.
 * @param {import('../../../../../../../types/Items').WeaponDataSource} weapon
 */
export const getStrengthRequirement = weapon =>
  isTwoHandedGrip(weapon)
    ? weapon.system.strRequired.twoHands.final.value
    : weapon.system.strRequired.oneHand.final.value;
