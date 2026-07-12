import { ABFAttackData } from './ABFAttackData.js';
import { ABFDefenseData } from './ABFDefenseData.js';
import { ABFCombatResultData } from './ABFCombatResultData.js';
import { resolveActorForRoll } from '../actor/utils/resolveActorForRoll.js';
import { calculateCounterAttackBonus } from './utils/calculateCounterAttackBonus.js';
import { martialArtSpecialEffects } from './martialArts/martialArtSpecials.js';
import { computeAimedArmor } from './utils/armorCoverage.js';
import { isMassActor, massComponentCount, areaDamageMultiplier } from './massCombat.js';

/**
 * Computes a base combat result from the given attack and defense data.
 * @param {ABFAttackData} attackData
 * @param {ABFDefenseData} defenseData
 * @returns {ABFCombatResultData}
 */
export function computeCombatResult(attackData, defenseData) {
  // Resolve actors via the token-aware helper so unlinked-token AE are honoured.
  const defenderActor = resolveActorForRoll({
    tokenId: defenseData.defenderTokenId,
    actorId: defenseData.defenderId
  });
  const attackerActor = resolveActorForRoll({
    tokenId: attackData.attackerTokenId,
    actorId: attackData.attackerId
  });

  // Anima rule: neither attack nor defense ability totals can go below 0.
  // Apply the floor before computing the round difference so accumulated
  // penalties never produce phantom counter-attacks.
  const attackTotal = Math.max(0, attackData.attackAbility ?? 0);
  const defenseTotal = Math.max(0, defenseData.defenseAbility ?? 0);
  const difference = attackTotal - defenseTotal;

  const hasCounterAttack =
    difference <= 0 &&
    attackData.canBeCounterAttacked !== false &&
    defenseData.canCounterAttack !== false;

  // Bono de contraataque (RAW Core Exxet): la MITAD del margen Defensa-Ataque,
  // redondeado a la baja en multiplos de 5, con tope +150. Las Artes Marciales del
  // DEFENSOR lo modifican antes del tope: Selene dobla (multiplier), Boxeo suma +10 (flat).
  const ma = hasCounterAttack ? martialArtSpecialEffects(defenderActor) : null;
  const counterAttackValue = hasCounterAttack
    ? calculateCounterAttackBonus(attackTotal, defenseTotal, {
        multiplier: ma?.counterAttackMultiplier || 1,
        flat: ma?.counterAttackBonus || 0
      })
    : 0;

  // Masa de enemigos como defensor: inmune a criticos + multiplicador de area (Tabla 2).
  const defenderIsMass = isMassActor(defenderActor?.system);

  let baseDamage = getFinalBaseDamage(attackData, defenseData);
  // Multiplicador de AREA (Tabla 2) al Dano Base segun enemigos alcanzados, con tope en el
  // nº de componentes de la masa. areaEnemiesHit=1 -> x1 (impacto normal, sin cambio).
  let areaMultiplier = 1;
  if (defenderIsMass) {
    const massCount = massComponentCount(defenderActor?.system);
    const hitsRaw = Math.max(1, Math.floor(Number(attackData.areaEnemiesHit) || 1));
    const hits = massCount > 0 ? Math.min(hitsRaw, massCount) : hitsRaw;
    areaMultiplier = areaDamageMultiplier(hits);
    baseDamage = baseDamage * areaMultiplier;
  }
  // Ataque APUNTADO: la TA solo cuenta si la zona golpeada esta cubierta por la
  // armadura (un peto no protege las piernas; un yelmo cerrado si la cara...). Se
  // recalcula con las armaduras que cubren la zona; null = no apuntado -> TA normal.
  const aimedArmor =
    attackData.aimed && attackData.aimedWhere
      ? computeAimedArmor(defenderActor, attackData.aimedWhere, attackData.armorType)
      : null;
  let finalArmor = getFinalArmor(attackData, defenseData, aimedArmor);

  // Full (pre-halving) base damage, kept for the critical calculation: aimed
  // maneuvers (Inutilizar/Inconsciencia) deal half damage to HP but the crit is
  // computed from the FULL damage (RAW). baseDamage itself may be halved below.
  const baseDamageFull = baseDamage;

  // Combat maneuver: three RAW interactions with damage and armor:
  //
  // 1. Maneuver but no damage opted (causesDamage=false):
  //    - forceTAZero (Derribo, Presa, Desarme, ...) applies → TA = 0.
  //    - finalDamage is forced to 0 below (the maneuver passes through
  //      armor but does no harm).
  //
  // 2. Maneuver with damage (causesDamage=true) and
  //    damageHalvedIfApplied=true (Derribo, Presa, Inutilizar,
  //    Inconsciencia):
  //    - baseDamage /= 2 and TA applies NORMALLY (forceTAZero ignored).
  //    - RAW: "el atacante puede causar daño si lo desea, pero queda
  //      reducido a la mitad y sí se aplica la armadura del defensor".
  //    - For maneuvers whose damage is INTRINSIC (def.dealsMandatoryDamage:
  //      Inutilizar, Inconsciencia) causesDamage is forced true below, so they
  //      always take this halving path regardless of the "Causar daño" checkbox.
  //
  // 3. Maneuver with damage opted but damageHalvedIfApplied=false:
  //    - Damage and TA computed normally (no special interaction).
  const maneuverSlug = attackData.maneuverSlug || '';
  let suppressDamage = false;
  // When true, the critical uses the FULL (pre-halved) damage even though HP
  // loss stays halved — set only for maneuvers whose damage is intrinsic and
  // halved (def.dealsMandatoryDamage: Inutilizar, Inconsciencia).
  let critUsesFullDamage = false;
  if (maneuverSlug) {
    const def = game.animabf?.maneuvers?.get?.(maneuverSlug);
    // Maneuvers with intrinsic damage (def.dealsMandatoryDamage) always deal
    // (halved) damage — the attacker does not choose, so treat them as if
    // "Causar daño" were checked.
    const causesDamage = !!attackData.causesDamage || !!def?.dealsMandatoryDamage;
    if (def) {
      if (def.damageAllowed && !causesDamage) {
        // Path 1: maneuver without damage — armor bypass + 0 damage.
        if (def.forceTAZero) finalArmor = 0;
        suppressDamage = true;
      } else if (
        def.damageAllowed &&
        causesDamage &&
        def.damageHalvedIfApplied
      ) {
        // Path 2: damage with halved base and normal TA. EXCEPCION: ciertas Artes
        // Marciales conceden dano COMPLETO en la maniobra (Grappling Supremo en
        // Presa/Derribo) -> no se halvea el base.
        if (!attackData.maneuverFullDamage) baseDamage = Math.floor(baseDamage / 2);
        // RAW: aimed maneuvers count the FULL damage for the critical (trigger
        // + level), while HP loss stays halved.
        critUsesFullDamage = !!def.dealsMandatoryDamage;
      } else if (def.forceTAZero && !def.damageAllowed) {
        // Maneuvers like Engatillar that never deal damage but still
        // ignore TA when checking thresholds.
        finalArmor = 0;
      }
    }
  }

  const roundedDifference = Math.floor(difference / 10) * 10;
  const damagePercentage = Math.max(0, roundedDifference - finalArmor * 10 - 20);
  // Round damage up so half-points (e.g. base 45 halved by Presa = 22.5)
  // never get silently truncated to the defender's favor. RAW expects
  // the inflicted damage to be a clean integer at or above the math.
  let finalDamage = Math.ceil((baseDamage * damagePercentage) / 100);
  if (suppressDamage) finalDamage = 0;

  // Desgaste del escudo sobrenatural: se CALCULA aqui pero NO se aplica. Se ofrece un boton
  // en el chat para aplicarlo a mano, porque hay casos en los que el escudo no debe recibir
  // dano aunque pare con exito (decision del DJ).
  const shieldWear = computeShieldWear(attackData, defenseData, difference);

  const lifeBeforeAttack =
    defenderActor.system.characteristics.secondaries.lifePoints.value;
  let lifePercentRemoved = 100;
  if (lifeBeforeAttack > 0) {
    lifePercentRemoved = (finalDamage / lifeBeforeAttack) * 100;
  }

  // Puntos vulnerables (Core Exxet): if the attack is aimed at a vulnerable
  // body part (head, eye, neck, heart by default), the threshold to force a
  // critical drops from 50% to 10% of the defender's life. Maneuvers like
  // Inutilizar mark the targeted limb as vulnerable too so a relatively low
  // damage still triggers the critical roll.
  // Critical uses the FULL damage for aimed maneuvers (Inutilizar/Inconsciencia):
  // both the trigger (% of life vs threshold) and the level are computed from
  // the un-halved damage, while HP loss (finalDamage) stays halved. In every
  // other case critDamage === finalDamage, so behaviour is unchanged.
  const critDamage = critUsesFullDamage
    ? Math.ceil((baseDamageFull * damagePercentage) / 100)
    : finalDamage;
  const critLifePercent =
    lifeBeforeAttack > 0 ? (critDamage / lifeBeforeAttack) * 100 : 100;

  const criticThreshold = isAimedAtVulnerableZone(attackData) ? 10 : 50;
  // Masa de enemigos: inmune a criticos (no tiene un cuerpo unico) -> se anula el critico
  // aunque supere el umbral o el ataque sea critico automatico.
  const isCritical =
    !defenderIsMass && (critLifePercent >= criticThreshold || attackData.automaticCrit);
  const critValue = critDamage + attackData.critBonus + (attackData.critDamageBonus ?? 0);

  // Reduccion de TA BLANDA (Hakyoukuken) para mostrarla en la tarjeta: cantidad plana (-2
  // Base) o, con el centinela 999, "anula" la TA blanda (Arcano).
  const softTaReduction = Number(attackData.softArmorReduction) || 0;
  const softArmorNullified = softTaReduction >= 999;

  const result = ABFCombatResultData.builder()
    .difference(difference)
    .hasCounterAttack(hasCounterAttack)
    .counterAttackValue(counterAttackValue)
    .damageFinal(finalDamage)
    .finalBaseDamage(baseDamage)
    .damagePercentage(damagePercentage)
    .areaMultiplier(areaMultiplier)
    .usedShield(shieldWear.usedShield)
    .shieldId(shieldWear.shieldId)
    .shieldWearDamage(shieldWear.damage)
    .finalArmor(finalArmor)
    .reducedArmor(attackData.reducedArmor ?? 0)
    .lifePercentRemoved(Math.floor(Math.min(100, Math.max(lifePercentRemoved, 0))))
    .isCritical(isCritical)
    .baseCriticalValue(critValue)
    .attackBreak(attackData.breakage)
    .armorType(attackData.armorType)
    .softReducedArmor(softArmorNullified ? 0 : softTaReduction)
    .softArmorNullified(softArmorNullified)
    .directBleeding(attackData.directBleeding)
    .aimedZone(attackData.aimed && attackData.aimedWhere ? attackData.aimedWhere : '')
    .aimedZoneArmor(aimedArmor ? aimedArmor.armor : 0)
    .fullArmor(defenseData.armor ?? 0)
    .build();

  // Attach maneuver context (consumed by the chat hook that auto-posts the
  // maneuver opposed-check card once damage is resolved).
  if (maneuverSlug) {
    result.maneuverSlug = maneuverSlug;
    result.maneuverItemName = attackData.maneuverItemName || maneuverSlug;
    result.attackerId = attackData.attackerId || '';
    // Daño retrasado: asaltos declarados, para que la tarjeta de resultado
    // muestre el botón "Programar daño retrasado (N)".
    result.delayRounds = Number(attackData.delayRounds ?? 0) || 0;
  }

  return result;
}

