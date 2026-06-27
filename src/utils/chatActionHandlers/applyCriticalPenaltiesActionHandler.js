import { accumulatePenalty } from '../../module/combat/criticalPenalties.js';
import { Templates } from '../../module/utils/constants.js';

/**
 * Boton "Aplicar penalizadores": vuelca al defensor los penalizadores del critico
 * ya resuelto -> painPenalty a Dolor (allActions.painPenalty.base) y physicalPenalty
 * a Carencias (allActions.physicalLack.base), ACUMULANDO. Mismo patron que aplicar
 * dano (permisos GM/owner + idempotencia). El resto de "efectos" (inconsciente,
 * muerte, miembro) no se tocan aqui.
 */
export default async function applyCriticalPenaltiesActionHandler(message, _html, ds) {
  try {
    const msg = game.messages.get(ds.messageId ?? message.id);
    if (!msg) return ui.notifications?.warn('Mensaje no encontrado.');

    const animabf = msg.flags?.animabf ?? {};
    const result = animabf.result ?? {};
    const eff = result.critEffects;
    const pain = Math.max(0, Number(eff?.painPenalty) || 0);
    const phys = Math.max(0, Number(eff?.physicalPenalty) || 0);
    if (!pain && !phys)
      return ui.notifications?.warn('El critico no genera penalizadores que aplicar.');

    // Resolve defender (token primero, como aplicar dano)
    const tokenId = ds.defToken ?? ds['def-token'] ?? animabf.defender?.tokenId ?? '';
    const actorId = ds.defActor ?? ds['def-actor'] ?? animabf.defender?.actorId ?? '';
    const token = tokenId ? canvas.tokens.get(tokenId) : null;
    const actor = token?.actor ?? (actorId ? game.actors.get(actorId) : null);
    if (!actor) return ui.notifications?.warn('Defensor no encontrado.');

    // Permissions
    const canApply =
      game.user.isGM ||
      actor.testUserPermission?.(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER);
    if (!canApply) return ui.notifications?.warn('Sin permisos para aplicar penalizadores.');

    // Confirm if already applied (evita doble volcado del mismo critico)
    if (result.critPenaltyApplied) {
      const ok = await foundry.applications.api.DialogV2.confirm({
        window: { title: '¿Aplicar penalizadores de nuevo?' },
        content: `<p>Este critico ya aplico sus penalizadores antes. ¿Seguro?</p><p><b>Dolor -${pain}</b>${
          phys ? ` · <b>Carencias -${phys}</b>` : ''
        }</p>`,
        rejectClose: false,
        modal: true
      }).catch(() => false);
      if (!ok) return;
    }

    // Apply (accumulate) to the defender's buckets
    const painPath = 'system.general.modifiers.allActions.painPenalty.base.value';
    const physPath = 'system.general.modifiers.allActions.physicalLack.base.value';
    const curPain = Number(foundry.utils.getProperty(actor, painPath)) || 0;
    const curPhys = Number(foundry.utils.getProperty(actor, physPath)) || 0;
    await actor.update({
      [painPath]: accumulatePenalty(curPain, pain),
      [physPath]: accumulatePenalty(curPhys, phys)
    });
    ui.notifications?.info(
      `${actor.name}: dolor -${pain}${phys ? `, carencias -${phys}` : ''}`
    );

    // Mark applied + re-render. Best-effort: si el usuario no es autor del mensaje no
    // puede actualizarlo, pero los penalizadores YA se aplicaron (lo importante).
    try {
      const updated = { ...result, critPenaltyApplied: true };
      const renderFn = foundry.applications?.handlebars?.renderTemplate ?? renderTemplate;
      const content = await renderFn(Templates.Chat.CombatResult, {
        combatResult: updated,
        defenderId: actorId,
        defenderTokenId: tokenId
      });
      await msg.setFlag(game.animabf.id, 'result', updated);
      await msg.update({ content });
    } catch (e) {
      console.debug('[ABF] no se pudo re-renderizar la tarjeta de penalizadores:', e);
    }
  } catch (err) {
    console.error('[ABF] applyCriticalPenalties error:', err);
    ui.notifications?.error('No se pudieron aplicar los penalizadores del critico.');
  }
}

export const action = 'animabf-apply-crit-penalties';
