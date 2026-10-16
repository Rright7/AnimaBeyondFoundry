import { openCanonicalSkillSelectDialog } from './openCanonicalSkillSelectDialog.js';
import { ELEMENTAL_KI_SKILLS } from '../../actor/utils/excelImporter/kiSkills/kiSkills.js';

describe('elemental Ki skill selection', () => {
  const previousGame = globalThis.game;
  const previousFoundry = globalThis.foundry;
  let content;
  let selectedId;

  beforeEach(() => {
    globalThis.game = { i18n: { localize: key => key } };
    globalThis.foundry = {
      applications: {
        api: {
          DialogV2: {
            prompt: async options => {
              content = options.content;
              return options.ok.callback(null, {
                form: { elements: { canonicalId: { value: selectedId } } }
              });
            }
          }
        }
      }
    };
  });

  afterEach(() => {
    globalThis.game = previousGame;
    globalThis.foundry = previousFoundry;
  });

  test('offers all six elements and no generic elemental option', async () => {
    for (const skill of ELEMENTAL_KI_SKILLS) {
      selectedId = skill.id;
      expect(await openCanonicalSkillSelectDialog('ki')).toEqual({
        name: skill.name,
        canonicalId: skill.id
      });
      expect(content).toContain(`value="${skill.id}"`);
    }
    expect(content).not.toContain('value="elementalAttack"');
  });
});
