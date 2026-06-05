import { ABFItems } from './ABFItems';
import { ITEM_CONFIGURATIONS } from '../actor/utils/prepareItems/constants';
import { ensureLinkedEffectForItem } from '../actor/utils/ensureLinkedEffectForItem.js';
import {
  getEffect,
  getDisadvantage,
  getEffectsByCategory,
  DISADVANTAGE_CATALOG
} from '../domine/techniques/effectCatalog';
import {
  newTechniqueEffectRow,
  newTechniqueDisadvantageRow
} from '../types/domine/TechniqueItemConfig';

const TECHNIQUE_CATEGORY_LABELS = {
  offensive: 'Ofensivos',
  defensive: 'Defensivos',
  destructive: 'De destrucción',
  increment: 'De aumento',
  integrity: 'De integridad',
  action: 'De acción',
  reaction: 'De reacción',
  spatial: 'Espaciales',
  varied: 'Variados'
};

const TECHNIQUE_CHARACTERISTICS = [
  { key: 'agility', label: 'AGI' },
  { key: 'constitution', label: 'CON' },
  { key: 'dexterity', label: 'DES' },
  { key: 'strength', label: 'FUE' },
  { key: 'power', label: 'POD' },
  { key: 'willPower', label: 'VOL' }
];

const TECHNIQUE_MAINT_MODES = [
  { value: 'none', label: '—' },
  { value: 'maintained', label: 'Mantenido' },
  { value: 'sustainMinor', label: 'Sost. Menor' },
  { value: 'sustainMajor', label: 'Sost. Mayor' }
];

