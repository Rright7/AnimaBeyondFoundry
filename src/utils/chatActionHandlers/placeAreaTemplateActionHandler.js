// Boton "Colocar area" de la tarjeta de ataque: coloca INTERACTIVAMENTE (la plantilla
// sigue el cursor con snap al grid, clic izquierdo la fija) una plantilla circular del
// radio del conjuro (metros, unidades de la escena). Ademas, los tokens que queden
// DENTRO del area se anaden al flujo de defensa de la tarjeta (como objetivos pendientes)
// para que tiren su defensa/resistencia, igual que los objetivos apuntados al lanzar.

import { placeAreaTemplateInteractive, tokensInsideCircle } from '../placeAreaTemplate.js';
import { updateAttackTargetsFlag } from '../updateAttackTargetsFlag.js';

export default async function placeAreaTemplateActionHandler(message, _html, dataset) {
  try {
    const radius = Number(dataset.radius) || 0;
    if (radius <= 0) return;
    if (!canvas?.scene) return ui.notifications?.warn('No hay escena activa.');
    // Areas de escala narrativa (km-cosmicas: Caos, Armagedon...): una plantilla de ese
    // radio bloquearia el canvas. Se informa del valor real y no se dibuja.
    if (radius > 5000) {
      return ui.notifications?.info(
        `Área de ${radius} m: escala narrativa (>5 km), no se coloca plantilla táctica.`
      );
    }

    const placed = await placeAreaTemplateInteractive({
      distance: radius,
      flags: { animabf: { spellArea: true } }
    });
    if (!placed) return; // cancelado

    const messageId = dataset.messageId;
    const attackerId = dataset.attackerId;
    if (!messageId) return;

    // Objetivos ya presentes en la tarjeta (no re-anadir ni resetear su estado).
    const msg = game.messages.get(messageId);
    const existing = new Set(
      (msg?.getFlag(game.animabf.id, 'targets') ?? []).map(t => t.tokenUuid).filter(Boolean)
    );

    const contained = tokensInsideCircle(placed.x, placed.y, radius)
      .filter(t => t.actor?.id && t.actor.id !== attackerId) // no el propio lanzador
      .filter(t => !existing.has(t.document?.uuid ?? t.id));

    let added = 0;
    for (const t of contained) {
      const tokenUuid = t.document?.uuid ?? t.id ?? '';
      if (!tokenUuid) continue;
      await updateAttackTargetsFlag(messageId, {
        actorUuid: t.actor.id,
        tokenUuid,
        state: 'pending',
        label: t.name ?? t.actor?.name ?? '',
        updatedAt: Date.now()
      });
      added++;
    }

    ui.notifications?.info(
      added
        ? `${added} objetivo(s) dentro del área añadido(s) a la defensa.`
        : 'Ningún objetivo nuevo dentro del área.'
    );
  } catch (err) {
    console.error('[ABF] placeAreaTemplateActionHandler error:', err);
    ui.notifications?.error('No se pudo colocar la plantilla de área.');
  }
}

export const action = 'place-area-template';
