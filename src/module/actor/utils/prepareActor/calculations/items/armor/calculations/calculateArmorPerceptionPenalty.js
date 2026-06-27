import { ArmorLocation } from '../../../../../../../types/combat/ArmorItemConfig';

/**
 * @param {import("../../../../../../../types/Items").ArmorDataSource} armor
 * @returns {number}
 */
export const calculateArmorPerceptionPenalty = armor => {
  if (
    armor.system.localization.value !== ArmorLocation.HEAD &&
    armor.system.localization.value !== ArmorLocation.HEAD_CLOSED
  )
    return 0;
  return Math.min(armor.system.perceptionPenalty.base.value, 0);
};

