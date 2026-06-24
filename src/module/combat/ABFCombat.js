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
      // await: gasta el zeon de mantenimiento ANTES de accumulateZeon (que relee
      // zeon.value). Sin await habia carrera de updates -> concentrado descuadrado.
      await actor.consumeMaintainedZeon();
      // Ki: serializado con await sobre el mismo actor para evitar carreras de
      // update (mantenimiento de técnicas y acumulación por asalto persisten bien).
      await actor.consumeActiveTechniquesKi();
      await actor.accumulateKi();
      await actor.accumulateZeon();
      await actor.psychicShieldsMaintenance();
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
      await actor.consumeMaintainedZeon(true);
      await actor.consumeActiveTechniquesKi(true);
      await actor.revertAccumulateKi();
      await actor.revertAccumulateZeon();
      await actor.psychicShieldsMaintenance(true);
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
    // Cancelar el dialogo (X / Escape) aborta la tirada de iniciativa; pulsar
    // Continuar con el campo vacio o un valor no numerico cuenta como modificador 0.
    const modRaw = await openModDialog();
    if (modRaw === undefined || modRaw === null) return this;
    const mod = Number(modRaw) || 0;

    if (typeof ids === 'string') {
      ids = [ids];
    }
    for (const id of ids) {
      const combatant = this.combatants.get(id);
      const actor = combatant?.actor;
      // El token puede no resolverse en la escena (o el actor estar borrado): saltar
      // en vez de reventar, igual que nextRound/_sortCombatants.
      if (!actor) continue;

      const baseInit =
        actor.system?.characteristics?.secondaries?.initiative?.final?.value ?? 0;
      const formula = `${combatant._getInitiativeFormula()} + ${baseInit} + ${mod}`;
      await super.rollInitiative(id, { formula, updateTurn, messageOptions });

      // Marca explicita de pifia: una pifia de iniciativa (dado 1-3) aplica un
      // penalizador grande negativo en ABFInitiativeRoll, asi que la contribucion del
      // dado (= total - base - mod) cae por debajo de 0; una tirada normal es >= 4.
      // Guardar el flag evita que _sortCombatants tenga que inferir la pifia con
      // numeros magicos a partir del total.
      if (Number.isFinite(combatant.initiative)) {
        const dieContribution = combatant.initiative - baseInit - mod;
        await combatant.setFlag('animabf', 'initiativeFumble', dieContribution < 0);
      }
    }

    if (this.getFlag('world', 'newRound')) {
      await this.update({ turn: 0 }); // Updates active turn such that it is the one with higher innitiative.
    }

    return this;
  }

  /**
   * Orden de turno (mayor iniciativa actua antes), con las reglas de Anima:
   *  - Quien aun no ha tirado va al final.
   *  - Una pifia de iniciativa actua siempre DESPUES de quien no pifio.
   *  - Dentro del mismo grupo, mayor iniciativa (ya con penalizadores) primero.
   *  - En empate, desempata la base cruda de iniciativa (mayor primero).
   * @protected @override
   * @param {Combatant} combatantA
   * @param {Combatant} combatantB
   */
  _sortCombatants(combatantA, combatantB) {
    const aRolled = Number.isFinite(combatantA?.initiative);
    const bRolled = Number.isFinite(combatantB?.initiative);
    if (aRolled !== bRolled) return aRolled ? -1 : 1;
    if (!aRolled && !bRolled) return 0;

    const aFumble = combatantA.getFlag('animabf', 'initiativeFumble') === true;
    const bFumble = combatantB.getFlag('animabf', 'initiativeFumble') === true;
    if (aFumble !== bFumble) return aFumble ? 1 : -1;

    if (combatantA.initiative !== combatantB.initiative) {
      return combatantB.initiative - combatantA.initiative;
    }

    const baseOf = c =>
      c?.actor?.system?.characteristics?.secondaries?.initiative?.base?.value ?? 0;
    return baseOf(combatantB) - baseOf(combatantA);
  }
}
