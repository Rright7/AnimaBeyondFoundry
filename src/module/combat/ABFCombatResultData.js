export class ABFCombatResultData {
  /** @param {Partial<ABFCombatResultData>} p */
  constructor(p = {}) {
    this.difference = p.difference ?? 0;
    this.counterAttackValue = p.counterAttackValue ?? 0;
    this.hasCounterAttack = p.hasCounterAttack ?? false;
    this.damageFinal = p.damageFinal ?? 0;
    this.finalBaseDamage = p.finalBaseDamage ?? 0;
    this.damagePercentage = p.damagePercentage ?? 0;
    this.finalArmor = p.finalArmor ?? 0;
    this.reducedArmor = p.reducedArmor ?? 0;
    this.lifePercentRemoved = p.lifePercentRemoved ?? 0;
    this.isCritical = p.isCritical ?? false;
    this.baseCriticalValue = p.baseCriticalValue ?? 0;
    this.attackBreak = p.attackBreak ?? 0;
    // Tipo de critico/tabla del ataque (cut/thrust/impact/energy/...). Se propaga para que
    // el disparador de sangrado sepa si el critico es fisico (desangra) o de energia (no).
    this.armorType = p.armorType ?? '-';
    // Reduccion de TA BLANDA (Hakyoukuken) para la tarjeta: cantidad plana (-2) o, si
    // softArmorNullified, "anula" la TA blanda (Arcano).
    this.softReducedArmor = p.softReducedArmor ?? 0;
    this.softArmorNullified = p.softArmorNullified ?? false;
    // Desangramiento directo (Dumah Arcano): el hook de chat inicia hemorragia en un impacto
    // con dano aunque no haya critico.
    this.directBleeding = p.directBleeding ?? false;

    // Ataque APUNTADO: zona golpeada + TA por cobertura de la zona vs TA total, para
    // que la tarjeta aclare por que la TA contabilizada puede ser 0 (la armadura no
    // cubre esa zona) y no la TA del cuerpo. '' / 0 cuando el ataque no es apuntado.
    this.aimedZone = p.aimedZone ?? '';
    this.aimedZoneArmor = p.aimedZoneArmor ?? 0;
    this.fullArmor = p.fullArmor ?? 0;

    // Critical resolution (populated by resolveCriticalHit)
    this.critResolved = p.critResolved ?? false;
    this.critImmune = p.critImmune ?? false;
    this.critImmuneReason = p.critImmuneReason ?? null;
    this.critLevel = p.critLevel ?? 0;
    this.critLevelRoll = p.critLevelRoll ?? 0;
    this.phRoll = p.phRoll ?? 0;
    this.phBase = p.phBase ?? 0;
    this.phTotal = p.phTotal ?? 0;
    this.phPassed = p.phPassed ?? false;
    this.failureLevel = p.failureLevel ?? 0;
    this.critLocation = p.critLocation ?? null;
    this.critLocationRoll = p.critLocationRoll ?? 0;
    this.critEffects = p.critEffects ?? null;
  }

  toJSON() {
    return { ...this };
  }

  static fromJSON(json) {
    const obj = typeof json === 'string' ? JSON.parse(json) : json;
    return new ABFCombatResultData(obj);
  }

  /** Fluent builder */
  static builder() {
    return new ABFCombatResultDataBuilder();
  }
}

export class ABFCombatResultDataBuilder {
  constructor() {
    this._p = {};
  }

  difference(v) {
    this._p.difference = Number(v) || 0;
    return this;
  }
  counterAttackValue(v) {
    this._p.counterAttackValue = Number(v) || 0;
    return this;
  }
  hasCounterAttack(v) {
    this._p.hasCounterAttack = !!v;
    return this;
  }
  damageFinal(v) {
    this._p.damageFinal = Number(v) || 0;
    return this;
  }
  finalBaseDamage(v) {
    this._p.finalBaseDamage = Number(v) || 0;
    return this;
  }
  damagePercentage(v) {
    this._p.damagePercentage = Number(v) || 0;
    return this;
  }
  finalArmor(v) {
    this._p.finalArmor = Number(v) || 0;
    return this;
  }
  reducedArmor(v) {
    this._p.reducedArmor = Number(v) || 0;
    return this;
  }
  lifePercentRemoved(v) {
    this._p.lifePercentRemoved = Number(v) || 0;
    return this;
  }
  isCritical(v) {
    this._p.isCritical = !!v;
    return this;
  }
  baseCriticalValue(v) {
    this._p.baseCriticalValue = Number(v) || 0;
    return this;
  }
  attackBreak(v) {
    this._p.attackBreak = Number(v) || 0;
    return this;
  }
  armorType(v) {
    this._p.armorType = v ?? '-';
    return this;
  }
  softReducedArmor(v) {
    this._p.softReducedArmor = Number(v) || 0;
    return this;
  }
  softArmorNullified(v) {
    this._p.softArmorNullified = !!v;
    return this;
  }
  directBleeding(v) {
    this._p.directBleeding = !!v;
    return this;
  }
  aimedZone(v) {
    this._p.aimedZone = v ?? '';
    return this;
  }
  aimedZoneArmor(v) {
    this._p.aimedZoneArmor = Number(v) || 0;
    return this;
  }
  fullArmor(v) {
    this._p.fullArmor = Number(v) || 0;
    return this;
  }

  /** Merge a full CriticalHitResult into the builder. */
  applyCriticalResult(critResult) {
    if (!critResult) return this;
    this._p.critResolved = critResult.resolved ?? false;
    this._p.critImmune = critResult.immune ?? false;
    this._p.critImmuneReason = critResult.immuneReason ?? null;
    this._p.critLevel = critResult.critLevel ?? 0;
    this._p.critLevelRoll = critResult.critLevelRoll ?? 0;
    this._p.phRoll = critResult.phRoll ?? 0;
    this._p.phBase = critResult.phBase ?? 0;
    this._p.phTotal = critResult.phTotal ?? 0;
    this._p.phPassed = critResult.phPassed ?? false;
    this._p.failureLevel = critResult.failureLevel ?? 0;
    this._p.critLocation = critResult.location ?? null;
    this._p.critLocationRoll = critResult.locationRoll ?? 0;
    this._p.critEffects = critResult.effects ?? null;
    return this;
  }

  build() {
    return new ABFCombatResultData(this._p);
  }
}
