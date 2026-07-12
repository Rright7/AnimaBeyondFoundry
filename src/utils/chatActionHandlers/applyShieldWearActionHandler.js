import { applyShieldWear } from '../../module/combat/computeCombatResult.js';

// Boton "Aplicar desgaste al escudo" de la tarjeta de resultado: resta a mano los
// shieldPoints del escudo sobrenatural usado (el desgaste NO se aplica solo, porque hay
// casos en los que el escudo no recibe dano aunque pare). Marca el resultado como aplicado.
export default async function applyShieldWearActionHandler(message, _html, ds) {
  try {
    const msg = game.messages.get(ds.messageId ?? message?.id);
    if (!msg) return ui.notifications?.warn('Mensaje no encontrado.');

    const animabf = msg.flags?.animabf ?? {};

    const shieldId = ds.shieldId ?? ds['shield-id'] ?? animabf.result?.shieldId ?? '';
    const damage = Number(
      ds.shieldDamage ?? ds['shield-damage'] ?? animabf.result?.shieldWearDamage ?? 0
    );
    if (!shieldId || !(damage > 0)) return ui.notifications?.warn('Sin desgaste que aplicar.');

    if (animabf.result?.shieldWearApplied) {
      return ui.notifications?.info('El desgaste ya se aplicó.');
    }

    const tokenId = ds.defToken ?? ds['def-token'] ?? animabf.defender?.tokenId ?? '';
    const actorId = ds.defActor ?? ds['def-actor'] ?? animabf.defender?.actorId ?? '';
    const token = tokenId ? canvas.tokens.get(tokenId) : null;
    const actor = token?.actor ?? (actorId ? game.actors.get(actorId) : null);
    if (!actor) return ui.notifications?.warn('Defensor no encontrado.');

    const canApply =
      game.user.isGM ||
      actor.testUserPermission?.(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER);
    if (!canApply) return ui.notifications?.warn('Sin permisos para desgastar el escudo.');

    await applyShieldWear(actor, shieldId, damage);
    ui.notifications?.info(`${actor.name}: escudo -${damage}`);

    // Marcar aplicado en el flag + re-renderizar la tarjeta.
    const updatedResult = { ...(animabf.result ?? {}), shieldWearApplied: true };
    await msg.setFlag(game.animabf.id, 'result', updatedResult);

    const renderFn = foundry.applications?.handlebars?.renderTemplate ?? renderTemplate;
    const { Templates } = await import('../../module/utils/constants.js');
    const content = await renderFn(Templates.Chat.CombatResult, {
      combatResult: updatedResult,
      defenderId: actorId,
      defenderTokenId: tokenId
    });
    await msg.update({ content });
  } catch (err) {
    console.error('[ABF] applyShieldWearActionHandler error:', err);
    ui.notifications?.error('No se pudo aplicar el desgaste al escudo.');
  }
}

export const action = 'apply-shield-wear';
