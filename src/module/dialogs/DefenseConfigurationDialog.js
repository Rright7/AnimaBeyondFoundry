import { Templates } from '../utils/constants';
import { ABFAttackData } from '../combat/ABFAttackData';
import { ABFDefenseData } from '../combat/ABFDefenseData';
import { AbilityData } from '../types/AbilityData';
import { computeCombatResult } from '../combat/computeCombatResult';
import { updateAttackTargetsFlag } from '../../utils/updateAttackTargetsFlag.js';
import { getChatVisibilityOptions } from '../utils/chatVisibility.js';
import ABFFoundryRoll from '../rolls/ABFFoundryRoll.js';
import { FormulaEvaluator } from '../../utils/formulaEvaluator.js';
import { defensesCounterCheck, freeDefensesFor } from '../combat/utils/defensesCounterCheck.js';
import { buildRollFormula } from '../combat/utils/buildRollFormula.js';
import {
  activeTechniqueCombatBonuses,
  usableInstantCombatTechniques
} from '../domine/techniques/techniqueCombatBonuses.js';
import { martialArtsDodgeBonus } from '../combat/martialArts/martialArtsDodge.js';
import { maxFatiguePerAction } from '../combat/utils/fatigue.js';

export class DefenseConfigurationDialog extends FormApplication {
  constructor(object = {}, options = {}) {
    const base = DefenseConfigurationDialog._buildInitialData(object);

    base.ui.activeTab = DefenseConfigurationDialog._pickBestDefenseTab(base);

    super(base, options);

    this.modalData = base;

    this._claimed = false;
    this._resolved = false;
    this._initialState = null;

    if (this._tabs?.[0]) {
      this._tabs[0].callback = (_event, _tabs, tabName) => {
        this.modalData.ui.activeTab = tabName;
        this.render(true);
      };
      try {
        this._tabs[0].activate(this.modalData.ui.activeTab);
      } catch (_) {}
    }

    this.render(true);
  }

  static _getDocId(docLike) {
    return docLike?._id ?? docLike?.id ?? '';
  }

