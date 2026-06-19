import { ABFItems } from './ABFItems';
import { ITEM_CONFIGURATIONS } from '../actor/utils/prepareItems/constants';
import { ensureLinkedEffectForItem } from '../actor/utils/ensureLinkedEffectForItem.js';
import { GRIP_QUALITY_SLUGS } from '../actor/utils/prepareActor/utils/getCombatHandWeapons';
import {
  buildTechniqueViewModel,
  techAddEffect,
  techRemoveEffect,
  techAddDisadvantage,
  techRemoveDisadvantage,
  techEffectFieldChange,
  techDisadvantageFieldChange,
  onDropTechniqueEffect
} from '../domine/techniques/techniqueBuilder';

const ItemSheetV1 = foundry.appv1?.sheets?.ItemSheet ?? ItemSheet;
export default class ABFItemSheet extends ItemSheetV1 {
  constructor(object, options) {
    super(object, options);

    this.position.width = this.getWidthFromType();
    this.position.height = this.getHeightFromType();
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['animabf', 'sheet', 'item'],
      resizable: true
    });
  }

  get template() {
    const configuration = ITEM_CONFIGURATIONS[this.item?.type];
    if (configuration && configuration.hasSheet) {
      return `systems/animabf/templates/items/${this.item.type}/${this.item.type}.hbs`;
    }

    return super.template;
  }

  getWidthFromType() {
    switch (this.item?.type) {
      case ABFItems.SPELL:
        return 700;
      case ABFItems.ARMOR:
        return 1000;
      case ABFItems.WEAPON:
        return 815;
      case ABFItems.COMBAT_MANEUVER:
        return 560;
      case ABFItems.TECHNIQUE:
        return 780;
      default:
        return 900;
    }
  }

  getHeightFromType() {
    switch (this.item?.type) {
      case ABFItems.SPELL:
        return 450;
      case ABFItems.WEAPON:
        return 300;
      case ABFItems.ARMOR:
        return 235;
      case ABFItems.AMMO:
        return 144;
      case ABFItems.PSYCHIC_POWER:
        return 540;
      case ABFItems.COMBAT_MANEUVER:
        return 560;
      case ABFItems.TECHNIQUE:
        return 620;
      default:
        return 450;
    }
  }

  async getData(options) {
    const sheet = await super.getData(options);

    await sheet.item.prepareDerivedData();

    sheet.system = sheet.item.system;
    sheet.config = CONFIG.config;

    // Combat maneuver: enrich with definition preview from registry
    if (sheet.item.type === ABFItems.COMBAT_MANEUVER) {
      sheet.maneuverPreview = this._buildManeuverPreview(sheet.item);
    }

    // Technique: build the constructor view-model (catalog + per-row options + cost)
    if (sheet.item.type === ABFItems.TECHNIQUE) {
      sheet.technique = this._buildTechniqueSheetData(sheet.item);
    }

    return sheet;
  }

  /**
   * View-model para la hoja-constructor de Técnicas de Ki: catálogo de efectos
   * agrupado, opciones disponibles por fila (según el efecto elegido), coste
   * computado y avisos de validación. La aritmética vive en computeTechniqueCost.
   * @param {Item} item
   * @returns {object}
   */
  _buildTechniqueSheetData(item) {
    return buildTechniqueViewModel(item);
  }

  /**
   * Build a read-only preview block from the ManeuverDefinition registry,
   * looked up by the Item's slug. Returns null if no slug is set or the
   * registry has no entry for that slug.
   * @param {Item} item
   * @returns {object|null}
   */
  _buildManeuverPreview(item) {
    const slug = item.system?.slug?.value;
    if (!slug) return null;
    const def = game.animabf?.maneuvers?.get?.(slug);
    if (!def) return null;
    return {
      attackPenalty: def.attackPenalty ?? 0,
      forceTAZero: def.forceTAZero === true,
      attackerStats: (def.attackerStats ?? []).join(' / ').toUpperCase(),
      defenderStats: (def.defenderStats ?? []).join(' / ').toUpperCase(),
      grantsQuadrupedBonus: def.grantsQuadrupedBonus === true
    };
  }

  // ============================
  // Weapon qualities drag & drop
  // ============================
  // The weapon sheet shows a [data-drop-target="weaponQuality"] zone and
  // chips that map to entries of system.qualities.value. Dropping a
  // weaponQuality compendium item adds its slug; clicking the × on a chip
  // removes it.
  activateListeners(html) {
    super.activateListeners(html);

    const root = html[0] ?? html;
    if (!root) return;

    if (this.item?.type === ABFItems.WEAPON) {
      this._activateWeaponListeners(root);
    } else if (this.item?.type === ABFItems.TECHNIQUE) {
      this._activateTechniqueListeners(root);
    }
  }

  _activateWeaponListeners(root) {
    const dropZone = root.querySelector('[data-drop-target="weaponQuality"]');
    if (dropZone) {
      dropZone.addEventListener('dragover', e => {
        e.preventDefault();
        dropZone.classList.add('weapon-qualities-section--drag-over');
      });
      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('weapon-qualities-section--drag-over');
      });
      dropZone.addEventListener('drop', async e => {
        e.preventDefault();
        dropZone.classList.remove('weapon-qualities-section--drag-over');
        await this._onDropWeaponQuality(e);
      });
    }

    root
      .querySelectorAll('[data-action="removeQuality"]')
      .forEach(btn => {
        btn.addEventListener('click', async e => {
          e.preventDefault();
          const slug = e.currentTarget?.dataset?.qualitySlug;
          if (!slug) return;
          await this._removeWeaponQuality(slug);
        });
      });
  }

  // ============================
  // Technique constructor (Ki)
  // ============================
  _activateTechniqueListeners(root) {
    const { item } = this;
    const on = (selector, type, handler) =>
      root.querySelectorAll(selector).forEach(el => el.addEventListener(type, handler));

    on('[data-action="tech-add-effect"]', 'click', e => {
      e.preventDefault();
      techAddEffect(item);
    });
    on('[data-action="tech-remove-effect"]', 'click', e => {
      e.preventDefault();
      techRemoveEffect(item, Number(e.currentTarget.dataset.index));
    });
    on('[data-action="tech-add-disadvantage"]', 'click', e => {
      e.preventDefault();
      techAddDisadvantage(item);
    });
    on('[data-action="tech-remove-disadvantage"]', 'click', e => {
      e.preventDefault();
      techRemoveDisadvantage(item, Number(e.currentTarget.dataset.index));
    });
    on('[data-tech-effect-field]', 'change', e => techEffectFieldChange(item, e.currentTarget));
    on('[data-tech-disadvantage-field]', 'change', e =>
      techDisadvantageFieldChange(item, e.currentTarget)
    );

    const dropZone = root.querySelector('[data-drop-target="techniqueEffect"]');
    if (dropZone) {
      dropZone.addEventListener('dragover', e => {
        e.preventDefault();
        dropZone.classList.add('technique-drop-zone--drag-over');
      });
      dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('technique-drop-zone--drag-over');
      });
      dropZone.addEventListener('drop', async e => {
        e.preventDefault();
        dropZone.classList.remove('technique-drop-zone--drag-over');
        await onDropTechniqueEffect(item, e);
      });
    }
  }

  async _onDropWeaponQuality(event) {
    let payload;
    try {
      payload = JSON.parse(event.dataTransfer?.getData('text/plain') ?? '{}');
    } catch {
      return;
    }
    if (!payload || payload.type !== 'Item') return;

    const doc = await fromUuid(payload.uuid);
    if (!doc || doc.type !== ABFItems.WEAPON_QUALITY) {
      return ui.notifications?.warn(
        'Solo se pueden arrastrar items de tipo Cualidad de arma aquí.'
      );
    }

    const slug = String(doc.system?.slug?.value ?? '').trim();
    if (!slug) {
      return ui.notifications?.warn(
        'La cualidad arrastrada no tiene slug definido.'
      );
    }

    const current = Array.isArray(this.item.system?.qualities?.value)
      ? this.item.system.qualities.value.slice()
      : [];
    if (current.includes(slug)) {
      return ui.notifications?.info(`${doc.name} ya está en este arma.`);
    }

    current.push(slug);
    await this.item.update({ 'system.qualities.value': current });
  }

  async _removeWeaponQuality(slug) {
    // El agarre es obligatorio (exactamente uno) y lo gobierna la cualidad: no se
    // quita desde el chip; se cambia con el selector de Manejabilidad o arrastrando
    // otra cualidad de agarre.
    if (GRIP_QUALITY_SLUGS.includes(slug)) {
      return ui.notifications?.info(
        'El agarre no se quita: cámbialo con el selector de Manejabilidad o arrastrando otra cualidad de agarre.'
      );
    }
    const current = Array.isArray(this.item.system?.qualities?.value)
      ? this.item.system.qualities.value.slice()
      : [];
    const next = current.filter(s => s !== slug);
    if (next.length === current.length) return;
    await this.item.update({ 'system.qualities.value': next });
  }

  // ABFItemSheet.js

  async _render(force, options = {}) {
    if (!this.item || !this.item.type) {
      return super._render(force, options);
    }

    if (this.item.type !== ABFItems.EFFECT) {
      return super._render(force, options);
    }

    if (
      typeof this.item.toActiveEffectData !== 'function' ||
      typeof this.item.fromActiveEffect !== 'function'
    ) {
      return super._render(force, options);
    }

    const aeData = this.item.toActiveEffectData();
    if (!aeData) return super._render(force, options);

    const { parent } = this.item;
    const isOwned = parent instanceof Actor;

    // ============================
    // World Item (Items tab)
    // ============================
    if (!isOwned) {
      const [effect] = await this.item.createEmbeddedDocuments('ActiveEffect', [aeData]);
      if (!effect) return super._render(force, options);

      const syncHandler = async (doc, diff, hookOptions, userId) => {
        if (doc.id !== effect.id) return;
        if (userId !== game.user.id) return;

        // If user toggles "apply to actor", force it off
        if (doc.transfer === true) {
          await doc.update({ transfer: false });
          return; // avoid syncing the "true" state
        }

        await this.item.fromActiveEffect(doc);
        // IMPORTANT: do NOT delete the AE here (it would close the editor on "Add Change")
      };

      Hooks.on('updateActiveEffect', syncHandler);

      Hooks.once('closeActiveEffectConfig', async app => {
        if (app?.document?.id !== effect.id) return;

        Hooks.off('updateActiveEffect', syncHandler);
        await this.item.deleteEmbeddedDocuments('ActiveEffect', [effect.id]);
      });

      effect.sheet?.render(true);
      return;
    }

    // ============================
    // Owned Item (inside an Actor)
    // ============================
    // Delegate to the central helper (single source of truth, in-flight guard
    // against the race condition where two render passes both create an AE).
    const actor = parent;
    const effect = await ensureLinkedEffectForItem(actor, this.item);

    if (!effect) return super._render(force, options);

    const syncHandler = async (doc, diff, hookOptions, userId) => {
      if (doc.id !== effect.id) return;
      if (userId !== game.user.id) return;

      // If user toggles "apply to actor", force it off
      if (doc.transfer === true) {
        await doc.update({ transfer: false });
        return;
      }

      await this.item.fromActiveEffect(doc);
      Hooks.off('updateActiveEffect', syncHandler);
    };

    Hooks.on('updateActiveEffect', syncHandler);
    effect.sheet?.render(true);
  }
}
