/**
 * Declarative definition of a combat maneuver.
 *
 * Maneuvers come in different shapes (active attack-based, persistent modes,
 * sub-maneuvers of an existing grapple, ...). This base class covers the
 * common "active maneuver with opposed characteristic check" pattern used
 * by Derribo, Desarme and Presa.
 *
 * Future iterations will add subclasses for the other shapes (persistent
 * modes, sub-maneuvers, modifier-only maneuvers). Keeping the data model
 * declarative so each definition file is small and the engine logic lives
 * in one place.
 */

/**
 * @typedef {'strength'|'dexterity'|'agility'|'constitution'} CharacteristicSlug
 *
 * @typedef {object} ManeuverDefinitionData
 * @property {string} slug — stable id (e.g. 'derribo')
 * @property {string} nameKey — i18n key for the display name
 * @property {string} descriptionKey — i18n key for the rules description
 * @property {string} [icon] — Foundry icon path
 *
 * @property {number} attackPenalty — base penalty to attack roll (e.g. -30)
 * @property {{ small: number }} [attackPenaltyByWeaponSize]
 *   — extra penalty by weapon size when relevant (e.g. Derribo: small=-30 more)
 *
 * @property {boolean} forceTAZero — true → defender's TA forced to 0
 * @property {boolean} damageAllowed — true → attacker can choose to deal damage
 * @property {boolean} damageHalvedIfApplied — true → if damage dealt, base /= 2 and TA applies normally
 *
 * @property {number} damageThresholdPercent — min damage % required to trigger the opposed check (default 10)
 *
 * @property {CharacteristicSlug[]} attackerStats — characteristics the attacker can choose from
 * @property {CharacteristicSlug[]} defenderStats — characteristics the defender can choose from
 *
 * @property {number} attackerPenaltyUnder100 — modifier applied when damage% < 100 (e.g. -3)
 * @property {number} attackerBonusOver200 — modifier applied when damage% >= 200 (e.g. +3)
 *
 * @property {boolean} grantsQuadrupedBonus — true → defender gets +3 if quadruped (Derribo)
 *
 * @property {string[]} [weaponRestrictions] — e.g. ['unarmed', 'allowsPresa'] — Presa
 *
 * @property {(result: ManeuverResolution) => Effect[]} resolveEffects
 *   — given the resolved maneuver result, returns the AE slugs to apply
 *     and to whom (defender / attacker)
 */

/**
 * @typedef {object} ManeuverResolution
 * @property {boolean} attackHit — true if attack roll caused at least the threshold damage
 * @property {number} damagePercent — % damage dealt
 * @property {boolean} opposedSuccess — true → attacker won the opposed check
 * @property {number} opposedDifference — positive number = how much attacker beat defender
 * @property {Actor} attacker
 * @property {Actor} defender
 */

/**
 * @typedef {object} Effect
 * @property {'attacker'|'defender'} target
 * @property {string} effectSlug — pack entry name (e.g. 'Derribado')
 * @property {string} [reason] — short text shown in chat
 */

/** ¿El arma tiene la cualidad de slug dado (p.ej. 'precise')? */
function weaponHasQuality(weapon, slug) {
  const arr = weapon?.system?.qualities?.value;
  return Array.isArray(arr) && arr.map(s => String(s).toLowerCase()).includes(slug);
}

