/**
 * Sub-grapple maneuver runner (Aplastar).
 *
 * Skips the attack-roll phase. Validates the maneuver's preconditions, then
 * opens the OpposedCheckDialog with the maneuver's stats and applies the
 * computed automatic damage to the defender directly.
 *
 * Preconditions are declared on the maneuver as a `predicate` (Phase 3) and
 * evaluated against the combined grapple option set (self:* attacker +
 * defender:*). We keep specific warning messages by checking which atomic
 * fact is missing, so the user knows WHY the maneuver can't run.
 */

import { openOpposedCheckDialog } from './opposedCheck/OpposedCheckDialog.js';
import { testPredicate } from '../../actor/utils/effectFow/predicates/Predicate.js';
import { buildGrappleOptions } from '../../actor/utils/effectFow/rollOptions/rollOptions.js';

const SYSTEM_ID = 'animabf';

/**
 * Resolve the grappled defender actor from the attacker's relational flag.
 * @param {Actor} attackerActor
 * @returns {Actor|null}
 */
function resolveGrappledDefender(attackerActor) {
  const defenderId = attackerActor.getFlag(SYSTEM_ID, 'grappling');
  return defenderId ? game.actors?.get(defenderId) ?? null : null;
}

/**
 * Produce a specific warning when the predicate fails, by checking which
 * precondition is missing against the option set. Returns the message or null
 * if everything actually passes.
 *
 * Note: "Parálisis total" is intentionally not checked — it is the same state
 * as "completa", whose standard name the system uses everywhere.
 *
 * @param {Set<string>} options
 * @param {string} maneuverName
 * @returns {string|null}
 */
function explainPredicateFailure(options, maneuverName) {
  if (!options.has('self:grappling')) {
    return `${maneuverName}: el atacante no está apresando a nadie.`;
  }
  if (!options.has('self:grapple:unarmed')) {
    return `${maneuverName}: solo se puede usar si la Presa se realizó sin armas.`;
  }
  const hasParalysis =
    options.has('defender:condition:paralisis-parcial') ||
    options.has('defender:condition:paralisis-completa');
  if (!hasParalysis) {
    return `${maneuverName}: el defensor debe estar en Parálisis (parcial o completa).`;
  }
  return null;
}

/**
 * @param {Actor} attackerActor
 * @param {import('./ManeuverDefinition.js').ManeuverDefinition} def
 * @param {Item} maneuverItem
 */
export async function runSubGrappleManeuver(attackerActor, def, maneuverItem) {
  if (!attackerActor || !def || !maneuverItem) return;

  const defenderActor = resolveGrappledDefender(attackerActor);

  // Build the combined option set (self:* attacker + defender:*) and evaluate
  // the maneuver's declarative predicate. If it fails, surface a specific
  // reason. A maneuver without a predicate passes trivially.
  const options = buildGrappleOptions(attackerActor, defenderActor);
  if (Array.isArray(def.predicate) && def.predicate.length > 0) {
    if (!testPredicate(def.predicate, options)) {
      const msg = explainPredicateFailure(options, maneuverItem.name);
      return ui.notifications?.warn(msg ?? `${maneuverItem.name}: no se cumplen las condiciones.`);
    }
  }

  // After the predicate passes we still need a concrete defender actor to run
  // the opposed check against (the predicate only proves the facts hold).
  if (!defenderActor) {
    return ui.notifications?.warn(
      `${maneuverItem.name}: no se encontró el defensor apresado.`
    );
  }

  // Defender's impact armor adds +1 per point to his check.
  const defenderArmorBonus =
    def.defenderArmorBonusType === 'impact'
      ? Number(defenderActor.system?.combat?.totalArmor?.at?.impact?.value ?? 0)
      : 0;

  // Run the opposed check. The dialog does not natively support a "defender
  // extra bonus" yet, so we adjust the resulting difference afterwards:
  // subtracting from `difference` is mathematically the same as adding to the
  // defender's roll.
  const rawOpposed = await openOpposedCheckDialog({
    maneuver: def,
    attacker: attackerActor,
    defender: defenderActor,
    damagePercent: 100,
    defenderIsQuadruped: false
  });

  if (!rawOpposed) return; // cancelled

  const adjustedDifference = (rawOpposed.difference ?? 0) - defenderArmorBonus;
  const opposed = {
    ...rawOpposed,
    difference: Math.max(0, Math.abs(adjustedDifference)),
    attackerWins: adjustedDifference > 0
  };

  // Damage: only when the attacker wins, and only when the maneuver declares
  // an auto-damage formula.
  if (!opposed.attackerWins) {
    await postSummary({
      attackerActor,
      defenderActor,
      maneuverItem,
      opposed,
      damage: 0
    });
    return;
  }

  let damage = 0;
  if (typeof def.computeAutoDamage === 'function') {
    // Same rounding convention as computeCombatResult: never silently
    // truncate fractional damage to the defender's favor.
    damage = Math.ceil(Number(def.computeAutoDamage(opposed.difference) ?? 0) || 0);
  }

  if (damage > 0) {
    const lp = Number(
      defenderActor.system?.characteristics?.secondaries?.lifePoints?.value ?? 0
    );
    const newLp = Math.max(-100, lp - damage);
    try {
      await defenderActor.update({
        'system.characteristics.secondaries.lifePoints.value': newLp
      });
    } catch (err) {
      console.warn('[ABF] failed to apply crush damage:', err);
    }
  }

  await postSummary({
    attackerActor,
    defenderActor,
    maneuverItem,
    opposed,
    damage
  });
}

async function postSummary({
  attackerActor,
  defenderActor,
  maneuverItem,
  opposed,
  damage
}) {
  const flavor = `<strong>${attackerActor.name}</strong> usa <strong>${maneuverItem.name}</strong> contra <strong>${defenderActor.name}</strong>`;
  const winText = opposed.attackerWins
    ? `<strong>Gana por ${opposed.difference}</strong>`
    : `<strong>${defenderActor.name} resiste</strong>`;
  const damageText = damage > 0 ? ` · Daño automático: <strong>${damage}</strong>` : '';

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: attackerActor }),
    flavor,
    content: `<div class="sub-grapple-result">${winText}${damageText}</div>`,
    flags: {
      [SYSTEM_ID]: {
        kind: 'subGrappleResult',
        maneuverSlug: maneuverItem.system?.slug?.value ?? '',
        attackerId: attackerActor.id,
        defenderId: defenderActor.id,
        difference: opposed.difference,
        attackerWins: !!opposed.attackerWins,
        damage
      }
    }
  });
}
