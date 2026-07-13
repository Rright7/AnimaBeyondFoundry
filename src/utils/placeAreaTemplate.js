// Colocacion INTERACTIVA de una plantilla circular de area: sigue el cursor por el
// mapa; clic izquierdo la fija, clic derecho (o Esc via contextmenu) cancela. El radio
// va en metros y se dibuja en las unidades de la escena. Usa las APIs de canvas de
// Foundry V13 (CONFIG.MeasuredTemplate + la capa de preview de plantillas), al estilo
// del AbilityTemplate de dnd5e.

export async function placeAreaTemplateInteractive({ distance, flags = {} }) {
  if (!canvas?.ready || !canvas.scene) {
    ui.notifications?.warn('No hay escena activa.');
    return false;
  }

  const DocCls = CONFIG.MeasuredTemplate.documentClass;
  const ObjCls = CONFIG.MeasuredTemplate.objectClass;

  // Ajusta el punto al grid de la escena (centros y vertices de casilla). En escenas sin
  // grid, getSnappedPoint devuelve el punto tal cual -> colocacion libre.
  const snap = point => {
    try {
      const M = CONST.GRID_SNAPPING_MODES;
      return canvas.grid.getSnappedPoint(point, { mode: M.CENTER | M.VERTEX, resolution: 1 });
    } catch (e) {
      return point;
    }
  };

  const start = snap(
    canvas.mousePosition ?? { x: canvas.dimensions.width / 2, y: canvas.dimensions.height / 2 }
  );

  const doc = new DocCls(
    {
      t: 'circle',
      user: game.user.id,
      distance,
      direction: 0,
      x: start.x,
      y: start.y,
      fillColor: game.user?.color?.toString?.() ?? undefined,
      flags
    },
    { parent: canvas.scene }
  );
  const template = new ObjCls(doc);

  const layer = canvas.templates;
  const initialLayer = canvas.activeLayer;
  layer.activate();
  await template.draw();
  layer.preview.addChild(template);

  ui.notifications?.info('Clic izquierdo para colocar el área · clic derecho para cancelar.');

  return new Promise(resolve => {
    let done = false;
    const savedCtx = canvas.app?.view ? canvas.app.view.oncontextmenu : null;

    const cleanup = () => {
      if (done) return;
      done = true;
      canvas.stage.off('pointermove', onMove);
      canvas.stage.off('pointerdown', onDown);
      if (canvas.app?.view) canvas.app.view.oncontextmenu = savedCtx;
      try {
        layer.preview?.removeChild(template);
        template.destroy();
      } catch (e) {
        /* noop */
      }
      initialLayer?.activate?.();
    };

    const onMove = () => {
      const raw = canvas.mousePosition;
      if (!raw) return;
      const p = snap(raw);
      template.document.updateSource({ x: p.x, y: p.y });
      template.refresh();
    };

    const onDown = async event => {
      const button = event?.button ?? 0;
      if (button === 0) {
        event?.stopPropagation?.();
        const data = template.document.toObject();
        cleanup();
        const created = await canvas.scene.createEmbeddedDocuments('MeasuredTemplate', [data]);
        resolve(created?.[0] ?? data);
      } else if (button === 2) {
        cleanup();
        resolve(false);
      }
    };

    if (canvas.app?.view) {
      canvas.app.view.oncontextmenu = e => {
        e.preventDefault();
        cleanup();
        resolve(false);
      };
    }
    canvas.stage.on('pointermove', onMove);
    canvas.stage.on('pointerdown', onDown);
  });
}

// Tokens cuyo centro cae dentro de un circulo (centro en px de canvas, radio en metros
// de escena). distancePixels = px por unidad de la escena.
export function tokensInsideCircle(cx, cy, radiusMeters) {
  const dp =
    canvas?.dimensions?.distancePixels ??
    (canvas?.scene?.grid?.size ?? 100) / (canvas?.scene?.grid?.distance ?? 1);
  const pixelRadius = radiusMeters * dp;
  return (canvas?.tokens?.placeables ?? []).filter(t => {
    const c = t.center;
    return c && Math.hypot(c.x - cx, c.y - cy) <= pixelRadius;
  });
}
