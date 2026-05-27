import { ABFItems } from '../../items/ABFItems';
import { openCanonicalSkillSelectDialog } from '../../utils/dialogs/openCanonicalSkillSelectDialog';
import { ABFItemConfigFactory } from '../ABFItemConfig';

/** @type {import("../Items").NemesisSkillItemConfig} */
export const NemesisSkillItemConfig = ABFItemConfigFactory({
  type: ABFItems.NEMESIS_SKILL,
  isInternal: true,
  fieldPath: ['domine', 'nemesisSkills'],
  selectors: {
    addItemButtonSelector: 'add-nemesis-skill',
    containerSelector: '#nemesis-skills-context-menu-container',
    rowSelector: '.nemesis-skill-row'
  },
  onCreate: async actor => {
    const selection = await openCanonicalSkillSelectDialog('nemesis');
    if (!selection) return;

    const system = selection.canonicalId
      ? { canonicalId: selection.canonicalId }
      : {};

    await actor.createInnerItem({
      name: selection.name,
      type: ABFItems.NEMESIS_SKILL,
      system
    });
  }
});
