import { maneuverRegistry } from './ManeuverRegistry.js';
import { openOpposedCheckDialog } from './opposedCheck/OpposedCheckDialog.js';

/**
 * High-level entry point to execute a combat maneuver end-to-end.
 *
 * For this initial pass we focus on the post-combat phase: given that the
 * attacker has already rolled the attack and the defender has defended
 * (using the existing combat flow), this function takes the resulting
 * damage % and runs the opposed characteristic check, then posts a chat
 * card with the maneuver outcome and "apply effect" buttons.
 *
 * @param {object} opts
 * @param {string} opts.maneuverSlug — 'derribo' | 'desarme' | 'presa'
 * @param {Actor} opts.attacker
 * @param {Actor} opts.defender
 * @param {number} opts.damagePercent — % damage caused by the attack roll
 * @returns {Promise<{success:boolean, result?:object, applied?:object[]}|null>}
 */
export async function executeManeuverPostCombat({
  maneuverSlug,
  attacker,
  defender,
  damagePercent
}) {
  const maneuver = maneuverRegistry.get(maneuverSlug);
  if (!maneuver) {
    ui.notifications?.warn(`[ABF] Maniobra desconocida: ${maneuverSlug}`);
    return null;
  }

  if (!attacker || !defender) {
    ui.notifications?.warn('[ABF] Maniobra requiere atacante y defensor');
    return null;
  }

  const threshold = maneuver.damageThresholdPercent;
  if (damagePercent < threshold) {
    await postManeuverChat({
      maneuver,
      attacker,
      defender,
      attackHit: false,
      damagePercent,
      opposedResult: null
    });
    return { success: false };
  }

  // Detect quadruped flag on defender (optional).
  const defenderIsQuadruped =
    !!defender.system?.characteristics?.isQuadruped ||
    !!defender.system?.general?.isQuadruped;

  const opposed = await openOpposedCheckDialog({
    maneuver,
    attacker,
    defender,
    damagePercent,
    defenderIsQuadruped
  });

  if (!opposed) return null; // cancelled

  const maneuverResult = {
    attackHit: true,
    damagePercent,
    opposedSuccess: opposed.attackerWins,
    opposedDifference: opposed.difference,
    attacker,
    defender
  };

  const effects = maneuver.resolveEffects(maneuverResult);

  await postManeuverChat({
    maneuver,
    attacker,
    defender,
    attackHit: true,
    damagePercent,
    opposedResult: opposed,
    effectsToApply: effects
  });

  return { success: opposed.attackerWins, result: opposed, applied: effects };
}

/**
 * Render a chat card describing the maneuver outcome.
 * @private
 */
async function postManeuverChat(data) {
  const renderFn = foundry.applications?.handlebars?.renderTemplate ?? renderTemplate;
  const content = await renderFn(
    'systems/animabf/templates/chat/maneuver-result.hbs',
    {
      maneuverName: game.i18n.localize(data.maneuver.nameKey),
      attackerName: data.attacker.name,
      defenderName: data.defender.name,
      attackHit: data.attackHit,
      damagePercent: data.damagePercent,
      threshold: data.maneuver.damageThresholdPercent,
      opposed: data.opposedResult,
      effects: data.effectsToApply ?? []
    }
  );

  await ChatMessage.create({
    content,
    speaker: ChatMessage.getSpeaker({ actor: data.attacker }),
    flags: {
      animabf: {
        kind: 'maneuverResult',
        maneuverSlug: data.maneuver.slug,
        attackerId: data.attacker.id,
        defenderId: data.defender.id,
        effects: data.effectsToApply ?? []
      }
    }
  });
}