export class ManeuverDefinition {
  /** @param {ManeuverDefinitionData} data */
  constructor(data) {
    this.slug = data.slug;
    this.nameKey = data.nameKey;
    this.descriptionKey = data.descriptionKey ?? '';
    this.icon = data.icon ?? 'icons/svg/sword.svg';

    this.attackPenalty = Number(data.attackPenalty ?? 0);
    this.attackPenaltyByWeaponSize = data.attackPenaltyByWeaponSize ?? null;

    this.forceTAZero = !!data.forceTAZero;
    this.damageAllowed = !!data.damageAllowed;
    this.damageHalvedIfApplied = !!data.damageHalvedIfApplied;

    this.damageThresholdPercent = Number(data.damageThresholdPercent ?? 10);

    this.attackerStats = Array.isArray(data.attackerStats) ? data.attackerStats : [];
    this.defenderStats = Array.isArray(data.defenderStats) ? data.defenderStats : [];

    this.attackerPenaltyUnder100 = Number(data.attackerPenaltyUnder100 ?? 0);
    this.attackerBonusOver200 = Number(data.attackerBonusOver200 ?? 0);

    this.grantsQuadrupedBonus = !!data.grantsQuadrupedBonus;

    // Family A — non-opposed-check maneuvers.
    // When noOpposedCheck is true, the maneuver applies its resolveEffects
    // directly upon impact, with no D10 opposed check between attacker and
    // defender. Used by Engatillar (Amenazado on hit), and by Inutilizar /
    // Inconsciencia once the attack lands on the right aimed location.
    this.noOpposedCheck = !!data.noOpposedCheck;

    // Aimed attack info: if set, the maneuver implies a predetermined aimed
    // location. aimedZone is the canonical English ID from Tabla 45
    // (e.g. 'head', 'arm', 'thigh'). aimedZoneOptions is an optional list of
    // allowed zones the player can pick from at the card level (Inutilizar
    // lets the player choose between 'arm' and 'thigh').
    this.aimedZone = data.aimedZone ?? '';
    this.aimedZoneOptions = Array.isArray(data.aimedZoneOptions)
      ? data.aimedZoneOptions
      : [];

    // Maniobras que declaran un retraso en asaltos antes de tirar (Daño
    // retrasado: el jugador elige 1-5 asaltos en la tarjeta). Habilita el
    // <select> de retraso y el flujo de daño programado.
    this.hasDelayRoundsOption = !!data.hasDelayRoundsOption;

    // Maniobras de ATAQUE EN ÁREA (Lluvia de proyectiles): no exigen pre-target;
    // colocan una plantilla de radio calculado y auto-targetean a los tokens
    // dentro. damageMultiplier dobla el Daño Base. hasCadenceOption habilita el
    // toggle CF≤50/>50 (define el divisor del radio: 20 o 40).
    this.isAreaAttack = !!data.isAreaAttack;
    this.damageMultiplier = Number(data.damageMultiplier ?? 1) || 1;
    this.hasCadenceOption = !!data.hasCadenceOption;

    // Penalización OPCIONAL declarada por la maniobra, activable con un checkbox
    // en la tarjeta (Lluvia de proyectiles: -50 al "elegir blancos"). Aditiva e
    // inerte si no se marca.
    this.optionalPenalty = Number(data.optionalPenalty ?? 0) || 0;
    this.hasOptionalPenaltyOption = !!data.hasOptionalPenaltyOption;
    this.optionalPenaltyLabelKey = String(data.optionalPenaltyLabelKey ?? '');

    // Control enfrentado con valor de característica FIJO para el atacante
    // (Inmovilizar a distancia: 8 en vez de FUE/DES; el ±3 lo pone el GM en el
    // "Modificador extra" del diálogo del control). 0 = característica normal.
    this.fixedAttackerValue = Number(data.fixedAttackerValue ?? 0) || 0;

    // Penalizador a ELEGIR en la tarjeta (Inmovilizar a distancia: -80 sin daño /
    // -50 con daño). Cada opción: { value, labelKey, causesDamage }. El valor se
    // suma al ataque; causesDamage decide si el golpe aplica daño.
    this.penaltyOptions = Array.isArray(data.penaltyOptions)
      ? data.penaltyOptions.slice()
      : [];

    // Penalizador base alternativo si el arma seleccionada tiene Precisa (Ataque
    // apuntado Ropa: -150 normal, -100 con Precisa). Lo aplica getAttackPenalty.
    this.precisePenalty = Number(data.precisePenalty ?? 0) || 0;

    // Modificador plano al Daño Base de la maniobra (Disparo apuntado Rebote: -10
    // por perder potencia). Se aplica al construir el ataque en el diálogo.
    this.damageDelta = Number(data.damageDelta ?? 0) || 0;

    // Crit-type requirement: if set to 'impact', the maneuver is meant to be
    // used with a bludgeoning weapon. Used by Inconsciencia, which adds an
    // extra penalty when the weapon is not impact-type but still allows it.
    this.requiresImpactCritic = !!data.requiresImpactCritic;
    this.nonImpactCriticExtraPenalty = Number(data.nonImpactCriticExtraPenalty ?? 0);

    // Status-toggle maneuvers (e.g. Cargar): do not open the attack dialog
    // when executed. Instead, the engine applies the named Active Effect to
    // the actor if absent, or removes it if already present. The effect
    // itself is what carries the +/- combat modifiers RAW.
    this.isStatusToggle = !!data.isStatusToggle;
    this.statusEffectName = String(data.statusEffectName ?? '');

    // Sub-grapple maneuvers (e.g. Aplastar) skip the attack roll phase
    // entirely. The attacker is already grappling the defender, so the
    // execute path opens the opposed-check dialog directly with the
    // characteristics declared by the definition. The runtime validates
    // that the relational grapple flags exist and meet the maneuver's
    // requirements before launching.
    this.noAttackPhase = !!data.noAttackPhase;
    this.requiresGrappling = !!data.requiresGrappling;
    this.requiresUnarmedGrapple = !!data.requiresUnarmedGrapple;
    this.requiredDefenderStates = Array.isArray(data.requiredDefenderStates)
      ? data.requiredDefenderStates.slice()
      : [];

    // Optional predicate (Phase 3): preconditions for the maneuver expressed
    // declaratively against roll options (see effectFow/predicates/Predicate
    // and effectFow/rollOptions/buildGrappleOptions). An empty/absent
    // predicate means "no precondition" — additive and inert by default, so
    // existing maneuvers are unaffected. The runner evaluates it before
    // launching the maneuver. For two-actor maneuvers (Aplastar) the option
    // set combines self:* (attacker) and defender:* facts.
    this.predicate = Array.isArray(data.predicate) ? data.predicate.slice() : [];

    // Damage formula for auto-damage maneuvers (Aplastar). The engine
    // calls this with the opposed-check difference and the defender's
    // impact armor to produce the final damage.
    this.computeAutoDamage = typeof data.computeAutoDamage === 'function'
      ? data.computeAutoDamage
      : null;

    this.weaponRestrictions = data.weaponRestrictions ?? [];

    this.resolveEffects = typeof data.resolveEffects === 'function'
      ? data.resolveEffects
      : () => [];
  }

