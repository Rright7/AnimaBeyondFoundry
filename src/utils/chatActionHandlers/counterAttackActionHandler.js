import { AttackConfigurationDialog } from '../../module/dialogs/AttackConfigurationDialog';
import { Templates } from '../../module/utils/constants.js';

// Mensajes en proceso (anti doble-click en el mismo cliente, antes de que la marca
// de "consumido" persista; la guardia por flag cubre el resto).
const inFlight = new Set();

/**
 * Boton "Contraatacar" del mensaje de resultado de combate (kind:'combatResult').
 * Aparece para el defensor (su owner / GM) cuando hubo defensa con exito y margen
 * de contra >= 0 (result.hasCounterAttack). Al pulsarlo abre el AttackConfigurationDialog
 * del DEFENSOR contra el AGRESOR original, con el bono de margen precargado. Es un
 * ataque normal (defendible y encadenable, RAW). Tras lanzarse, marca
 * result.counterAttackConsumed=true para que el boton no se reuse.
 */
export default async function counterAttackActionHandler(message, html, dataset) {
  const msg = game.messages.get(dataset.messageId ?? message?.id);
  if (!msg) return ui.notifications?.warn(game.i18n.localize('chat.common.msgNotFound'));

  if (inFlight.has(msg.id)) return;
  inFlight.add(msg.id);
  try {
    const animabf = msg.flags?.animabf ?? {};
    const result = animabf.result ?? {};

    if (!result.hasCounterAttack)
      return ui.notifications?.warn(game.i18n.localize('chat.counterAttack.notAvailable'));
    if (result.counterAttackConsumed)
      return ui.notifications?.warn(game.i18n.localize('chat.counterAttack.alreadyUsed'));

    // Defensor = quien contraataca.
    const defActorId = animabf.defender?.actorId ?? '';
    const defTokenId = animabf.defender?.tokenId ?? '';
    let defenderToken = defTokenId ? canvas.tokens?.get(defTokenId) : null;
    if (!defenderToken && defActorId)
      defenderToken = canvas.tokens?.placeables.find(t => t.actor?.id === defActorId) ?? null;
    if (!defenderToken?.actor)
      return ui.notifications?.warn(game.i18n.localize('chat.counterAttack.noDefenderToken'));

    // Permiso: GM u owner del defensor.
    if (!game.user.isGM) {
      const ok = defenderToken.actor.testUserPermission?.(
        game.user,
        CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
      );
      if (!ok)
        return ui.notifications?.warn(game.i18n.localize('chat.counterAttack.noPermission'));
    }

    // Feedback inmediato: desactiva el boton mientras se procesa (el re-render lo quita).
    html?.querySelector?.('[data-action="counter-attack"]')?.setAttribute('disabled', 'true');

    // Objetivo del contraataque = agresor original.
    const atkActorId = animabf.attacker?.actorId || animabf.attackData?.attackerId || '';
    const attackerToken = atkActorId
      ? canvas.tokens?.placeables.find(t => t.actor?.id === atkActorId) ?? null
      : null;
    const targets = [];
    if (attackerToken) {
      targets.push({
        actorUuid: attackerToken.actor.id,
        tokenUuid: attackerToken.document?.uuid ?? attackerToken.id,
        state: 'pending',
        label: attackerToken.name ?? attackerToken.actor.name ?? '',
        updatedAt: Date.now()
      });
    } else if (atkActorId) {
      targets.push({
        actorUuid: atkActorId,
        tokenUuid: '',
        state: 'pending',
        label: game.actors.get(atkActorId)?.name ?? '',
        updatedAt: Date.now()
      });
    }

    // Arma del defensor para contraatacar: la equipada o, en su defecto, la primera
    // de su perfil de combate (incluye "Desarmado"/"Artes Marciales").
    const weapons = defenderToken.actor.system?.combat?.weapons ?? [];
    const weaponId = (weapons.find(w => w.system?.equipped?.value) ?? weapons[0])?._id;

    const bonus = Number(result.counterAttackValue) || 0;

    new AttackConfigurationDialog(
      {
        attacker: defenderToken,
        weaponId,
        counterBonus: bonus,
        isCounterAttack: true,
        targets
      },
      { allowed: true }
    );

    await markCounterAttackConsumed(msg, animabf);
  } catch (err) {
    console.error('[ABF] counterAttackActionHandler error:', err);
    ui.notifications?.error(game.i18n.localize('chat.counterAttack.openFailed'));
  } finally {
    inFlight.delete(msg.id);
  }
}

export const action = 'counter-attack';

/**
 * Marca el resultado como contraataque consumido y re-renderiza el mensaje (oculta
 * el boton). El author del mensaje (el defensor) y el GM lo actualizan directo; el
 * resto lo proxya al GM por socket (mismo patron que critUpdate, con userId para
 * que el GM valide la autoria).
 * @param {ChatMessage} msg
 * @param {object} animabf flags.animabf del mensaje
 */
async function markCounterAttackConsumed(msg, animabf) {
  const result = { ...(animabf.result ?? {}), counterAttackConsumed: true };

  if (game.user.isGM || msg.isAuthor) {
    const renderFn = foundry.applications?.handlebars?.renderTemplate ?? renderTemplate;
    const content = await renderFn(Templates.Chat.CombatResult, {
      combatResult: result,
      defenderId: animabf.defender?.actorId ?? '',
      defenderTokenId: animabf.defender?.tokenId ?? ''
    });
    await msg.setFlag(game.animabf.id, 'result', result);
    await msg.update({ content });
  } else {
    game.socket.emit('system.animabf', {
      op: 'critUpdate',
      messageId: msg.id,
      userId: game.user.id,
      patch: { counterAttackConsumed: true }
    });
  }
}
