import { Templates } from '../utils/constants';
import { ABFConfig } from '../ABFConfig';
import { getAimedPenalty } from '../combat/criticalTables.js';
import { composeAimedPenalty } from '../equipment/qualities/composeWeaponEffects.js';
import { resolveManeuverAttackPenalty } from '../combat/maneuvers/resolveManeuverPenalty.js';
import { ABFAttackData } from '../combat/ABFAttackData';
import { getSnapshotTargets } from '../actor/utils/getSnapshotTargets.js';
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

  static _buildInitialData({ attacker, weaponId, weapon, options = {}, targets, maneuverSlug, maneuverItemName, aimed, aimedZone, delayRounds, chooseTargets, chosenPenalty, causesDamage }) {
    if (!attacker || !attacker.actor) {
      ui.notifications?.error('AttackConfigurationDialog: attacker is required');
      return { allowed: false };
    }

    const attackerActor = attacker.actor;

    const resolvedWeapon =
      weapon ?? (weaponId ? attackerActor.items.get(weaponId) : undefined);

    if (!resolvedWeapon) {
      ui.notifications?.warn('Arma no encontrada.');
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
    // another from the dropdown. A plain weapon attack keeps the weapon locked
    // (the player already chose it by clicking that weapon's button).
    const lockWeapon = !!resolvedWeapon && !maneuverSlug;

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
      attackSent: false
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
      combat.damage.final =
        (combat.damage.special ?? 0) +
        10 +
        this.attackerActor.system.characteristics.primaries.strength.mod;
    } else {
      combat.weapon = weapon;
      combat.weaponUsed = weapon._id;
      // Preserva el valor existente del checkbox; solo resetea si es undefined
      if (!combat.projectile || combat.projectile.value === undefined) {
        combat.projectile = { value: false, type: '' };
      }

      if (!combat.criticSelected) {
        combat.criticSelected = weapon.system.critic.primary.value;
      }

      ui.weaponHasSecondaryCritic =
        weapon?.system?.critic?.secondary?.value !==
        game.animabf.weapon.NoneWeaponCritic.NONE;

      combat.damage.final =
        (combat.damage.special ?? 0) + (weapon?.system?.damage?.final?.value ?? 0);
    }

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
    if (!weapon) return ui.notifications?.warn('Arma no encontrada.');

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
          actor
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

      const mod =
        Number(combat.modifier ?? 0)
        + maneuverPenalty
        + aimedPenalty
        + secondaryCritPenalty;
      const die =
        actor.system.combat.attack.base.value >= 200
          ? actor.system.general.diceSettings.abilityMasteryDie.value
          : actor.system.general.diceSettings.abilityDie.value;

      const formula = `${die} + ${baseAttack} + ${mod}`;
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
            Number(combat.damage?.final ?? weapon.system.damage?.final?.value ?? 0) +
              (this.modalData.maneuver?.damageDelta ?? 0)
          ) * (this.modalData.maneuver?.damageMultiplier ?? 1)
        )
        .ignoreArmor(!!weapon.system.ignoreArmor?.value)
        .reducedArmor(Number(weapon.system.reducedArmor?.final?.value ?? 0))
        .armorType(combat.criticSelected ?? weapon.system.critic?.primary?.value)
        .damageType(game.animabf.combat.DamageType.NONE)
        .presence(Number(weapon.system.presence?.final?.value ?? 0))
        .isProjectile(!!combat.projectile?.value)
        .automaticCrit(!!combat.automaticCrit)
        .critBonus(0)
        .critDamageBonus(Number(combat.critDamageBonus ?? 0))
        .attackerId(actor.id)
        .weaponId(weapon.id)
        .maneuverSlug(this.modalData.maneuver?.slug ?? '')
        .maneuverItemName(this.modalData.maneuver?.itemName ?? '')
        .maneuverWasUnarmed(!combat.weapon || !!combat.weapon.system?.isUnarmed?.value)
        .delayRounds(this.modalData.maneuver?.delayRounds ?? 0)
        .causesDamage(!!combat.causesDamage)
        .aimed(!!combat.aimed)
        .aimedWhere(combat.aimedZone || '')
        .targets(this.modalData.targets ?? [])
        .build();

      const attackMsg = await attackData.toChatMessage({ actor, weapon });
      if (attackMsg && this.modalData.maneuver?.slug) {
        await attackMsg.setFlag('animabf', 'maneuverSlug', this.modalData.maneuver.slug);
        await attackMsg.setFlag('animabf', 'maneuverItemName', this.modalData.maneuver.itemName);
      }

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

    // Convierte checkbox a booleano
    if (formData['attacker.combat.projectile.value'] !== undefined) {
      formData['attacker.combat.projectile.value'] =
        formData['attacker.combat.projectile.value'] === 'on' ||
        formData['attacker.combat.projectile.value'] === true;
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
