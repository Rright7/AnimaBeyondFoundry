/**
 * Keeps the relational grapple flags in sync with the underlying Active
 * Effect items. When a Parálisis (parcial / total / completa) item is
 * removed from the defender, the defender's `grappledBy` flag and the
 * attacker's `grappling` flag must be cleared too. Same when the
 * attacker's "Apresando" item is removed.
 *
 * Hook: deleteItem.
 *
 * Registered from animabf.mjs at ready time.
 */

const SYSTEM_ID = 'animabf';

const PARALYSIS_NAMES = new Set([
  'Parálisis menor',
  'Parálisis parcial',
  'Parálisis total',
  'Parálisis completa'
]);

const ATTACKER_NAMES = new Set(['Apresando']);

export function registerGrappleRelationalSync() {
  Hooks.on('deleteItem', async (item, options, userId) => {
    try {
      if (!item || item.type !== 'effect') return;
      if (game.user.id !== userId) return; // single-client guard

      const actor = item.actor;
      if (!actor) return;

      // Defender side: a paralysis was lifted → clear defender flags and
      // the attacker's grappling flag too.
      if (PARALYSIS_NAMES.has(item.name)) {
        const attackerId = actor.getFlag(SYSTEM_ID, 'grappledBy');
        await actor.unsetFlag(SYSTEM_ID, 'grappledBy');
        await actor.unsetFlag(SYSTEM_ID, 'grappleWasUnarmed');
        if (attackerId) {
          const attacker = game.actors?.get(attackerId);
          if (attacker?.getFlag(SYSTEM_ID, 'grappling') === actor.id) {
            await attacker.unsetFlag(SYSTEM_ID, 'grappling');
          }
        }
        return;
      }

      // Attacker side: Apresando lifted → clear attacker's grappling and
      // mirror flags on the defender (he may still keep the paralysis
      // until naturally removed, but the relational pointer is gone).
      if (ATTACKER_NAMES.has(item.name)) {
        const defenderId = actor.getFlag(SYSTEM_ID, 'grappling');
        await actor.unsetFlag(SYSTEM_ID, 'grappling');
        if (defenderId) {
          const defender = game.actors?.get(defenderId);
          if (defender?.getFlag(SYSTEM_ID, 'grappledBy') === actor.id) {
            await defender.unsetFlag(SYSTEM_ID, 'grappledBy');
            await defender.unsetFlag(SYSTEM_ID, 'grappleWasUnarmed');
          }
        }
      }
    } catch (err) {
      console.warn('[ABF] grappleRelationalSync failed:', err);
    }
  });
}
