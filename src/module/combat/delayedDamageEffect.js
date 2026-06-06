// /module/combat/delayedDamageEffect.js
//
// Capa de runtime del daño retrasado (toca Foundry: PV del actor, flags,
// desangramiento). La aritmética/vencimiento vive en ./delayedDamage.js (puro,
// testeado). Aquí solo: procesar la cola de daños programados de un actor en una
// ronda dada, aplicando los vencidos (PV + desangrado) y conservando el resto.

import { splitDueDelayedDamage } from './delayedDamage.js';
import { startBleeding } from './bleedingEffect.js';
import { applyDamageToActor } from '../../utils/chatActionHandlers/applyDamageActionHandler.js';

const SYSTEM_ID = 'animabf';

/**
 * Aplica los daños programados que vencen en `currentRound` y deja en el flag
 * solo los pendientes. Cada daño vencido aplica PV y, si bleeding, dispara
 * desangramiento (físico). Guarded: no bloquea el avance de ronda si falla.
 * @param {object} actor
 * @param {number} currentRound
 */
export async function processDueDelayedDamage(actor, currentRound) {
  try {
    const list = actor?.getFlag?.(SYSTEM_ID, 'scheduledDamages');
    if (!Array.isArray(list) || list.length === 0) return;

    const { due, pending } = splitDueDelayedDamage(list, currentRound);
    if (due.length === 0) return;

    for (const entry of due) {
      const amount = Math.max(0, Math.round(Number(entry?.amount) || 0));
      if (amount > 0) await applyDamageToActor(actor, amount);
      // El daño retrasado siempre causa desangramiento (RAW). critType físico
      // para no quedar bloqueado por el filtro de energía.
      if (entry?.bleeding) await startBleeding(actor, { critType: 'cut' });
    }

    await actor.setFlag(SYSTEM_ID, 'scheduledDamages', pending);
  } catch (err) {
    console.error('[ABF] processDueDelayedDamage error:', err);
  }
}
