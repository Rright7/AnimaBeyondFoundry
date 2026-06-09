import { openModDialog } from '../utils/dialogs/openSimpleInputDialog';
import ABFFoundryRoll from '../rolls/ABFFoundryRoll';
import { splitAsActorAndItemChanges } from './utils/splitAsActorAndItemChanges';
import { unflat } from './utils/unflat';
import { ALL_ITEM_CONFIGURATIONS } from './utils/prepareItems/constants';
import { INITIAL_EFFECT_DATA } from '../types/effects/EffectItemConfig';
import { getFieldValueFromPath } from './utils/prepareItems/util/getFieldValueFromPath';
import { getUpdateObjectFromPath } from './utils/prepareItems/util/getUpdateObjectFromPath';
import { ABFItems } from '../items/ABFItems';
import { ABFDialogs } from '../dialogs/ABFDialogs';
import { Logger } from '../../utils';
import { ABFSettingsKeys } from '../../utils/registerSettings';
import {
  buildTechniqueViewModel,
  techAddEffect,
  techRemoveEffect,
  techAddDisadvantage,
  techRemoveDisadvantage,
  techEffectFieldChange,
  techDisadvantageFieldChange,
  onDropTechniqueEffect,
  TECHNIQUE_CHARACTERISTICS
} from '../domine/techniques/techniqueBuilder';
import { createClickHandlers } from './utils/createClickHandlers';
import { TypeEditorRegistry } from './types/TypeEditorRegistry.js';
import {
  ensureLinkedEffectForItem,
  findEffectByItemOrigin
} from './utils/ensureLinkedEffectForItem.js';

/** @typedef {import('./constants').TActorData} TData */
/** @typedef {typeof FormApplication<FormApplicationOptions, TData, TData>} TFormApplication */
const ActorSheetV1 = foundry.appv1?.sheets?.ActorSheet ?? ActorSheet;
export default class ABFActorSheet extends ActorSheetV1 {
  i18n;

  constructor(actor, options) {
    super(actor, options);

    this.i18n = game.i18n;

    this.position.width = this.getWidthDependingFromContent();
  }

  static get defaultOptions() {
    return {
      ...super.defaultOptions,
      ...{
        classes: [game.animabf.id, 'sheet', 'actor'],
        template: 'systems/animabf/templates/actor/actor-sheet.hbs',
        width: 1100,
        height: 850,
        submitOnChange: false,
        viewPermission: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
        tabs: [
          {
            navSelector: '.sheet-tabs',
            contentSelector: '.sheet-body',
            initial: 'main'
          },
          {
            navSelector: '.mystic-tabs',
            contentSelector: '.mystic-body',
            initial: 'mystic-main'
          },
          {
            navSelector: '.general-tabs',
            contentSelector: '.general-body',
            initial: 'general-first'
          },
          {
            navSelector: '.psychic-tabs',
            contentSelector: '.psychic-body',
            initial: 'psychic-main'
          },
          {
            navSelector: '.combat-tabs',
            contentSelector: '.combat-body',
            initial: 'combat-main'
          },
          {
            navSelector: '.domine-tabs',
            contentSelector: '.domine-body',
            initial: 'domine-ki'
          }
        ]
      }
    };
  }

  get template() {
    return 'systems/animabf/templates/actor/actor-sheet.hbs';
  }

  async close(options = {}) {
    this._isClosing = true;

    try {
      await this._flushPendingSheetUpdatesImmediately();

      // Capture image before close; persist it after close to avoid re-render race.
      const nextImg = this._getEditedActorImage();

      await super.close({
        ...options,
        // Avoid submitting the whole form on close: it can persist derived/AE-applied values.
        submit: options.submit ?? false
      });

      await this._persistActorImageIfChanged(nextImg);

      this.position.width = this.getWidthDependingFromContent();
    } finally {
      this._isClosing = false;
    }
  }

  _getEditedActorImage() {
    const imgEl = this.element?.find?.("[data-edit='img']")?.[0];
    return imgEl?.getAttribute?.('src')?.trim?.() ?? '';
  }

  async _persistActorImageIfChanged(nextImg = '') {
    if (!this.options.editable) return false;

    if (!nextImg || nextImg === this.actor.img) return false;

    await this.actor.update({ img: nextImg });
    await this._refreshActorDirectoryImage(nextImg);
    return true;
  }

