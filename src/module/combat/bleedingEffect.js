// /module/combat/bleedingEffect.js
//
// Capa de runtime del desangramiento (toca Foundry: efecto, PV del actor).
// La aritmética vive en ./bleeding.js (pura, testeada). Aquí solo la
// integración: crear/quitar el efecto "Desangrándose", avanzar el sangrado por
// asaltos y aplicar la pérdida de PV.
//
// NOTA: este módulo no es unit-testable sin Foundry (createEmbeddedDocuments,
// actor.update, packs). Su lógica numérica está cubierta por bleeding.test.js.

import {
  BLEEDING_EFFECT_NAME,
  advanceBleeding,
  bleedingActionPenalty,
  isImmuneToBleeding,
  critTypeCausesBleeding
} from './bleeding.js';

const SYSTEM_ID = 'animabf';
const ALL_ACTIONS_PATH = 'system.general.modifiers.allActions.final.value';
const LIFE_PATH = 'system.characteristics.secondaries.lifePoints.value';

/** El item-efecto "Desangrándose" del actor, si lo tiene. */
function findBleedingItem(actor) {
  const items = actor?.items?.contents ?? actor?.items ?? [];
  return [...items].find(i => i?.type === 'effect' && i?.name === BLEEDING_EFFECT_NAME) ?? null;
}

/**
 * Inicia el desangramiento en el actor (si no es inmune, el crítico es físico,
 * y no está ya sangrando). Crea el efecto "Desangrándose" desde el compendio.
 * @param {object} actor
 * @param {{critType?:string}} [opts] tipo de crítico (energía no desangra)
 * @returns {Promise<boolean>} true si se inició
 */
export async function startBleeding(actor, { critType } = {}) {
  try {
    if (!actor || isImmuneToBleeding(actor)) return false;
    if (critType && !critTypeCausesBleeding(critType)) return false;
    if (findBleedingItem(actor)) return false; // no apila

    const pack = game.packs?.get?.(`${SYSTEM_ID}.effects`);
    if (!pack) return false;
    const docs = await pack.getDocuments();
    const source = docs.find(d => d.name === BLEEDING_EFFECT_NAME);
    if (!source) {
      ui.notifications?.warn(`Efecto "${BLEEDING_EFFECT_NAME}" no encontrado en el compendio.`);
      return false;
    }
    const data = source.toObject();
    delete data._id;
    delete data._key;
    delete data.folder;
    data.flags = {
      ...(data.flags ?? {}),
      [SYSTEM_ID]: { ...(data.flags?.[SYSTEM_ID] ?? {}), bleeding: { pvLost: 0, asaltos: 0 } }
    };
    await actor.createEmbeddedDocuments('Item', [data]);
    return true;
  } catch (err) {
    console.error('[ABF] startBleeding error:', err);
    return false;
  }
}

/**
 * Avanza el sangrado `ticks` asaltos: aplica los PV perdidos al actor y
 * actualiza el penalizador a la acción (−10 por cada 5 PV). Si los PV llegan a
 * 0, detiene el sangrado (el resto —inconsciencia— lo gestiona el flujo de PV).
 * @param {object} actor
 * @param {number} [ticks=1]
 */
export async function tickBleeding(actor, ticks = 1) {
  try {
    const item = findBleedingItem(actor);
    if (!item) return;

    const state = item.getFlag?.(SYSTEM_ID, 'bleeding') ?? { pvLost: 0, asaltos: 0 };
    const next = advanceBleeding(state, ticks);

    if (next.pvApplied > 0) {
      const life = Number(foundry.utils.getProperty(actor, LIFE_PATH) ?? 0);
      const newLife = life - next.pvApplied;
      await actor.update({ [LIFE_PATH]: newLife });
      if (newLife <= 0) {
        await stopBleeding(actor);
        return;
      }
    }

    // Actualiza estado + penalizador (−10 por cada 5 PV). El cambio de
    // penalizador solo ocurre cada 5 PV (≈100 asaltos), así que casi nunca
    // varía dentro de un combate.
    const penalty = bleedingActionPenalty(next.pvLost);
    const changes = foundry.utils.duplicate(item.system?.effectData?.changes ?? []);
    const idx = changes.findIndex(c => c.key === ALL_ACTIONS_PATH);
    if (idx >= 0) changes[idx] = { ...changes[idx], value: String(penalty) };

    await item.update({
      [`flags.${SYSTEM_ID}.bleeding`]: next,
      'system.effectData.changes': changes
    });
  } catch (err) {
    console.error('[ABF] tickBleeding error:', err);
  }
}

/**
 * Detiene el desangramiento (al tratarse con Medicina o llegar a 0 PV):
 * elimina el efecto "Desangrándose".
 * @param {object} actor
 */
export async function stopBleeding(actor) {
  try {
    const item = findBleedingItem(actor);
    if (item) await item.delete();
  } catch (err) {
    console.error('[ABF] stopBleeding error:', err);
  }
}
