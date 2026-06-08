import { KI_SKILLS } from '../../actor/utils/excelImporter/kiSkills/kiSkills.js';

/**
 * Show a dialog with a dropdown of every canonical Ki or Nemesis ability
 * (filtered by `type`), so the user picks instead of typing the name by
 * hand. Options are listed in their in-book DFS order and indented with
 * non-breaking spaces according to tree.depth so the dropdown reads as
 * the tree.
 *
 * Also offers a "— Otra (homebrew) —" option at the end that falls back
 * to the plain text input flow (returns `{ name: <typed>, canonicalId: null }`).
 *
 * @param {'ki' | 'nemesis'} type
 * @returns {Promise<{ name: string, canonicalId: string | null } | null>}
 *          The user's selection, or `null` if the dialog was closed.
 */
export async function openCanonicalSkillSelectDialog(type) {
  const referencedGame = game;
  const i18n = referencedGame.i18n;

  const candidates = KI_SKILLS.filter(s => s.type === type);

  const titleKey =
    type === 'nemesis'
      ? 'dialogs.items.nemesisSkill.title'
      : 'dialogs.items.kiSkill.title';
  const labelKey =
    type === 'nemesis'
      ? 'dialogs.items.nemesisSkill.selectLabel'
      : 'dialogs.items.kiSkill.selectLabel';

  const options = candidates
    .map(s => {
      const indent = '&nbsp;&nbsp;&nbsp;&nbsp;'.repeat(s.tree?.depth ?? 0);
      return `<option value="${s.id}">${indent}${escapeHtml(s.name)}</option>`;
    })
    .join('');

  const content = `
    <form>
      <div class="form-group" style="display:flex;flex-direction:column;gap:0.5rem;">
        <label for="canonical-skill-select">${i18n.localize(labelKey)}</label>
        <select id="canonical-skill-select" name="canonicalId" style="width:100%;">
          ${options}
          <option value="__homebrew__">&mdash; ${i18n.localize(
            'dialogs.items.kiSkill.homebrew'
          )} &mdash;</option>
        </select>
        <input id="canonical-skill-homebrew-name" name="homebrewName"
               type="text" placeholder="${i18n.localize(
                 'dialogs.items.kiSkill.homebrewPlaceholder'
               )}" style="width:100%;" />
      </div>
    </form>
  `;

  return foundry.applications.api.DialogV2.prompt({
    window: { title: i18n.localize(titleKey) },
    content,
    ok: {
      label: i18n.localize('dialogs.continue'),
      callback: (event, button, dialog) => {
        const form = button?.form ?? dialog?.element?.querySelector?.('form');
        const value = form?.elements?.canonicalId?.value;
        if (value === '__homebrew__') {
          const typed = (form?.elements?.homebrewName?.value ?? '').trim();
          return typed ? { name: typed, canonicalId: null } : null;
        }
        const entry = candidates.find(s => s.id === value);
        return entry ? { name: entry.name, canonicalId: entry.id } : null;
      }
    },
    rejectClose: false,
    modal: true
  }).catch(() => null);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
