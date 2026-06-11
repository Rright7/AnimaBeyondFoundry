/* eslint-disable class-methods-use-this */
import { nanoid } from '../../vendor/nanoid/nanoid';
import { ABFItems } from '../items/ABFItems';
import { ALL_ITEM_CONFIGURATIONS } from './utils/prepareItems/constants';
import { getUpdateObjectFromPath } from './utils/prepareItems/util/getUpdateObjectFromPath';
import { getFieldValueFromPath } from './utils/prepareItems/util/getFieldValueFromPath';
import { prepareActor } from './utils/prepareActor/prepareActor';
import { INITIAL_ACTOR_DATA } from './constants';
import {
  KI_CHAR_KEYS,
  KI_CHAR_LABELS,
  accumulateKiStep,
  concentratedShortfall,
  techniqueRoundStep
} from '../domine/techniques/kiAccumulation';
import ABFActorSheet from './ABFActorSheet';
import { Logger } from '../../utils';
import { migrateItem } from '../items/migrations/migrateItem';
import { executeMacro } from '../utils/functions/executeMacro';
import { ABFSettingsKeys } from '../../utils/registerSettings';
import { calculateDamage } from '../combat/utils/calculateDamage';
import { roundTo5Multiples } from '../combat/utils/roundTo5Multiples';
import { psychicPotentialEffect } from '../combat/utils/psychicPotentialEffect.js';
import { psychicFatigueCheck } from '../combat/utils/psychicFatigueCheck.js';
import { shieldBaseValueCheck } from '../combat/utils/shieldBaseValueCheck.js';
import { shieldValueCheck } from '../combat/utils/shieldValueCheck.js';
import { INITIAL_SPELL_CASTING_DATA } from '../types/mystic/SpellItemConfig.js';
import ABFFoundryRoll from '../rolls/ABFFoundryRoll';
import { openModDialog } from '../utils/dialogs/openSimpleInputDialog';
import ABFItem from '../items/ABFItem';
import { FormulaEvaluator } from '../../utils/formulaEvaluator.js';
import { inflateSystemFromTypeMarkers } from './types/inflateSystemFromTypeMarkers.js';
import { TYPED_PATHS } from './types/typedTemplateIndex.js';
import { buildTypedNodes } from './types/runtimeTypedNodes.js';

export class ABFActor extends Actor {
  i18n = game.i18n;

  /**
   * @param {ConstructorParameters<typeof foundry.documents.BaseActor>[0]} data
   * @param {ConstructorParameters<typeof foundry.documents.BaseActor>[1]} context
   */
  constructor(data, context) {
    super(data, context);

    if (this.system.version !== INITIAL_ACTOR_DATA.version) {
      Logger.log(
        `Upgrading actor ${this.name} (${this._id}) from version ${this.system.version} to ${INITIAL_ACTOR_DATA.version}`
      );

      this.updateSource({ 'system.version': INITIAL_ACTOR_DATA.version });
    }
  }

  async _preCreate(data, options, user) {
    // Ensure system exists + template defaults
    data.system = foundry.utils.mergeObject(data.system ?? {}, INITIAL_ACTOR_DATA, {
      overwrite: false
    });

    return super._preCreate(data, options, user);
  }

  async prepareDerivedData() {
    super.prepareDerivedData();

    // this.system = foundry.utils.mergeObject(this.system, INITIAL_ACTOR_DATA, {
    //   overwrite: false
    // });

    // Safety: if some actor came without inflation (old data / imports)
    this.system = inflateSystemFromTypeMarkers(this.system);

    buildTypedNodes(this, TYPED_PATHS);
    this._applyDefaultKeysToTypedNodes();
    await prepareActor(this);
    // applyTypedDerived(this);
  }

  /**
   * Ensure BaseType.key is persisted when empty.
   * Derives it from the last segment of the system path.
   */
  _applyDefaultKeysToTypedNodes() {
    const updates = {};

    // typedNodes: Map<path, BaseTypeInstance>
    for (const [path, node] of this.typedNodes ?? []) {
      // Only if the type actually has a "key" field in its defaults/common defaults
      // (BaseType.commonDefaults includes key)

      const current = foundry.utils.getProperty(this.system, `${path}.key`);

      if (current == null || String(current) === '') {
        const parts = String(path).split('.');
        const derivedKey = parts.length ? parts[parts.length - 1] : '';
        if (derivedKey) updates[`${path}.key`] = derivedKey;
      }
    }

    if (Object.keys(updates).length) {
      // Persist without triggering another full update cycle
      this.updateSource(updates);
    }
  }

  getRollData() {
    const data = super.getRollData();

    // data.system = this.system;
    // data.health = this.system.characteristics.secondaries.lifePoints;
    // data.modifiers = this.system.general.modifiers;
    // data.presence = this.system.general.presence;
    // data.initiative = this.system.characteristics.secondaries.initiative;
    // data.characteristics = this.system.characteristics.primaries;

    return data;
  }

  /**
   * Updates the value of the 'fatigue' secondary characteristic of an ABFActor object.
   *
   * @param {number} fatigueUsed - The amount of fatigue to be subtracted from the current value.
   * @returns {void}
   */
  applyFatigue(fatigueUsed) {
    const newFatigue =
      this.system.characteristics.secondaries.fatigue.value - fatigueUsed;

    this.update({
      system: {
        characteristics: {
          secondaries: { fatigue: { value: newFatigue } }
        }
      }
    });
  }

