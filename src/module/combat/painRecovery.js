// El penalizador por DOLOR (system.general.modifiers.allActions.painPenalty.base) se
// recupera hacia 0 por asalto. El ritmo se mide sobre el penalizador SUFRIDO (el real,
// ya reducido por Ki/Nemesis): si algo lo reduce a la mitad, la base baja el doble para
// que el sufrido baje los 5. Aqui la aritmetica pura (testeada); `tickPainRecovery` es
// la integracion con Foundry (actor.update), no unit-testable.

import { painReductionDivisor } from './painReduction.js';

const PAIN_BASE_PATH = 'system.general.modifiers.allActions.painPenalty.base.value';

/**
 * Acerca el penalizador por dolor (<= 0) a 0 el ritmo indicado, sin pasarse.
 * @param {number} base penalizador actual (negativo = dolor; >= 0 no recupera nada).
 * @param {number} [rate=5] puntos que se recuperan por asalto.
 * @returns {number} nuevo penalizador (<= 0).
 */
export function recoverPain(base, rate = 5) {
  const b = Number(base) || 0;
  if (b >= 0) return 0;
  return Math.min(0, b + Math.abs(Number(rate) || 0));
}

/**
 * Recupera la BASE del dolor de modo que el penalizador SUFRIDO (el real, ya reducido)
 * baje `rate` por asalto. El sufrido es base/divisor, asi que la base debe bajar
 * divisor*rate para que el sufrido baje rate (mitad -> x2, cuarto -> x4). divisor
 * Infinity (inmune: el sufrido ya es 0) usa el ritmo normal.
 * @param {number} base
 * @param {{rate?:number, divisor?:number}} [opts] divisor de painReductionDivisor
 * @returns {number} nueva base (<= 0)
 */
export function recoverPainStep(base, { rate = 5, divisor = 1 } = {}) {
  const factor = isFinite(divisor) && divisor > 1 ? divisor : 1;
  return recoverPain(base, (Math.abs(Number(rate)) || 0) * factor);
}

/**
 * Aplica al actor la recuperacion de dolor de un asalto. El penalizador SUFRIDO baja
 * `rate` (5 por defecto) hacia 0; si una habilidad lo reduce a la mitad, la base baja el
 * doble para que el sufrido baje los 5. No-op si no hay dolor. @returns {Promise<void>}
 */
export async function tickPainRecovery(actor, rate = 5) {
  try {
    // El kiBonus (la reduccion) es DERIVADO y async; el llamador (ABFCombat.nextRound)
    // hace prepareActor justo antes para que aqui llegue calculado (si no, divisor sale 1
    // y la base baja 5 en vez de 10). Mantenemos este modulo libre de deps de Foundry.
    const m = actor?.system?.general?.modifiers ?? {};
    const base = Number(m.allActions?.painPenalty?.base?.value) || 0;
    if (base >= 0) return; // sin dolor pendiente
    const next = recoverPainStep(base, {
      rate,
      divisor: painReductionDivisor(m.kiBonus ?? {})
    });
    if (next !== base) await actor.update({ [PAIN_BASE_PATH]: next });
  } catch (err) {
    console.error('[ABF] tickPainRecovery error:', err);
  }
}
