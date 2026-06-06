/**
 * Keeps the relational grapple flags in sync with the underlying Active
 * Effect items. When a Parálisis (parcial / completa) item is removed from the
 * defender, the defender's `grappledBy` flag and the attacker's `grappling`
 * flag must be cleared too. Same when the attacker's "Apresando" item is
 * removed.
 *
 * The grapple flags store a TOKEN REF (token uuid preferred, token id, or a
 * legacy actor id) — see resolveManeuverOpposedCheck. So the reciprocal actor
 * is resolved with resolveActorFromRef, not game.actors.get, and the
 * back-pointer is matched by resolving it to the SAME actor rather than by
 * comparing against a bare actor id (which would never match a token ref).
 *
 * Hook: deleteItem.
 *
 * Registered from animabf.mjs at ready time.
 */

import { resolveActorFromRef } from '../../actor/utils/resolveActorForRoll.js';

const SYSTEM_ID = 'animabf';

// "Parálisis total" is intentionally absent: it is the same state as
// "completa", whose standard name the system uses everywhere.
const PARALYSIS_NAMES = new Set([
  'Parálisis menor',
  'Parálisis parcial',
  'Parálisis completa'
]);

const ATTACKER_NAMES = new Set(['Apresando']);

/**
 * True when `ref` resolves to `actor` (same Actor document). Token refs and
 * actor ids both resolve through resolveActorFromRef, so this matches a
 * back-pointer regardless of which format it was stored in.
 */
function refPointsAt(ref, actor) {
  if (!ref || !actor) return false;
  const resolved = resolveActorFromRef(ref);
  return !!resolved && resolved === actor;
}

export function registerGrappleRelationalSync() {
  Hooks.on('deleteItem', async (item, options, userId) => {
    try {
      if (!item || item.type !== 'effect') return;
      if (game.user.id !== userId) return;

      const actor = item.actor;
      if (!actor) return;

      if (PARALYSIS_NAMES.has(item.name)) {
        const attackerRef = actor.getFlag(SYSTEM_ID, 'grappledBy');
        await actor.unsetFlag(SYSTEM_ID, 'grappledBy');
        await actor.unsetFlag(SYSTEM_ID, 'grappleWasUnarmed');
        if (attackerRef) {
          const attacker = resolveActorFromRef(attackerRef);
          if (
            attacker &&
            refPointsAt(attacker.getFlag(SYSTEM_ID, 'grappling'), actor)
          ) {
            await attacker.unsetFlag(SYSTEM_ID, 'grappling');
          }
        }
        return;
      }

      if (ATTACKER_NAMES.has(item.name)) {
        const defenderRef = actor.getFlag(SYSTEM_ID, 'grappling');
        await actor.unsetFlag(SYSTEM_ID, 'grappling');
        if (defenderRef) {
          const defender = resolveActorFromRef(defenderRef);
          if (
            defender &&
            refPointsAt(defender.getFlag(SYSTEM_ID, 'grappledBy'), actor)
          ) {
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
