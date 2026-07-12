// Combate de Masas (Anima): calculos PUROS para tratar un grupo de enemigos como UNA
// criatura de acumulacion de dano. Fiel al simulador Excel del usuario + Tablas del
// manual. Sin Foundry -> testeable. Ver memoria mass-combat-rules.
//
// Inputs "por criatura" (se asume que los componentes son similares): PV, ataque,
// defensa, armadura, iniciativa. Flags de la masa: count (nº), accumulates (componentes
// con acumulacion de dano), disorganized (torpes -> medio bono), adversaries (a cuantos
// personajes ataca la masa).

/**
 * PV agregados de la masa (aguante al dano). Redondeos del manual.
 * - Normal: PV/criatura redondeado a la baja en grupos de 50, x nº; si >100, los 100
 *   primeros normal y cada extra suma 10 (PV<250) o 25 (PV>=250).
 * - Acumulacion: base = PV medio redondeado a la baja en grupos de 100; cada extra suma
 *   la mitad de ese redondeo; si >50, cada componente vale 100 (PV<1000) o 250.
 * @returns {number}
 */
export function massLifePool({ count, pv, accumulates = false }) {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  const p = Math.max(0, Number(pv) || 0);
  if (n <= 0 || p <= 0) return 0;

  if (accumulates) {
    if (n > 50) return n * (p < 1000 ? 100 : 250);
    const base = Math.floor(p / 100) * 100;
    const half = Math.floor(p / 100) * 50;
    return base + (n - 1) * half;
  }

  const rounded = Math.floor(p / 50) * 50;
  if (n <= 100) return rounded * n;
  return rounded * 100 + (p < 250 ? 10 : 25) * (n - 100);
}

/**
 * Bono a la Habilidad de Ataque (Tabla 1) segun enemigos por oponente. Menos de 3 -> 0.
 * @returns {number} 0|30|50|70|90|110|130|150
 */
export function tabla1Bonus(enemiesPerOpponent) {
  const n = Number(enemiesPerOpponent) || 0;
  if (n >= 100) return 150;
  if (n >= 50) return 130;
  if (n >= 25) return 110;
  if (n >= 15) return 90;
  if (n >= 10) return 70;
  if (n >= 5) return 50;
  if (n >= 3) return 30;
  return 0;
}

/**
 * Habilidad Ofensiva total de la masa = ataque base medio + bono Tabla 1 (por
 * enemigos/oponente = count/adversaries). Desorganizada -> medio bono.
 * @returns {number}
 */
export function massOffensiveAbility({
  baseAttack,
  count,
  adversaries = 1,
  disorganized = false
}) {
  const adv = Math.max(1, Number(adversaries) || 1);
  const perOpponent = (Number(count) || 0) / adv;
  const bonus = tabla1Bonus(perOpponent);
  return (Number(baseAttack) || 0) + (disorganized ? bonus / 2 : bonus);
}

/**
 * Bono a la Habilidad de Ataque de la masa (Tabla 1) por su nº TOTAL de enemigos. NO se
 * divide entre los personajes atacados (decision del usuario): se aplica a TODOS sus
 * ataques por igual. Mitad si esta desorganizada.
 * @returns {number}
 */
export function massAttackBonus({ count, disorganized = false }) {
  const b = tabla1Bonus(Number(count) || 0);
  return disorganized ? b / 2 : b;
}

/**
 * ¿El actor (por su `system`) es una "Masa de enemigos"? (Tipo de defensa = 'mass').
 * @returns {boolean}
 */
export function isMassActor(system) {
  return system?.general?.settings?.defenseType?.value === 'mass';
}

/**
 * Bono de HA (Tabla 1) del actor SI es una masa, leyendo su config; 0 si no lo es. Atajo
 * para los puntos de ataque (arma / conjuro / psiquica), que suman este bono a su tirada.
 * @returns {number}
 */
export function massActorAttackBonus(system) {
  if (!isMassActor(system)) return 0;
  const m = system?.general?.settings?.mass ?? {};
  // Efectividad decreciente: el bono se calcula con los componentes VIVOS (segun la vida
  // actual), no con el nº original -> al perder PV, baja la HA.
  return massAttackBonus({
    count: massSurvivingCount(system),
    disorganized: !!m.disorganized?.value
  });
}

/**
 * Nº de componentes (enemigos) ORIGINAL de la masa, leido de su config. Sirve para topar
 * los enemigos alcanzados por un ataque de area (Tabla 2): nunca se puede multiplicar por
 * mas enemigos de los que tiene la masa.
 * @returns {number}
 */