/**
 * Calcula el desgaste que un escudo sobrenatural sufriria al PARAR con exito (diferencia
 * <= 0): **dano base del arma + 10 por cada punto de TA que reduce el arma** (reducedArmor).
 * NO lo aplica: se ofrece un boton en el chat, porque hay casos en los que el escudo no
 * debe recibir dano aunque pare (decision del DJ).
 * @returns {{ usedShield: boolean, shieldId: string, damage: number }}
 */
function computeShieldWear(attackData, defenseData, difference) {
  const none = { usedShield: false, shieldId: '', damage: 0 };

  const defenseType = defenseData?.defenseType;
  const usedShield = defenseType === 'shield' || defenseType === 'supernaturalShield';
  const blockedSuccessfully = (difference ?? 0) <= 0;
  const shieldId = defenseData?.shieldId ?? '';
  if (!usedShield || !blockedSuccessfully || !shieldId) return none;

  const baseAttackDamage = Number(attackData?.damage ?? 0) || 0;
  if (baseAttackDamage <= 0) return none;

  // Dano al escudo = dano base del arma + 10 por cada punto de TA que reduce el arma.
  const reducedArmor = Math.max(0, Number(attackData?.reducedArmor) || 0);
  return { usedShield: true, shieldId, damage: baseAttackDamage + reducedArmor * 10 };
}

