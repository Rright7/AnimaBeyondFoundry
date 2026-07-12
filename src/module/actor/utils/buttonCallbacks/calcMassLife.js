import { massLifePool } from '../../../combat/massCombat.js';

/**
 * Boton "Calcular vida de la masa" (seccion Masa de enemigos). El sheet tiene
 * submitOnChange=false, asi que primero guarda la config tecleada (sin re-render) y luego
 * fija la Vida del actor = PV totales de la masa (vida base x nº, con los redondeos del
 * manual). Registrado automaticamente por createClickHandlers (export nombrado).
 */
export async function calcMassLife(sheet) {
  if (!sheet?.actor) return;
  // Persistir lo tecleado en la seccion (nº, vida base, ¿acumulan?) antes de calcular.
  await sheet.submit({ preventClose: true, preventRender: true });

  const s = sheet.actor.system?.general?.settings?.mass ?? {};
  const pool = massLifePool({
    count: Number(s.count?.value) || 0,
    pv: Number(s.baseLife?.value) || 0,
    accumulates: !!s.accumulates?.value
  });

  // lifePoints = { value, max } con max/value NUMEROS planos (no {value}).
  await sheet.actor.update({
    'system.characteristics.secondaries.lifePoints.max': pool,
    'system.characteristics.secondaries.lifePoints.value': pool
  });
  ui.notifications?.info(`Vida de la masa fijada a ${pool}.`);
}
