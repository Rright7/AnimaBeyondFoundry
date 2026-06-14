/**
 * Resuelve el Token "placeable" (canvas) a partir de un ref que puede ser
 * token uuid ("Scene.x.Token.y") | token id plano | (legacy) actor id.
 * Espejo de resolveActorFromRef pero devolviendo el TOKEN, no el actor:
 * las animaciones necesitan el placeable para atLocation()/stretchTo().
 * Devuelve null si no se puede resolver (escena no cargada, token borrado...).
 */
export function resolveTokenFromRef(ref) {
  if (!ref || typeof ref !== 'string') return null;

  // 1) Token UUID -> TokenDocument.object (placeable si la escena esta cargada).
  if (ref.includes('Token.')) {
    try {
      const doc = typeof fromUuidSync === 'function' ? fromUuidSync(ref) : null;
      if (doc?.object) return doc.object;
    } catch (e) {
      /* fall through */
    }
  }

  // 2) Token id plano en el canvas activo.
  const byId =
    canvas?.tokens?.get?.(ref) ?? canvas?.tokens?.placeables?.find?.(p => p.id === ref);
  if (byId) return byId;

  // 3) Actor id -> primer token activo de ese actor en la escena.
  const actor = game.actors?.get?.(ref);
  return (
    actor?.getActiveTokens?.(true, false)?.[0] ??
    canvas?.tokens?.placeables?.find?.(p => p?.actor?.id === ref) ??
    null
  );
}