  /**
   * True when this maneuver's damage is INTRINSIC (always dealt, halved) rather
   * than an opt-in choice. Derived from the existing flags — no separate data
   * field needed: a maneuver that halves damage but does NOT force TA to zero is
   * an aimed damaging strike (Inutilizar, Inconsciencia), where RAW makes the
   * halved damage mandatory. forceTAZero maneuvers (Presa/Derribo/Desarme) are
   * grapples where dealing damage stays optional, so they are excluded.
   * @returns {boolean}
   */
  get dealsMandatoryDamage() {
    return this.damageHalvedIfApplied && !this.forceTAZero;
  }

  /**
   * Compute the actual attack penalty given the weapon used.
   * @param {Item|null} weapon
   * @returns {number}
   */
  getAttackPenalty(weapon) {
    let penalty = this.attackPenalty;
    // Ropa: el penalizador base cambia (p.ej. -150 → -100) si el arma tiene Precisa.
    if (this.precisePenalty && weaponHasQuality(weapon, 'precise')) {
      penalty = this.precisePenalty;
    }
    // El extra por arma corta NO aplica al combate DESARMADO (RAW Derribo: "-60 si se usa
    // arma corta QUE NO SEA combate desarmado"). El perfil "Artes Marciales" / "Desarmado"
    // tiene size 'small' pero isUnarmed -> se queda en el penalizador base.
    if (
      this.attackPenaltyByWeaponSize &&
      weapon?.system?.size?.value &&
      !weapon?.system?.isUnarmed?.value
    ) {
      const extra = this.attackPenaltyByWeaponSize[weapon.system.size.value];
      if (typeof extra === 'number') penalty += extra;
    }
    return penalty;
  }

  /**
   * Compute the modifier applied to the attacker's opposed characteristic
   * check based on the damage % dealt by the attack roll.
   * @param {number} damagePercent
   * @returns {number}
   */
  getOpposedCheckModifierFromDamage(damagePercent) {
    if (damagePercent >= 200) return this.attackerBonusOver200;
    if (damagePercent < 100) return this.attackerPenaltyUnder100;
    return 0;
  }

  /**
   * @param {Item|null} weapon
   * @returns {boolean} true if this weapon may be used for the maneuver
   */
  isWeaponAllowed(weapon) {
    if (this.weaponRestrictions.length === 0) return true;
    for (const r of this.weaponRestrictions) {
      if (r === 'unarmed') {
        if (!weapon || weapon.system?.isUnarmed?.value) return true;
      } else if (r === 'allowsPresa') {
        if (weapon?.system?.allowsPresa?.value) return true;
      }
    }
    return false;
  }
}
