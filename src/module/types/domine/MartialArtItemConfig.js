import { ABFItems } from '../../items/ABFItems';
import { openMartialArtSelectDialog } from '../../utils/dialogs/openMartialArtSelectDialog';
import { ABFItemConfigFactory } from '../ABFItemConfig';

/** @type {import("../Items").MartialArtItemConfig} */
export const MartialArtItemConfig = ABFItemConfigFactory({
  type: ABFItems.MARTIAL_ART,
  isInternal: true,
  fieldPath: ['domine', 'martialArts'],
  selectors: {
    addItemButtonSelector: 'add-martial-art',
    containerSelector: '#martial-arts-context-menu-container',
    rowSelector: '.martial-art-row'
  },
  onCreate: async actor => {
    const selection = await openMartialArtSelectDialog();
    if (!selection) return;

    await actor.createInnerItem({
      name: selection.name,
      type: ABFItems.MARTIAL_ART,
      system: {
        canonicalId: selection.canonicalId,
        artType: selection.artType,
        grade: { value: selection.grade }
      }
    });
  }
});
