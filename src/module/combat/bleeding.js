// /module/combat/bleeding.js
//
// Desangramiento — Anima Beyond Fantasy (Core Exxet, "Desangrarse").
//
// RAW: cualquier crítico (aunque no produzca efectos) provoca pérdida de
// sangre: el afectado pierde 1 PV por MINUTO hasta que pueda tratar sus heridas
// y estabilizarse. Cada 5 PV perdidos así sufre además un penalizador de -10 a
// la acción. Si llega a 0 PV por este daño, cae inconsciente y deja de sangrar.
// Es inmune quien tenga un índice de regeneración >= 6, los seres sin sangre /
// con acumulación, y no lo provocan los ataques de Calor/Frío/Electricidad.
//
// En combate, 1 minuto ≈ 20 asaltos (un asalto ≈ 3 s), así que el tick es de
// 1 PV cada 20 asaltos. Este módulo es PURO (sin dependencias de Foundry): solo
// la aritmética del sangrado; la integración (efecto, tick por rondas, disparo
// en críticos, tratamiento) vive en ABFCombat / ABFActor / el handler de crítico.

/** Nombre del efecto que representa el estado de desangramiento en la ficha. */
export const BLEEDING_EFFECT_NAME = 'Desangrándose';

/** 1 PV por minuto ≈ 1 PV cada 20 asaltos. */
export const ASALTOS_PER_PV = 20;

/** Índice de regeneración a partir del cual el ser no sufre desangramiento. */
export const REGEN_IMMUNITY_THRESHOLD = 6;

/** Tipos de crítico FÍSICO (FIL/PEN/CON) que SÍ desangran. */
export const PHYSICAL_CRIT_TYPES = ['cut', 'thrust', 'impact'];

/**
 * Penalizador a la acción por desangramiento: -10 por cada 5 PV perdidos así.
 * @param {number} pvLost — PV perdidos acumulados por desangramiento
 * @returns {number} penalizador (<= 0)
 */
export function bleedingActionPenalty(pvLost) {
  const n = Math.max(0, Math.floor(Number(pvLost) || 0));
  // `|| 0` evita el -0 que produce `-10 * 0`.
  return -10 * Math.floor(n / 5) || 0;
}

/**
 * Avanza el sangrado `ticks` asaltos. Aplica 1 PV por cada bloque de
 * ASALTOS_PER_PV asaltos acumulados que se cruce. Puro: no muta entradas.
 *
 * @param {{pvLost?:number, asaltos?:number}} state estado previo
 * @param {number} [ticks=1] asaltos a avanzar
 * @returns {{pvLost:number, asaltos:number, pvApplied:number}}
 *   nuevo estado + cuántos PV se pierden en este avance
 */
export function advanceBleeding(state, ticks = 1) {
  const pvLost0 = Math.max(0, Math.floor(Number(state?.pvLost) || 0));
  const asaltos0 = Math.max(0, Math.floor(Number(state?.asaltos) || 0));
  const t = Math.max(0, Math.floor(Number(ticks) || 0));
  const asaltos = asaltos0 + t;
  const pvApplied =
    Math.floor(asaltos / ASALTOS_PER_PV) - Math.floor(asaltos0 / ASALTOS_PER_PV);
  return { pvLost: pvLost0 + pvApplied, asaltos, pvApplied };
}

/**
 * ¿El actor es inmune al desangramiento? Por índice de regeneración >= 6, por
 * ser sin sangre / con acumulación (isMass) o por inmunidad a críticos
 * (critImmune). Defensivo ante fichas/mocks incompletos.
 * @param {object} actor
 * @returns {boolean}
 */
export function isImmuneToBleeding(actor) {
  const ch = actor?.system?.characteristics ?? {};
  const regen = Number(ch?.secondaries?.regenerationType?.final?.value ?? 0);
  if (regen >= REGEN_IMMUNITY_THRESHOLD) return true;
  if (ch?.isMass) return true;
  if (ch?.critImmune) return true;
  return false;
}

/**
 * ¿Un crítico de este tipo provoca desangramiento? Los físicos (FIL/PEN/CON)
 * sí; los de energía (Calor/Frío/Electricidad) no. Por defecto (tipo ausente)
 * se asume físico → desangra, y el DJ puede retirar el estado si procede.
 * @param {string} critType tipo de crítico/daño del ataque
 * @returns {boolean}
 */
export function critTypeCausesBleeding(critType) {
  // '' / '-' (NoneWeaponCritic.NONE) = tipo ausente: por defecto desangra (se asume fisico).
  // Solo los tipos NO fisicos EXPLICITOS (energy/heat/cold/electricity) no desangran.
  if (!critType || critType === '-') return true;
  return PHYSICAL_CRIT_TYPES.includes(String(critType).toLowerCase());
}
