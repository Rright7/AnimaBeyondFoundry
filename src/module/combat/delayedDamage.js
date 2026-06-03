// /module/combat/delayedDamage.js
//
// Daño retrasado (maniobra maestra, Core Exxet): un luchador con Maestría puede
// retrasar el daño que produce un golpe FIL/PEN/CON entre 1 y 5 asaltos; al
// manifestarse, el daño se aplica y SIEMPRE causa desangramiento.
//
// La cola de daños programados vive en `flags.animabf.scheduledDamages` del
// DEFENSOR: [{ dueRound, amount, attackerId, bleeding }]. Este módulo es PURO
// (sin dependencias de Foundry): solo construye entradas y decide cuáles vencen
// en una ronda dada. La aplicación real (PV + desangramiento) y el almacenado
// los hacen ABFCombat.nextRound / el handler de programación.

export const MIN_DELAY_ROUNDS = 1;
export const MAX_DELAY_ROUNDS = 5;

/**
 * Normaliza los asaltos de retraso al rango [1, 5]. Devuelve 0 si es inválido
 * (< 1 o no numérico), lo que significa "no programar".
 * @param {number|string} n
 * @returns {number}
 */
export function clampDelayRounds(n) {
  const v = Math.floor(Number(n) || 0);
  if (v < MIN_DELAY_ROUNDS) return 0;
  return Math.min(v, MAX_DELAY_ROUNDS);
}

/**
 * ¿Vence esta entrada en la ronda dada? (dueRound <= currentRound)
 * @param {{dueRound:number}} entry
 * @param {number} currentRound
 * @returns {boolean}
 */
export function isDelayedDamageDue(entry, currentRound) {
  const due = Math.floor(Number(entry?.dueRound));
  const cur = Math.floor(Number(currentRound));
  if (!Number.isFinite(due) || !Number.isFinite(cur)) return false;
  return due <= cur;
}

/**
 * Parte la cola en { due, pending } según la ronda actual. Puro: no muta la
 * entrada. Las entradas malformadas (sin dueRound numérico) se consideran NO
 * vencidas (se conservan en pending) para no perder daño por datos corruptos.
 * @param {object[]} list
 * @param {number} currentRound
 * @returns {{ due: object[], pending: object[] }}
 */
export function splitDueDelayedDamage(list, currentRound) {
  const arr = Array.isArray(list) ? list : [];
  const due = [];
  const pending = [];
  for (const e of arr) {
    if (isDelayedDamageDue(e, currentRound)) due.push(e);
    else pending.push(e);
  }
  return { due, pending };
}

/**
 * Construye una entrada de daño programado, o null si los datos no permiten
 * programar (retraso fuera de rango o daño <= 0).
 * @param {{currentRound:number, delayRounds:number, amount:number, attackerId?:string, bleeding?:boolean}} params
 * @returns {{dueRound:number, amount:number, attackerId:string, bleeding:boolean}|null}
 */
export function makeDelayedDamageEntry({ currentRound, delayRounds, amount, attackerId, bleeding = true }) {
  const n = clampDelayRounds(delayRounds);
  if (n <= 0) return null;
  const amt = Math.max(0, Math.round(Number(amount) || 0));
  if (amt <= 0) return null;
  return {
    dueRound: Math.floor(Number(currentRound) || 0) + n,
    amount: amt,
    attackerId: String(attackerId ?? ''),
    bleeding: !!bleeding
  };
}