const TECHNIQUE_VALIDATION_LABELS = {
  cmExcesivo: 'CM excede el tope del nivel',
  nivelMinimo: 'Nivel insuficiente para los efectos/desventajas',
  mantenidoYSostenido: 'No se puede mezclar Mantenido y Sostenido',
  errorEnSostenidos: 'Sostenimiento no permitido (Nv1 o efecto Nv3)',
  unSoloPrimario: 'Debe haber exactamente 1 efecto primario',
  desventajasLimite: 'Las desventajas reducen más del 50% del CM',
  noPuedeReducirKi: 'Sólo puedes reducir Ki dependiendo de 3+ características',
  maxReduccionKi: 'No puedes reducir una característica más de la mitad',
  modificacionDeCostes: 'La redistribución no cuadra con las reducciones',
  costeTotal: 'El Ki repartido no cuadra con el coste total'
};

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
    const build = item.system?.build ?? {};
    const computed = item.system?.computed ?? {};
    const effects = Array.isArray(build.effects) ? build.effects : [];
    const disadvantages = Array.isArray(build.disadvantages) ? build.disadvantages : [];

    const groups = getEffectsByCategory();
    const effectGroups = Object.keys(groups).map(key => ({
      key,
      label: TECHNIQUE_CATEGORY_LABELS[key] ?? key,
      effects: groups[key].map(e => ({ id: e.id, name: e.name }))
    }));

    const effectRows = effects.map((row, index) => {
      const def = getEffect(row.effectId);
      const selected = new Set(Array.isArray(row.tierOptions) ? row.tierOptions : []);
      return {
        index,
        isPrimary: index === 0,
        effectId: row.effectId ?? '',
        effectName: def?.name ?? '',
        maintMode: row.maintMode ?? 'none',
        options: def
          ? def.tiers.map(t => ({
              option: t.option,
              selected: selected.has(t.option),
              cm: t.cm,
              kiPrimary: t.kiPrimary,
              kiSecondary: t.kiSecondary,
              level: t.level
            }))
          : [],
        ki: TECHNIQUE_CHARACTERISTICS.map(c => ({
          key: c.key,
          label: c.label,
          active: row.kiByCharacteristic?.[c.key] ?? 0,
          maint: row.maintKiByCharacteristic?.[c.key] ?? 0
        })),
        perEffect: computed.perEffect?.[index] ?? null
      };
    });

    const disadvantageRows = disadvantages.map((row, index) => {
      const def = getDisadvantage(row.disadvantageId);
      return {
        index,
        disadvantageId: row.disadvantageId ?? '',
        option: row.option ?? '',
        name: def?.name ?? '',
        options: def
          ? def.options.map(o => ({
              option: o.option,
              cmReduction: o.cmReduction,
              selected: o.option === row.option
            }))
          : []
      };
    });

    const validations = computed.validations ?? {};
    const validationBadges = Object.keys(TECHNIQUE_VALIDATION_LABELS)
      .filter(key => validations[key])
      .map(key => ({ key, label: TECHNIQUE_VALIDATION_LABELS[key] }));

    const costByCharacteristic = TECHNIQUE_CHARACTERISTICS.map(c => ({
      label: c.label,
      active: computed.costByCharacteristic?.[c.key]?.active ?? 0,
      maint: computed.costByCharacteristic?.[c.key]?.maint ?? 0
    }));

    return {
      levelOptions: [1, 2, 3].map(v => ({ value: v, selected: Number(build.level) === v })),
      build,
      computed,
      characteristics: TECHNIQUE_CHARACTERISTICS,
      maintModes: TECHNIQUE_MAINT_MODES,
      effectGroups,
      disadvantageOptions: DISADVANTAGE_CATALOG.map(d => ({ id: d.id, name: d.name })),
      effectRows,
      disadvantageRows,
      canAddEffect: effects.length < 5,
      canAddDisadvantage: disadvantages.length < 3,
      validationBadges,
      costByCharacteristic
    };
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
    const on = (selector, type, handler) =>
      root.querySelectorAll(selector).forEach(el => el.addEventListener(type, handler));

    on('[data-action="tech-add-effect"]', 'click', e => {
      e.preventDefault();
      this._techAddEffect();
    });
    on('[data-action="tech-remove-effect"]', 'click', e => {
      e.preventDefault();
      this._techRemoveEffect(Number(e.currentTarget.dataset.index));
    });
    on('[data-action="tech-add-disadvantage"]', 'click', e => {
      e.preventDefault();
      this._techAddDisadvantage();
    });
    on('[data-action="tech-remove-disadvantage"]', 'click', e => {
      e.preventDefault();
      this._techRemoveDisadvantage(Number(e.currentTarget.dataset.index));
    });
    on('[data-tech-effect-field]', 'change', e => this._techEffectFieldChange(e));
    on('[data-tech-disadvantage-field]', 'change', e => this._techDisadvantageFieldChange(e));
  }

  _techEffects() {
    return foundry.utils.duplicate(this.item.system?.build?.effects ?? []);
  }

  _techDisadvantages() {
    return foundry.utils.duplicate(this.item.system?.build?.disadvantages ?? []);
  }

  _techFixRoles(effects) {
    effects.forEach((row, i) => {
      row.role = i === 0 ? 'primary' : 'secondary';
    });
    return effects;
  }

  async _techAddEffect() {
    const effects = this._techEffects();
    if (effects.length >= 5) return;
    effects.push(newTechniqueEffectRow(effects.length === 0 ? 'primary' : 'secondary'));
    await this.item.update({ 'system.build.effects': this._techFixRoles(effects) });
  }

  async _techRemoveEffect(index) {
    const effects = this._techEffects();
    if (!effects[index]) return;
    effects.splice(index, 1);
    await this.item.update({ 'system.build.effects': this._techFixRoles(effects) });
  }

  async _techAddDisadvantage() {
    const disadvantages = this._techDisadvantages();
    if (disadvantages.length >= 3) return;
    disadvantages.push(newTechniqueDisadvantageRow());
    await this.item.update({ 'system.build.disadvantages': disadvantages });
  }

  async _techRemoveDisadvantage(index) {
    const disadvantages = this._techDisadvantages();
    if (!disadvantages[index]) return;
    disadvantages.splice(index, 1);
    await this.item.update({ 'system.build.disadvantages': disadvantages });
  }

  async _techEffectFieldChange(event) {
    const el = event.currentTarget;
    const index = Number(el.dataset.index);
    const field = el.dataset.techEffectField;
    const effects = this._techEffects();
    const row = effects[index];
    if (!row) return;

    row.kiByCharacteristic ??= {};
    row.maintKiByCharacteristic ??= {};

    if (field === 'effectId') {
      row.effectId = el.value;
      row.tierOptions = []; // las opciones del efecto anterior dejan de ser válidas
    } else if (field === 'maintMode') {
      row.maintMode = el.value;
    } else if (field === 'tierOption') {
      const option = el.dataset.option;
      const set = new Set(Array.isArray(row.tierOptions) ? row.tierOptions : []);
      if (el.checked) set.add(option);
      else set.delete(option);
      row.tierOptions = [...set];
    } else if (field.startsWith('ki.')) {
      row.kiByCharacteristic[field.slice(3)] = Number(el.value) || 0;
    } else if (field.startsWith('maint.')) {
      row.maintKiByCharacteristic[field.slice(6)] = Number(el.value) || 0;
    }

    await this.item.update({ 'system.build.effects': effects });
  }

  async _techDisadvantageFieldChange(event) {
    const el = event.currentTarget;
    const index = Number(el.dataset.index);
    const field = el.dataset.techDisadvantageField;
    const disadvantages = this._techDisadvantages();
    const row = disadvantages[index];
    if (!row) return;

    if (field === 'disadvantageId') {
      row.disadvantageId = el.value;
      row.option = '';
    } else if (field === 'option') {
      row.option = el.value;
    }

    await this.item.update({ 'system.build.disadvantages': disadvantages });
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