  /**
   * Rolls an ability check for the ABFActor class.
   *
   * @param {string} ability - The name of the ability to roll.
   * @param {boolean} sendToChat - Whether to send the roll result to the chat. Default is true.
   * @returns {Promise<number>} - The total result of the dice roll.
   *
   * @example
   * const actor = new ABFActor(data, context);
   * await actor.rollAbility('agility', true);
   *
   * This code creates a new instance of the ABFActor class and calls the `rollAbility` method with the ability name 'agility' and the `sendToChat` parameter set to true. The method will calculate the ability value, prompt the user for a modifier, roll the dice, and display the result in the chat.
   */
  async rollAbility(ability, sendToChat = true) {
    const name = game.i18n.localize(`anima.ui.secondaries.${ability}.title`);
    const { secondaries } = this.system;
    let groupPath = '';
    for (const groupKey in secondaries) {
      for (const abilityKey in secondaries[groupKey]) {
        if (abilityKey === ability) {
          groupPath = groupKey;
        }
      }
    }
    if (groupPath === '') {
      return;
    }
    const abilityValue = this.system.secondaries[groupPath][ability].final.value;
    const label = name ? `Rolling ${name}` : '';
    const mod = await openModDialog();
    let formula = `${
      this.system.general.diceSettings.abilityDie.value
    } + ${abilityValue} + ${mod ?? 0}`;
    if (abilityValue >= 200)
      formula = formula.replace(
        this.system.general.diceSettings.abilityDie.value,
        this.system.general.diceSettings.abilityMasteryDie.value
      );
    const roll = new ABFFoundryRoll(formula, this.system);
    await roll.roll();
    if (sendToChat) {
      roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        flavor: label
      });
    }
    return roll.total;
  }

  async newSupernaturalShield(shieldData) {
    // Accept either DTO or plain create data
    const itemCreateData =
      typeof shieldData?.toItemCreateData === 'function'
        ? shieldData.toItemCreateData()
        : shieldData;

    const [item] = await this.createEmbeddedDocuments('Item', [itemCreateData]);

    const shieldPts =
      Number(itemCreateData?.system?.shieldPoints?.value ?? itemCreateData?.system?.shieldPoints) ||
      0;
    ui.notifications?.info(
      `Escudo «${itemCreateData.name}» creado${shieldPts ? ` (${shieldPts} puntos)` : ''}.`
    );

    const args = { thisActor: this, newShield: true, shieldId: item._id };
    executeMacro(itemCreateData.name, args);
    return item._id;
  }

  /**
   * Deletes a supernatural shield item from the actor's inventory and exucute a macro passing argument 'newShield: false, shieldId: supShieldId' to stop the corresponding the animation.
   *
   * @param {string} supShieldId  The ID of the supernatural shield item to be deleted.
   * @returns {void}
   */
  async deleteSupernaturalShield(supShieldId) {
    const supShield = this.getItem(supShieldId);
    if (supShield) {
      await this.deleteItem(supShieldId);
      let args = {
        thisActor: this,
        newShield: false,
        shieldId: supShieldId
      };
      executeMacro(supShield.name ?? undefined, args);
    }
  }

  /**
   * Applies damage to a supernatural shield.
   * If the damage reduces the shield's points to zero or below, the shield is deleted and the remaining damage is recalculated and applied to the actor.
   *
   * @param {string} supShieldId - The ID of the supernatural shield to apply damage to.
   * @param {number} damage - The amount of damage to apply to the shield.
   * @param {boolean} [dobleDamage] - Whether to apply double damage or not. Default is `false`.
   * @param {object} [newCombatResult] - Additional combat result data used to calculate damage to the actor if the shield breaks.
   *
   * @returns {void}
   */
  async applyDamageSupernaturalShield(supShieldId, damage, dobleDamage, newCombatResult) {
    const supShield = this.getItem(supShieldId);
    const shieldValue = supShield?.system.shieldPoints;
    const newShieldPoints = dobleDamage ? shieldValue - damage * 2 : shieldValue - damage;
    if (newShieldPoints > 0) {
      this.updateItem({
        id: supShieldId,
        system: { shieldPoints: newShieldPoints }
      });
    } else {
      this.deleteSupernaturalShield(supShieldId);
      // If shield breaks, apply damage to actor
      if (newShieldPoints < 0 && newCombatResult) {
        const needToRound = game.settings.get(
          game.animabf.id,
          ABFSettingsKeys.ROUND_DAMAGE_IN_MULTIPLES_OF_5
        );
        const result = calculateDamage(
          newCombatResult.attack,
          0,
          newCombatResult.at,
          Math.abs(newShieldPoints),
          newCombatResult.halvedAbsorption
        );
        const breakingDamage = needToRound ? roundTo5Multiples(result) : result;
        this.applyDamage(breakingDamage);
      }
    }
  }

  /**
   * Evaluates the psychic fatigue caused by using a power in the game.
   * It checks if the actor has immunity to fatigue and calculates the fatigue value based on the power's effects and the psychic difficulty.
   * If the actor is not immune to fatigue, it applies the fatigue value to the actor's characteristics.
   *
   * @param {object} power - The power for which the psychic fatigue is being evaluated.
   * @param {number} psychicDifficulty - The difficulty level of the psychic power.
   * @param {boolean} eliminateFatigue - Whether to apply the fatigue value or not to the actor's characteristics.
   * @param {boolean} sendToChat - Whether to send a chat message or not. Default is `true`.
   *
   * @returns {number} The calculated psychic fatigue value.
   */
  async evaluatePsychicFatigue(
    power,
    psychicDifficulty,
    eliminateFatigue,
    sendToChat = true
  ) {
    const {
      psychic: {
        psychicSettings: { fatigueResistance },
        psychicPoints
      }
    } = this.system;
    const psychicFatigue = {
      value: psychicFatigueCheck(power?.system.effects[psychicDifficulty].value),
      inmune: fatigueResistance || eliminateFatigue
    };

    if (psychicFatigue.value) {
      if (sendToChat) {
        const { i18n } = game;
        ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ actor: this }),
          flavor: i18n.format('macros.combat.dialog.psychicPotentialFatigue.title', {
            fatiguePen: psychicFatigue.inmune ? 0 : psychicFatigue.value
          })
        });
      }
      if (!psychicFatigue.inmune && !eliminateFatigue) {
        this.applyFatigue(psychicFatigue.value - psychicPoints.value);
        this.update({
          system: {
            psychic: {
              psychicPoints: {
                value: Math.max(psychicPoints.value - psychicFatigue.value, 0)
              }
            }
          }
        });
      }
    }
    if (eliminateFatigue) {
      this.update({
        system: {
          psychic: {
            psychicPoints: { value: psychicPoints.value - 1 }
          }
        }
      });
    }

    return psychicFatigue.value;
  }

  /**
   * Performs maintenance on psychic shields by checking if they are overmaintained or need to be damaged.
   * If a psychic shield is overmaintained, it is either unset or damaged based on the `revert` parameter.
   * Its executed in every next turn in ABFCombat, if the combat goes to a previous turn the 'revert' parameter is set to true.
   *
   * @param {boolean} revert - A flag indicating whether to revert the maintenance or not.
   */
  async psychicShieldsMaintenance(revert) {
    const psychicShields = this.system.combat.supernaturalShields.filter(
      s => s.system.type === 'psychic'
    );

    for (const psychicShield of psychicShields) {
      const psychic = psychicShield.getFlag(game.animabf.id, 'psychic');
      if (psychic?.overmantained) {
        if (psychic.maintainMax >= psychicShield.system.shieldPoints) {
          psychicShield.unsetFlag(game.animabf.id, 'psychic');
        } else {
          const supShield = {
            system: psychicShield.system,
            id: psychicShield._id
          };
          const damage = revert ? -5 : 5;
          this.applyDamageSupernaturalShield(supShield.id, damage, false, undefined);
        }
      }
    }
  }

  /**
   * Updates the defenses counter for an actor based on the value of the `keepAccumulating` parameter.
   *
   * @param {boolean} keepAccumulating - A flag indicating whether to continue accumulating defenses or not.
   */
  accumulateDefenses(keepAccumulating) {
    /** @type {{accumulated: number, keepAccumulating: boolean}} */
    const defensesCounter = this.getFlag(game.animabf.id, 'defensesCounter') || {
      accumulated: 0,
      keepAccumulating
    };
    const newDefensesCounter = defensesCounter.accumulated + 1;
    if (keepAccumulating) {
      this.setFlag(game.animabf.id, 'defensesCounter', {
        accumulated: newDefensesCounter,
        keepAccumulating
      });
    } else {
      this.setFlag(game.animabf.id, 'defensesCounter.keepAccumulating', keepAccumulating);
    }
  }

  /**
   * Resets the accumulated defenses counter for an ABFActor object.
   *
   * @example
   * const actor = new ABFActor(data, context);
   * actor.resetDefensesCounter();
   */
  resetDefensesCounter() {
    const defensesCounter = this.getFlag(game.animabf.id, 'defensesCounter');
    if (defensesCounter === undefined) {
      this.setFlag(game.animabf.id, 'defensesCounter', {
        accumulated: 0,
        keepAccumulating: true
      });
    } else {
      this.setFlag(game.animabf.id, 'defensesCounter.accumulated', 0);
    }
  }

  /**
   * Determines if a mystic character can cast a specific spell at a specific grade.
   *
   * @param spell - The spell object that contains information about the spell, including the
   * zeon cost for each grade.
   * @param {string} spellGrade - The grade of the spell that the character wants to cast.
   * @param {{prepared: boolean, innate:boolean}} [casted] - An object that indicates whether the spell has been casted before,
   * either as a prepared spell or an innate spell.
   * Default is { prepared: false, innate: false }.
   * @param {boolean} override - A flag that indicates whether to override the normal casting rules and
   * allow the spell to be casted regardless of zeon points or previous casting.
   * Default is false.
   * @returns {import('../types/mystic/SpellItemConfig.js').SpellCasting} - An object that contains information about the zeon points,
   * whether the spell can be cast (prepared or innate), if the spell has been casted, and
   * whether the casting rules should be overridden.
   */
  mysticCanCastEvaluate(
    spell,
    spellGrade,
    casted = { prepared: false, innate: false },
    override = false
  ) {
    const spellCasting = {
      zeon: { ...INITIAL_SPELL_CASTING_DATA.zeon },
      canCast: { ...INITIAL_SPELL_CASTING_DATA.canCast },
      casted: { ...casted },
      override
    };

    spellCasting.zeon.accumulated = this.system.mystic.zeon.accumulated ?? 0;

    if (override) {
      return spellCasting;
    }

    const spellGradeData = spell?.system?.grades?.[spellGrade];
    spellCasting.zeon.cost = spellGradeData?.zeon?.value ?? 0;

    // Defensive fallback: if the selected spell no longer exists, keep default cast flags.
    if (!spell?.name) {
      spellCasting.casted.innate = false;
      spellCasting.casted.prepared = false;
      return spellCasting;
    }

    const preparedSpells = this.system.mystic.preparedSpells ?? [];
    spellCasting.canCast.prepared =
      preparedSpells.find(
        ps => ps?.name === spell.name && ps?.system?.grade?.value === spellGrade
      )?.system?.prepared?.value ?? false;

    const spellVia = spell?.system?.via?.value;
    const innateMagic = this.system.mystic.innateMagic;
    const innateVia = innateMagic?.via?.find(i => i?.name === spellVia);
    const innateMagicValue =
      innateMagic?.via?.length !== 0 && innateVia
        ? innateVia.system.final.value
        : innateMagic?.main?.final?.value ?? 0;

    spellCasting.canCast.innate = innateMagicValue >= spellCasting.zeon.cost;

    if (!spellCasting.canCast.innate) {
      spellCasting.casted.innate = false;
    }
    if (!spellCasting.canCast.prepared) {
      spellCasting.casted.prepared = false;
    }

    return spellCasting;
  }

  /**
   * Evaluates the spell casting conditions and returns a boolean value indicating whether the
   * spell can be cast or not.
   *
   * @param {import('../types/mystic/SpellItemConfig.js').SpellCasting} spellCasting - - An object that contains information about the zeon
   * points, whether the spell can be cast (prepared or innate), if the spell has been casted,
   * and whether the casting rules should be overridden.
   * @returns {false} Permisivo: SIEMPRE devuelve false (nunca bloquea el lanzamiento);
   * solo emite el aviso que corresponda. El caller decide a la vista del aviso.
   */
  evaluateCast(spellCasting) {
    const { i18n } = game;
    const { canCast, casted, zeon, override } = spellCasting;
    if (override) return false;
    // Permisivo (preferencia de la mesa): avisamos claro segun el caso pero NUNCA
    // bloqueamos el lanzamiento. El gasto posterior (mysticCast / consumeAccumulatedZeon)
    // tiene suelo 0; decide el jugador/DJ a la vista del aviso. Por eso siempre false.
    if (canCast.innate && casted.innate && canCast.prepared && casted.prepared) {
      ui.notifications.warn(i18n.localize('dialogs.spellCasting.warning.mustChoose'));
    } else if (!canCast.innate && casted.innate) {
      ui.notifications.warn(i18n.localize('dialogs.spellCasting.warning.innateMagic'));
    } else if (!canCast.prepared && casted.prepared) {
      ui.notifications.warn(i18n.localize('dialogs.spellCasting.warning.preparedSpell'));
    } else if (!casted.innate && !casted.prepared && zeon.accumulated < zeon.cost) {
      ui.notifications.warn(i18n.localize('dialogs.spellCasting.warning.zeonAccumulated'));
    }
    return false;
  }

  /**
   * Handles the casting of mystic spells by an actor in the ABFActor class.
   *
   * @param {import('../types/mystic/SpellItemConfig.js').SpellCasting} spellCasting An object that contains information about the zeon points, whether the spell can be cast (prepared or innate), if the spell has been casted, and whether the casting rules should be overridden.
   * @param {string} spellName The name of the spell being casted.
   * @param {string} spellGrade The grade of the spell being casted.
   */
  mysticCast(spellCasting, spellName, spellGrade) {
    const { zeon, casted, override } = spellCasting;
    if (override) {
      return;
    }
    if (casted.innate) {
      return;
    }
    if (casted.prepared) {
      this.deletePreparedSpell(spellName, spellGrade);
    } else {
      this.consumeAccumulatedZeon(zeon.cost);
    }
  }

  /**
   * Updates the accumulated zeon value of a mystic character by subtracting the zeon cost of a spell.
   *
   * @param {number} zeonCost The amount of zeon to be consumed.
   */
  consumeAccumulatedZeon(zeonCost) {
    // Suelo 0: en modo permisivo el lanzamiento no se bloquea aunque falte zeon
    // acumulado; se descuenta lo que haya, sin bajar de 0.
    const newAccumulateZeon = Math.max(0, (this.system.mystic.zeon.accumulated ?? 0) - zeonCost);

    this.update({
      system: {
        mystic: {
          zeon: { accumulated: newAccumulateZeon }
        }
      }
    });
  }

  /**
   * Economia de lanzamiento rapido para los botones de la ficha. Aplica la
   * prioridad RAW: INNATO (gratis) > PREPARADO (consume el conjuro) > ZEON
   * ACUMULADO (descuenta el coste). Devuelve true si se puede lanzar (ya
   * descontado); false si no llega (ya avisa). La eleccion explicita
   * innato/preparado/override va por el dialogo de escudo sobrenatural.
   * @param {object} spell
   * @param {string} spellGrade
   * @returns {boolean}
   */
  tryCastSpell(spell, spellGrade) {
    // Inteligencia Requerida (RAW Core Exxet): la INT del actor debe alcanzar la
    // del grado o no puede lanzarlo en ese grado.
    const intRequired = Number(spell?.system?.grades?.[spellGrade]?.intRequired?.value) || 0;
    const intel = this.system?.characteristics?.primaries?.intelligence;
    const intelligence = Number(intel?.final?.value ?? intel?.value) || 0;
    if (intRequired > 0 && intelligence < intRequired) {
      // Permisivo: avisa pero NO bloquea (antes return false).
      ui.notifications?.warn(
        game.i18n.format('dialogs.spellCasting.warning.intRequired', {
          required: intRequired,
          current: intelligence
        })
      );
    }
    const spellCasting = this.mysticCanCastEvaluate(spell, spellGrade);
    if (spellCasting.canCast.innate) spellCasting.casted.innate = true;
    else if (spellCasting.canCast.prepared) spellCasting.casted.prepared = true;
    if (this.evaluateCast(spellCasting)) return false;
    this.mysticCast(spellCasting, spell.name, spellGrade);
    const zeonCost = Number(spell?.system?.grades?.[spellGrade]?.zeon?.value) || 0;
    const src = spellCasting.casted?.innate
      ? 'innato'
      : spellCasting.casted?.prepared
      ? 'preparado'
      : 'acumulado';
    ui.notifications?.info(`Conjuro «${spell.name}»: ${zeonCost} zeon (${src}).`);
    return true;
  }

  /**
   * Consumes or restores the amount of maintained Zeon for a Mystic character.
   * Used in every turn change in ABFCombat.
   *
   * @param {boolean} revert A flag indicating whether to consume or restore the maintained Zeon. If `true`, the maintained Zeon will be restored to the character's total Zeon value. If `false`, the maintained Zeon will be consumed from the character's total Zeon value.
   * @returns A promise that resolves when the update is complete.
   */
  async consumeMaintainedZeon(revert) {
    const { zeon, zeonMaintained } = this.system.mystic;
    const updatedZeon = revert
      ? zeon.value + zeonMaintained.value
      : zeon.value - zeonMaintained.value;

    return this.update({
      system: {
        mystic: {
          zeon: { value: updatedZeon }
        }
      }
    });
  }

  // ============================
  // Técnicas de Ki (F6) — uso/activación en juego
  // ============================

  /**
   * Gasta `cost` Ki de la reserva unificada (permisivo: descuenta y avisa si no
   * llega, sin bloquear). `cost` negativo reembolsa.
   * @param {number} cost
   * @param {string} label
   */
  async _spendKiReserve(cost, label) {
    const reserve = this.system?.domine?.kiAccumulation?.reserve;
    const current = Number(reserve?.current?.value) || 0;
    const max = Number(reserve?.max?.value) || 0;
    if (cost > 0 && cost > current) {
      ui.notifications?.warn(
        `Ki insuficiente para «${label}»: cuesta ${cost} y la reserva es ${current}.`
      );
    }
    // cost < 0 = reembolso (revert de mantenimiento): nunca por encima del maximo,
    // que es lo que recortaria mutateKiReserve en la siguiente preparacion.
    const cap = max > 0 ? max : Infinity;
    const next = Math.min(cap, Math.max(0, current - cost));
    await this.update({
      system: {
        domine: { kiAccumulation: { reserve: { current: { value: next } } } }
      }
    });
  }

  /** Uso instantáneo: exige Ki concentrado suficiente y lo gasta (con la reserva). */
  async useTechnique(techniqueId) {
    const technique = this.items.get(techniqueId);
    if (technique?.type !== 'technique') return false;
    // Ya en efecto este asalto (botón «Usar» pulsado o checkbox ya marcado en una
    // tirada): el Ki se gastó la primera vez, así que reaplicarla este asalto es
    // gratis. El hook de ronda limpia freshTurn y vuelve a cobrar al asalto siguiente.
    if (technique.flags?.animabf?.freshTurn) {
      ui.notifications?.info(`Tecnica «${technique.name}» ya en efecto este asalto (sin coste).`);
      return true;
    }
    const ok = await this._consumeConcentratedForTechnique(technique);
    if (ok) {
      const ki = Number(technique.system?.computed?.kiActiveTotal) || 0;
      // Marca "en efecto este asalto" (feedback del botón «Usando…»); lo limpia el
      // hook de ronda (consumeActiveTechniquesKi) al pasar el asalto completo.
      await technique.update({ 'flags.animabf.freshTurn': true });
      ui.notifications?.info(`Tecnica «${technique.name}» usada${ki ? ` (Ki ${ki})` : ''}.`);
    }
    return ok;
  }

  /** Activa una técnica mantenida/sostenida: gasta el coste y marca el estado. */
  async activateTechnique(techniqueId) {
    const technique = this.items.get(techniqueId);
    if (technique?.type !== 'technique') return false;
    if (technique.flags?.animabf?.active) return true; // ya activa: no re-gastar Ki
    const computed = technique.system?.computed ?? {};
    const flags = computed.flags ?? {};
    if (!(await this._consumeConcentratedForTechnique(technique))) return false;
    const sostenidaMayor = !!flags.anySostMayor;
    const sostenida = sostenidaMayor || !!flags.anySostMenor;
    // Sostenida Menor = 5 asaltos; Mayor ≈ 1 minuto (~20 asaltos). Mantenida no expira por duración.
    const remaining = sostenida ? (sostenidaMayor ? 20 : 5) : 0;
    await technique.update({
      'flags.animabf.active': true,
      'flags.animabf.remaining': remaining,
      // Marca el turno de activación: la porción Tipo Acción de la técnica solo se
      // ofrece este asalto; el hook de ronda (consumeActiveTechniquesKi) lo limpia.
      'flags.animabf.freshTurn': true
    });
    const ki = Number(computed.kiActiveTotal) || 0;
    ui.notifications?.info(
      `Tecnica «${technique.name}» activada${ki ? ` (Ki ${ki})` : ''}${
        remaining ? ` · dura ${remaining} asaltos` : ''
      }.`
    );
    return true;
  }

  /** Desactiva una técnica (sin reembolso de Ki). */
  async deactivateTechnique(techniqueId) {
    const technique = this.items.get(techniqueId);
    if (technique?.type !== 'technique') return false;
    await technique.update({
      'flags.animabf.active': false,
      'flags.animabf.remaining': 0,
      'flags.animabf.freshTurn': false
    });
    ui.notifications?.info(`Tecnica «${technique.name}» desactivada.`);
    return true;
  }

  // ============================
  // Concentración de Ki (Cargar Ki) — F6
  // ============================

  /**
   * Gasta el coste activo de una técnica del Ki CONCENTRADO (por característica)
   * y de la reserva total. Permisivo: si falta concentración avisa claro pero gasta
   * lo que haya (suelo 0) sin bloquear; solo devuelve false si el coste no está
   * calculado (técnica sin preparar). El mantenimiento NO pasa por aquí.
   * @param {ABFActor['items'] extends Map<string, infer I> ? I : any} technique
   * @returns {Promise<boolean>}
   */
  async _consumeConcentratedForTechnique(technique) {
    const computed = technique.system?.computed ?? {};
    const cost = computed.costByCharacteristic;
    if (!cost) {
      // computed sin poblar (item recien creado/importado sin preparar): NO gastar
      // gratis ni saltarse el gating; avisar para que se reabra y recalcule.
      ui.notifications?.warn(
        `No se pudo calcular el coste de «${technique.name}»: reabre la tecnica e intentalo de nuevo.`
      );
      return false;
    }
    const ka = this.system?.domine?.kiAccumulation ?? {};
    const accumulated = {};
    for (const c of KI_CHAR_KEYS) accumulated[c] = Number(ka[c]?.accumulated?.value) || 0;

    const short = concentratedShortfall(cost, accumulated);
    if (short.length) {
      const detail = short
        .map(s => `${KI_CHAR_LABELS[s.char] ?? s.char} ${s.have}/${s.need}`)
        .join(', ');
      // Permisivo: avisa claro pero NO bloquea (antes return false); el gasto de
      // abajo (concentrado + reserva) ya tiene suelo 0.
      ui.notifications?.warn(
        `Ki concentrado insuficiente para «${technique.name}»: ${detail}. Activa «Cargar Ki».`
      );
    }

    const update = {};
    for (const c of KI_CHAR_KEYS) {
      const need = Number(cost?.[c]?.active) || 0;
      if (need <= 0) continue;
      update[`system.domine.kiAccumulation.${c}.accumulated.value`] = Math.max(
        0,
        accumulated[c] - need
      );
    }
    const total = Number(computed.kiActiveTotal) || 0;
    const reserveCurrent = Number(ka.reserve?.current?.value) || 0;
    update['system.domine.kiAccumulation.reserve.current.value'] = Math.max(
      0,
      reserveCurrent - total
    );
    await this.update(update);
    return true;
  }

  /**
   * Lee this.system y devuelve el nuevo concentrado por característica tras un
   * paso de acumulación (reduce a la mitad si no es "plena", luego suma la Acu.).
   * @returns {Record<string,number>|null}
   */
  _computeAccumulationStep(firstStep = false) {
    const ka = this.system?.domine?.kiAccumulation;
    if (!ka) return null;
    const accumulated = {};
    const rates = {};
    const selected = {};
    for (const c of KI_CHAR_KEYS) {
      accumulated[c] = Number(ka[c]?.accumulated?.value) || 0;
      rates[c] = Number(ka[c]?.final?.value) || 0;
      selected[c] = ka[c]?.accumulating?.value !== false; // por defecto, todas
    }
    return accumulateKiStep({
      accumulated,
      rates,
      selected,
      full: !!this.flags?.animabf?.fullKiAccumulation,
      firstStep
    });
  }

  /**
   * Un paso de acumulación (concentración) de Ki por asalto. Sólo actúa si
   * "Cargar Ki" está activo (lo llama ABFCombat.nextRound).
   */
  async accumulateKi() {
    if (!this.flags?.animabf?.chargingKi) return;
    // La preparación de este sistema es asíncrona: la tasa de acumulación es un
    // dato DERIVADO. Aseguramos que esté calculada antes de leerla (si no, sale
    // 0 y el incremento es 0).
    await prepareActor(this);
    const next = this._computeAccumulationStep();
    if (!next) return;
    const ka = this.system?.domine?.kiAccumulation ?? {};
    // Snapshot del concentrado previo para poder revertir el paso (previousRound).
    const prev = {};
    const update = {};
    for (const c of KI_CHAR_KEYS) {
      prev[c] = Number(ka[c]?.accumulated?.value) || 0;
      update[`system.domine.kiAccumulation.${c}.accumulated.value`] = next[c];
    }
    update['flags.animabf.kiAccumPrev'] = prev;
    await this.update(update);
  }

  /**
   * Deshace el último paso de acumulación (lo llama ABFCombat.previousRound):
   * restaura el concentrado al snapshot guardado por accumulateKi. Un solo nivel
   * de deshacer (el del asalto que se revierte); si no hay snapshot, no hace nada.
   */
  async revertAccumulateKi() {
    const prev = this.flags?.animabf?.kiAccumPrev;
    if (!prev) return;
    const update = { 'flags.animabf.kiAccumPrev': null };
    for (const c of KI_CHAR_KEYS) {
      update[`system.domine.kiAccumulation.${c}.accumulated.value`] = Math.max(
        0,
        Number(prev[c]) || 0
      );
    }
    await this.update(update);
  }

  /**
   * Activa/desactiva "Cargar Ki" en UN SOLO update (flag + concentrado), para
   * evitar carreras de render. Al activar concentra el primer asalto; al
   * desactivar, el concentrado vuelve a la reserva (se pone a 0).
   */
  async toggleChargeKi() {
    const charging = !this.flags?.animabf?.chargingKi;
    const update = { 'flags.animabf.chargingKi': charging };
    if (charging) {
      // Asegurar datos derivados (tasa de acumulación) antes de leerlos.
      await prepareActor(this);
      // La activación aporta la tasa completa (primer lote del asalto en curso).
      const next = this._computeAccumulationStep(true);
      if (next) {
        for (const c of KI_CHAR_KEYS) {
          update[`system.domine.kiAccumulation.${c}.accumulated.value`] = next[c];
        }
      }
    } else {
      for (const c of KI_CHAR_KEYS) {
        update[`system.domine.kiAccumulation.${c}.accumulated.value`] = 0;
      }
    }
    await this.update(update);
    ui.notifications?.info(
      charging
        ? 'Concentracion de Ki activada.'
        : 'Concentracion de Ki detenida (concentrado a 0).'
    );
    return charging;
  }

  /** Activa/desactiva la "acumulación plena" (no reduce a la mitad al pasar el asalto). */
  async toggleFullKiAccumulation() {
    const next = !this.flags?.animabf?.fullKiAccumulation;
    await this.setFlag('animabf', 'fullKiAccumulation', next);
    ui.notifications?.info(`Acumulacion plena de Ki ${next ? 'activada' : 'desactivada'}.`);
    return next;
  }

  // ============================
  // Acumulación de zeón (concentración mágica) — Magia fase 2b
  // ============================

  /**
   * Un paso de acumulación de zeón por asalto (lo llama ABFCombat.nextRound).
   * Mientras "Acumular zeón" está activo, transfiere el ACT Final desde la
   * reserva (zeon.value) a lo concentrado (zeon.accumulated), hasta agotar la
   * reserva. RAW (Core Exxet): el zeón se canaliza desde la reserva al concentrar.
   */
  async accumulateZeon() {
    if (!this.flags?.animabf?.accumulatingZeon) return;
    // ACT es DERIVADO (penalizadores); recalcular antes de leerlo.
    await prepareActor(this);
    const zeon = this.system?.mystic?.zeon ?? {};
    const act = Number(this.system?.mystic?.act?.main?.final?.value) || 0;
    const value = Number(zeon.value) || 0;
    const accumulated = Number(zeon.accumulated) || 0;
    const drawn = Math.max(0, Math.min(act, value));
    if (drawn <= 0) return;
    await this.update({
      'flags.animabf.zeonAccumPrev': { value, accumulated },
      system: {
        mystic: { zeon: { value: value - drawn, accumulated: accumulated + drawn } }
      }
    });
  }

  /** Deshace el último paso de acumulación de zeón (ABFCombat.previousRound). */
  async revertAccumulateZeon() {
    const prev = this.flags?.animabf?.zeonAccumPrev;
    if (!prev) return;
    await this.update({
      'flags.animabf.zeonAccumPrev': null,
      system: {
        mystic: {
          zeon: {
            value: Math.max(0, Number(prev.value) || 0),
            accumulated: Math.max(0, Number(prev.accumulated) || 0)
          }
        }
      }
    });
  }

  /**
   * Activa/desactiva "Acumular zeón". Al activar concentra el primer asalto. Al
   * PARAR (desactivar), lo concentrado vuelve a la reserva PERDIENDO 10 (RAW:
   * Core Exxet — si dejas de acumular un turno, lo concentrado vuelve a la
   * reserva perdiendo 10 puntos en el proceso).
   */
  async toggleAccumulateZeon() {
    const accumulating = !this.flags?.animabf?.accumulatingZeon;
    if (accumulating) {
      await prepareActor(this);
      const zeon = this.system?.mystic?.zeon ?? {};
      const act = Number(this.system?.mystic?.act?.main?.final?.value) || 0;
      const value = Number(zeon.value) || 0;
      const accumulated = Number(zeon.accumulated) || 0;
      const drawn = Math.max(0, Math.min(act, value));
      await this.update({
        'flags.animabf.accumulatingZeon': true,
        system: {
          mystic: { zeon: { value: value - drawn, accumulated: accumulated + drawn } }
        }
      });
      ui.notifications?.info(
        `Acumulacion de zeon activada${drawn ? ` (+${drawn} concentrado)` : ''}.`
      );
    } else {
      const zeon = this.system?.mystic?.zeon ?? {};
      const value = Number(zeon.value) || 0;
      const max = Number(zeon.max) || 0;
      const accumulated = Number(zeon.accumulated) || 0;
      const returned = accumulated > 0 ? Math.max(0, accumulated - 10) : 0;
      const newValue = max > 0 ? Math.min(max, value + returned) : value + returned;
      await this.update({
        'flags.animabf.accumulatingZeon': false,
        'flags.animabf.zeonAccumPrev': null,
        system: { mystic: { zeon: { value: newValue, accumulated: 0 } } }
      });
      ui.notifications?.info(
        accumulated > 0
          ? `Acumulacion de zeon detenida (devueltos ${returned} a reserva, -10).`
          : 'Acumulacion de zeon detenida.'
      );
    }
    return accumulating;
  }

  /**
   * Bucle por asalto (llamado desde ABFCombat): las técnicas mantenidas activas
   * gastan su Ki de mantenimiento; las sostenidas descuentan duración y se
   * desactivan al expirar. `revert` deshace el paso (asalto anterior).
   * @param {boolean} [revert]
   */
  async consumeActiveTechniquesKi(revert = false) {
    if (revert) {
      // Revert: restaurar desde el snapshot que guardó el paso hacia delante.
      // Asi se reactivan las sostenidas que expiraron ESE asalto (active:false,
      // remaining:0) sin tocar las que nunca estuvieron activas, y se reembolsa
      // el mantenimiento exactamente igual al que se gastó. Un solo nivel.
      const snapped = this.items.filter(
        i => i.type === 'technique' && i.flags?.animabf?.prevRound
      );
      for (const technique of snapped) {
        const snap = technique.flags.animabf.prevRound;
        const maint = Number(snap?.maint) || 0;
        if (maint > 0) await this._spendKiReserve(-maint, technique.name);
        await technique.update({
          'flags.animabf.active': !!snap.active,
          'flags.animabf.remaining': Number(snap.remaining) || 0,
          'flags.animabf.freshTurn': !!snap.freshTurn,
          'flags.animabf.prevRound': null
        });
      }
      return;
    }

    // Activas (mantienen/sostienen) o instantáneas marcadas "este asalto" (freshTurn).
    const techniques = this.items.filter(
      i =>
        i.type === 'technique' &&
        (i.flags?.animabf?.active || i.flags?.animabf?.freshTurn)
    );
    for (const technique of techniques) {
      const wasFresh = !!technique.flags?.animabf?.freshTurn;

      // Instantánea usada este asalto (no activa): solo limpia el feedback «Usando…».
      if (!technique.flags?.animabf?.active) {
        await technique.update({
          'flags.animabf.prevRound': { active: false, remaining: 0, maint: 0, freshTurn: wasFresh },
          'flags.animabf.freshTurn': false
        });
        continue;
      }

      const computed = technique.system?.computed ?? {};
      const flags = computed.flags ?? {};
      const step = techniqueRoundStep({
        flags,
        remaining: Number(technique.flags?.animabf?.remaining) || 0,
        kiMaint: Number(computed.kiMaintTotal) || 0
      });

      if (step.maintSpent) await this._spendKiReserve(step.maintSpent, technique.name);

      // Snapshot del estado PRE-paso para poder revertir (previousRound). Al pasar
      // de asalto la técnica deja de ser "fresca": su porción Tipo Acción ya no se
      // ofrece (solo perduran los efectos mantenidos/sostenidos).
      const techUpdate = {
        'flags.animabf.prevRound': { ...step.snapshot, freshTurn: wasFresh },
        'flags.animabf.freshTurn': false
      };
      if (step.sustained) {
        techUpdate['flags.animabf.active'] = step.nextActive;
        techUpdate['flags.animabf.remaining'] = step.nextRemaining;
      }
      await technique.update(techUpdate);
    }
  }

  /**
   * Deletes a prepared spell from the `mystic.preparedSpells` array of the `ABFActor` class.
   *
   * @param {string} spellName The name of the spell to be deleted.
   * @param {string} spellGrade The grade of the spell to be deleted.
   * @returns The method updates the `mystic.preparedSpells` array of the actor.
   */
  deletePreparedSpell(spellName, spellGrade) {
    let preparedSpellId = this.system.mystic.preparedSpells.find(
      ps =>
        ps.name == spellName &&
        ps.system.grade.value == spellGrade &&
        ps.system.prepared.value == true
    )._id;
    if (preparedSpellId !== undefined) {
      let items = this.getPreparedSpells();
      items = items.filter(item => item._id !== preparedSpellId);
      const fieldPath = ['mystic', 'preparedSpells'];
      const dataToUpdate = {
        system: getUpdateObjectFromPath(items, fieldPath)
      };
      return this.update(dataToUpdate);
    }
  }

  /**
   * Updates the `lifePoints` attribute of an `ABFActor` object by subtracting the specified `damage` value.
   * @param {number} damage - The amount of damage to be subtracted from the `lifePoints` attribute.
   */
  applyDamage(damage) {
    const newLifePoints =
      this.system.characteristics.secondaries.lifePoints.value - damage;

    this.update({
      system: {
        characteristics: {
          secondaries: { lifePoints: { value: newLifePoints } }
        }
      }
    });
  }

  /**
   *  @param {Object} data
   *  @param {import('../items/ABFItems').ABFItemsEnum} data.type
   *  @param {string} data.name
   *  @param {ABFItem["system"]} data.system
   *  @param {Record<string, unknown>} [data.flags]
   */
  async createItem({ type, name, system = {}, flags = {} }) {
    const items = await this.createEmbeddedDocuments('Item', [
      {
        type,
        name,
        system,
        flags
      }
    ]);
    return items[0];
  }

  /**
   *  @param {Object} data
   *  @param {import('../items/ABFItems').ABFItemsEnum} data.type
   *  @param {string} data.name
   *  @param {Record<string, unknown>} data.system
   */
  async createInnerItem({ type, name, system = {} }) {
    const configuration = ALL_ITEM_CONFIGURATIONS[type];

    const items = getFieldValueFromPath(this.system, configuration.fieldPath) ?? [];

    await this.update({
      system: getUpdateObjectFromPath(
        [
          ...items,
          {
            _id: nanoid(),
            type,
            name,
            system
          }
        ],
        configuration.fieldPath
      )
    });
  }

  /**
   * @param {string} id
   */
  async deleteItem(id) {
    const item = this.getItem(id);

    if (item) {
      await item.delete();
    }
  }

  /**
   * Limpia el actor para una RE-importacion idempotente: borra TODOS los items
   * embebidos (createItem/createEmbeddedDocuments) y vacia los arrays de inner
   * items (createInnerItem los APPENDEA). Sin esto, re-importar una ficha
   * existente duplicaba armas, conjuros, habilidades de Ki, artes marciales, etc.
   * Conserva el actor (id, token, permisos, notas) — solo resetea su contenido.
   */
  async clearForReimport() {
    const ids = this.items.map(i => i.id);
    if (ids.length) {
      await this.deleteEmbeddedDocuments('Item', ids);
    }

    const reset = {};
    for (const cfg of Object.values(ALL_ITEM_CONFIGURATIONS)) {
      if (cfg?.isInternal && Array.isArray(cfg.fieldPath) && cfg.fieldPath.length) {
        foundry.utils.setProperty(reset, ['system', ...cfg.fieldPath].join('.'), []);
      }
    }
    if (Object.keys(reset).length) {
      await this.update(reset);
    }
  }

  /**
   *  @param {Object} data
   *  @param {import('../items/ABFItems').ABFItemsEnum} data.type
   *  @param {string} data.name
   *  @param {ABFItem["system"]} data.system
   */
  async updateItem({ id, name, system = {} }) {
    const item = this.getItem(id);

    if (item) {
      let updateObject = { system };

      if (name) {
        updateObject = {
          ...updateObject,
          name
        };
      }

      if (
        (!!name && name !== item.name) ||
        JSON.stringify(system) !== JSON.stringify(item.system)
      ) {
        await item.update(updateObject);
      }
    }
  }

  /**
   *  @param {Object} data
   *  @param {import('../items/ABFItems').ABFItemsEnum} data.type
   *  @param {string} data.id
   *  @param {string} data.name
   *  @param {Record<string, unknown>} data.system
   *  @param {boolean} forceSave
   */
  async updateInnerItem({ type, id, name, system = {} }, forceSave = false) {
    const configuration = ALL_ITEM_CONFIGURATIONS[type];

    const items = this.getInnerItems(type);
    const item = items.find(it => it._id === id);

    if (item) {
      const hasChanges =
        forceSave ||
        (!!name && name !== item.name) ||
        JSON.stringify(system) !== JSON.stringify(item.system);

      if (hasChanges) {
        if (name) {
          item.name = name;
        }

        if (system) {
          item.system = foundry.utils.mergeObject(item.system, system);
        }

        await this.update({
          system: getUpdateObjectFromPath(items, configuration.fieldPath)
        });
      }
    }
  }

  /**
   * @param {import('../items/ABFItems').ABFItemsEnum} data.type
   * @param {string} itemId
   */
  getInnerItem(type, itemId) {
    return this.getItemsOf(type).find(item => item._id === itemId);
  }

  getSecondarySpecialSkills() {
    return this.getItemsOf(ABFItems.SECONDARY_SPECIAL_SKILL);
  }

  getKnownSpells() {
    return this.getItemsOf(ABFItems.SPELL);
  }

  getSpellMaintenances() {
    return this.getItemsOf(ABFItems.SPELL_MAINTENANCE);
  }

  getSelectedSpells() {
    return this.getItemsOf(ABFItems.SELECTED_SPELL);
  }

  getActVias() {
    return this.getItemsOf(ABFItems.ACT_VIA);
  }

  getInnateMagicVias() {
    return this.getItemsOf(ABFItems.INNATE_MAGIC_VIA);
  }

  getPreparedSpells() {
    return this.getItemsOf(ABFItems.PREPARED_SPELL);
  }

  getSupernaturalShields() {
    return this.getItemsOf(ABFItems.SUPERNATURAL_SHIELD);
  }

  getKnownMetamagics() {
    return this.getItemsOf(ABFItems.METAMAGIC);
  }

  getKnownSummonings() {
    return this.getItemsOf(ABFItems.SUMMON);
  }

  getCategories() {
    return this.getItemsOf(ABFItems.LEVEL);
  }

  getKnownLanguages() {
    return this.getItemsOf(ABFItems.LANGUAGE);
  }

  getElans() {
    return this.getItemsOf(ABFItems.ELAN);
  }

  getElanPowers() {
    return this.getItemsOf(ABFItems.ELAN_POWER);
  }

  getTitles() {
    return this.getItemsOf(ABFItems.TITLE);
  }

  getAdvantages() {
    return this.getItemsOf(ABFItems.ADVANTAGE);
  }

  getDisadvantages() {
    return this.getItemsOf(ABFItems.DISADVANTAGE);
  }

  getContacts() {
    return this.getItemsOf(ABFItems.CONTACT);
  }

  getNotes() {
    return this.getItemsOf(ABFItems.NOTE);
  }

  getPsychicDisciplines() {
    return this.getItemsOf(ABFItems.PSYCHIC_DISCIPLINE);
  }

  getMentalPatterns() {
    return this.getItemsOf(ABFItems.MENTAL_PATTERN);
  }

  getInnatePsychicPowers() {
    return this.getItemsOf(ABFItems.INNATE_PSYCHIC_POWER);
  }

  getPsychicPowers() {
    return this.getItemsOf(ABFItems.PSYCHIC_POWER);
  }

  getKiSkills() {
    return this.getItemsOf(ABFItems.KI_SKILL);
  }

  getNemesisSkills() {
    return this.getItemsOf(ABFItems.NEMESIS_SKILL);
  }

  getArsMagnus() {
    return this.getItemsOf(ABFItems.ARS_MAGNUS);
  }

  getMartialArts() {
    return this.getItemsOf(ABFItems.MARTIAL_ART);
  }

  getKnownCreatures() {
    return this.getItemsOf(ABFItems.CREATURE);
  }

  getSpecialSkills() {
    return this.getItemsOf(ABFItems.SPECIAL_SKILL);
  }

  getKnownTechniques() {
    return this.getItemsOf(ABFItems.TECHNIQUE);
  }

  getCombatSpecialSkills() {
    return this.getItemsOf(ABFItems.COMBAT_SPECIAL_SKILL);
  }

  getCombatTables() {
    return this.getItemsOf(ABFItems.COMBAT_TABLE);
  }

  getAmmos() {
    return this.getItemsOf(ABFItems.AMMO);
  }

  getWeapons() {
    return this.getItemsOf(ABFItems.WEAPON);
  }

  getArmors() {
    return this.getItemsOf(ABFItems.ARMOR);
  }

  getInventoryItems() {
    return this.getItemsOf(ABFItems.INVENTORY_ITEM);
  }

  getAllItems() {
    return Object.values(ABFItems).flatMap(itemType => this.getItemsOf(itemType));
  }

  _getSheetClass() {
    return ABFActorSheet;
  }

  /**
   * @param {import('../items/ABFItems').ABFItemsEnum} type
   * @returns {ABFItem[]}
   * @TODO: Improve return type
   */
  getItemsOf(type) {
    const configuration = ALL_ITEM_CONFIGURATIONS[type];

    if (!configuration) {
      Logger.error(`No configuration found for item type ${type}`);

      return [];
    }

    if (configuration.isInternal) {
      return this.getInnerItems(type);
    }

    return this.items.filter(i => i.type === type);
  }

  /**
   * @param {import('../items/ABFItems').ABFItemsEnum} type
   * @TODO: Improve return type
   */
  getInnerItems(type) {
    const configuration = ALL_ITEM_CONFIGURATIONS[type];

    if (!configuration) {
      Logger.error(`No configuration found for item type ${type}`);

      return [];
    }

    if (configuration.fieldPath.length === 0) {
      return [];
    }

    const items = getFieldValueFromPath(this.system, configuration.fieldPath);

    if (Array.isArray(items)) {
      return items.map(migrateItem);
    }

    return [];
  }

  /**
   * @param {ABFItem["id"]} itemId
   */
  getItem(itemId) {
    return this.getEmbeddedDocument('Item', itemId);
  }
  applyActiveEffects() {
    // Active Effects are applied in prepareActor using the flow ordering (per-change).
    // We keep _applyDynamicEffectValue for evaluating dynamic change values.
    return this;
  }

  _applyDynamicEffectValue(value) {
    if (typeof value !== 'string') return value;

    const evaluated = FormulaEvaluator.evaluate(value, this);
    if (evaluated !== null && !Number.isNaN(evaluated)) return evaluated;

    return value;
  }
}
