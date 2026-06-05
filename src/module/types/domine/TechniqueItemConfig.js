import { ABFItems } from '../../items/ABFItems';
import { openSimpleInputDialog } from '../../utils/dialogs/openSimpleInputDialog';
import { ABFItemConfigFactory } from '../ABFItemConfig';
import { computeTechniqueCost } from '../../domine/techniques/computeTechniqueCost';
import { KI_CHARACTERISTICS } from '../../domine/techniques/effectCatalog';

const ZERO_KI_BY_CHARACTERISTIC = () => ({
  agility: 0,
  constitution: 0,
  dexterity: 0,
  strength: 0,
  power: 0,
  willPower: 0
});

/**
 * Initial data for a new technique. Used to infer the type of the data inside `technique.system`
 * @readonly
 */
export const INITIAL_TECHNIQUE_DATA = {
  description: { value: '' },
  level: { value: 1 },
  strength: { value: 0 },
  agility: { value: 0 },
  dexterity: { value: 0 },
  constitution: { value: 0 },
  willPower: { value: 0 },
  power: { value: 0 },
  martialKnowledge: { value: 0 },
  build: {
    level: 1,
    combinable: false,
    kiReductionLine: 0,
    cmReductionLine: 0,
    effects: [],
    disadvantages: [],
    redistribution: ZERO_KI_BY_CHARACTERISTIC()
  },
  computed: {
    cmTotal: 0,
    cmFloor: 20,
    cmCeiling: 50,
    kiActiveTotal: 0,
    kiMaintTotal: 0,
    levelRequired: 0,
    isValid: true
  }
};

/** Fila de efecto vacía para el constructor. */
export const newTechniqueEffectRow = (role = 'secondary') => ({
  effectId: '',
  role,
  tierOptions: [],
  maintMode: 'none',
  kiByCharacteristic: ZERO_KI_BY_CHARACTERISTIC(),
  maintKiByCharacteristic: ZERO_KI_BY_CHARACTERISTIC()
});

export const newTechniqueDisadvantageRow = () => ({ disadvantageId: '', option: '' });

/** @type {import("../Items").TechniqueItemConfig} */
export const TechniqueItemConfig = ABFItemConfigFactory({
  type: ABFItems.TECHNIQUE,
  isInternal: false,
  hasSheet: true,
  defaultValue: INITIAL_TECHNIQUE_DATA,
  fieldPath: ['domine', 'techniques'],
  selectors: {
    addItemButtonSelector: 'add-technique',
    containerSelector: '#techniques-context-menu-container',
    rowSelector: '.technique-row'
  },
  onCreate: async actor => {
    const { i18n } = game;

    const name = await openSimpleInputDialog({
      content: i18n.localize('dialogs.items.technique.content')
    });

    await actor.createItem({
      name,
      type: ABFItems.TECHNIQUE,
      system: INITIAL_TECHNIQUE_DATA
    });
  },
  prepareItem: async technique => {
    const { system } = technique;

    system.enrichedDescription = await (
      foundry.applications?.ux?.TextEditor?.implementation ?? TextEditor
    ).enrichHTML(system.description?.value ?? '', { async: true });

    // Coste computado desde el constructor (system.build) — siempre derivado.
    const computed = computeTechniqueCost(system.build);
    system.computed = computed;

    // Sólo derivamos los campos legacy (que el actor agrega y la fila inline
    // muestra) cuando la técnica está CONSTRUIDA con efectos; así las técnicas
    // antiguas tecleadas a mano conservan sus valores editables.
    if (Array.isArray(system.build?.effects) && system.build.effects.length > 0) {
      system.level.value = computed.level;
      system.martialKnowledge.value = computed.cmTotal;
      for (const characteristic of KI_CHARACTERISTICS) {
        if (system[characteristic]) {
          system[characteristic].value = computed.costByCharacteristic[characteristic].active;
        }
      }
    }
  }
});
