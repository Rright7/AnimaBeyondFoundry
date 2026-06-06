// Lógica pura de acumulación/concentración de Ki (F6: "Cargar Ki"), fiel al
// manual (Core Exxet, cap. del Ki):
//  - Reserva: total disponible (sólo baja al USAR; se recupera descansando).
//  - Concentrado (acumulado por característica): Ki "listo" para usar técnicas.
//  - Modelo por lotes: el asalto EN CURSO aporta la Acumulación COMPLETA; cada
//    lote de un asalto anterior se asienta a la mitad (redondeo arriba) UNA sola
//    vez (al terminar su asalto) y luego queda fijo (no se vuelve a partir).
//    Por eso el avance por asalto es incremental: nuevo = anterior + ⌈tasa/2⌉
//    (o + tasa con "acumulación plena"). La activación añade la tasa completa.
//  - Topes: por característica (sus Puntos de Ki) y global (la reserva disponible).
//
//  Ejemplo (DES Acu 5, sin plena): T1=5 ; T2=3+5=8 ; T3=3+3+5=11.

export const KI_CHAR_KEYS = [
  'strength',
  'agility',
  'dexterity',
  'constitution',
  'willPower',
  'power'
];

export const KI_CHAR_LABELS = {
  strength: 'FUE',
  agility: 'AGI',
  dexterity: 'DES',
  constitution: 'CON',
  willPower: 'VOL',
  power: 'POD'
};

/**
 * Un paso de acumulación por asalto (incremental). Concentrar Ki NO consume la
 * reserva ni tiene tope (la reserva sólo limita el GASTO, no la concentración);
 * sólo se acumulan las características seleccionadas.
 * @param {object} p
 * @param {Record<string,number>} [p.accumulated] concentrado actual por característica
 * @param {Record<string,number>} [p.rates] acumulación por característica (Acu.)
 * @param {Record<string,boolean>} [p.selected] qué características acumular (default: todas; sólo se omite si === false)
 * @param {boolean} [p.full] acumulación plena (el incremento es la tasa completa)
 * @param {boolean} [p.firstStep] primer asalto/activación (aporta la tasa completa)
 * @returns {Record<string,number>} nuevo concentrado por característica
 */
export function accumulateKiStep({
  accumulated = {},
  rates = {},
  selected = {},
  full = false,
  firstStep = false
} = {}) {
  const out = {};
  for (const c of KI_CHAR_KEYS) {
    const prev = Number(accumulated[c]) || 0;
    // Sólo se acumulan las características seleccionadas (por defecto, todas).
    if (selected[c] === false) {
      out[c] = prev;
      continue;
    }
    const rate = Number(rates[c]) || 0;
    // El asalto en curso (o la activación) aporta la tasa completa; los lotes
    // de asaltos previos ya se asentaron a la mitad, así que el avance neto por
    // asalto es ⌈tasa/2⌉ (o la tasa completa si "acumulación plena"). Sin tope.
    const delta = firstStep || full ? rate : Math.ceil(rate / 2);
    out[c] = prev + Math.max(0, delta);
  }
  return out;
}

/**
 * Características en las que falta Ki concentrado para pagar el coste activo de
 * una técnica.
 * @param {Record<string,{active:number}>} cost costByCharacteristic (computed)
 * @param {Record<string,number>} accumulated concentrado por característica
 * @returns {Array<{char:string, need:number, have:number}>}
 */
export function concentratedShortfall(cost = {}, accumulated = {}) {
  const short = [];
  for (const c of KI_CHAR_KEYS) {
    const need = Number(cost?.[c]?.active) || 0;
    if (need <= 0) continue;
    const have = Number(accumulated[c]) || 0;
    if (have < need) short.push({ char: c, need, have });
  }
  return short;
}

/**
 * Paso por asalto (hacia delante) de UNA técnica activa: lógica pura del bucle de
 * combate (ABFCombat.nextRound). Las mantenidas gastan su Ki de mantenimiento;
 * las sostenidas descuentan 1 de duración y se desactivan al llegar a 0.
 *
 * Devuelve también `snapshot` (estado PRE-paso) para poder revertir exactamente
 * el paso en previousRound: restaurar {active, remaining} y reembolsar `maint`.
 * Solo se aplica a técnicas que están activas, así una sostenida que expira
 * (snapshot.active=true) se puede reactivar al retroceder, sin tocar las que
 * nunca estuvieron activas (que no tienen snapshot).
 *
 * @param {{flags?:object, remaining?:number, kiMaint?:number}} [input]
 * @returns {{maintSpent:number, sustained:boolean, nextActive:boolean, nextRemaining:number, snapshot:{active:boolean, remaining:number, maint:number}}}
 */
export function techniqueRoundStep({ flags = {}, remaining = 0, kiMaint = 0 } = {}) {
  const prevRemaining = Number(remaining) || 0;
  const maintSpent = flags.anyMaintained && kiMaint > 0 ? Number(kiMaint) || 0 : 0;
  const sustained = !!(flags.anySostMenor || flags.anySostMayor);
  let nextActive = true;
  let nextRemaining = prevRemaining;
  if (sustained) {
    const next = prevRemaining - 1;
    if (next <= 0) {
      nextActive = false;
      nextRemaining = 0;
    } else {
      nextRemaining = next;
    }
  }
  return {
    maintSpent,
    sustained,
    nextActive,
    nextRemaining,
    snapshot: { active: true, remaining: prevRemaining, maint: maintSpent }
  };
}