/**
 * Aplica el desgaste a un escudo sobrenatural (item propio o escudo dinamico): resta
 * `damage` de sus shieldPoints con suelo 0. Lo llama el boton "Aplicar desgaste" del chat.
 * @returns {Promise|null} la promesa del update, o null si no hay nada que hacer.
 */
export function applyShieldWear(defenderActor, shieldId, damage) {
  const amount = Number(damage) || 0;
  if (!defenderActor || !shieldId || amount <= 0) return null;

  const shieldItem = defenderActor.items?.get?.(shieldId);
  if (shieldItem) {
    const current = Number(shieldItem.system?.shieldPoints ?? 0) || 0;
    const next = Math.max(0, current - amount);
    if (next === current) return null;
    return shieldItem.update({ 'system.shieldPoints': next });
  }

  const dyn = defenderActor.system?.dynamic?.supernaturalShields?.[shieldId];
  if (dyn?.system) {
    const current = Number(dyn.system.shieldPoints ?? 0) || 0;
    const next = Math.max(0, current - amount);
    if (next === current) return null;
    return defenderActor.update({
      [`system.dynamic.supernaturalShields.${shieldId}.system.shieldPoints`]: next
    });
  }
  return null;
}

/** Final base damage after flat reductions (rounded to nearest 10) */
function getFinalBaseDamage(attackData, defenseData) {
  const finalBaseDamage = Math.max(
    0,
    (attackData.damage ?? 0) - (defenseData.damageReduction ?? 0)
  );
  const roundedFinalBaseDamage = Math.round(finalBaseDamage / 10) * 10;
  return Math.max(0, roundedFinalBaseDamage);
}