  async _refreshActorDirectoryImage(nextImg) {
    const actorDirectory = ui.actors ?? ui.sidebar?.tabs?.actors ?? null;

    actorDirectory?.render?.(true);

    const selectors = [
      `[data-entry-id="${this.actor.id}"] img`,
      `[data-document-id="${this.actor.id}"] img`
    ];

    for (const selector of selectors) {
      actorDirectory?.element?.find?.(selector)?.attr?.('src', nextImg);
    }
  }

  getWidthDependingFromContent() {
    if (this.actor.items.filter(i => i.type === ABFItems.SPELL).length > 0) {
      return 1300;
    }

    return 1100;
  }

  async _render(force, options = {}) {
    if (this._isClosing) return;

    // If user permission is exactly LIMITED, then display image popout and quit; else do normal render
    if (force && this.actor.testUserPermission(game.user, 'LIMITED', { exact: true })) {
      this.displayActorImagePopout();
      return;
    }
    return super._render(force, options);
  }

  displayActorImagePopout() {
    const imagePopout = new ImagePopout(this.actor.img, {
      title: this.actor.name,
      uuid: this.actor.uuid
    });
    imagePopout.render(true);
  }

  async getData(options) {
    const sheet = await super.getData(options);

    const { actor } = this; // use the real Document, not sheet.actor

    if (actor?.type === 'character') {
      try {
        await actor.prepareDerivedData();
      } catch (err) {
        console.error(`animabf | prepareDerivedData failed for "${actor?.name}"`, err);
      }
      sheet.system = actor.system;
    }

    sheet.config = CONFIG.config;

    const permissions = game.settings.get(
      game.animabf.id,
      ABFSettingsKeys.MODIFY_DICE_FORMULAS_PERMISSION
    );
    sheet.canModifyDice = permissions?.[game.user.role] === true;

    // Use embedded item collection directly
    const effectItems = actor.items.filter(i => i && i.type === ABFItems.EFFECT);
    sheet.effects = effectItems;

    // Técnicas de Ki: un view-model por técnica para el constructor (pestaña) y
    // las tarjetas de Domine; acumulaciones por característica para la cabecera.
    sheet.kiTechniques = actor.items
      .filter(i => i && i.type === ABFItems.TECHNIQUE)
      .map(buildTechniqueViewModel);
    sheet.kiAccumulations = TECHNIQUE_CHARACTERISTICS.map(c => ({
      label: c.label,
      value: actor.system?.domine?.kiAccumulation?.[c.key]?.final?.value ?? 0
    }));
    // Estado de "Cargar Ki" (concentración por asalto).
    sheet.kiCharging = !!actor.flags?.animabf?.chargingKi;
    sheet.kiFullAccumulation = !!actor.flags?.animabf?.fullKiAccumulation;
    // Estado de "Acumular zeón" (concentración mágica por asalto).
    sheet.zeonAccumulating = !!actor.flags?.animabf?.accumulatingZeon;
    // Ki concentrado total (suma de los "Ki acu." por característica).
    sheet.kiAccumulatedTotal = TECHNIQUE_CHARACTERISTICS.reduce(
      (sum, c) =>
        sum +
        (Number(actor.system?.domine?.kiAccumulation?.[c.key]?.accumulated?.value) || 0),
      0
    );

    return sheet;
  }

  activateListeners(html) {
    super.activateListeners(html);

    if (!this.options.editable) return;

    this._activateBaseTypeContextMenu(html);

    this._setupDebouncedSheetUpdates(html);

    this._activateRollables(html);
    this._activateContractibleButtons(html);
    this._activateItemsDragAndContextMenus(html);
    this._activateDataOnClickHandlers(html);
    this._activateEffectControls(html);
    this._activateCombatManeuverSearch(html);
    this._activateKiTechniquesListeners(html);
  }

