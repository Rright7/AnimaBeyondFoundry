import { Templates } from '../utils/constants';
import { ABFConfig } from '../ABFConfig';
import { getAimedPenalty, getAimedZones } from '../combat/criticalTables.js';
import { composeAimedPenalty } from '../equipment/qualities/composeWeaponEffects.js';
import { resolveManeuverAttackPenalty } from '../combat/maneuvers/resolveManeuverPenalty.js';
import { ABFAttackData } from '../combat/ABFAttackData';
import { getSnapshotTargets } from '../actor/utils/getSnapshotTargets.js';
import { playWeaponAttackAnimation } from '../animations/combatAnimations.js';
import {
  activeTechniqueCombatBonuses,
  usableInstantCombatTechniques
} from '../domine/techniques/techniqueCombatBonuses.js';
import {
  martialArtUnarmedDamage,
  martialArtsAdditionalAttack
} from '../combat/martialArts/martialArtCatalog.js';
import {
  martialArtCritBonus,
  martialArtArmorReduction,
  martialArtAllowedAttackTables,
  martialArtGrantsFullManeuverDamage,
  martialArtCausesDirectBleeding
} from '../combat/martialArts/martialArtSpecials.js';
import { maxFatiguePerAction } from '../combat/utils/fatigue.js';
import { buildRollFormula } from '../combat/utils/buildRollFormula.js';
import { arePointBlank, pointBlankAttackBonus } from '../combat/pointBlank.js';
import { massActorAttackBonus, isMassActor, massAdjustedDamage } from '../combat/massCombat.js';
///dialogs/AttackConfigurationDialog.js
///actor/utils/getSnapshotTargets.js

export class AttackConfigurationDialog extends FormApplication {
  constructor(object = {}, options = {}) {
    // Expect object: { attacker: TokenDocument, weaponId?: string, weapon?: Item }
    const base = AttackConfigurationDialog._buildInitialData(object);
    super(base, options);
    this.modalData = base;
    this.render(true);
  }

