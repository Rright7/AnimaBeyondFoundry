import { openModDialog } from '../utils/dialogs/openSimpleInputDialog';
import { tickBleeding } from './bleedingEffect.js';
import { processDueDelayedDamage } from './delayedDamageEffect.js';

export default class ABFCombat extends Combat {
  /**
   *  @param {import('../../types/foundry-vtt-types/src/foundry/common/data/data.mjs/combatData').CombatDataConstructorData} data
   *  @param {Context<null>} [context]
   */
  constructor(data, context) {
    super(data, context);
    this.updateSource({ 'flags.world.newRound': true });
  }

  async startCombat() {
    const combatants = this.combatants.map(c => c.token);
    for (let token of combatants) {
      token?.actor?.resetDefensesCounter();
    }
    return super.startCombat();
  }

  async nextTurn() {
    if (this.getFlag('world', 'newRound')) {
      this.setFlag('world', 'newRound', false);
    }
    return super.nextTurn();
  }

  async nextRound() {
    // Reset initiative for everyone when going to the next round
    await this.resetAll();
    this.setFlag('world', 'newRound', true);

    // Usar combatant.actor (accesor robusto): c.token puede ser null si el token
    // no se resuelve en la escena, lo que saltaría TODAS las operaciones por asalto.
    for (const combatant of this.combatants) {
      const actor = combatant?.actor;
      if (!actor) continue;
      actor.resetDefensesCounter();
      actor.consumeMaintainedZeon();
      // Ki: serializado con await sobre el mismo actor para evitar carreras de
      // update (mantenimiento de técnicas y acumulación por asalto persisten bien).
      await actor.consumeActiveTechniquesKi();
      await actor.accumulateKi();
      actor.psychicShieldsMaintenance();
      // Desangramiento: 1 PV cada 20 asaltos mientras dure el sangrado.
      await tickBleeding(actor, 1);
      // Daño retrasado: aplica los daños que vencen en la ronda que se entra
      // (this.round aún es la anterior; super.nextRound la incrementa).
      await processDueDelayedDamage(actor, (this.round ?? 0) + 1);
    }

    return super.nextRound();
  }

  async previousRound() {
    // Reset initiative for everyone when going to the next round
    await this.resetAll();

    for (const combatant of this.combatants) {
      const actor = combatant?.actor;
      if (!actor) continue;
      actor.consumeMaintainedZeon(true);
      await actor.consumeActiveTechniquesKi(true);
      actor.psychicShieldsMaintenance(true);
    }

    return super.previousRound();
  }

  prepareDerivedData() {
    super.prepareDerivedData();

    this.combatants.forEach(combatant => {
      combatant.actor?.prepareDerivedData();
    });
  }

  /**
   * Modify rollInitiative so that it asks for modifiers
   * @param {string[] | string} ids
   * @param {{updateTurn?: boolean, messageOptions?: any}} [options]
   */
  async rollInitiative(ids, { updateTurn = false, messageOptions } = {}) {
    const mod = await openModDialog();

    if (typeof ids === 'string') {
      ids = [ids];
    }
    for (const id of ids) {
      const combatant = this.combatants.get(id);

      const baseInit =
        combatant.actor.system.characteristics.secondaries.initiative.final.value || 0;
      const formula = `${combatant._getInitiativeFormula()} + ${baseInit} + ${mod}`;
      await super.rollInitiative(id, { formula, updateTurn, messageOptions });
    }

    if (this.getFlag('world', 'newRound')) {
      await this.update({ turn: 0 }); // Updates active turn such that it is the one with higher innitiative.
    }

    return this;
  }

  /**
   * @protected @override
   * @param {Combatant} combatantA
   * @param {Combatant} combatantB
   */
  _sortCombatants(combatantA, combatantB) {
    let initiativeA = combatantA.initiative || -9999;
    let initiativeB = combatantB.initiative || -9999;
    if (
      initiativeA <
      (combatantA?.actor?.system.characteristics.secondaries.initiative.final.value || 0)
    )
      initiativeA -= 2000;
    if (
      initiativeB <
      (combatantB?.actor?.system.characteristics.secondaries.initiative.final.value || 0)
    )
      initiativeB -= 2000;
    return initiativeB - initiativeA;
  }
}