  // Constructor de Técnicas de Ki dentro de la pestaña: cada control lleva (o
  // está dentro de) un [data-technique-id]; resolvemos el item y delegamos en
  // los helpers compartidos de techniqueBuilder.
  _activateKiTechniquesListeners(html) {
    const root = html[0] ?? html;
    if (!root) return;

    const techniqueOf = el => {
      const id = el.closest('[data-technique-id]')?.dataset?.techniqueId;
      return id ? this.actor.items.get(id) : null;
    };
    const on = (selector, type, handler) =>
      root.querySelectorAll(selector).forEach(el => el.addEventListener(type, handler));

    on('[data-action="tech-add-technique"]', 'click', e => {
      e.preventDefault();
      ALL_ITEM_CONFIGURATIONS[ABFItems.TECHNIQUE]?.onCreate?.(this.actor);
    });
    on('[data-action="tech-delete-technique"]', 'click', async e => {
      e.preventDefault();
      const item = techniqueOf(e.currentTarget);
      if (item) await item.delete();
    });
    on('[data-action="tech-add-effect"]', 'click', e => {
      e.preventDefault();
      const item = techniqueOf(e.currentTarget);
      if (item) techAddEffect(item);
    });
    on('[data-action="tech-remove-effect"]', 'click', e => {
      e.preventDefault();
      const item = techniqueOf(e.currentTarget);
      if (item) techRemoveEffect(item, Number(e.currentTarget.dataset.index));
    });
    on('[data-action="tech-add-disadvantage"]', 'click', e => {
      e.preventDefault();
      const item = techniqueOf(e.currentTarget);
      if (item) techAddDisadvantage(item);
    });
    on('[data-action="tech-remove-disadvantage"]', 'click', e => {
      e.preventDefault();
      const item = techniqueOf(e.currentTarget);
      if (item) techRemoveDisadvantage(item, Number(e.currentTarget.dataset.index));
    });
    on('[data-tech-effect-field]', 'change', e => {
      const item = techniqueOf(e.currentTarget);
      if (item) techEffectFieldChange(item, e.currentTarget);
    });
    on('[data-tech-disadvantage-field]', 'change', e => {
      const item = techniqueOf(e.currentTarget);
      if (item) techDisadvantageFieldChange(item, e.currentTarget);
    });

    // Uso en juego (tarjetas de Domine): usar / activar / desactivar.
    on('[data-action="tech-use"]', 'click', e => {
      e.preventDefault();
      const item = techniqueOf(e.currentTarget);
      if (item) this.actor.useTechnique(item.id);
    });
    on('[data-action="tech-activate"]', 'click', e => {
      e.preventDefault();
      const item = techniqueOf(e.currentTarget);
      if (item) this.actor.activateTechnique(item.id);
    });
    on('[data-action="tech-deactivate"]', 'click', e => {
      e.preventDefault();
      const item = techniqueOf(e.currentTarget);
      if (item) this.actor.deactivateTechnique(item.id);
    });

    // Cargar Ki (concentración por asalto) y acumulación plena.
    on('[data-action="ki-charge"]', 'click', e => {
      e.preventDefault();
      this.actor.toggleChargeKi();
    });
    // Acumular zeón (concentración mágica por asalto).
    on('[data-action="zeon-accumulate"]', 'click', e => {
      e.preventDefault();
      this.actor.toggleAccumulateZeon();
    });
    on('[data-action="ki-full-accumulation"]', 'change', e => {
      this.actor.toggleFullKiAccumulation();
    });
    // Editar el total de la reserva ajusta el modificador (máx = base + Mod).
    on('[data-action="ki-reserve-max"]', 'change', e => {
      const newMax = Number(e.currentTarget.value) || 0;
      const base =
        Number(this.actor.system?.domine?.kiAccumulation?.reserve?.base?.value) || 0;
      this.actor.update({
        'system.domine.kiAccumulation.reserve.modifier.value': newMax - base
      });
    });

    root.querySelectorAll('.tech-builder[data-drop-target="techniqueEffect"]').forEach(zone => {
      zone.addEventListener('dragover', e => {
        e.preventDefault();
        zone.classList.add('technique-drop-zone--drag-over');
      });
      zone.addEventListener('dragleave', () => {
        zone.classList.remove('technique-drop-zone--drag-over');
      });
      zone.addEventListener('drop', async e => {
        e.preventDefault();
        e.stopPropagation(); // evita el _onDropItem global del actor
        zone.classList.remove('technique-drop-zone--drag-over');
        const id = zone.dataset.techniqueId;
        const item = id ? this.actor.items.get(id) : null;
        if (item) await onDropTechniqueEffect(item, e);
      });
    });
  }

