import { ABFDefenseData } from './ABFDefenseData.js';
import ABFFoundryRoll from '../rolls/ABFFoundryRoll.js';
import { computeCombatResult } from './computeCombatResult.js';
import { pickBestDefenseCandidate } from './DefenseStrategies.js';
import { getMessageMode } from '../utils/chatVisibility.js';
import { defensesCounterCheck, freeDefensesFor } from './utils/defensesCounterCheck.js';
import { buildRollFormula } from './utils/buildRollFormula.js';

function toSafeNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isProjectileAttack(attackData) {
  const projectileType =
    attackData?.projectile?.type ?? attackData?.projectileType ?? null;
  if (attackData?.isProjectile === true) return true;
  return (
    projectileType === 'shot' ||
    projectileType === 'throw' ||
    projectileType === 'projectile'
  );
}

function multipleDefensePenaltyFromAccumulated(accumulated, opts) {
  // Positivo (se RESTA en la formula). Reusa la funcion canonica (negativa) con el
  // margen de defensas exentas (opts) para no duplicar la tabla.
  return -defensesCounterCheck(accumulated, opts);
}

function getDefensesCounter(actor) {
  return (
    actor?.getFlag?.(game.animabf.id, 'defensesCounter') ?? {
      accumulated: 0,
      keepAccumulating: true
    }
  );
}

function buildZeroDefenseResult({ actor, defenderToken, attackData }) {
  const armorType = attackData?.armorType;
  const taFinal =
    armorType != null ? actor.system?.combat?.totalArmor?.at?.[armorType]?.value ?? 0 : 0;

  const defenseData = ABFDefenseData.builder()
    .defenseAbility(0)
    .armor(taFinal)
    .inmodifiableArmor(false)
    .defenseType('resistance')
    .defenderId(actor.id)
    .defenderTokenId(defenderToken?.id ?? '')
    .weaponId('')
    .shieldId('')
    .stackDefense(false)
    .applyMultipleDefensePenalty(false)
    .projectilePenalty(0)
    .build();

  const combatResult = computeCombatResult(attackData, defenseData);

  return {
    actor,
    token: defenderToken ?? null,
    defenseType: 'resistance',
    defenseTotal: 0,
    weaponId: '',
    shieldId: '',
    defenseData,
    combatResult,
    appliedPenalties: {
      projectilePenalty: 0,
      multipleDefensePenalty: 0
    }
  };
}

export async function autoRollDefenseAgainstAttack({
  defenderToken = null,
  defenderActor = null,
  attackData,
  defenseMod = 0
}) {
  // Prefer the token's actor instance whenever a token is provided so AE on
  // unlinked tokens are honoured. Fall back to the explicitly passed actor.
  const actor = defenderToken?.actor ?? defenderActor ?? null;
  if (!actor) throw new Error('autoRollDefenseAgainstAttack: defender actor missing');

  const defenseMode = actor.system?.general?.settings?.defenseType?.value;

  // Accumulation/resistance defenders: base defense 0, no roll, no penalties.
  if (defenseMode === 'resistance') {
    return buildZeroDefenseResult({ actor, defenderToken, attackData });
  }

  const defensesCounter = getDefensesCounter(actor);

  const candidate = pickBestDefenseCandidate(actor, { attackData, defensesCounter });
  if (!candidate)
    throw new Error('autoRollDefenseAgainstAttack: no defense candidates available');

  const safeMod = toSafeNumber(defenseMod);

  const accumulated = defensesCounter.keepAccumulating ? defensesCounter.accumulated : 0;

  const multipleDefensePenalty = candidate.applyMultipleDefensePenalty
    ? multipleDefensePenaltyFromAccumulated(accumulated, freeDefensesFor(actor))
    : 0;

  const projectilePenalty = isProjectileAttack(attackData)
    ? candidate.projectilePenalty
    : 0;

  const die =
    candidate.naturalBase >= 200
      ? actor.system?.general?.diceSettings?.abilityMasteryDie?.value ?? '1d100xa'
      : actor.system?.general?.diceSettings?.abilityDie?.value ?? '1d100xa';

  // Omite los terminos a 0; los penalizadores se pasan negativos (se restan).
  const formula = buildRollFormula(die, [
    candidate.finalBase,
    safeMod,
    -projectilePenalty,
    -multipleDefensePenalty
  ]);

  const roll = new ABFFoundryRoll(formula, actor.system);
  await roll.evaluate({ async: true });

  const rollMode = getMessageMode();

  const flavorKey =
    candidate.type === 'block'
      ? 'chat.defense.autoRollFlavor.block'
      : candidate.type === 'dodge'
      ? 'chat.defense.autoRollFlavor.dodge'
      : 'chat.defense.autoRollFlavor.supernaturalShield';

  let flavor = game.i18n?.localize?.(flavorKey) || `Auto Defense — ${candidate.type}`;
  flavor = `${flavor}${candidate.flavorSuffix ?? ''}`;

  const tokenName = defenderToken?.name ?? defenderToken?.document?.name ?? actor.name;
  const speaker = defenderToken
    ? { ...ChatMessage.getSpeaker({ token: defenderToken }), alias: tokenName }
    : ChatMessage.getSpeaker({ actor });

  // candidate.type is one of 'block' | 'dodge' | 'supernaturalShield'.
  // Normalize to the same vocabulary used by the manual DefenseConfigurationDialog
  // so the AE trace hook can match without special-casing.
  const rollAttribute =
    candidate.type === 'supernaturalShield' ? 'shield' : candidate.type;

  await roll.toMessage({
    speaker,
    flavor,
    rollMode,
    flags: { animabf: { rollAttribute } }
  });

  if (typeof actor.accumulateDefenses === 'function') {
    actor.accumulateDefenses(!!candidate.stackDefense);
  }

  const armorType = attackData?.armorType;
  const taFinal =
    armorType != null ? actor.system?.combat?.totalArmor?.at?.[armorType]?.value ?? 0 : 0;

  // IMPORTANT: normalize supernatural shield -> "shield" so central resolution works everywhere
  const defenseTypeNormalized =
    candidate.type === 'supernaturalShield' ? 'shield' : candidate.type;

  const defenseData = ABFDefenseData.builder()
    .defenseAbility(Math.max(0, roll.total))
    .armor(taFinal)
    .inmodifiableArmor(false)
    .defenseType(defenseTypeNormalized)
    .defenderId(actor.id)
    .defenderTokenId(defenderToken?.id ?? '')
    .weaponId(candidate.weaponId ?? '')
    .shieldId(candidate.shieldId ?? '') // IMPORTANT: needed to apply wear
    .stackDefense(candidate.stackDefense)
    .applyMultipleDefensePenalty(candidate.applyMultipleDefensePenalty)
    .projectilePenalty(projectilePenalty)
    .build();

  const combatResult = computeCombatResult(attackData, defenseData);

  return {
    actor,
    token: defenderToken ?? null,
    defenseType: defenseTypeNormalized,
    defenseTotal: roll.total,
    weaponId: candidate.weaponId ?? '',
    shieldId: candidate.shieldId ?? '',
    defenseData,
    combatResult,
    appliedPenalties: {
      projectilePenalty,
      multipleDefensePenalty
    }
  };
}
