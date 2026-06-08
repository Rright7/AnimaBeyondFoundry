import {
  MARTIAL_ARTS,
  MARTIAL_ART_IDS
} from '../../combat/martialArts/martialArtCatalog.js';

/**
 * Selector de Arte Marcial con buscador. Se elige SOLO el arte (no el grado): se
 * crea en grado Base y el grado se ajusta luego en el desplegable de la ficha.
 * Devuelve { canonicalId, artType, name, grade:'base' } o null si se cierra.
 *
 * @returns {Promise<{canonicalId:string, artType:string, name:string, grade:string}|null>}
 */
export async function openMartialArtSelectDialog() {
  const { i18n } = game;

  const groups = { basic: [], advanced: [] };
  for (const id of MARTIAL_ART_IDS) {
    const def = MARTIAL_ARTS[id];
    if (!def) continue;
    groups[def.type].push(
      `<option value="${id}" data-name="${escapeHtml(def.name).toLowerCase()}">${escapeHtml(def.name)}</option>`
    );
  }
  const optgroup = (label, opts) =>
    opts.length ? `<optgroup label="${label}">${opts.join('')}</optgroup>` : '';

  const label =
    i18n.localize('dialogs.items.martialArt.selectLabel') || 'Arte Marcial';
  const searchPh = 'Buscar...';
  const content = `
    <form>
      <div class="form-group" style="display:flex;flex-direction:column;gap:.5rem;">
        <input type="text" name="ma-search" placeholder="${searchPh}" style="width:100%;" autofocus autocomplete="off" />
        <label for="ma-select">${label}</label>
        <select id="ma-select" name="art" size="8" style="width:100%;">
          ${optgroup('Basicas', groups.basic)}
          ${optgroup('Avanzadas', groups.advanced)}
        </select>
      </div>
    </form>`;

  return foundry.applications.api.DialogV2.prompt({
    window: { title: i18n.localize('dialogs.items.martialArt.title') || 'Nueva Arte Marcial' },
    content,
    ok: {
      label: i18n.localize('dialogs.continue') || 'Continuar',
      callback: (event, button, dialog) => {
        const form = button?.form ?? dialog?.element?.querySelector?.('form');
        const id = form?.elements?.art?.value;
        const def = MARTIAL_ARTS[id];
        if (!def) return null;
        return { canonicalId: id, artType: def.type, name: def.name, grade: 'base' };
      }
    },
    render: (...renderArgs) => {
      const root = renderArgs
        .map(a => (a?.querySelectorAll ? a : a?.element))
        .find(Boolean);
      if (!root) return;
      const search = root.querySelector('[name="ma-search"]');
      const select = root.querySelector('#ma-select');
      if (!search || !select) return;
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
        if ((!sel || sel.style.display === 'none') && firstVisible) firstVisible.selected = true;
      });
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