  _activateBaseTypeContextMenu(html) {
    const ContextMenuImpl = foundry.applications?.ux?.ContextMenu?.implementation ?? ContextMenu;
    const isV14 = !!foundry.applications?.ux?.ContextMenu?.implementation;
    new ContextMenuImpl(
      html instanceof HTMLElement ? html : html[0],
      '.base-type-row',
      [
        {
          name: game.i18n.localize('contextualMenu.common.options.edit') ?? 'Edit…',
          icon: '<i class="fas fa-edit"></i>',
          callback: target => this._openBaseTypeEditor(target instanceof HTMLElement ? target : target[0])
        }
      ],
      ...(isV14 ? [{ jQuery: false }] : [])
    );
  }

  async _flushPendingSheetUpdatesImmediately() {
    const flat = this._pendingUpdate;

    this._flushPendingUpdate?.cancel?.();
    this._pendingUpdate = {};

    await this._applyFlatChanges(flat);
  }

  async _applyFlatChanges(flat) {
    if (!flat || Object.keys(flat).length === 0) return;

    const [actorChanges, itemChanges] = splitAsActorAndItemChanges(flat);

    await this.updateItems(itemChanges);

    if (actorChanges && Object.keys(actorChanges).length > 0) {
      await this.actor.update(actorChanges);
    }
  }

  _setupDebouncedSheetUpdates(html) {
    this._pendingUpdate = {};

    // Build debounce once
    this._flushPendingUpdate =
      this._flushPendingUpdate ??
      foundry.utils.debounce(async () => {
        const flat = this._pendingUpdate;
        this._pendingUpdate = {};

        await this._applyFlatChanges(flat);
      }, 150);

    // IMPORTANT: remove previous handlers for this sheet instance
    html.off('change.animabf');

    html.on('change.animabf', 'input, select, textarea', ev => {
      const el = ev.currentTarget;
      if (!el?.name) return;

      let value = el.type === 'checkbox' ? el.checked : el.value;

      const dtype = el.dataset?.dtype;
      if (dtype === 'Number' || el.type === 'number') {
        const n = Number(value);
        value = Number.isFinite(n) ? n : 0;
      } else if (dtype === 'Boolean') {
        value = value === 'true' || value === true;
      }

      this._pendingUpdate[el.name] = value;
      this._flushPendingUpdate();

      // Feedback al equipar/desequipar un arma o armadura (accion silenciosa).
      const equipMatch = String(el.name).match(
        /^system\.dynamic\.(weapons|armors)\.([^.]+)\.system\.equipped\.value$/
      );
      if (equipMatch) {
        const item = this.actor.items.get(equipMatch[2]);
        if (item) {
          ui.notifications?.info(`«${item.name}» ${value ? 'equipada' : 'desequipada'}.`);
        }
      }
    });
  }

  _activateRollables(html) {
    html.find('.rollable').click(e => this._onRoll(e));
  }

  _activateContractibleButtons(html) {
    html.find('.contractible-button').click(e => {
      const { contractibleItemId } = e.currentTarget.dataset;
      if (!contractibleItemId) return;

      const { ui } = this.actor.system;
      ui.contractibleItems = {
        ...ui.contractibleItems,
        [contractibleItemId]: !ui.contractibleItems[contractibleItemId]
      };

      this.actor.update({ system: { ui } });
    });
  }

  _activateItemsDragAndContextMenus(html) {
    const handler = ev => this._onDragStart(ev);

    for (const item of Object.values(ALL_ITEM_CONFIGURATIONS)) {
      // Aísla cada tipo: un fallo (menú/selectores) de uno no debe abortar
      // activateListeners y, con ello, todo el render de la ficha.
      try {
        this.buildCommonContextualMenu(item);

        html.find(item.selectors.rowSelector).each((_, row) => {
          row.setAttribute('draggable', 'true');
          row.addEventListener('dragstart', handler, false);
        });

        html.find(`[data-on-click="${item.selectors.addItemButtonSelector}"]`).click(() => {
          item.onCreate(this.actor);
        });
      } catch (err) {
        console.error(`animabf | drag/context-menu setup failed for "${item?.type}"`, err);
      }
    }
  }

  _activateDataOnClickHandlers(html) {
    const clickHandlers = createClickHandlers(this);

    html.find('[data-on-click]').click(e => {
      const key = e.currentTarget.dataset.onClick;
      const handler = clickHandlers[key];
      if (handler) handler(e);
      else console.warn(`No handler for data-on-click="${key}"`);
    });
  }