/**
 * Final armor after ignore/reduced logic.
 * @param {ABFAttackData} attackData
 * @param {ABFDefenseData} defenseData
 * @param {{armor:number, hardArmor:number}|null} [aimedArmor] TA ya filtrada por
 *   cobertura cuando el ataque es apuntado; si es null se usa la TA total normal.
 */
function getFinalArmor(attackData, defenseData, aimedArmor = null) {
  const baseArmor = aimedArmor ? aimedArmor.armor : defenseData.armor ?? 0;
  const baseHardArmor = aimedArmor ? aimedArmor.hardArmor : defenseData.hardArmor ?? 0;
  let armor = 0;

  if (attackData.ignoreArmor && defenseData.inmodifiableArmor) {
    armor = Math.ceil(baseArmor / 2);
  } else if (attackData.ignoreArmor) {
    armor = 0;
  } else if (defenseData.inmodifiableArmor) {
    armor = baseArmor;
  } else {
    const reduced = Number(attackData.reducedArmor) || 0;
    armor = baseArmor - reduced;
    // Hakyoukuken: reduce SOLO la porcion blanda de la TA; no puede bajar de la TA
    // dura (que ya sufrio la reduccion general). 999 = anula la blanda del todo.
    const softReduction = Number(attackData.softArmorReduction) || 0;
    if (softReduction > 0) {
      const hardFloor = Math.max(0, baseHardArmor - reduced);
      armor = Math.max(hardFloor, armor - softReduction);
    }
  }

  return Math.max(0, armor);
}

/** Vulnerable zones for the puntos vulnerables rule (humanoid baseline). */
const VULNERABLE_ZONES = new Set(['head', 'eye', 'neck', 'heart']);

/**
 * True if the attack was aimed at a body part considered vulnerable for the
 * 'puntos vulnerables' rule. Combat maneuvers can also flag their aimed zone
 * as vulnerable via `treatsAimedZoneAsVulnerable` on the ManeuverDefinition
 * (used by Inutilizar to treat the targeted limb as vulnerable).
 *
 * @param {ABFAttackData} attackData
 * @returns {boolean}
 */
function isAimedAtVulnerableZone(attackData) {
  if (!attackData?.aimed || !attackData?.aimedWhere) return false;
  if (VULNERABLE_ZONES.has(attackData.aimedWhere)) return true;
  const slug = attackData.maneuverSlug || '';
  if (slug) {
    const def = game.animabf?.maneuvers?.get?.(slug);
    if (def?.treatsAimedZoneAsVulnerable) return true;
  }
  return false;
}
