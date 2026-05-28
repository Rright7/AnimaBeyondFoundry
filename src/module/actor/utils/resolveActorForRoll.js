/**
 * Resolve the Actor instance to use for a roll/combat resolution.
 *
 * For UNLINKED tokens the per-scene token actor and the base actor (in the
 * sidebar) diverge: AE applied to the unlinked token only exist on the token
 * actor. If a roll reads `game.actors.get(actorId)` it will miss those AE.
 *
 * Resolution priority:
 *   1. token by tokenId on the active canvas
 *   2. token by tokenId scanned across placeables (any scene loaded)
 *   3. token whose actor.id matches actorId, anywhere on the canvas
 *   4. base actor `game.actors.get(actorId)` (only as last resort)
 *
 * @param {object} opts
 * @param {string} [opts.tokenId]
 * @param {string} [opts.actorId]
 * @returns {Actor|null}
 */
export function resolveActorForRoll({ tokenId, actorId } = {}) {
  // 1. tokenId on the current scene
  if (tokenId) {
    const t = canvas.tokens?.get?.(tokenId);
    if (t?.actor) return t.actor;
  }

  // 2. tokenId across placeables
  if (tokenId) {
    const t = canvas.tokens?.placeables?.find?.(p => p.id === tokenId);
    if (t?.actor) return t.actor;
  }

  // 3. actorId via token (covers unlinked tokens we don't know the id of)
  if (actorId) {
    const t = canvas.tokens?.placeables?.find?.(p => p?.actor?.id === actorId);
    if (t?.actor) return t.actor;
  }

  // 4. base actor (last resort — misses unlinked AE)
  if (actorId) {
    return game.actors?.get?.(actorId) ?? null;
  }

  return null;
}
