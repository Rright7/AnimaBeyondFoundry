import { ABFItems } from '../../items/ABFItems';
import { openSimpleInputDialog } from '../../utils/dialogs/openSimpleInputDialog';
import { ABFItemConfigFactory } from '../ABFItemConfig';

// Efecto de Técnica de Ki (Dominus Exxet). Item de compendio de referencia:
// cada efecto lleva su metadato (categoría, tipo, clase, característica primaria
// + opcionales, elementos) y la tabla de escalones con sus costes. El generador
// scripts/compendia/buildTechniqueEffectCatalog.py produce el compendio.
export const INITIAL_TECHNIQUE_EFFECT_DATA = {
  kind: { value: 'effect' },
  category: { value: '' },
  effectType: { value: '' },
  effectClass: { value: '' },
  primaryCharacteristic: { value: '' },
  optionalCharacteristics: {},
  elements: [],
  tiers: [],
  description: { value: '' }
};

/** @type {import("../Items").TechniqueEffectItemConfig} */
export const TechniqueEffectItemConfig = ABFItemConfigFactory({
  type: ABFItems.TECHNIQUE_EFFECT,
  isInternal: false,
  hasSheet: true,
  defaultValue: INITIAL_TECHNIQUE_EFFECT_DATA,
  fieldPath: ['domine', 'techniqueEffects'],
  selectors: {
    addItemButtonSelector: 'add-technique-effect',
    containerSelector: '#technique-effects-context-menu-container',
    rowSelector: '.technique-effect-row'
  },
  onCreate: async actor => {
    const name = await openSimpleInputDialog({
      content: 'Nombre del efecto de técnica:'
    });

    await actor.createItem({
      name,
      type: ABFItems.TECHNIQUE_EFFECT,
      system: INITIAL_TECHNIQUE_EFFECT_DATA
    });
  }
});
