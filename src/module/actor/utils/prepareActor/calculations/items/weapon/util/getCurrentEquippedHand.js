import { WeaponEquippedHandType } from '../../../../../../../types/combat/WeaponItemConfig';
import { isTwoHandedGrip } from '../../../../utils/getCombatHandWeapons';

/**
 * Agarre actual del arma. Se DERIVA de la asignación de mano (handSlot) y la
 * manejabilidad mediante isTwoHandedGrip — fuente única para no divergir con el
 * panel "Armas en mano" ni con la FUE requerida.
 * @param {import('../../../../../../../types/Items').WeaponDataSource} weapon
 */
export const getCurrentEquippedHand = weapon =>
  isTwoHandedGrip(weapon)
    ? WeaponEquippedHandType.TWO_HANDED
    : WeaponEquippedHandType.ONE_HANDED;
