import { ABFItems } from '../../items/ABFItems';
import { openComplexInputDialog } from '../../utils/dialogs/openComplexInputDialog';
import { openModDialog } from '../../utils/dialogs/openSimpleInputDialog';
import { SpellGrades } from '../mystic/SpellItemConfig';
import { ABFItemConfigFactory } from '../ABFItemConfig';
import { ABFSupernaturalShieldData } from '../../combat/ABFSupernaturalShieldData.js';
import { shieldValueCheck } from '../../combat/utils/shieldValueCheck.js';

/**
 * Initial data for a new supernatural shield. Used to infer the type of the data inside `supernaturalShield.system`
 * @readonly
 */
export const INITIAL_SUPERNATURAL_SHIELD_DATA = {
  shieldPoints: 0,
  abilityFormula: ''
};

/** @type {import("../Items").SupernaturalShieldItemConfig} */
export const SupernaturalShieldItemConfig = ABFItemConfigFactory({
  type: ABFItems.SUPERNATURAL_SHIELD,
  isInternal: false,
  fieldPath: ['combat', 'supernaturalShields'],
  selectors: {
    addItemButtonSelector: 'add-supernatural-shield',
    containerSelector: '#supernatural-shields-context-menu-container',
    rowSelector: '.supernatural-shield-row'
  },
  hideDeleteRow: true,
  contextMenuConfig: {
    buildExtraOptionsInContextMenu: actor => [
      {
        name: game.i18n.localize('contextualMenu.superntarualShield.options.release'),
        icon: '<i class="fas fa-times" aria-hidden="true"></i>',
        callback: target => {
          const { itemId } = (target instanceof HTMLElement ? target : target[0]).dataset;

          if (!itemId) throw new Error('supernaturalShieldId missing');

          actor.deleteSupernaturalShield(itemId);
        }
      }
    ]
  },
  onCreate: async actor => {
    const results = await openComplexInputDialog(actor, 'newSupernaturalShield');
    const { tab } = results;
    if (tab === 'mystic') {
      const spellID = results['new.mysticShield.id'];
      const spellGrade = results['new.mysticShield.grade'];
      const castSpell = results['new.mysticShield.castSpell'];
      const innate = castSpell == 'innate';
      const prepared = castSpell == 'prepared';
      const override = castSpell == 'override';
      const spell = actor.system.mystic.spells.find(i => i._id == spellID);
      if (!spell) {
        return;
      }
      actor.setFlag(game.animabf.id, 'spellCastingOverride', override);
      const spellCasting = actor.mysticCanCastEvaluate(
        spell,
        spellGrade,
        { innate, prepared },
        override
      );
      spellCasting.casted = { innate, prepared };
      if (actor.evaluateCast(spellCasting)) {
        return;
      }
      actor.mysticCast(spellCasting, spell.name, spellGrade);
      const gradeData = spell.system.grades[spellGrade];
      const shieldPoints = Number(shieldValueCheck(gradeData)) || 0;
      const gradeLabel = game.i18n.localize(
        `anima.ui.mystic.spell.grade.${spellGrade}.title`
      );
      actor.newSupernaturalShield(
        ABFSupernaturalShieldData.builder()
          .name(`${spell.name} (${gradeLabel})`)
          .shieldPoints(shieldPoints)
          .abilityFormula('@mystic.magicProjection.imbalance.defensive.final.value')
          .flags({ animabf: { supernaturalShield: { type: 'mystic' } } })
          .build()
      );
    } else if (tab === 'psychic') {
      const powerID = results['new.psychicShield.id'];
      const eliminateFatigue = results['new.psychicShield.eliminateFatigue'];
      const mentalPatternImbalance = results['new.psychicShield.mentalPatternImbalance'];
      const showRoll = true;
      let powerDifficulty = results['new.psychicShield.difficulty'];
      const power = actor.system.psychic.psychicPowers.find(i => i._id == powerID);
      if (!power) {
        return;
      }
      if (powerDifficulty == 'roll') {
        const { i18n } = game;
        const mod = await openModDialog();
        const psychicPotential = actor.system.psychic.psychicPotential.final.value;
        const psychicPotentialRoll = new ABFFoundryRoll(
          `1d100PsychicRoll + ${psychicPotential} + ${mod}`,
          { ...actor.system, power, mentalPatternImbalance }
        );
        await psychicPotentialRoll.roll();
        powerDifficulty = psychicPotentialRoll.total;
        psychicPotentialRoll.toMessage({
          speaker: ChatMessage.getSpeaker({ actor }),
          flavor: i18n.format('macros.combat.dialog.psychicPotential.title')
        });
        const fatigue = await actor.evaluatePsychicFatigue(
          power,
          psychicPotentialRoll.total,
          eliminateFatigue,
          showRoll
        );
        if (fatigue) {
          return;
        }
      }
      actor.newSupernaturalShield('psychic', power, powerDifficulty);
    }
  }
});