  static _buildInitialData({ attacker, weaponId, weapon, options = {}, targets, maneuverSlug, maneuverItemName, aimed, aimedZone, delayRounds, chooseTargets, chosenPenalty, causesDamage, counterBonus, counterDamageBonus, isCounterAttack, onCounterAttackSent }) {
    if (!attacker || !attacker.actor) {
      ui.notifications?.error('AttackConfigurationDialog: attacker is required');
      return { allowed: false };
    }

    const attackerActor = attacker.actor;

    const resolvedWeapon =
      weapon ?? (weaponId ? attackerActor.items.get(weaponId) : undefined);

    if (!resolvedWeapon) {
      ui.notifications?.warn(game.i18n.localize('macros.combat.dialog.weapon.notFound'));
    }

    // Fallback targets snapshot (reusing shared helper)
    const fallbackSnapshot = getSnapshotTargets();

    const isOwner = attackerActor.testUserPermission?.(
      game.user,
      CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
    );

    // A maneuver may be performed with any of the actor's weapons, so when the
    // dialog is opened from a maneuver we do NOT lock the weapon: the resolved
    // (equipped) weapon is only the default selection and the player can pick
    // another from the dropdown. A counter-attack is the same case: the weapon
    // was auto-picked (equipped/first), so the defender must be able to choose
    // which weapon to counter with. A plain weapon attack keeps the weapon locked
    // (the player already chose it by clicking that weapon's button).
    const lockWeapon = !!resolvedWeapon && !maneuverSlug && !isCounterAttack;

    return {
      ui: {
        isGM: !!game.user?.isGM,
        hasFatiguePoints:
          (attackerActor.system?.characteristics?.secondaries?.fatigue?.value ?? 0) > 0,
        weaponHasSecondaryCritic: undefined,
        lockedWeapon: lockWeapon
      },
      attacker: {
        token: attacker,
        actor: attackerActor,
        combat: {
          fatigueUsed: 0,
          modifier: 0,
          // Contraataque: el bono de margen va en su PROPIO termino (no en el
          // modificador editable, para no perderlo si el jugador edita ese campo).
          // _sendAttack lo suma a la formula y lo desglosa en el flavor.
          counterBonus: Number(counterBonus) || 0,
          // Daño extra de contraataque por Arte Marcial (Aikido: N x mod FUE del
          // agresor). Termino propio, se suma al daño en _sendAttack y se desglosa.
          counterDamageBonus: Number(counterDamageBonus) || 0,
          // Modo contraataque: habilita los bonos "solo-contraataque" (Habilidad de
          // Contraataque) en auto (tecnicas activas) y en los checkbox (instantaneas).
          isCounterAttack: !!isCounterAttack,
          unarmed:
            !resolvedWeapon && (attackerActor.system?.combat?.weapons?.length ?? 0) === 0,
          weaponUsed: resolvedWeapon?._id,
          criticSelected: undefined,
          weapon: resolvedWeapon,
          projectile: { value: false, type: '' },
          damage: { special: 0, final: 0 },
          critDamageBonus: attackerActor.system.general.modifiers.critDamageBonus?.final?.value ?? 0,
          automaticCrit: !!(attackerActor.system.general.modifiers.automaticCrit?.value),
          // Aimed attack toggle + chosen zone. When a maneuver opens the
          // dialog pre-aimed, these come pre-filled from the `aim` block and
          // the UI shows them locked.
          aimed: !!aimed,
          aimedZone: String(aimedZone ?? ''),
          // For maneuvers with damageAllowed=true, the attacker decides
          // whether to inflict damage. OFF by default per RAW. The
          // checkbox is only shown in the dialog when the maneuver
          // supports it. Inmovilizar a distancia lo prefija desde la opción
          // elegida en la tarjeta (-80 sin daño / -50 con daño).
          causesDamage: !!causesDamage
        },
        distance: { value: 0, enable: false, check: false }
      },
      targets: Array.isArray(targets) && targets.length ? targets : fallbackSnapshot,
      maneuver: maneuverSlug
        ? (() => {
            const def = game.animabf?.maneuvers?.get?.(maneuverSlug);
            return {
              slug: maneuverSlug,
              itemName: maneuverItemName ?? maneuverSlug,
              damageAllowed: !!def?.damageAllowed,
              damageHalvedIfApplied: !!def?.damageHalvedIfApplied,
              damageMandatory: !!def?.dealsMandatoryDamage,
              delayRounds: Number(delayRounds ?? 0) || 0,
              damageMultiplier: Number(def?.damageMultiplier ?? 1) || 1,
              optionalPenalty: Number(def?.optionalPenalty ?? 0) || 0,
              chooseTargets: !!chooseTargets,
              chosenPenalty: Number(chosenPenalty ?? 0) || 0,
              damageDelta: Number(def?.damageDelta ?? 0) || 0
            };
          })()
        : null,
      aim: aimed
        ? { active: true, zone: String(aimedZone ?? '') }
        : null,
      allowed: options?.allowed ?? isOwner ?? false,
      config: ABFConfig,
      attackSent: false,
      // Contraataque: callback que marca el resultado como consumido. Se invoca
      // SOLO cuando el ataque se envia de verdad (no al abrir el dialogo), para que
      // cerrar sin atacar conserve el boton del mensaje de resultado.
      onCounterAttackSent: typeof onCounterAttackSent === 'function' ? onCounterAttackSent : null
    };
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ['animabf-dialog', 'attack-config-dialog'],
      submitOnChange: true,
      closeOnSubmit: false,
      resizable: true,
      width: null,
      height: null,
      template: Templates.Dialog.Combat.AttackConfigDialog,
      title: game.i18n.localize('macros.combat.dialog.modal.attack.title')
    });
  }

  get attackerActor() {
    return this.modalData?.attacker?.token?.actor;
  }

  getData() {
    // Compute weapon, projectile and damage
    const { attacker, ui } = this.modalData;
    if (!attacker?.token) return this.modalData;

    ui.hasFatiguePoints =
      this.attackerActor.system.characteristics.secondaries.fatigue.value > 0;

    const { weapons } = this.attackerActor.system.combat;
    const combat = attacker.combat;

    // Apuntado: si esta activo pero aun no se ha tocado el desplegable, el <select>
    // muestra la PRIMERA zona (la de mayor penalizador) pero combat.aimedZone sigue
    // vacio, asi que el penalizador no se aplicaba (bug del "ojo", primera opcion).
    // Commitea la zona mostrada para que coincida lo visto con lo aplicado.
    if (combat.aimed && !combat.aimedZone) {
      combat.aimedZone = getAimedZones()[0]?.id ?? '';
    }

    // Expose the full weapon list so the template can render a picker when the
    // weapon is not locked (e.g. a maneuver, where any weapon may be used).
    ui.weapons = weapons ?? [];

    // If locked, keep the resolved weapon; otherwise resolve from current id
    const weapon = ui.lockedWeapon
      ? combat.weapon
      : weapons.find(w => w._id === combat.weaponUsed);

    combat.unarmed = !weapon;

    if (!weapon) {
      combat.weapon = undefined;
      combat.projectile = { value: false, type: '' };
      // Daño desarmado: si hay Arte Marcial, el MAYOR Daño Base entre las artes
      // conocidas + el bono de daño de las Avanzadas; si no, el brawl 10 + FUE.
      const brawl =
        10 + this.attackerActor.system.characteristics.primaries.strength.mod;
      const ma = martialArtUnarmedDamage(this.attackerActor);
      // Con Arte Marcial el Dano Base del arte ES el dano (puede usar POD, p.ej. Tai Chi):
      // no aplicar el suelo brawl (10+FUE), que pisaria POD con FUE. El brawl solo cuenta
      // para el desarmado SIN arte.
      const base = ma.base !== null ? ma.base : brawl;
      combat.damage.final = (combat.damage.special ?? 0) + base + ma.bonus;
    } else {
      combat.weapon = weapon;
      combat.weaponUsed = weapon._id;
      // Modo del ataque (proyectil o melee): lo decide el boton de lanzamiento
      // (mode 'ranged' = Lanzar/Disparar, 'melee' = Atacar). Sin modo (macro/contraataque/
      // maniobra) cae al default por isRanged del arma. Ya no hay checkbox: el modo manda.
      const attackMode = this.modalData?.mode;
      combat.projectile = {
        value:
          attackMode === 'ranged'
            ? true
            : attackMode === 'melee'
              ? false
              : !!weapon.system?.isRanged?.value,
        type: ''
      };

      if (!combat.criticSelected) {
        combat.criticSelected = weapon.system.critic.primary.value;
      }

      ui.weaponHasSecondaryCritic =
        weapon?.system?.critic?.secondary?.value !==
        game.animabf.weapon.NoneWeaponCritic.NONE;

      // Perfil "Artes Marciales": el atacante elige la TABLA de ataque entre las que sus
      // artes permiten (Dumah FIL/PEN, Velez ENE), no solo CON. 'impact' siempre disponible.
      if (weapon.system?.isMartialArtsProfile?.value) {
        const tables = martialArtAllowedAttackTables(this.attackerActor);
        if (!tables.includes(combat.criticSelected)) combat.criticSelected = 'impact';
        ui.martialAttackTables = tables.map(value => ({
          value,
          selected: value === combat.criticSelected
        }));
      }

      combat.damage.final =
        (combat.damage.special ?? 0) + (weapon?.system?.damage?.final?.value ?? 0);
    }

    // Ataques adicionales (RAW: 1 por cada 100 de HA final; penalizador por tamano
    // de arma -P20/-M30/-G40 a TODOS los ataques) y gasto de Cansancio (+15 por
    // punto, max 2/asalto; Dominio del Esfuerzo +5 no modelado).
    const ATTACK_SIZE_PENALTY = { small: 20, medium: 30, big: 40 };
    const atkFinal = Number(weapon?.system?.attack?.final?.value ?? 0);
    let sizePenalty = ATTACK_SIZE_PENALTY[weapon?.system?.size?.value] ?? 30;
    let maxAttacks = weapon ? 1 + Math.max(0, Math.floor(atkFinal / 100)) : 1;
    // Con el perfil "Artes Marciales": Kempo reduce el penalizador por ataque
    // adicional (-15/-10) y en Supremo concede un ataque extra (como +100 HA).
    if (weapon?.system?.isMartialArtsProfile?.value) {
      const ma = martialArtsAdditionalAttack(this.attackerActor);
      if (ma.penalty != null) sizePenalty = ma.penalty;
      maxAttacks += ma.extraAttacks;
    }
    const curTotal = Math.min(maxAttacks, Math.max(1, Number(combat.totalAttacks) || 1));
    combat.totalAttacks = curTotal;
    ui.canMultiAttack = maxAttacks > 1;
    ui.attackOptions = Array.from({ length: maxAttacks }, (_, i) => ({
      value: i + 1,
      label: i ? `${i + 1} (-${i * sizePenalty})` : `${i + 1}`,
      selected: i + 1 === curTotal
    }));

    const fatiguePool = Number(
      this.attackerActor.system?.characteristics?.secondaries?.fatigue?.value ?? 0
    );
    const maxFatigue = Math.min(fatiguePool, maxFatiguePerAction(this.attackerActor));
    const curFatigue = Math.min(maxFatigue, Math.max(0, Number(combat.fatigueUsed) || 0));
    combat.fatigueUsed = curFatigue;
    ui.hasFatiguePoints = fatiguePool > 0;
    ui.fatigueOptions = Array.from({ length: maxFatigue + 1 }, (_, i) => ({
      value: i,
      label: i ? `+${i * 15}` : '0',
      selected: i === curFatigue
    }));

    // F6.3: tecnicas de Ki INSTANTANEAS ofrecibles para este ataque (gastan Ki
    // concentrado al marcarlas). Las ACTIVAS aplican su bono automaticamente en
    // el handler, no necesitan UI aqui.
    attacker.kiInstant = usableInstantCombatTechniques(this.attackerActor, 'attack', {
      isCounterAttack: !!attacker.combat?.isCounterAttack
    });

    this.modalData.config = ABFConfig;
    return this.modalData;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('.send-attack').on('click', async ev => {
      ev.preventDefault();
      await this._sendAttack();
    });
  }

  async _sendAttack() {
    const actor = this.attackerActor;
    if (!actor) return ui.notifications?.warn('Actor no encontrado.');
    const combat = this.modalData.attacker?.combat;
    const weapon = combat?.weapon;
    if (!weapon) return ui.notifications?.warn(game.i18n.localize('macros.combat.dialog.weapon.notFound'));

    try {
      this.modalData.attackSent = true;
      setTimeout(() => this.render(), 0);

      const baseAttack = Number(weapon.system.attack?.final?.value ?? 0);

      // Maneuver penalty computed against the SELECTED weapon (not the first
      // equipped one): base/aimed penalty → weapon qualities (Precisa) →
      // non-bludgeoning -40. Changing the weapon in the dropdown changes the
      // penalty correctly. See resolveManeuverAttackPenalty.
      let maneuverPenalty = 0;
      let maneuverAppliedBy = [];
      let maneuverNonImpactExtra = 0;
      if (this.modalData.maneuver?.slug) {
        const def = game.animabf?.maneuvers?.get?.(this.modalData.maneuver.slug);
        const resolved = resolveManeuverAttackPenalty({
          def,
          weapon,
          aimed: !!combat.aimed,
          aimedZone: combat.aimedZone,
          actor,
          isCounterAttack: !!combat.isCounterAttack
        });
        maneuverPenalty = resolved.penalty;
        maneuverAppliedBy = resolved.appliedBy;
        maneuverNonImpactExtra = resolved.nonImpactExtra;
      }

      // Penalización opcional de la maniobra (Lluvia de proyectiles: -50 al
      // elegir blancos dentro del área), activada por el checkbox de la tarjeta.
      if (this.modalData.maneuver?.chooseTargets && this.modalData.maneuver?.optionalPenalty) {
        maneuverPenalty += Number(this.modalData.maneuver.optionalPenalty) || 0;
        maneuverAppliedBy = [...maneuverAppliedBy, 'elegir-blancos'];
      }

      // Inmovilizar a distancia: penalizador a elegir (-80/-50) declarado en la
      // tarjeta; se suma al penalizador de la maniobra.
      if (this.modalData.maneuver?.chosenPenalty) {
        maneuverPenalty += Number(this.modalData.maneuver.chosenPenalty) || 0;
        maneuverAppliedBy = [...maneuverAppliedBy, 'inmovilizar'];
      }

      // Ataque apuntado: when active, apply the Tabla 45 penalty for the
      // chosen zone. Maneuvers that preload aimed pass the penalty through
      // `maneuverPenalty`, so for those we skip this branch (otherwise we
      // would double-count).
      //
      // The weapon's qualities can modify the penalty (e.g. Precisa halves
      // it for melee). The registry composer runs every applicable hook
      // and reports which qualities took effect so chat can show them.
      let aimedPenalty = 0;
      let aimedAppliedBy = [];
      if (combat.aimed && combat.aimedZone && !this.modalData.maneuver?.slug) {
        const rawAimed = Number(getAimedPenalty(combat.aimedZone) ?? 0);
        const composed = composeAimedPenalty(rawAimed, {
          weapon,
          actor,
          aimedZone: combat.aimedZone
        });
        aimedPenalty = composed.penalty;
        aimedAppliedBy = composed.appliedBy;
      }
      // Kept as a boolean for the chat-flavor breakdown below; will be
      // generalized once more qualities feed into appliedBy.
      const aimedPreciseApplied = aimedAppliedBy.includes('precise');

      // Crítico secundario: -10 when the player picks the weapon's secondary
      // critic instead of the primary one.
      let secondaryCritPenalty = 0;
      const primaryCritic = weapon.system?.critic?.primary?.value;
      const secondaryCritic = weapon.system?.critic?.secondary?.value;
      if (
        combat.criticSelected &&
        secondaryCritic &&
        secondaryCritic !== '-' &&
        combat.criticSelected === secondaryCritic &&
        combat.criticSelected !== primaryCritic
      ) {
        secondaryCritPenalty = -10;
      }

      // ── F6.3: Bonos de combate de Tecnicas de Ki ──────────────────────
      // Activas (mantenidas/sostenidas): su bono se aplica automaticamente.
      // Instantaneas marcadas en el dialogo: gastan Ki concentrado al usarse.
      const kiAuto = activeTechniqueCombatBonuses(actor, {
        isCounterAttack: !!combat.isCounterAttack
      });
      let kiAttackBonus = Number(kiAuto.attack) || 0;
      let kiDamageBonus = Number(kiAuto.damage) || 0;
      const kiAppliedBy = [];
      if (kiAuto.attack || kiAuto.damage) kiAppliedBy.push('activa');

      const kiInstantSel = combat.kiInstant ?? {};
      const kiInstantList = usableInstantCombatTechniques(actor, 'attack', {
        isCounterAttack: !!combat.isCounterAttack
      });
      for (const tech of kiInstantList) {
        if (kiInstantSel[tech.id] !== true) continue;
        // `free` = porción Tipo Acción de una mantenida ya pagada al activar: no re-gasta Ki.
        const ok = tech.free ? true : await actor.useTechnique(tech.id);
        if (!ok) continue;
        kiAttackBonus += Number(tech.attack) || 0;
        kiDamageBonus += Number(tech.damage) || 0;
        kiAppliedBy.push(tech.name);
      }
      // Ataques adicionales (RAW): penalizador (Nº-1) x tamano de arma, igual a
      // TODOS los ataques. maxAtaques = 1 + floor(HA_final/100).
      const ATTACK_SIZE_PENALTY = { small: 20, medium: 30, big: 40 };
      let sizePenalty = ATTACK_SIZE_PENALTY[weapon.system?.size?.value] ?? 30;
      let maxAttacks = 1 + Math.max(0, Math.floor(Number(weapon.system?.attack?.final?.value ?? 0) / 100));
      // Kempo (perfil "Artes Marciales"): penalizador reducido + ataque extra en Supremo.
      if (weapon.system?.isMartialArtsProfile?.value) {
        const ma = martialArtsAdditionalAttack(actor);
        if (ma.penalty != null) sizePenalty = ma.penalty;
        maxAttacks += ma.extraAttacks;
      }
      const totalAttacks = Math.min(maxAttacks, Math.max(1, Number(combat.totalAttacks) || 1));
      const additionalAttacksPenalty = -(totalAttacks - 1) * sizePenalty;

      // Cansancio gastado: +15 por punto (max 2/asalto). Se consume tras la tirada.
      const fatiguePool = Number(actor.system?.characteristics?.secondaries?.fatigue?.value ?? 0);
      const fatigueUsed = Math.max(0, Math.min(Number(combat.fatigueUsed) || 0, maxFatiguePerAction(actor), fatiguePool));
      const fatigueBonus = fatigueUsed * 15;

      const editableMod = Number(combat.modifier ?? 0);
      const counterBonusValue = Number(combat.counterBonus ?? 0);
      // A bocajarro: <1 m / adyacente, AUTOCALCULADO con la metrica de la escena
      // (canvas.grid). +30 al ataque SOLO si es disparado; el lanzado no recibe bono.
      const pointBlank = arePointBlank(
        this.modalData?.attacker?.token,
        Array.from(game.user?.targets ?? [])[0]
      );
      const pointBlankBonus = combat.projectile?.value
        ? pointBlankAttackBonus(weapon.system?.shotType?.value, pointBlank)
        : 0;
      // Masa de enemigos: si el atacante es una masa, su bono de HA (Tabla 1 por nº total,
      // mitad si desorganizada) se aplica a TODOS sus ataques, y su Dano Base sube +50%.
      const isMass = isMassActor(actor.system);
      const massBonus = massActorAttackBonus(actor.system);
      const rawBaseDamage = Number(combat.damage?.final ?? weapon.system.damage?.final?.value ?? 0);
      const massedBaseDamage = isMass
        ? massAdjustedDamage(rawBaseDamage, { magic: false })
        : rawBaseDamage;
      // Cada termino por separado para que la formula del chat se vea DESGLOSADA (no un
      // neto), incluido el "Modificador" editable. La suma (= total tirado) es identica.
      const rollTerms = [
        editableMod,
        counterBonusValue,
        maneuverPenalty,
        aimedPenalty,
        secondaryCritPenalty,
        kiAttackBonus,
        additionalAttacksPenalty,
        fatigueBonus,
        pointBlankBonus,
        massBonus
      ];
      // Umbral de maestria (>=200): para el arma-perfil "Artes Marciales" la
      // "habilidad" efectiva es la HA del actor MAS el bono de AM inyectado en su
      // special; para el resto de armas es la HA del actor.
      const masteryBase = weapon.system?.isMartialArtsProfile?.value
        ? Number(actor.system.combat.attack.base.value ?? 0) +
          Number(weapon.system.attack?.special?.value ?? 0)
        : Number(actor.system.combat.attack.base.value ?? 0);
      const die =
        masteryBase >= 200
          ? actor.system.general.diceSettings.abilityMasteryDie.value
          : actor.system.general.diceSettings.abilityDie.value;

      const formula = buildRollFormula(die, [baseAttack, ...rollTerms]);
      const roll = new ABFFoundryRoll(formula, actor.system);
      await roll.evaluate({ async: true });

      // 🔹 Use token speaker (alias = token name) instead of actor
      const tokenDocOrToken = this.modalData?.attacker?.token ?? null; // TokenDocument or Token
      const tokenForSpeaker = tokenDocOrToken?.object ?? tokenDocOrToken ?? null; // Token if on canvas
      const tokenName =
        tokenForSpeaker?.name ?? tokenForSpeaker?.document?.name ?? actor.name;
      const speaker = tokenForSpeaker
        ? { ...ChatMessage.getSpeaker({ token: tokenForSpeaker }), alias: tokenName }
        : ChatMessage.getSpeaker({ actor });

      // Build a short breakdown of the penalties this dialog applied so the
      // chat message shows where each modifier came from (similar to the AE
      // breakdown line in the actor flow).
      const dialogContribs = [];
      // Modificador editable del dialogo: era el unico termino aplicado que no se
      // listaba, lo que hacia parecer que los penalizadores "no iban".
      if (editableMod !== 0) {
        dialogContribs.push(`Modificador (${editableMod > 0 ? '+' : ''}${editableMod})`);
      }
      if (Number(combat.counterBonus) > 0) {
        dialogContribs.push(
          `${game.i18n.localize('macros.combat.dialog.counterBonus.title')} (+${Number(combat.counterBonus)})`
        );
      }
      if (Number(combat.counterDamageBonus) > 0) {
        dialogContribs.push(
          `${game.i18n.localize('macros.combat.dialog.counterDamageBonus.title')} (+${Number(combat.counterDamageBonus)})`
        );
      }
      if (maneuverPenalty !== 0 && this.modalData.maneuver?.itemName) {
        const sign = maneuverPenalty > 0 ? '+' : '';
        const qualityTag = maneuverAppliedBy.length ? ` [${maneuverAppliedBy.join(', ')}]` : '';
        const nonImpactTag = maneuverNonImpactExtra !== 0
          ? ` [no-contundente ${maneuverNonImpactExtra}]`
          : '';
        dialogContribs.push(
          `${this.modalData.maneuver.itemName} (${sign}${maneuverPenalty})${qualityTag}${nonImpactTag}`
        );
      }
      if (aimedPenalty !== 0 && combat.aimedZone) {
        const sign = aimedPenalty > 0 ? '+' : '';
        const zoneKey = `anima.combat.aimedZone.${combat.aimedZone}`;
        const zoneLabel = game.i18n.has(zoneKey) ? game.i18n.localize(zoneKey) : combat.aimedZone;
        const precisaTag = aimedPreciseApplied ? ' [Precisa]' : '';
        dialogContribs.push(`Apuntado: ${zoneLabel} (${sign}${aimedPenalty})${precisaTag}`);
      }
      if (secondaryCritPenalty !== 0) {
        dialogContribs.push(`Crit. secundario (${secondaryCritPenalty})`);
      }
      if (additionalAttacksPenalty !== 0) {
        dialogContribs.push(`${totalAttacks} ataques (${additionalAttacksPenalty})`);
      }
      if (fatigueBonus !== 0) {
        dialogContribs.push(`Cansancio (+${fatigueBonus})`);
      }
      if (pointBlankBonus !== 0) {
        dialogContribs.push(`A bocajarro (+${pointBlankBonus})`);
      }
      if (massBonus !== 0) {
        dialogContribs.push(`Masa de enemigos (+${massBonus})`);
      }
      if (massedBaseDamage !== rawBaseDamage) {
        dialogContribs.push(`Masa daño (+${massedBaseDamage - rawBaseDamage})`);
      }
      if (kiAttackBonus !== 0 || kiDamageBonus !== 0) {
        const label = game.i18n.localize('macros.combat.dialog.combatMod.kiTechnique.title');
        const tag = kiAppliedBy.length ? ` [${kiAppliedBy.join(', ')}]` : '';
        if (kiAttackBonus !== 0) {
          const sign = kiAttackBonus > 0 ? '+' : '';
          dialogContribs.push(`${label} (${sign}${kiAttackBonus})${tag}`);
        }
        if (kiDamageBonus !== 0) {
          const sign = kiDamageBonus > 0 ? '+' : '';
          dialogContribs.push(`${label} daño (${sign}${kiDamageBonus})${tag}`);
        }
      }
      const flavorParts = ['Rolling attack'];
      if (dialogContribs.length) {
        flavorParts.push(`Mods: ${dialogContribs.join(', ')}`);
      }

      await roll.toMessage({
        speaker,
        flavor: flavorParts.join(' — ')
      });

      const attackData = ABFAttackData.builder()
        .attackAbility(roll.total)
        .damage(
          Math.max(
            0,
            massedBaseDamage +
              (this.modalData.maneuver?.damageDelta ?? 0) +
              kiDamageBonus +
              (Number(combat.counterDamageBonus) || 0)
          ) * (this.modalData.maneuver?.damageMultiplier ?? 1)
        )
        .ignoreArmor(!!weapon.system.ignoreArmor?.value)
        // TA reducida del arma + reduccion general de Artes Marciales (Dumah -2/-6).
        .reducedArmor(
          Number(weapon.system.reducedArmor?.final?.value ?? 0) +
            martialArtArmorReduction(actor).general
        )
        // Reduccion SOLO de TA blanda (Hakyoukuken); el resolver no baja de la TA dura.
        .softArmorReduction(martialArtArmorReduction(actor).soft)
        .armorType(combat.criticSelected ?? weapon.system.critic?.primary?.value)
        .damageType(game.animabf.combat.DamageType.NONE)
        .presence(Number(weapon.system.presence?.final?.value ?? 0))
        .isProjectile(!!combat.projectile?.value)
        .projectileType(weapon.system.shotType?.value ?? '')
        .pointBlank(!!combat.projectile?.value && pointBlank)
        .automaticCrit(!!combat.automaticCrit)
        // Bono al nivel del critico por Artes Marciales (Moai Thai/Hakyoukuken siempre;
        // Asakusen solo apuntado; Enuth solo con Inconsciencia).
        .critBonus(
          martialArtCritBonus(actor, {
            aimed: !!combat.aimed,
            maneuverSlug: this.modalData.maneuver?.slug ?? ''
          })
        )
        .critDamageBonus(Number(combat.critDamageBonus ?? 0))
        .attackerId(actor.id)
        .weaponId(weapon.id)
        .weaponName(weapon.name)
        .maneuverSlug(this.modalData.maneuver?.slug ?? '')
        .maneuverItemName(this.modalData.maneuver?.itemName ?? '')
        .maneuverWasUnarmed(!combat.weapon || !!combat.weapon.system?.isUnarmed?.value)
        .delayRounds(this.modalData.maneuver?.delayRounds ?? 0)
        .causesDamage(!!combat.causesDamage)
        // Excepcion de dano completo en maniobra (Grappling Supremo en Presa/Derribo):
        // el resolver no halvea el dano base si esto es true.
        .maneuverFullDamage(
          martialArtGrantsFullManeuverDamage(actor, this.modalData.maneuver?.slug ?? '')
        )
        // Desangramiento directo (Dumah Arcano): cualquier impacto con dano desangra.
        .directBleeding(martialArtCausesDirectBleeding(actor))
        .aimed(!!combat.aimed)
        .aimedWhere(combat.aimedZone || '')
        .targets(this.modalData.targets ?? [])
        .build();

      const attackMsg = await attackData.toChatMessage({ actor, weapon });

      // Animacion del arma AL ATACAR: swing melee del atacante hacia el/los objetivo(s).
      playWeaponAttackAnimation(
        actor.getActiveTokens?.()[0],
        Array.from(game.user?.targets ?? []),
        weapon
      );

      if (attackMsg && this.modalData.maneuver?.slug) {
        await attackMsg.setFlag('animabf', 'maneuverSlug', this.modalData.maneuver.slug);
        await attackMsg.setFlag('animabf', 'maneuverItemName', this.modalData.maneuver.itemName);
      }

      // Contraataque enviado de verdad: ahora si se marca como consumido y se oculta
      // el boton del mensaje de resultado. Si se hubiera cerrado el dialogo sin enviar,
      // el boton seguiria disponible para reintentarlo.
      if (attackMsg && combat.isCounterAttack && typeof this.modalData.onCounterAttackSent === 'function') {
        try {
          await this.modalData.onCounterAttackSent();
        } catch (e) {
          console.error('[ABF] onCounterAttackSent error:', e);
        }
      }

      // Consume el Cansancio gastado (reduce el pool; afecta a acciones futuras).
      if (fatigueUsed > 0) await actor.applyFatigue(fatigueUsed);

      await this.close();
    } catch (err) {
      console.error(err);
      ui.notifications?.error('No se pudo enviar el ataque al chat.');
    } finally {
      this.modalData.attackSent = false;
      if (this.rendered) setTimeout(() => this.render(), 0);
    }
  }

  async _updateObject(event, formData) {
    const wasWeapon = this.modalData.attacker?.combat?.weaponUsed;
    // Prevent weapon changes if locked
    if (this.modalData.ui.lockedWeapon) {
      delete formData['attacker.combat.weaponUsed'];
    }

    this.modalData = foundry.utils.mergeObject(this.modalData, formData);

    if (!this.modalData.ui.lockedWeapon) {
      const curWeapon = this.modalData.attacker?.combat?.weaponUsed;
      if (wasWeapon !== curWeapon) {
        this.modalData.attacker.combat.criticSelected = undefined;
      }
    }

    setTimeout(() => this.render(), 0);
  }
}
