import { openOpposedCheckRollDialog } from '../../module/combat/maneuvers/OpposedCheckRollDialog.js';
import { resolveManeuverOpposedCheck } from '../../module/combat/maneuvers/resolveManeuverOpposedCheck.js';

const SYSTEM_ID = 'animabf';

/**
 * Roll the attacker's D10 for a maneuver opposed check.
 * Visible to everyone but only meaningful for: the attacker's owner or any GM.
 */
export const action = 'animabf-roll-maneuver-attacker';

export default async function rollManeuverAttackerActionHandler(message, _html, ds) {
  try {
    const msg = game.messages.get(ds.messageId ?? message.id);
    if (!msg) return;

    const flags = msg.flags?.[SYSTEM_ID];
    if (!flags || flags.kind !== 'maneuverOpposedCheck') return;
    if (flags.attackerRoll) return; // already rolled

    const attacker = game.actors?.get?.(flags.attackerId);
    if (!attacker) return ui.notifications?.warn('Actor atacante no encontrado.');

    const isOwner = attacker.testUserPermission?.(
      game.user,
      CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
    );
    if (!game.user.isGM && !isOwner) {
      return ui.notifications?.warn(
        'Solo el dueño del atacante (o el GM) puede tirar.'
      );
    }

    const def = game.animabf?.maneuvers?.get?.(flags.maneuverSlug);
    if (!def) return ui.notifications?.warn('Maniobra no encontrada en el registry.');

    const result = await openOpposedCheckRollDialog({
      role: 'attacker',
      actor: attacker,
      maneuver: def,
      damagePercent: flags.damagePercent ?? 100
    });
    if (!result) return;

    if (game.user.isGM || msg.user?.id === game.user.id || msg.isAuthor) {
      await msg.setFlag(SYSTEM_ID, 'attackerRoll', result);
      await resolveManeuverOpposedCheck(msg);
    } else {
      game.socket.emit('system.animabf', {
        op: 'updateManeuverRoll',
        messageId: msg.id,
        side: 'attacker',
        roll: result,
        from: game.user.id
      });
    }
  } catch (err) {
    console.error('[ABF] rollManeuverAttacker failed:', err);
    ui.notifications?.error('Error al tirar el atacante.');
  }
}
