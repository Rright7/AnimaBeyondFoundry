import { ABFItems } from '../../items/ABFItems';
import { openSimpleInputDialog } from '../../utils/dialogs/openSimpleInputDialog';
import { ABFItemConfigFactory } from '../ABFItemConfig';

/**
 * @readonly
 * @enum {string}
 */
export const CombatManeuverActionType = /** @type {const} */ ({
  ACTIVE: 'active',
  PASSIVE: 'passive'
});

/**
 * Initial data for a new combat maneuver Item. Used to infer the shape of the
 * data inside `combatManeuver.system`.
 *
 * `slug` is the canonical identifier that links this Item to the matching
 * ManeuverDefinition in the registry. When set, all rules (penalty, opposed
 * stats, damage modifiers, resolveEffects) are read from the definition.
 *
 * @readonly
 */
export const INITIAL_COMBAT_MANEUVER_DATA = {
  slug: { value: '' },
  description: { value: '' },
  actionType: { value: CombatManeuverActionType.ACTIVE },
  traits: [],
  visible: false
};

/** @type {import("../Items").CombatManeuverItemConfig} */
export const CombatManeuverItemConfig = ABFItemConfigFactory({
  type: ABFItems.COMBAT_MANEUVER,
  isInternal: false,
  hasSheet: true,
  defaultValue: INITIAL_COMBAT_MANEUVER_DATA,
  fieldPath: ['combat', 'combatManeuvers'],
  selectors: {
    addItemButtonSelector: 'add-combat-maneuver',
    containerSelector: '#combat-maneuvers-context-menu-container',
    rowSelector: '.combat-maneuver-row'
  },
  onCreate: async actor => {
    const { i18n } = game;

    const name = await openSimpleInputDialog({
      content: i18n.localize('dialogs.items.combatManeuvers.content')
    });

    const itemData = {
      name,
      type: ABFItems.COMBAT_MANEUVER,
      system: INITIAL_COMBAT_MANEUVER_DATA
    };

    await actor.createItem(itemData);
  }
});
