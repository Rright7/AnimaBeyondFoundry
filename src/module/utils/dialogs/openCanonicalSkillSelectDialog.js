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
      const name = escapeHtml(s.name);
      return `<option value="${s.id}" data-name="${name.toLowerCase()}">${indent}${name}</option>`;
    })
    .join('');

  const content = `
    <form>
      <div class="form-group" style="display:flex;flex-direction:column;gap:0.5rem;">
        <input type="text" name="skill-search" placeholder="${i18n.localize(
          'dialogs.search'
        )}" style="width:100%;" autofocus autocomplete="off" />
        <label for="canonical-skill-select">${i18n.localize(labelKey)}</label>
        <select id="canonical-skill-select" name="canonicalId" size="8" style="width:100%;">
          ${options}
          <option value="__homebrew__" data-name="">&mdash; ${i18n.localize(
            'dialogs.items.kiSkill.homebrew'
          )} &mdash;</option>
        </select>
        <input id="canonical-skill-homebrew-name" name="homebrewName"
               type="text" placeholder="${i18n.localize(
                 'dialogs.items.kiSkill.homebrewPlaceholder'
               )}" style="width:100%; display:none;" />
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
    render: (...renderArgs) => {
      const root = renderArgs
        .map(a => (a?.querySelectorAll ? a : a?.element))
        .find(Boolean);
      if (!root) return;
      const search = root.querySelector('[name="skill-search"]');
      const select = root.querySelector('#canonical-skill-select');
      const homebrew = root.querySelector('#canonical-skill-homebrew-name');
      if (!select) return;

      // En lista (size>1) no hay seleccion por defecto: preselecciona la primera
      if (select.selectedIndex < 0) select.selectedIndex = 0;

      // El nombre libre solo tiene sentido para "— Otra (homebrew) —"
      const syncHomebrew = () => {
        if (homebrew) {
          homebrew.style.display = select.value === '__homebrew__' ? '' : 'none';
        }
      };
      select.addEventListener('change', syncHomebrew);
      syncHomebrew();

      if (search) {
        search.addEventListener('input', () => {
          const q = search.value.trim().toLowerCase();
          let firstVisible = null;
          for (const opt of select.querySelectorAll('option')) {
            const hay = opt.dataset.name ?? opt.textContent.toLowerCase();
            const match = !q || hay.includes(q);
            opt.style.display = match ? '' : 'none';
            if (match && !firstVisible) firstVisible = opt;
          }
          const sel = select.selectedOptions[0];
          if ((!sel || sel.style.display === 'none') && firstVisible) {
            firstVisible.selected = true;
          }
          syncHomebrew();
        });
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
