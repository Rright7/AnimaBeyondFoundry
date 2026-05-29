/**
 * Sub-grapple maneuver runner (Aplastar).
 *
 * Skips the attack-roll phase. Validates that the attacker is currently
 * grappling someone (via animabf.grappling flag), that the grappled
 * defender is in one of the maneuver's required paralysis states, and
 * that the parent Presa was performed without weapons when the maneuver
 * requires it.
 *
 * On success, opens the OpposedCheckDialog with the maneuver's stats and
 * applies the computed automatic damage to the defender directly.
 */

import { openOpposedCheckDialog } from './opposedCheck/OpposedCheckDialog.js';

const SYSTEM_ID = 'animabf';

const PARALYSIS_NORMALIZED = {
  'Parálisis menor': 'Parálisis menor',
  'Parálisis parcial': 'Parálisis parcial',
  'Parálisis total': 'Parálisis total',
  'Parálisis completa': 'Parálisis completa'
};

/**
 * @param {Actor} attackerActor
 * @param {import('./ManeuverDefinition.js').ManeuverDefinition} def
 * @param {Item} maneuverItem
 */
export async function runSubGrappleManeuver(attackerActor, def, maneuverItem) {
  if (!attackerActor || !def || !maneuverItem) return;

  // 1) Validate the attacker is grappling.
  const defenderId = attackerActor.getFlag(SYSTEM_ID, 'grappling');
  if (def.requiresGrappling && !defenderId) {
    return ui.notifications?.warn(
      `${maneuverItem.name}: el atacante no está apresando a nadie.`
    );
  }

  const defenderActor = defenderId ? game.actors?.get(defenderId) : null;
  if (def.requiresGrappling && !defenderActor) {
    return ui.notifications?.warn(
      `${maneuverItem.name}: no se encontró el defensor apresado.`
    );
  }

  // 2) Unarmed-grapple requirement (RAW Aplastar).
  if (def.requiresUnarmedGrapple) {
    const wasUnarmed = !!defenderActor.getFlag(SYSTEM_ID, 'grappleWasUnarmed');
    if (!wasUnarmed) {
      return ui.notifications?.warn(
        `${maneuverItem.name}: solo se puede usar si la Presa se realizó sin armas.`
      );
    }
  }

  // 3) Defender must be in one of the required paralysis states.
  if (Array.isArray(def.requiredDefenderStates) && def.requiredDefenderStates.length > 0) {
    const hasState = defenderActor.items?.some(
      i =>
        i.type === 'effect' &&
        def.requiredDefenderStates.includes(PARALYSIS_NORMALIZED[i.name] ?? i.name)
    );
    if (!hasState) {
      return ui.notifications?.warn(
        `${maneuverItem.name}: el defensor debe estar en ${def.requiredDefenderStates.join(' o ')}.`
      );
    }
  }

  // 4) Defender's impact armor adds +1 per point to his check.
  const defenderArmorBonus =
    def.defenderArmorBonusType === 'impact'
      ? Number(defenderActor.system?.combat?.totalArmor?.at?.impact?.value ?? 0)
      : 0;

  // 5) Run the opposed check. The dialog does not natively support a
  // "defender extra bonus" yet, so we adjust the resulting difference
  // afterwards: subtracting from `difference` is mathematically the
  // same as adding to the defender's roll.
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

  // 6) Damage: only when the attacker wins, and only when the maneuver
  // declares an auto-damage formula.
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
