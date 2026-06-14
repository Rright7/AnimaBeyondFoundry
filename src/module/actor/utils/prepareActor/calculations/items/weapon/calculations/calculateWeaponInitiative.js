import { WeaponSizeProportion } from '../../../../../../../types/combat/WeaponItemConfig';

/**
 * @param {import('../../../../../../../types/Items').WeaponDataSource} weapon
 */
export const calculateWeaponInitiative = weapon => {
  const num = v => Number(v) || 0;
  let initiative =
    num(weapon.system.initiative.base.value) +
    num(weapon.system.initiative.special.value) +
    num(weapon.system.quality.value);

  // This depends on the size of the character but right now is not automatized
  if (weapon.system.sizeProportion.value !== WeaponSizeProportion.NORMAL) {
    initiative -= 40;
  }

  return initiative;
};
