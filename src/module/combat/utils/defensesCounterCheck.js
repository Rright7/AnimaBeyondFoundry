import { martialArtExtraDefenses } from '../martialArts/martialArtSpecials.js';

// Penalizador por defensa multiple (RAW Core Exxet, Tabla 44), por ORDEN 0-based de
// la defensa en el asalto: 1a (0) -> 0; 2a (1) -> -30; 3a (2) -> -50; 4a (3) -> -70;
// 5a+ -> -90. Devuelve NEGATIVO. Fuente unica de verdad (la usan el dialogo manual y
// la auto-defensa).
const MULTIPLE_DEFENSE_PENALTY = [0, -30, -50, -70, -90];

/**
 * Penalizador (negativo) por defensa multiple. Permite eximir defensas:
 *  - freeDefenses: desplaza la progresion N pasos (las primeras N+1 defensas a 0).
 *  - neverPenalty: exencion total (siempre 0; cortocircuito ANTES del clamp).
 * @param {number} accumulated  orden 0-based (1a defensa = 0)
 * @param {{freeDefenses?:number, neverPenalty?:boolean}} [opts]
 * @returns {number} penalizador negativo (0, -30, -50, -70, -90)
 */
export const defensesCounterCheck = (
  accumulated,
  { freeDefenses = 0, neverPenalty = false } = {}
) => {
  if (neverPenalty) return 0;
  const idx = Math.max(0, (Number(accumulated) || 0) - (Number(freeDefenses) || 0));
  return MULTIPLE_DEFENSE_PENALTY[Math.min(idx, 4)];
};

/**
 * Margen de "defensas adicionales sin penalizador" del actor: Artes Marciales
 * (Lama/Lama Tsu, automatico) MAS el extra manual de Opciones Avanzadas
 * (system.general.settings.extraDefensesBonus). El never (exencion total) sale solo
 * de las AM. Listo para pasar como opts a defensesCounterCheck.
 * @param {object} actor
 * @returns {{freeDefenses:number, neverPenalty:boolean}}
 */
export function freeDefensesFor(actor) {
  const am = martialArtExtraDefenses(actor);
  const manual = Math.max(
    0,
    Number(actor?.system?.general?.settings?.extraDefensesBonus?.value) || 0
  );
  return { freeDefenses: (am.count || 0) + manual, neverPenalty: !!am.never };
}
