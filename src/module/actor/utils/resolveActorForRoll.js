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
  if (tokenId) {
    const t = canvas.tokens?.get?.(tokenId);
    if (t?.actor) return t.actor;
  }

  if (tokenId) {
    const t = canvas.tokens?.placeables?.find?.(p => p.id === tokenId);
    if (t?.actor) return t.actor;
  }

  if (actorId) {
    const t = canvas.tokens?.placeables?.find?.(p => p?.actor?.id === actorId);
    if (t?.actor) return t.actor;
  }

  if (actorId) {
    return game.actors?.get?.(actorId) ?? null;
  }

  return null;
}

/**
 * Resolve an Actor from a stored relational REFERENCE. The ref may be, in
 * order of preference:
 *   1. a full Token UUID ("Scene.<id>.Token.<id>" or an embedded token uuid)
 *      -> resolved via fromUuidSync to its `.actor`
 *   2. a plain token id (a 16-char Foundry id of a token placed on a scene)
 *      -> resolved by scanning the canvas placeables
 *   3. a plain actor id (legacy data) -> resolved via game.actors.get
 *
 * Preferring the token resolution is what makes relational state (grapples,
 * etc.) point at the UNLINKED token actor on the map rather than the base
 * sidebar actor. Two unlinked tokens of the same base actor share an actor id,
 * so a token ref is the only unambiguous handle for them.
 *
 * Every step is defensive; a failed resolution falls through to the next.
 *
 * @param {string} ref token uuid, token id, or actor id
 * @returns {Actor|null}
 */
export function resolveActorFromRef(ref) {
  if (!ref || typeof ref !== 'string') return null;

  // 1) Full token UUID.
  if (ref.includes('Token.')) {
    try {
      const doc = typeof fromUuidSync === 'function' ? fromUuidSync(ref) : null;
      if (doc?.actor) return doc.actor;
      if (doc?.documentName === 'Actor') return doc;
    } catch (e) {
      // fall through
    }
  }

  // 2) Plain token id on the canvas (the unlinked-token case).
  const byTokenId =
    canvas?.tokens?.get?.(ref) ??
    canvas?.tokens?.placeables?.find?.(p => p.id === ref);
  if (byTokenId?.actor) return byTokenId.actor;

  // 3) Plain actor id (legacy / linked actors).
  return game.actors?.get?.(ref) ?? null;
}

/**
 * Build the most stable stored reference for an actor given an optional token
 * handle. Prefers the token's full UUID (unambiguous across scenes and for
 * unlinked tokens), then a plain token id, then the actor id as a last resort.
 *
 * Used when persisting relational state (e.g. the grapple `grappling` /
 * `grappledBy` flags) so the stored value resolves back to the right token
 * actor via resolveActorFromRef.
 *
 * @param {object} opts
 * @param {Actor} [opts.actor]
 * @param {string} [opts.tokenUuid] full token uuid if already known
 * @param {string} [opts.tokenId]   plain token id if already known
 * @returns {string} a ref string ('' if nothing resolvable)
 */
export function buildActorRef({ actor, tokenUuid, tokenId } = {}) {
  if (tokenUuid) return String(tokenUuid);
  if (tokenId) return String(tokenId);

  // Derive a token from the actor when no explicit handle was given.
  const token =
    actor?.token ?? // unlinked: the actor's own TokenDocument
    actor?.getActiveTokens?.()?.[0]?.document ??
    actor?.getActiveTokens?.()?.[0] ??
    null;
  if (token?.uuid) return String(token.uuid);
  if (token?.id) return String(token.id);

  return actor?.id ? String(actor.id) : '';
}
