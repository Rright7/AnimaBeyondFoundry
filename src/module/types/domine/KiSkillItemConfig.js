import { ABFItems } from '../../items/ABFItems';
import { openCanonicalSkillSelectDialog } from '../../utils/dialogs/openCanonicalSkillSelectDialog';
import { ABFItemConfigFactory } from '../ABFItemConfig';

/** @type {import("../Items").KiSkillItemConfig} */
export const KiSkillItemConfig = ABFItemConfigFactory({
  type: ABFItems.KI_SKILL,
  isInternal: true,
  fieldPath: ['domine', 'kiSkills'],
  selectors: {
    addItemButtonSelector: 'add-ki-skill',
    containerSelector: '#ki-skills-context-menu-container',
    rowSelector: '.ki-skill-row'
  },
  onCreate: async actor => {
    const selection = await openCanonicalSkillSelectDialog('ki');
    if (!selection) return;

    const system = selection.canonicalId
      ? { canonicalId: selection.canonicalId }
      : {};

    await actor.createInnerItem({
      name: selection.name,
      type: ABFItems.KI_SKILL,
      system
    });
  }
});