  _activateCombatManeuverSearch(html) {
    const input = html.find('.combat-maneuver-search-input');
    if (!input.length) return;

    const normalize = value =>
      (value ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

    input.on('input', event => {
      const query = normalize(event.currentTarget.value.trim());
      let visible = 0;
      let masterVisible = 0;

      html.find('.combat-maneuver-card').each((_, card) => {
        if (card.classList.contains('combat-maneuver-card--placeholder')) {
          card.style.display = query ? 'none' : '';
          return;
        }

        const name = normalize(card.querySelector('.combat-maneuver-card__name')?.textContent);
        const match = !query || name.includes(query);
        card.style.display = match ? '' : 'none';
        if (match) {
          visible += 1;
          if (card.closest('.combat-maneuvers-grid--master')) masterVisible += 1;
        }
      });

      const hideMaster = !!query && masterVisible === 0;
      const subtitle = html.find('.combat-maneuvers-subtitle')[0];
      const masterGrid = html.find('.combat-maneuvers-grid--master')[0];
      if (subtitle) subtitle.style.display = hideMaster ? 'none' : '';
      if (masterGrid) masterGrid.style.display = hideMaster ? 'none' : '';

      const noResults = html.find('.combat-maneuvers-no-results')[0];
      if (noResults) noResults.style.display = query && visible === 0 ? 'block' : 'none';
    });
  }

  _activateEffectControls(html) {
    html.find('.effect-control').click(this._onEffectControl.bind(this));
  }

  _openBaseTypeEditor(el) {
    const path = el?.dataset?.path;
    if (!path) return;

    const node = this.actor.typedNodes?.get(path) ?? null;
    if (!node) return;

    const { type } = node.constructor;

    const app = TypeEditorRegistry.create(type, this.actor, { path });
    app?.render(true);
  }

  async _onEffectControl(event) {
    event.preventDefault();
    const a = event.currentTarget;
    const { action } = a.dataset;
    const li = a.closest('.effect');
    const itemId = li?.dataset.itemId;
    const item = itemId ? this.actor.items.get(itemId) : null;

    switch (action) {
      case 'create': {
        const name = game.i18n.localize('anima.effects.newEffect') ?? 'New Effect';
        const [created] = await this.actor.createEmbeddedDocuments('Item', [
          {
            type: ABFItems.EFFECT,
            name,
            system: INITIAL_EFFECT_DATA
          }
        ]);
        if (created?.sheet) created.sheet.render(true);
        return;
      }

      case 'edit': {
        if (!item) return;

        // Asegura que exista un AE vinculado a este item
        const effect = await this._ensureEffectForItem(item);
        if (!effect) return;

        // Configura la sincronización item <-> AE
        this._setupEffectSync(item, effect);

        return effect.sheet?.render(true);
      }

      case 'delete': {
        if (!itemId) return;

        const item = this.actor.items.get(itemId);
        if (!item) return;

        // get linked AE
        const effect = this._getLinkedEffect(item);

        const deletions = [];

        // delete item
        deletions.push(this.actor.deleteEmbeddedDocuments('Item', [itemId]));

        // delete linked AE
        if (effect) {
          deletions.push(this.actor.deleteEmbeddedDocuments('ActiveEffect', [effect.id]));
        }

        return Promise.all(deletions);
      }

      case 'toggle': {
        if (!item) return;

        const newActive = !item.system.active;
        await item.update({ 'system.active': newActive });

        const effect = this._getLinkedEffect(item);
        if (effect) {
          await effect.update({ disabled: !newActive });
        }
        return;
      }

      case 'clearAll': {
        // Wipe every effect on this actor — all Item documents of type
        // 'effect' plus every ActiveEffect on the actor. Drag the desired
        // ones back from the compendium to re-add them.
        const effectItemIds = this.actor.items
          .filter(i => i.type === ABFItems.EFFECT)
          .map(i => i.id);
        const aeIds = this.actor.effects.contents.map(e => e.id);

        const ops = [];
        if (effectItemIds.length) {
          ops.push(this.actor.deleteEmbeddedDocuments('Item', effectItemIds));
        }
        if (aeIds.length) {
          ops.push(this.actor.deleteEmbeddedDocuments('ActiveEffect', aeIds));
        }
        await Promise.all(ops);
        return;
      }

      default:
    }
  }

  async _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const { dataset } = element;

    if (dataset.roll) {
      const label = dataset.label ? `Rolling ${dataset.label}` : '';
      const mod = await openModDialog();
      const rollValue = this._getRollValueFromDataset(element, dataset);
      let formula = dataset.rollPath
        ? `${this._getRollDieFormula(dataset.roll)} + ${rollValue} + ${mod ?? 0}`
        : `${dataset.roll}+ ${mod ?? 0}`;
      const masteryValue = this._getMasteryValueFromDataset(
        element,
        dataset,
        rollValue
      );
      if (masteryValue >= 200) {
        formula = formula.replace(
          this.actor.system.general.diceSettings.abilityDie.value,
          this.actor.system.general.diceSettings.abilityMasteryDie.value
        );
        // let splittedFormula = formula.split(
        //   this.actor.system.general.diceSettings.abilityDie.value
        // );
        // formula = splittedFormula.join(
        //   this.actor.system.general.diceSettings.abilityMasteryDie.value
        // );
      }
      const roll = new ABFFoundryRoll(formula, this.actor.system);

      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: label,
        // Carry the exact rolled data path so the chat-trace hook can surface
        // any modifier (Ki techniques, AEs…) deposited on it — no flavor guessing.
        ...(dataset.rollPath
          ? { flags: { animabf: { rollPath: dataset.rollPath } } }
          : {})
      });
    }
  }

  _getRollDieFormula(rollFormula) {
    return String(rollFormula).split('+')[0].trim();
  }

  _getRollValueFromDataset(element, dataset) {
    if (!dataset.rollPath) {
      return Number(dataset.roll?.split('+')?.[1] ?? 0);
    }

    return Number(this._resolveRollPathValue(element, dataset.rollPath) ?? 0);
  }

  _getMasteryValueFromDataset(element, dataset, fallbackValue = 0) {
    if (!dataset.extraPath) {
      return Number(dataset.extra ?? fallbackValue ?? 0);
    }

    return Number(
      this._resolveRollPathValue(element, dataset.extraPath) ?? fallbackValue
    );
  }

  _resolveRollPathValue(element, path) {
    const actorValue = foundry.utils.getProperty(this.actor, path);
    if (actorValue !== undefined) return actorValue;

    const dynamicItemMatch = String(path).match(
      /^system\.dynamic\.[^.]+\.(?<itemId>[^.]+)\.(?<itemPath>.+)$/
    );

    if (dynamicItemMatch?.groups) {
      const { itemId, itemPath } = dynamicItemMatch.groups;
      const itemValue = foundry.utils.getProperty(this.actor.items.get(itemId), itemPath);
      if (itemValue !== undefined) return itemValue;
    }

    const itemId = element?.closest?.('[data-item-id]')?.dataset?.itemId;
    if (!itemId) return undefined;

    return foundry.utils.getProperty(this.actor.items.get(itemId), path);
  }

  protected;

  async _updateObject(event, formData) {
    const [actorChanges, itemChanges] = splitAsActorAndItemChanges(formData);

    await this.updateItems(itemChanges);

    return super._updateObject(event, actorChanges);
  }

  async updateItems(_changes) {
    if (!_changes || Object.keys(_changes).length === 0) return;

    const changes = unflat(_changes);

    for (const item of Object.values(ALL_ITEM_CONFIGURATIONS)) {
      const fromDynamicChanges = item.getFromDynamicChanges(changes);

      if (fromDynamicChanges) {
        await item.onUpdate(this.actor, fromDynamicChanges);
      }
    }
  }

  buildCommonContextualMenu = itemConfig => {
    const {
      selectors: { containerSelector, rowSelector },
      fieldPath,
      hideDeleteRow
    } = itemConfig;

    const deleteRowMessage =
      itemConfig.contextMenuConfig?.customDeleteRowMessage ??
      this.i18n.localize('contextualMenu.common.options.delete');

    const customCallbackFn = itemConfig.onDelete;

    const otherItems =
      itemConfig.contextMenuConfig?.buildExtraOptionsInContextMenu?.(this.actor) ?? [];

    if (!itemConfig.isInternal && itemConfig.hasSheet) {
      otherItems.push({
        name: this.i18n.localize('contextualMenu.common.options.edit'),
        icon: '<i class="fas fa-edit"></i>',
        callback: target => {
          const { itemId } = (target instanceof HTMLElement ? target : target[0]).dataset;

          if (itemId) {
            const item = this.actor.items.get(itemId);

            if (item?.sheet) {
              item.sheet.render(true);
            } else {
              Logger.warn('Item sheet was not found for item:', item);
            }
          } else {
            Logger.warn('Item ID was not found for target:', target);
          }
        }
      });
    }

    if (!hideDeleteRow) {
      otherItems.push({
        name: deleteRowMessage,
        icon: '<i class="fas fa-trash"></i>',
        callback: target => {
          if (!customCallbackFn && !fieldPath) {
            Logger.warn(
              `buildCommonContextualMenu: no custom callback and configuration set, could not delete the item: ${itemConfig.type}`
            );
          }

          if (customCallbackFn) {
            customCallbackFn(this.actor, target);
          } else {
            const id = (target instanceof HTMLElement ? target : target[0]).dataset.itemId;

            if (!id) {
              throw new Error(
                'Data id missing. Are you sure to set data-item-id to rows?'
              );
            }

            ABFDialogs.confirm(
              this.i18n.localize('dialogs.items.delete.title'),
              this.i18n.localize('dialogs.items.delete.body'),
              {
                onConfirm: () => {
                  if (fieldPath) {
                    if (this.actor.getEmbeddedDocument('Item', id)) {
                      this.actor.deleteEmbeddedDocuments('Item', [id]);
                    } else {
                      let items = getFieldValueFromPath(this.actor.system, fieldPath);

                      items = items.filter(item => item._id !== id);

                      const dataToUpdate = {
                        system: getUpdateObjectFromPath(items, fieldPath)
                      };

                      this.actor.update(dataToUpdate);
                    }
                  }
                }
              }
            );
          }
        }
      });
    }

    const container =
      this.element instanceof HTMLElement
        ? this.element.querySelector(containerSelector)
        : this.element?.find?.(containerSelector)?.[0];

    // Foundry V14: el constructor de ContextMenu lanza si el contenedor no existe
    // en el DOM. Algunos tipos de item (p.ej. techniqueEffect, sólo de compendio)
    // no tienen su sección en la ficha del actor: no hay a qué enganchar el menú,
    // así que salimos sin construirlo (antes esto reventaba todo el render).
    if (!container) return null;

    const ContextMenuImpl = foundry.applications?.ux?.ContextMenu?.implementation ?? ContextMenu;
    const isV14 = !!foundry.applications?.ux?.ContextMenu?.implementation;
    return new ContextMenuImpl(
      container,
      rowSelector,
      [...otherItems],
      ...(isV14 ? [{ jQuery: false }] : [])
    );
  };

  _getLinkedEffect(item) {
    return findEffectByItemOrigin(this.actor, item);
  }

  async _linkItemToEffect(item, effect) {
    if (!item || !effect) return;
    await item.setFlag('animabf', 'linkedEffectId', effect.id);
  }

  async _ensureEffectForItem(item) {
    return ensureLinkedEffectForItem(this.actor, item);
  }

  async _onDropItem(event, data) {
    // Los efectos de técnica sólo tienen sentido dentro del constructor de una
    // Técnica; evitar crear una copia suelta en el actor al soltarlos aquí.
    try {
      const dropped = data?.uuid ? await fromUuid(data.uuid) : null;
      if (dropped?.type === ABFItems.TECHNIQUE_EFFECT) {
        ui.notifications?.info(
          'Arrastra el efecto sobre el constructor de una Técnica de Ki, no sobre la ficha.'
        );
        return;
      }
    } catch {
      // Si no se puede resolver, continuar con el flujo normal.
    }

    const created = await super._onDropItem(event, data);

    const items = Array.isArray(created) ? created : created ? [created] : [];

    for (const item of items) {
      if (item.type !== ABFItems.EFFECT) continue;

      // Just ensure the AE exists. The helper handles activation and avoids
      // double-applying when it's called more than once (e.g. via the
      // `createItem` hook on top of this manual call).
      await this._ensureEffectForItem(item);
    }

    return created;
  }

  _setupEffectSync(item, effect) {
    const handler = async (doc, diff, options, userId) => {
      if (doc.id !== effect.id) return;
      if (userId !== game.user.id) return;

      if (doc.transfer === true) {
        await doc.update({ transfer: false });
        return;
      }

      const obj = doc.toObject();
      const { _id, _key, parent, ...clean } = obj;

      await item.update({ 'system.effectData': clean });
      await item.update({ 'system.active': !doc.disabled });

      Hooks.off('updateActiveEffect', handler);
    };

    Hooks.on('updateActiveEffect', handler);
  }
}
