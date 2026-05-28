import { ABFItems } from './ABFItems';
import { ITEM_CONFIGURATIONS } from '../actor/utils/prepareItems/constants';
import { ensureLinkedEffectForItem } from '../actor/utils/ensureLinkedEffectForItem.js';

const ItemSheetV1 = foundry.appv1?.sheets?.ItemSheet ?? ItemSheet;
export default class ABFItemSheet extends ItemSheetV1 {
  constructor(object, options) {
    super(object, options);

    this.position.width = this.getWidthFromType();
    this.position.height = this.getHeightFromType();
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['sheet', 'item'],
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

    return sheet;
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
