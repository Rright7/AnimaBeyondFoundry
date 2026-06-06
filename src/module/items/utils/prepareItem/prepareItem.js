import ABFItem from '../../ABFItem';
import { ABFItems } from '../../ABFItems';
import {
  ALL_ITEM_CONFIGURATIONS,
  ITEM_CONFIGURATIONS
} from '../../../actor/utils/prepareItems/constants';
import { normalizeItem } from '../../../actor/utils/prepareActor/utils/normalizeItem';

export const prepareItem = async item => {
  const configuration = ITEM_CONFIGURATIONS[item.type];

  if (configuration?.defaultValue) {
    item = await normalizeItem(item, configuration.defaultValue);
  }

  try {
    await ALL_ITEM_CONFIGURATIONS[item.type]?.prepareItem?.(item);
  } catch (err) {
    console.error(
      `animabf | prepareItem failed for "${item?.name}" (${item?.type})`,
      err
    );
  }
};
