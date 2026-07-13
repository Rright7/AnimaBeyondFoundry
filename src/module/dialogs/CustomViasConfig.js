import { ABFSettingsKeys } from '../../utils/settingKeys.js';
import { Templates } from '../utils/constants';
import { getCustomVias, slugifyVia } from '../mystic/customVias.js';

// Menu de ajustes "Vias personalizadas": el DJ anade/quita vias magicas custom por su
// nombre. Al guardar se persisten en el setting CUSTOM_VIAS; su onChange fusiona en la
// config y re-renderiza las hojas abiertas.
export default class CustomViasConfig extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: 'abf-custom-vias-config',
      title: 'Vías personalizadas',
      template: Templates.Dialog.Config.CustomVias,
      classes: ['animabf', 'sheet'],
      width: 460,
      height: 'auto',
      closeOnSubmit: true
    });
  }

  getData() {
    return { vias: getCustomVias() };
  }

  activateListeners(html) {
    super.activateListeners(html);
    const root = html[0] ?? html;

    root.querySelector('.cv-add')?.addEventListener('click', () => {
      const list = root.querySelector('.cv-list');
      if (!list) return;
      const row = document.createElement('div');
      row.className = 'cv-row';
      row.dataset.key = '';
      row.style.cssText = 'display:flex; gap:.4rem; align-items:center; margin-bottom:.35rem;';
      row.innerHTML =
        '<input type="text" class="cv-label" placeholder="Nombre de la vía" style="flex:1 1 auto;"/>' +
        '<button type="button" class="cv-del" title="Quitar"><i class="fas fa-trash"></i></button>';
      list.appendChild(row);
      row.querySelector('.cv-label')?.focus();
    });

    // Delegado: sirve para las filas iniciales y las anadidas dinamicamente.
    root.querySelector('.cv-list')?.addEventListener('click', ev => {
      const del = ev.target.closest?.('.cv-del');
      if (del) del.closest('.cv-row')?.remove();
    });
  }

  async _updateObject() {
    const root = this.element?.[0] ?? this.element;
    const rows = root ? [...root.querySelectorAll('.cv-row')] : [];

    const vias = [];
    const usedKeys = new Set();
    for (const row of rows) {
      const label = row.querySelector('.cv-label')?.value?.trim();
      if (!label) continue;
      let key = String(row.dataset.key ?? '').trim();
      if (!key) key = slugifyVia(label);
      while (usedKeys.has(key)) key = `${key}-2`;
      usedKeys.add(key);
      vias.push({ key, label });
    }

    // El onChange del setting fusiona en la config y re-renderiza las hojas abiertas.
    await game.settings.set(game.animabf.id, ABFSettingsKeys.CUSTOM_VIAS, vias);
  }
}