export function massComponentCount(system) {
  return Math.max(0, Math.floor(Number(system?.general?.settings?.mass?.count?.value) || 0));
}

/**
 * Componentes VIVOS de la masa segun su vida actual (`lifePoints.value`): a medida que
 * pierde PV caen miembros y baja el bono de Tabla 1. A vida plena = nº original.
 * @returns {number}
 */
export function massSurvivingCount(system) {
  if (!isMassActor(system)) return 0;
  const m = system?.general?.settings?.mass ?? {};
  return survivingComponents({
    lifeRemaining: Number(system?.characteristics?.secondaries?.lifePoints?.value) || 0,
    count: Number(m.count?.value) || 0,
    pv: Number(m.baseLife?.value) || 0,
    accumulates: !!m.accumulates?.value
  });
}

/**
 * Dano Base ajustado de la masa: +50% fisico, x2 sobrenatural (conjuros/poderes).
 * El fisico se redondea a la baja (dano entero).
 * @returns {number}
 */
export function massAdjustedDamage(baseDamage, { magic = false } = {}) {
  const d = Number(baseDamage) || 0;
  return magic ? d * 2 : Math.floor(d * 1.5);
}

/**
 * Multiplicador al Dano Base por nº de enemigos alcanzados en un ataque de AREA (Tabla 2).
 * `enemiesHit` ya debe venir capado al nº de componentes de la masa (no se puede
 * multiplicar por mas enemigos de los que hay).
 * @returns {number} 1|2|3|4|5|10|15|25
 */
export function areaDamageMultiplier(enemiesHit) {
  const n = Number(enemiesHit) || 0;
  if (n >= 1000) return 25;
  if (n > 100) return 15;
  if (n >= 25) return 10;
  if (n >= 10) return 5;
  if (n >= 5) return 4;
  if (n >= 3) return 3;
  if (n >= 2) return 2;
  return 1;
}

/**
 * Componentes vivos de la masa dada su vida restante (el resto han "caido"). El nuevo nº
 * baja el bono de Tabla 1 (efectividad decreciente). Nunca supera `count`.
 * @returns {number}
 */
export function survivingComponents({ lifeRemaining, count, pv, accumulates = false }) {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  const p = Math.max(0, Number(pv) || 0);
  const rem = Number(lifeRemaining) || 0;
  if (n <= 0 || p <= 0 || rem <= 0) return 0;

  if (accumulates) {
    const base = Math.floor(p / 100) * 100;
    const half = Math.floor(p / 100) * 50;
    if (base <= 0 || half <= 0) return Math.min(n, 1);
    if (rem <= base) return Math.min(n, 1);
    return Math.min(n, 1 + Math.ceil((rem - base) / half));
  }

  const rounded = Math.floor(p / 50) * 50;
  if (rounded <= 0) return 0;
  return Math.min(n, Math.floor(rem / rounded));
}

/**
 * Resultado de un control de Resistencia de la masa (RM/RF/RE/RP/RV) contra un efecto de
 * AREA, segun el margen = tirada_resistencia - dificultad (positivo = la masa supera).
 * Cuatro tramos (manual):
 *  - passClean  (supera por >40): el efecto no afecta.
 *  - passPartial(supera por 0..40): negativos a la mitad (redondeo ABAJO); otros efectos
 *    afectan a ~1/3 de los blancos del area.
 *  - failPartial(falla por 0..40): negativos a la mitad (redondeo ARRIBA); otros ~2/3.
 *  - failFull   (falla por >40): efecto pleno; otros a TODOS.
 * `negFactor`/`negRound` para escalar penalizadores; `affected` = fraccion de blancos
 * para efectos no-negativos (muerte, paralisis...).
 * @returns {{tier:string, negFactor:number, negRound:'down'|'up', affected:number}}
 */
export function massResistanceOutcome(margin) {
  const m = Number(margin) || 0;
  if (m > 40) return { tier: 'passClean', negFactor: 0, negRound: 'down', affected: 0 };
  if (m >= 0) return { tier: 'passPartial', negFactor: 0.5, negRound: 'down', affected: 1 / 3 };
  if (m > -40) return { tier: 'failPartial', negFactor: 0.5, negRound: 'up', affected: 2 / 3 };
  return { tier: 'failFull', negFactor: 1, negRound: 'up', affected: 1 };
}

/**
 * Dificultad extra que una masa anade a los efectos que OBLIGAN a Resistencia a sus
 * rivales: +20 si son 10 o menos componentes, +50 si son mas.
 * @returns {number}
 */
export function massResistanceDifficultyBonus(count) {
  return (Number(count) || 0) > 10 ? 50 : 20;
}
