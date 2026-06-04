// /module/combat/maneuvers/areaTemplate.js
//
// Capa de runtime para el ataque en área (Lluvia de proyectiles): crea una
// plantilla circular visual centrada en un punto y detecta los tokens dentro del
// radio. No unit-testable (depende de canvas/escena de Foundry). La aritmética
// del radio vive en ../lluviaProyectiles.js (pura, testeada).
//
// Modelo de colocación: el jugador coloca el área LIBREMENTE con el cursor
// (pickAreaCenter: previsualización circular que sigue el ratón + clic izquierdo
// para confirmar el centro). La detección por distancia (tokensInRadius) es
// independiente de la plantilla visual, así que el ataque funciona aunque la
// creación de la plantilla falle.

/**
 * Deja al jugador elegir el centro del área en el canvas. Muestra un círculo de
 * previsualización (radio real) que sigue al cursor; clic izquierdo confirma y
 * resuelve {x, y} en coordenadas de mundo, clic derecho o Esc cancela (null).
 * La previsualización es best-effort (si falla, el clic sigue funcionando).
 * @param {number} radiusMeters
 * @returns {Promise<{x:number,y:number}|null>}
 */
export async function pickAreaCenter(radiusMeters) {
  return new Promise(resolve => {
    let done = false;
    let preview = null;
    const radius = Math.max(1, Number(radiusMeters) || 1);
    const dim = canvas?.dimensions;
    const radiusPx = radius * ((dim?.size ?? 100) / (dim?.distance ?? 1));
    const board = document.getElementById('board') ?? canvas?.app?.view ?? null;
    const onCanvas = ev => !board || ev.target === board || board.contains?.(ev.target);

    const drawAt = (x, y) => {
      if (!preview) return;
      preview.clear();
      preview.lineStyle(2, 0xaa0000, 0.9);
      preview.beginFill(0xaa0000, 0.15);
      preview.drawCircle(x, y, radiusPx);
      preview.endFill();
    };

    const finish = result => {
      if (done) return;
      done = true;
      try { document.removeEventListener('pointermove', onMove, true); } catch (e) { /* noop */ }
      try { document.removeEventListener('pointerdown', onDown, true); } catch (e) { /* noop */ }
      try { window.removeEventListener('keydown', onKey, true); } catch (e) { /* noop */ }
      try {
        if (preview) {
          preview.parent?.removeChild(preview);
          preview.destroy();
        }
      } catch (e) { /* noop */ }
      resolve(result);
    };

    const onMove = () => {
      const p = canvas.mousePosition;
      if (p) drawAt(p.x, p.y);
    };

    const onDown = ev => {
      // Clic fuera del canvas (ficha/UI) → no interferir.
      if (!onCanvas(ev)) return;
      // Captura el clic ANTES que el token (que si no abriría su ficha) y lo consume.
      ev.preventDefault();
      ev.stopPropagation();
      if (typeof ev.stopImmediatePropagation === 'function') ev.stopImmediatePropagation();
      const btn = ev.button ?? 0;
      if (btn === 2) return finish(null); // clic derecho cancela
      if (btn !== 0) return;
      const p = canvas.mousePosition;
      finish(p ? { x: p.x, y: p.y } : null);
    };

    const onKey = e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        finish(null);
      }
    };

    try {
      preview = new PIXI.Graphics();
      (canvas.templates?.preview ?? canvas.stage).addChild(preview);
      const p = canvas.mousePosition;
      if (p) drawAt(p.x, p.y);
    } catch (err) {
      console.warn('[ABF] previsualización de área falló (sigue por clic):', err);
      preview = null;
    }

    ui.notifications?.info(
      'Lluvia de proyectiles: clic izquierdo para colocar el área · clic derecho o Esc para cancelar.'
    );
    // Captura en document (fase de captura): intercepta el clic antes que PIXI/el
    // token, así se puede colocar el área incluso encima de tokens.
    document.addEventListener('pointermove', onMove, true);
    document.addEventListener('pointerdown', onDown, true);
    window.addEventListener('keydown', onKey, true);
  });
}

/**
 * Crea una plantilla circular (MeasuredTemplate) visible en la escena, centrada
 * en (centerX, centerY) con radio en unidades de la escena (metros). Guarded:
 * devuelve el documento creado o null.
 * @param {number} centerX
 * @param {number} centerY
 * @param {number} radiusMeters
 * @returns {Promise<object|null>}
 */
export async function createAreaTemplate(centerX, centerY, radiusMeters) {
  try {
    const radius = Math.max(1, Number(radiusMeters) || 1);
    const data = {
      t: 'circle',
      user: game.user.id,
      distance: radius,
      direction: 0,
      x: centerX,
      y: centerY,
      fillColor: game.user?.color || '#aa0000',
      flags: { animabf: { areaAttack: true } }
    };
    const [doc] = await canvas.scene.createEmbeddedDocuments('MeasuredTemplate', [data]);
    return doc ?? null;
  } catch (err) {
    console.error('[ABF] createAreaTemplate error:', err);
    return null;
  }
}

/**
 * Tokens cuyo centro cae dentro del círculo (centerX, centerY, radiusMeters),
 * excluyendo al atacante. Devuelve el formato de getSnapshotTargets para encajar
 * en el flujo multiDefensa.
 * @param {number} centerX
 * @param {number} centerY
 * @param {number} radiusMeters
 * @param {{excludeActorId?: string}} [opts]
 * @returns {Array<{actorUuid:string, tokenUuid:string, state:string, label:string, updatedAt:number}>}
 */
export function tokensInRadius(centerX, centerY, radiusMeters, { excludeActorId } = {}) {
  const out = [];
  const dim = canvas?.dimensions;
  if (!dim || !dim.distance) return out;
  // metros → píxeles: size px por casilla / distance unidades por casilla.
  const radiusPx = (Number(radiusMeters) || 0) * (dim.size / dim.distance);

  for (const token of canvas.tokens?.placeables ?? []) {
    if (!token?.actor) continue;
    if (excludeActorId && token.actor.id === excludeActorId) continue;
    const c = token.center;
    if (!c) continue;
    if (Math.hypot(c.x - centerX, c.y - centerY) <= radiusPx) {
      out.push({
        actorUuid: token.actor.id,
        tokenUuid: token.document?.uuid ?? token.id,
        state: 'pending',
        label: token.name ?? token.actor.name ?? '',
        updatedAt: Date.now()
      });
    }
  }
  return out;
}