  static _buildInitialData({
    defender,
    attacker,
    attackData,
    weaponId,
    options = {},
    messageId
  }) {
    if (!defender || !defender.actor) {
      ui.notifications?.error('DefenseConfigurationDialog: defender is required');
      return { allowed: false };
    }

    const defenderActor = defender.actor;

    // Read defenses counter flag from defender actor (reset is handled by ABFCombat
    // hooks on turn change).
    const defensesCounter = defenderActor.getFlag?.(game.animabf.id, 'defensesCounter') || {
      accumulated: 0,
      keepAccumulating: true
    };

    const weapons = defenderActor.system?.combat?.weapons ?? [];
    const firstWeapon = weapons[0];

    // Ensure weaponUsed starts with a valid id
    const initialWeaponUsed = weaponId ?? firstWeapon?._id ?? firstWeapon?.id ?? '';

    // Ensure the initial weapon object is set from the start
    const initialWeapon =
      weapons.find(w => (w?._id ?? w?.id) === initialWeaponUsed) ??
      firstWeapon ??
      undefined;

    const supernaturalShields = defenderActor.system?.combat?.supernaturalShields ?? [];
    const firstShield = supernaturalShields[0];
    const firstShieldId = DefenseConfigurationDialog._getDocId(firstShield);

    return {
      ui: {
        isGM: !!game.user?.isGM,
        hasFatiguePoints:
          (defenderActor.system?.characteristics?.secondaries?.fatigue?.value ?? 0) > 0,
        activeTab: 'dodge',

        // Computed each getData()
        dodgeValue: 0,
        blockValue: 0,
        shieldValue: 0,
        supernaturalShields: []
      },
      attacker: attacker ? { token: attacker, actor: attacker?.actor } : undefined,
      attackData: attackData ? ABFAttackData.fromJSON(attackData) : new ABFAttackData(),
      defender: {
        token: defender,
        actor: defenderActor,
        withoutRoll: false,
        showRoll: !game.user?.isGM,
        combat: {
          modifier: 0,
          fatigueUsed: 0,
          // Auto-derive the multiple-defenses penalty from the actor's running counter.
          // No manual UI override is exposed in this dialog by design: the penalty
          // is fully driven by the rules (counter -> defensesCounterCheck mapping)
          // and the dialog only shows the resulting value as a read-only label.
          // Incluye el margen de defensas exentas (Artes Marciales + extra manual).
          multipleDefensesPenalty: defensesCounterCheck(
            defensesCounter.accumulated,
            freeDefensesFor(defenderActor)
          ),
          accumulateDefenses: defensesCounter.keepAccumulating,
          // Resistir el golpe: -80 a la defensa, NO acumula defensa
          // múltiple este asalto.
          resistTheHit: false,

          weaponUsed: initialWeaponUsed,
          weapon: initialWeapon,
          unarmed: weapons.length === 0,

          supernaturalShieldUsed: firstShieldId
        }
      },
      defenseSent: false,
      allowed: game.user?.isGM || (options?.allowed ?? true),
      messageId: messageId ?? options?.messageId ?? ''
    };
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['animabf-dialog', 'defense-config-dialog'],
      submitOnChange: true,
      closeOnSubmit: false,
      width: 600,
      height: 'auto',
      resizable: true,
      template: Templates.Dialog.Combat.DefenseConfigDialog,
      title: game.i18n.localize('macros.combat.dialog.defending.defend.title'),
      tabs: [
        {
          navSelector: '.sheet-tabs',
          contentSelector: '.sheet-body',
          initial: 'dodge'
        }
      ]
    });
  }

  get defenderActor() {
    return this.modalData?.defender?.actor;
  }

  getData() {
    const { defender, ui } = this.modalData;
    if (!defender?.actor) return this.modalData;

    ui.hasFatiguePoints =
      (this.defenderActor.system?.characteristics?.secondaries?.fatigue?.value ?? 0) > 0;

    // Weapons refresh
    const weapons = this.defenderActor.system?.combat?.weapons ?? [];
    defender.combat.unarmed = weapons.length === 0;

    // Ensure weaponUsed is valid before computing blockValue
    if (!defender.combat.unarmed) {
      const exists = weapons.some(w => (w?._id ?? w?.id) === defender.combat.weaponUsed);
      if (!exists) defender.combat.weaponUsed = weapons[0]?._id ?? weapons[0]?.id ?? '';
      defender.combat.weapon =
        weapons.find(w => (w?._id ?? w?.id) === defender.combat.weaponUsed) ?? weapons[0];
    } else {
      defender.combat.weapon = undefined;
      defender.combat.weaponUsed = '';
    }

    // Base values
    ui.dodgeValue =
      Number(this.defenderActor.system?.combat?.dodge?.final?.value ?? 0) || 0;
    // Esquiva de Artes Marciales: en modo desarmado (sin arma real equipada) el
    // perfil de AM aporta su bono a la esquiva. El helper aplica el gate.
    ui.dodgeValue += martialArtsDodgeBonus(this.defenderActor);

    ui.blockValue = defender.combat.unarmed
      ? Number(this.defenderActor.system?.combat?.block?.final?.value ?? 0) || 0
      : Number(defender.combat.weapon?.system?.block?.final?.value ?? 0) || 0;

    // Shields list + evaluated value from abilityFormula using FormulaEvaluator
    const shields = this.defenderActor.system?.combat?.supernaturalShields ?? [];

    ui.supernaturalShields = shields.map(sh => {
      const _id = DefenseConfigurationDialog._getDocId(sh);
      const formula = String(sh?.system?.abilityFormula ?? '').trim();
      const value = DefenseConfigurationDialog._evaluateShieldFormula(
        formula,
        this.defenderActor
      );

      // Normalize shape so HBS can always use sh._id
      return {
        ...sh,
        _id,
        value
      };
    });

    // Ensure selected shield exists and compute current shieldValue
    if (ui.supernaturalShields.length > 0) {
      const selectedId = String(defender.combat.supernaturalShieldUsed ?? '');
      const selected =
        ui.supernaturalShields.find(s => String(s._id ?? '') === selectedId) ??
        ui.supernaturalShields[0];

      defender.combat.supernaturalShieldUsed = selected?._id ?? '';
      ui.shieldValue = Number(selected?.value ?? 0) || 0;
    } else {
      defender.combat.supernaturalShieldUsed = '';
      ui.shieldValue = 0;
    }

    // Gasto de Cansancio: +15 por punto (max 2/asalto) a Parada/Esquiva (combate
    // fisico). NO aplica a Escudos sobrenaturales (se filtra al tirar). Dominio
    // del Esfuerzo (+5) no modelado.
    const fatiguePool = Number(
      this.defenderActor.system?.characteristics?.secondaries?.fatigue?.value ?? 0
    );
    const maxFatigue = Math.min(fatiguePool, maxFatiguePerAction(this.defenderActor));
    const curFatigue = Math.min(maxFatigue, Math.max(0, Number(defender.combat.fatigueUsed) || 0));
    defender.combat.fatigueUsed = curFatigue;
    ui.hasFatiguePoints = fatiguePool > 0;
    ui.fatigueOptions = Array.from({ length: maxFatigue + 1 }, (_, i) => ({
      value: i,
      label: i ? `+${i * 15}` : '0',
      selected: i === curFatigue
    }));

    // F6.3: tecnicas de Ki INSTANTANEAS de defensa (parada/esquiva) ofrecibles
    // para esta tirada (gastan Ki concentrado al marcarlas). Las ACTIVAS aplican
    // su bono automaticamente en el handler.
    defender.kiInstant = usableInstantCombatTechniques(this.defenderActor, 'defense');

    return this.modalData;
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find('.send-defense').on('click', async ev => {
      ev.preventDefault();
      const raw = ev.currentTarget.dataset.type;
      const type = raw === 'block' ? 'block' : raw === 'shield' ? 'shield' : 'dodge';
      await this._sendDefenseToChat(type);
    });
  }

  static _pickBestDefenseTab(modalData) {
    const actor = modalData?.defender?.actor;
    if (!actor) return 'dodge';

    const dodge = Number(actor.system?.combat?.dodge?.final?.value ?? 0) || 0;

    const weapons = actor.system?.combat?.weapons ?? [];
    const selectedWeaponId = modalData?.defender?.combat?.weaponUsed;
    const weapon =
      weapons.find(w => String(w?._id ?? w?.id) === String(selectedWeaponId ?? '')) ??
      weapons[0];

    const block = weapon
      ? Number(weapon.system?.block?.final?.value ?? 0) || 0
      : Number(actor.system?.combat?.block?.final?.value ?? 0) || 0;

    const shields = actor.system?.combat?.supernaturalShields ?? [];
    let bestShield = 0;

    for (const sh of shields) {
      const f = String(sh?.system?.abilityFormula ?? '').trim();
      const v = DefenseConfigurationDialog._evaluateShieldFormula(f, actor);
      if (v > bestShield) bestShield = v;
    }

    if (bestShield >= dodge && bestShield >= block) return 'shield';
    if (block >= dodge) return 'block';
    return 'dodge';
  }

  static _evaluateShieldFormula(formula, actor) {
    const v = FormulaEvaluator.evaluate(formula, actor);
    return Number(v ?? 0) || 0;
  }

  _getTargetKeys() {
    const actorUuid = this.defenderActor?.uuid ?? '';
    const tokenDocOrToken = this.modalData?.defender?.token ?? null;
    const tokenUuid = tokenDocOrToken?.document?.uuid ?? tokenDocOrToken?.uuid ?? '';
    return { actorUuid, tokenUuid };
  }

  async _sendDefenseToChat(type) {
    const actor = this.defenderActor;
    if (!actor) return ui.notifications?.warn('Defender no encontrado.');

    const { defender, attackData } = this.modalData;
    const combat = defender?.combat ?? {};
    const weapon = combat.weapon;

    try {
      // NOW we claim rolling: user is actually sending a defense
      if (!this._claimed && this.modalData?.messageId) {
        const { actorUuid, tokenUuid } = this._getTargetKeys();

        await updateAttackTargetsFlag(this.modalData.messageId, {
          actorUuid,
          tokenUuid,
          state: 'rolling',
          rolledBy: game.user.id,
          updatedAt: Date.now()
        });

        this._claimed = true;
      }

      this.modalData.defenseSent = true;
      setTimeout(() => this.render(), 0);

      const vis = getChatVisibilityOptions();

      // Shield value is ALWAYS evaluated from FormulaEvaluator using selected shield
      let shieldValue = 0;
      let shieldItemId = '';
      if (type === 'shield') {
        const shields = this.defenderActor.system?.combat?.supernaturalShields ?? [];
        const wantedId = String(combat.supernaturalShieldUsed ?? '');

        const selected =
          shields.find(
            s => String(DefenseConfigurationDialog._getDocId(s)) === wantedId
          ) ?? shields[0];

        if (selected) {
          const formula = String(selected.system?.abilityFormula ?? '').trim();
          shieldValue = DefenseConfigurationDialog._evaluateShieldFormula(
            formula,
            this.defenderActor
          );
          shieldItemId = DefenseConfigurationDialog._getDocId(selected);
        }
      }

      // Esquiva de Artes Marciales: en modo desarmado (sin arma real equipada) el
      // bono del perfil de AM se suma a la base/final de la esquiva (el helper
      // aplica el gate). Asi la maestria (naturalBase>=200) tambien lo recoge.
      const maDodge = type === 'dodge' ? martialArtsDodgeBonus(actor) : 0;

      // Defense ability (for shield, base and final are the evaluated formula)
      const defenseAbility = AbilityData.builder()
        .naturalBase(
          type === 'block'
            ? combat.unarmed
              ? actor.system?.combat?.block?.base?.value ?? 0
              : weapon?.system?.block?.base?.value ?? 0
            : type === 'shield'
            ? shieldValue
            : (actor.system?.combat?.dodge?.base?.value ?? 0) + maDodge
        )
        .finalBase(
          type === 'block'
            ? combat.unarmed
              ? actor.system?.combat?.block?.final?.value ?? 0
              : weapon?.system?.block?.final?.value ?? 0
            : type === 'shield'
            ? shieldValue
            : (actor.system?.combat?.dodge?.final?.value ?? 0) + maDodge
        )
        .build();

      // Mastery based on naturalBase
      const die =
        (defenseAbility.naturalBase ?? 0) >= 200
          ? actor.system?.general?.diceSettings?.abilityMasteryDie?.value ?? '1d100'
          : actor.system?.general?.diceSettings?.abilityDie?.value ?? '1d100';

      const mod = Number(combat?.modifier ?? 0);
      const multiPenalty = Number(combat?.multipleDefensesPenalty ?? 0);
      const baseValue = Number(defenseAbility.finalBase ?? 0);

      // Defense-type specific rules (mirrors RULES in DefenseStrategies.js):
      // supernatural shields neither apply the multiple-defenses penalty nor
      // stack into the defenses counter. Block and dodge do both.
      const isShieldDefense = type === 'shield';
      const effectiveMultiPenalty = isShieldDefense ? 0 : multiPenalty;

      // Resistir el golpe: -80 a la habilidad de defensa (sólo cuando es
      // parar/esquivar; no aplica a escudos). El suelo a 0 se enforza
      // tras el roll vía Math.max para mantener la semántica RAW: el
      // dado se tira igual, pero el total efectivo no baja de 0.
      //
      // RAW: los seres de acumulación (defenseType='resistance') y las
      // masas (defenseType='mass') no pueden encajar el golpe. Esta
      // regla queda automáticamente cubierta aguas arriba en
      // defendActionHandler / defendTargetActionHandler, que enrutan
      // ambos tipos a sendAccumulationZeroDefense y NUNCA abren este
      // dialog, así que aquí no hace falta guarda adicional.
      const resistTheHit = !!combat?.resistTheHit && !isShieldDefense;
      const resistPenalty = resistTheHit ? -80 : 0;

      // ── F6.3: Bonos de combate de Tecnicas de Ki (parada/esquiva) ─────
      // Las activas aplican su bono automaticamente; las instantaneas marcadas
      // gastan Ki concentrado. No aplica a escudos sobrenaturales.
      let kiDefenseBonus = 0;
      const kiAppliedBy = [];
      if (!isShieldDefense) {
        const kiAuto = activeTechniqueCombatBonuses(actor);
        const autoStat =
          type === 'block' ? Number(kiAuto.block) || 0 : Number(kiAuto.dodge) || 0;
        if (autoStat) {
          kiDefenseBonus += autoStat;
          kiAppliedBy.push('activa');
        }

        const kiInstantSel = combat?.kiInstant ?? {};
        const kiInstantList = usableInstantCombatTechniques(actor, 'defense');
        for (const tech of kiInstantList) {
          if (kiInstantSel[tech.id] !== true) continue;
          const stat = type === 'block' ? Number(tech.block) || 0 : Number(tech.dodge) || 0;
          if (!stat) continue;
          // `free` = porción Tipo Acción de una mantenida ya pagada al activar: no re-gasta Ki.
          const ok = tech.free ? true : await actor.useTechnique(tech.id);
          if (!ok) continue;
          kiDefenseBonus += stat;
          kiAppliedBy.push(tech.name);
        }
      }

      // Gasto de Cansancio: +15 por punto (max 2/asalto), solo Parada/Esquiva
      // (combate fisico); NO en Escudos sobrenaturales. Se consume tras la tirada.
      const fatiguePool = Number(actor.system?.characteristics?.secondaries?.fatigue?.value ?? 0);
      const fatigueUsed = isShieldDefense
        ? 0
        : Math.max(0, Math.min(Number(combat?.fatigueUsed) || 0, maxFatiguePerAction(actor), fatiguePool));
      const fatigueBonus = fatigueUsed * 15;

      // Split each contribution into its own term so the Foundry roll tooltip
      // shows the breakdown: defense ability, situational modifier, the
      // multiple-defenses penalty, the resist-the-hit penalty and fatigue.
      // Omite los terminos a 0 para no ensuciar el chat (cada uno trae su signo).
      const formula = buildRollFormula(die, [
        baseValue,
        mod,
        effectiveMultiPenalty,
        resistPenalty,
        kiDefenseBonus,
        fatigueBonus
      ]);
      const roll = new ABFFoundryRoll(formula, actor.system);
      await roll.evaluate({ async: true });

      // Speaker
      const tokenDocOrToken = defender?.token ?? null;
      const tokenForSpeaker = tokenDocOrToken?.object ?? tokenDocOrToken ?? null;
      const tokenName =
        tokenForSpeaker?.name ?? tokenForSpeaker?.document?.name ?? actor.name;
      const speaker = tokenForSpeaker
        ? { ...ChatMessage.getSpeaker({ token: tokenForSpeaker }), alias: tokenName }
        : ChatMessage.getSpeaker({ actor });

      const defenseLabel = game.i18n.localize(
        'macros.combat.dialog.defending.defend.title'
      );

      // Append dialog-level contributions to the flavor so the chat
      // shows where each modifier came from (mirrors the attack roll
      // breakdown). Active Effect contributions are appended by the
      // separate AE traceability hook on top of this.
      const defenseContribs = [];
      if (resistPenalty !== 0) {
        defenseContribs.push(`Resiste el golpe (${resistPenalty})`);
      }
      if (maDodge > 0) {
        defenseContribs.push(`Artes Marciales (+${maDodge})`);
      }
      if (fatigueBonus > 0) {
        defenseContribs.push(`Cansancio (+${fatigueBonus})`);
      }
      if (kiDefenseBonus !== 0) {
        const sign = kiDefenseBonus > 0 ? '+' : '';
        const label = game.i18n.localize('macros.combat.dialog.combatMod.kiTechnique.title');
        const tag = kiAppliedBy.length ? ` [${kiAppliedBy.join(', ')}]` : '';
        defenseContribs.push(`${label} (${sign}${kiDefenseBonus})${tag}`);
      }
      const flavorParts = [defenseLabel];
      if (defenseContribs.length) {
        flavorParts.push(`Mods: ${defenseContribs.join(', ')}`);
      }

      await roll.toMessage({
        speaker,
        flavor: flavorParts.join(' — '),
        rollMode: vis.rollMode,
        flags: {
          animabf: {
            // Carries which exact stat backed this defense roll (block /
            // dodge / shield), so the AE traceability hook can surface
            // only the contributions that affected this specific stat.
            rollAttribute: type
          }
        }
      });

      // Armor
      const armorType = attackData?.armorType;
      const taFinal =
        armorType != null
          ? actor.system?.combat?.totalArmor?.at?.[armorType]?.value ?? 0
          : 0;
      // TA solo de armaduras duras (suelo para la reduccion de TA blanda de Hakyoukuken).
      const hardTaFinal =
        armorType != null
          ? actor.system?.combat?.totalArmor?.hardAt?.[armorType]?.value ?? 0
          : 0;

      const defenseData = ABFDefenseData.builder()
        .defenseAbility(Math.max(0, roll.total))
        .armor(taFinal)
        .hardArmor(hardTaFinal)
        .inmodifiableArmor(false)
        .defenseType(type)
        .defenderId(actor.id)
        .defenderTokenId(defender?.token?.id ?? '')
        .weaponId(weapon?._id ?? weapon?.id ?? '')
        .shieldId(shieldItemId)
        .resistTheHit(resistTheHit)
        .build();

      const combatResult = computeCombatResult(attackData, defenseData);

      const damageFinal = Number(
        combatResult?.damageFinal ??
          combatResult?.damage?.final ??
          combatResult?.finalDamage ??
          combatResult?.damage ??
          0
      );

      // counterAttackConsumed: estado del boton "Contraatacar" del chat (motor de
      // contraataques). Arranca en false; el handler lo marca true al lanzarse.
      const resultForChat = { ...combatResult, damageFinal, counterAttackConsumed: false };

      const content = await (foundry.applications?.handlebars?.renderTemplate ?? renderTemplate)(Templates.Chat.CombatResult, {
        combatResult: resultForChat,
        defenderId: actor.id,
        defenderTokenId: defender?.token?.id ?? ''
      });

      await ChatMessage.create({
        content,
        speaker,
        ...vis,
        flags: {
          animabf: {
            kind: 'combatResult',
            result: resultForChat,
            // Persist the aimed flag so the critical resolver can skip the
            // location roll when the attack was aimed. Also persist
            // maneuverWasUnarmed so the relational-grapple flag setter
            // (in resolveManeuverOpposedCheck) can decide whether the
            // resulting Presa allows Aplastar later.
            attackData: {
              attackerId: attackData?.attackerId ?? '',
              aimed: !!attackData?.aimed,
              aimedWhere: attackData?.aimedWhere ?? '',
              maneuverSlug: attackData?.maneuverSlug ?? '',
              maneuverWasUnarmed: !!attackData?.maneuverWasUnarmed,
              delayRounds: Number(attackData?.delayRounds ?? 0) || 0
            },
            attacker: {
              actorId: attackData?.attackerId ?? '',
              // Token del atacante (uuid preferido): el control enfrentado de maniobras debe
              // resolver el TOKEN (sin vincular incluido), no el actor base, que pierde los
              // overrides del token (artes, AE, caracteristicas). Best-effort: '' si no hay token.
              tokenId:
                this.modalData.attacker?.token?.document?.uuid ??
                this.modalData.attacker?.token?.uuid ??
                this.modalData.attacker?.token?.id ??
                ''
            },
            defender: {
              actorId: actor.id,
              tokenId: defender?.token?.id ?? ''
            },
            damageControl: { appliedOnce: false, apps: [] }
          }
        }
      });

      // Update same entry (uuid keys) so rolling becomes done
      this._resolved = true;
      const { actorUuid, tokenUuid } = this._getTargetKeys();

      await updateAttackTargetsFlag(this.modalData.messageId, {
        actorUuid,
        tokenUuid,
        state: 'done',
        rolledBy: game.user.id,
        defenseResult: defenseData.toJSON?.() ?? defenseData,
        updatedAt: Date.now()
      });

      // Increment the defender's defenses counter so the next defense in this
      // round gets the right multi-defense penalty. The actor method respects
      // the `keepAccumulating` flag; ABFCombat hooks reset the counter when
      // the round changes. Supernatural-shield defenses do NOT stack (mirrors
      // RULES.supernaturalShield.stackDefense in DefenseStrategies.js).
      //
      // Resistir el golpe (RAW): aplica el penalizador de defensas múltiples
      // acumulado hasta este momento, pero NO incrementa el contador para la
      // siguiente defensa del asalto. Confirmed by table consensus: the
      // defender "no gasta" una defensa real al resistir.
      const shouldAccumulate = !isShieldDefense && !resistTheHit;
      if (shouldAccumulate && typeof actor?.accumulateDefenses === 'function') {
        actor.accumulateDefenses(!!combat?.accumulateDefenses);
      }

      // Consume el Cansancio gastado en la defensa (reduce el pool).
      if (fatigueUsed > 0) await actor.applyFatigue(fatigueUsed);

      await this.close();
    } catch (err) {
      console.error(err);
      ui.notifications?.error('No se pudo enviar la defensa al chat.');
    } finally {
      this.modalData.defenseSent = false;
      if (this.rendered) setTimeout(() => this.render(), 0);
    }
  }

  async _updateObject(_event, formData) {
    const expanded = foundry.utils.expandObject(formData);

    this.modalData = foundry.utils.mergeObject(this.modalData, expanded, {
      inplace: false,
      overwrite: true,
      insertKeys: true,
      insertValues: true
    });

    setTimeout(() => this.render(), 0);
  }

  async render(force, options) {
    const firstRealRender = !this.rendered;

    if (firstRealRender && this.modalData?.messageId && this.defenderActor) {
      try {
        const msg = game.messages.get(this.modalData.messageId);
        const targets = msg?.getFlag(game.animabf.id, 'targets') ?? [];

        const { actorUuid, tokenUuid } = this._getTargetKeys();

        const entry =
          targets.find(t => t.tokenUuid === tokenUuid) ??
          targets.find(t => t.actorUuid === actorUuid);

        // Store previous state for rollback ONLY if we later claim rolling
        this._initialState = entry?.state ?? null;

        // IMPORTANT:
        // Do NOT claim rolling here. Opening the dialog must not add the state chip.
        this._claimed = false;
      } catch (e) {
        console.warn('[ABF] render init failed:', e);
      }
    }

    return super.render(force, options);
  }

  async close(options) {
    if (options?.force) return super.close(options);

    if (
      this._claimed &&
      !this._resolved &&
      this.modalData?.messageId &&
      this.defenderActor
    ) {
      try {
        const msg = game.messages.get(this.modalData.messageId);
        const targets = msg?.getFlag(game.animabf.id, 'targets') ?? [];

        const { actorUuid, tokenUuid } = this._getTargetKeys();

        const entry =
          targets.find(t => t.tokenUuid === tokenUuid) ??
          targets.find(t => t.actorUuid === actorUuid);

        const current = entry?.state ?? null;

        if (current !== 'done') {
          await updateAttackTargetsFlag(this.modalData.messageId, {
            actorUuid,
            tokenUuid,
            state: this._initialState,
            updatedAt: Date.now()
          });
        }
      } catch (e) {
        console.warn('[ABF] rollback failed:', e);
      }
    }

    return super.close(options);
  }
}
