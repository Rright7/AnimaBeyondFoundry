/**
 * Resuelve el Token en el canvas para una entrada de objetivo del ataque, soportando UUID
 * (Scene.X.Token.Y) o id crudo, con fallback por id de actor (misma escena primero).
 * @returns {Token|null}
 */
export function resolveTokenForTarget(t, message) {
  const id = t?.tokenUuid ?? '';
  // UUID path
  if (id && id.includes('.')) {
    try {
      const doc = fromUuidSync(id); // TokenDocument
      return doc?.object ?? null; // Token on canvas if present
    } catch {
      /* noop */
    }
  }
  // Raw canvas id
  if (id) {
    const onCanvas = canvas.tokens?.get?.(id);
    if (onCanvas) return onCanvas;
  }
  // Fallback by actor id (same scene first)
  const actorId = t?.actorUuid ?? '';
  if (actorId) {
    const sceneId = message?.speaker?.scene;
    if (sceneId) {
      const tok = game.scenes?.get(sceneId)?.tokens?.find(tt => tt.actorId === actorId);
      const live = tok ? canvas.tokens?.get?.(tok.id) : null;
      if (live) return live;
    }
    return canvas.tokens?.placeables?.find(tt => tt.actor?.id === actorId) ?? null;
  }
  return null;
}
