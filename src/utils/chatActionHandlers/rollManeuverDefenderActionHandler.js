import { openOpposedCheckRollDialog } from '../../module/combat/maneuvers/OpposedCheckRollDialog.js';
import { resolveManeuverOpposedCheck } from '../../module/combat/maneuvers/resolveManeuverOpposedCheck.js';

const SYSTEM_ID = 'animabf';

export const action = 'animabf-roll-maneuver-defender';

export default async function rollManeuverDefenderActionHandler(message, _html, ds) {
  try {
    const msg = game.messages.get(ds.messageId ?? message.id);
    if (!msg) return;

    const flags = msg.flags?.[SYSTEM_ID];
    if (!flags || flags.kind !== 'maneuverOpposedCheck') return;
    if (flags.defenderRoll) return;

    // Token-aware resolution: prefer the stored token ref so an unlinked
    // token rolls with its own characteristics/AE, not the base sidebar actor.
    const { resolveActorFromRef } = await import(
      '../../module/actor/utils/resolveActorForRoll.js'
    );
    const defender =
      resolveActorFromRef(flags.defenderTokenUuid) ??
      resolveActorFromRef(flags.defenderId);
    if (!defender) return ui.notifications?.warn('Actor defensor no encontrado.');

    const isOwner = defender.testUserPermission?.(
      game.user,
      CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
    );
    if (!game.user.isGM && !isOwner) {
      return ui.notifications?.warn(
        'Solo el dueño del defensor (o el GM) puede tirar.'
      );
    }

    const def = game.animabf?.maneuvers?.get?.(flags.maneuverSlug);
    if (!def) return ui.notifications?.warn('Maniobra no encontrada en el registry.');

    const result = await openOpposedCheckRollDialog({
      role: 'defender',
      actor: defender,
      maneuver: def,
      damagePercent: flags.damagePercent ?? 100,
      defenderIsQuadruped: !!flags.defenderIsQuadruped
    });
    if (!result) return;

    if (game.user.isGM || msg.user?.id === game.user.id || msg.isAuthor) {
      await msg.setFlag(SYSTEM_ID, 'defenderRoll', result);
      await resolveManeuverOpposedCheck(msg);
    } else {
      game.socket.emit('system.animabf', {
        op: 'updateManeuverRoll',
        messageId: msg.id,
        side: 'defender',
        roll: result,
        from: game.user.id
      });
    }
  } catch (err) {
    console.error('[ABF] rollManeuverDefender failed:', err);
    ui.notifications?.error('Error al tirar el defensor.');
  }
}
