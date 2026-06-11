import { gradeOf } from './martialArtCatalog.js';

// Efectos "special" de las Artes Marciales ENRIQUECIDOS de forma estructurada
// (hecho a mano; el catalogo *.data.js es auto-generado y NO se toca). Cada entrada
// es el efecto COMPLETO de ese arte en ese grado (no acumulativo: el lector toma el
// grado actual del actor). Fundamento: Dominus Exxet (texto en `special`).
//
// Fase 1 — Maniobras + Contraataque. Tipos de descriptor:
//  - maneuverPenaltyReduction: { maneuvers:[slug...], factor:0..1, counterOnly?:bool }
//      factor multiplica el penalizador de la maniobra (0.5 = mitad, 0 = sin penalizador).
//      counterOnly: solo al contraatacar con esa maniobra.
//  - counterAttackBonus: number  -> bono PLANO a la HA del contraataque (Boxeo +10).
//  - counterAttackMultiplier: number -> multiplica el bono de margen del contraataque (Selene x2).
//  - counterDamageFromEnemyStr: number -> suma N x (mod FUE del agresor) al DAÑO del contraataque (Aikido).
//  - opposedCheckBonus: { maneuvers:[slug...], value:number, side:'attacker'|'defender' }
//      bono al chequeo enfrentado (D10) de esa maniobra (atacante = quien la hace; defender = quien la sufre).
//  - extraDefenses: { count:N } | { never:true } -> defensas adicionales sin penalizador
//      (count exime el penalizador desplazando la progresion N pasos; never = exencion total).
//
// Slugs de maniobra: 'presa', 'derribo', 'desarme' (ver maneuvers/definitions).
export const MARTIAL_ART_SPECIALS = {
  // Aikido — "Contra: +2xFUE al daño; Avanzado/Supremo Presa y Derribo sin penalizador
  // en contra; Supremo +2 a controles de Presa/Derribo y +4xFUE en contra".
  aikido: {
    base: { counterDamageFromEnemyStr: 2 },
    advanced: {
      counterDamageFromEnemyStr: 2,
      maneuverPenaltyReduction: { maneuvers: ['presa', 'derribo'], factor: 0, counterOnly: true }
    },
    supreme: {
      counterDamageFromEnemyStr: 4,
      maneuverPenaltyReduction: { maneuvers: ['presa', 'derribo'], factor: 0, counterOnly: true },
      opposedCheckBonus: { maneuvers: ['presa', 'derribo'], value: 2, side: 'attacker' }
    }
  },
  // Boxeo — "Bono especial de +10 en contraataque" (Avanzado y Supremo).
  boxeo: {
    advanced: { counterAttackBonus: 10 },
    supreme: { counterAttackBonus: 10 }
  },
  // Grappling — "Presa y Derribo: mitad de penalizadores (Base) / sin penalizadores (Avanzado+)".
  grappling: {
    base: { maneuverPenaltyReduction: { maneuvers: ['presa', 'derribo'], factor: 0.5 } },
    advanced: { maneuverPenaltyReduction: { maneuvers: ['presa', 'derribo'], factor: 0 } },
    // Supremo: sin penalizador y ademas "Se puede hacer Dano COMPLETO en Presa y Derribo"
    // (excepcion a la mitad de la regla general de maniobras).
    supreme: {
      maneuverPenaltyReduction: { maneuvers: ['presa', 'derribo'], factor: 0 },
      fullDamageManeuvers: ['presa', 'derribo']
    }
  },
  // Kardad — "Bono +1/+3 a los controles para DEFENDERSE de Presa y Derribo".
  kardad: {
    base: { opposedCheckBonus: { maneuvers: ['presa', 'derribo'], value: 1, side: 'defender' } },
    advanced: { opposedCheckBonus: { maneuvers: ['presa', 'derribo'], value: 3, side: 'defender' } },
    supreme: { opposedCheckBonus: { maneuvers: ['presa', 'derribo'], value: 3, side: 'defender' } }
  },
  // Malla-yuddha — Supremo "Desarmar sin penalizador en contraataque".
  mallaYuddha: {
    supreme: { maneuverPenaltyReduction: { maneuvers: ['desarme'], factor: 0, counterOnly: true } }
  },
  // Pankration — "Mitad de penalizador para Presa" (todos los grados).
  pankration: {
    base: { maneuverPenaltyReduction: { maneuvers: ['presa'], factor: 0.5 } },
    advanced: { maneuverPenaltyReduction: { maneuvers: ['presa'], factor: 0.5 } },
    supreme: { maneuverPenaltyReduction: { maneuvers: ['presa'], factor: 0.5 } }
  },
  // Sambo — "Mitad de penalizador: Derribo y Desarmar (Base) + Presa (Avanzado+)".
  // (Area y Apuntado: pendientes de fases posteriores.)
  sambo: {
    base: { maneuverPenaltyReduction: { maneuvers: ['derribo', 'desarme'], factor: 0.5 } },
    advanced: { maneuverPenaltyReduction: { maneuvers: ['derribo', 'desarme', 'presa'], factor: 0.5 } },
    // Supremo: ademas reduce los apuntados a la mitad, acumulable con Precisa -> 1/4.
    supreme: {
      maneuverPenaltyReduction: { maneuvers: ['derribo', 'desarme', 'presa'], factor: 0.5 },
      doublePrecise: true,
      // Mitad INTRINSECA del penalizador de Apuntados (independiente de Precisa): sin Precisa
      // -> mitad; con Precisa, doublePrecise lo acumula al cuarto (no se aplican ambos).
      aimedPenaltyFactor: 0.5
    }
  },
  // Emp (avanzada) — "Desarmar sin penalizador y +3 a los controles enfrentados".
  emp: {
    base: {
      maneuverPenaltyReduction: { maneuvers: ['desarme'], factor: 0 },
      opposedCheckBonus: { maneuvers: ['desarme'], value: 3, side: 'attacker' }
    },
    arcane: {
      maneuverPenaltyReduction: { maneuvers: ['desarme'], factor: 0 },
      opposedCheckBonus: { maneuvers: ['desarme'], value: 3, side: 'attacker' }
    }
  },
  // Melkaiah (avanzada) — "Bono +3 a controles enfrentados para Presa y Derribo".
  melkaiah: {
    base: { opposedCheckBonus: { maneuvers: ['presa', 'derribo'], value: 3, side: 'attacker' } },
    arcane: { opposedCheckBonus: { maneuvers: ['presa', 'derribo'], value: 3, side: 'attacker' } }
  },
  // Selene (avanzada) — "Dobla el bono de contraataque con Artes Marciales".
  // (Contraataque automatico en defensa con exito: fase posterior.)
  selene: {
    base: { counterAttackMultiplier: 2 },
    arcane: { counterAttackMultiplier: 2 }
  },
  // Lama — "Permite una/dos defensas adicionales sin penalizador".
  lama: {
    advanced: { extraDefenses: { count: 1 } },
    supreme: { extraDefenses: { count: 2 } }
  },
  // Lama Tsu (avanzada) — Base "2 defensas adicionales sin penalizador";
  // Arcano "Nunca aplica penalizador por defensas adicionales".
  lamaTsu: {
    base: { extraDefenses: { count: 2 } },
    arcane: { extraDefenses: { never: true } }
  },
  // ── Cat.4 (bono al critico) + Cat.5 (reduccion de TA) + Rex Frame (armadura) ──
  // critBonus: { value, condition:'always'|'aimed'|'inconsciencia' } -> suma al nivel
  //   del critico (attackData.critBonus) si la condicion se cumple.
  // taReduction: { amount, onlySoft } -> reduce la TA del defensor; onlySoft solo la
  //   parte blanda (no 'hard'); amount Infinity = la anula.
  // extraArmor: { value } -> +N a TODAS las TA del propio actor (bono de armadura).
  // doublePrecise: true (Sambo Supremo) -> su reduccion a la mitad de los Ataques
  //   Apuntados se ACUMULA con la calidad Precisa del Desarmado: el atacante aplica
  //   solo una CUARTA parte del penalizador de apuntado (redondeado hacia arriba en
  //   grupos de 5). Solo apuntados (no Engatillar).
  // attackTables: ['impact'|'cut'|'thrust'|'energy'] -> tablas (CON/FIL/PEN/ENE) que el
  //   arte PERMITE ELEGIR al atacar (perfil AM); se UNEN entre artes y CON siempre esta.
  moaiThai: {
    supreme: { critBonus: { value: 20, condition: 'always' } }
  },
  hakyoukuken: {
    base: { critBonus: { value: 20, condition: 'always' }, taReduction: { amount: 2, onlySoft: true } },
    // amount 999 = "anula" la TA blanda (centinela finito > cualquier TA; Infinity se
    // serializaria a null en el flag JSON del chat y romperia el efecto).
    arcane: { critBonus: { value: 40, condition: 'always' }, taReduction: { amount: 999, onlySoft: true } }
  },
  asakusen: {
    arcane: { critBonus: { value: 20, condition: 'aimed' } }
  },
  enuth: {
    base: { critBonus: { value: 20, condition: 'inconsciencia' } },
    arcane: { critBonus: { value: 50, condition: 'inconsciencia' } }
  },
  // Dumah ("arte del viento"): corta el aire -> ataca en tabla de FIL o PEN (elegible)
  // desde Base; la opcion persiste en Arcano (el lector toma el grado actual, se replica).
  dumah: {
    base: { taReduction: { amount: 2, onlySoft: false }, attackTables: ['cut', 'thrust'] },
    // Arcano: ademas, "cualquier Dano produce automaticamente desangramiento, incluso sin
    // Critico" (directBleeding).
    arcane: {
      taReduction: { amount: 6, onlySoft: false },
      attackTables: ['cut', 'thrust'],
      directBleeding: true
    }
  },
  rexFrame: {
    base: { extraArmor: { value: 3 } },
    arcane: { extraArmor: { value: 6 } }
  },
  // Velez (avanzada): en Arcano "Ataques intangibles de Energia" -> tabla ENE (elegible) y
  // "Permite usar POD para chequeos" -> POD elegible en los controles enfrentados (powerChecks).
  velez: {
    arcane: { attackTables: ['energy'], powerChecks: true }
  }
};

/** Descriptor estructurado del arte/grado, o null. */
export function getMartialArtSpecial(canonicalId, grade) {
  return MARTIAL_ART_SPECIALS[canonicalId]?.[grade] ?? null;
}

/**
 * Mejor (menor) factor de reduccion del penalizador de una maniobra entre las Artes
 * Marciales del actor. 1 = sin reduccion; 0.5 = mitad; 0 = sin penalizador.
 * Las reducciones `counterOnly` solo cuentan si la tirada es un contraataque.
 * @param {object} actor
 * @param {string} maneuverSlug
 * @param {{isCounterAttack?:boolean}} [opts]
 * @returns {number}
 */
export function martialArtManeuverPenaltyFactor(actor, maneuverSlug, { isCounterAttack = false } = {}) {
  const arts = actor?.system?.domine?.martialArts ?? [];
  let factor = 1;
  for (const art of arts) {
    const sp = getMartialArtSpecial(art?.system?.canonicalId, gradeOf(art));
    const r = sp?.maneuverPenaltyReduction;
    if (!r || !Array.isArray(r.maneuvers) || !r.maneuvers.includes(maneuverSlug)) continue;
    if (r.counterOnly && !isCounterAttack) continue;
    if (Number(r.factor) < factor) factor = Number(r.factor);
  }
  return factor;
}

/**
 * True si alguna Arte Marcial del actor concede DANO COMPLETO en una maniobra concreta
 * (excepcion a la mitad de la regla general): Grappling Supremo en Presa/Derribo.
 * @param {object} actor
 * @param {string} maneuverSlug
 * @returns {boolean}
 */
export function martialArtGrantsFullManeuverDamage(actor, maneuverSlug) {
  if (!maneuverSlug) return false;
  return actorArts(actor).some(art => {
    const fd = getMartialArtSpecial(art?.system?.canonicalId, gradeOf(art))?.fullDamageManeuvers;
    return Array.isArray(fd) && fd.includes(maneuverSlug);
  });
}

/**
 * Agrega los efectos "special" de fase 1 de las Artes Marciales activas del actor,
 * para los puntos de enganche de contraataque y chequeos enfrentados (fases siguientes).
 * @param {object} actor
 */
export function martialArtSpecialEffects(actor) {
  const arts = actor?.system?.domine?.martialArts ?? [];
  const out = {
    counterAttackBonus: 0, // suma (Boxeo)
    counterAttackMultiplier: 1, // producto (Selene)
    counterDamageFromEnemyStr: 0, // maximo (Aikido)
    opposedCheckBonuses: [] // {maneuvers, value, side}
  };
  for (const art of arts) {
    const sp = getMartialArtSpecial(art?.system?.canonicalId, gradeOf(art));
    if (!sp) continue;
    if (sp.counterAttackBonus) out.counterAttackBonus += Number(sp.counterAttackBonus) || 0;
    if (sp.counterAttackMultiplier) out.counterAttackMultiplier *= Number(sp.counterAttackMultiplier) || 1;
    if (sp.counterDamageFromEnemyStr) {
      out.counterDamageFromEnemyStr = Math.max(
        out.counterDamageFromEnemyStr,
        Number(sp.counterDamageFromEnemyStr) || 0
      );
    }
    if (sp.opposedCheckBonus) out.opposedCheckBonuses.push(sp.opposedCheckBonus);
  }
  return out;
}

/**
 * Bono al chequeo enfrentado (D10) de una maniobra, para un lado concreto, sumando
 * las Artes Marciales del actor que apliquen a esa maniobra.
 * @param {object} actor
 * @param {string} maneuverSlug
 * @param {'attacker'|'defender'} side
 * @returns {number}
 */
export function martialArtOpposedCheckBonus(actor, maneuverSlug, side) {
  const { opposedCheckBonuses } = martialArtSpecialEffects(actor);
  let bonus = 0;
  for (const b of opposedCheckBonuses) {
    if (b.side !== side) continue;
    if (!Array.isArray(b.maneuvers) || !b.maneuvers.includes(maneuverSlug)) continue;
    bonus += Number(b.value) || 0;
  }
  return bonus;
}

/**
 * Defensas adicionales sin penalizador que conceden las Artes Marciales del actor
 * (Lama, Lama Tsu). RAW: SE SUMAN entre artes (p.ej. Lama Supremo 2 + Lama Tsu Base 2
 * = 4 defensas exentas); never = OR (exencion total, gana sobre cualquier count).
 * @param {object} actor
 * @returns {{count:number, never:boolean}}
 */
export function martialArtExtraDefenses(actor) {
  const arts = actor?.system?.domine?.martialArts ?? [];
  let count = 0;
  let never = false;
  for (const art of arts) {
    const ed = getMartialArtSpecial(art?.system?.canonicalId, gradeOf(art))?.extraDefenses;
    if (!ed) continue;
    if (ed.never) never = true;
    if (ed.count) count += Number(ed.count) || 0;
  }
  return { count, never };
}

/** Itera las Artes Marciales del actor (helper interno). */
function actorArts(actor) {
  return actor?.system?.domine?.martialArts ?? [];
}

/**
 * Bono al NIVEL del critico que aportan las Artes Marciales, segun el contexto:
 * Moai Thai sup +20 (siempre), Hakyoukuken +20/+40 (siempre), Asakusen +20 (apuntado),
 * Enuth +20/+50 (con maniobra Inconsciencia). Se SUMA (varias artes acumulan).
 * @param {object} actor
 * @param {{aimed?:boolean, maneuverSlug?:string}} [ctx]
 * @returns {number}
 */
export function martialArtCritBonus(actor, { aimed = false, maneuverSlug = '' } = {}) {
  let bonus = 0;
  for (const art of actorArts(actor)) {
    const cb = getMartialArtSpecial(art?.system?.canonicalId, gradeOf(art))?.critBonus;
    if (!cb) continue;
    const cond = cb.condition ?? 'always';
    if (cond === 'aimed' && !aimed) continue;
    if (cond === 'inconsciencia' && maneuverSlug !== 'inconsciencia') continue;
    bonus += Number(cb.value) || 0;
  }
  return bonus;
}

/**
 * Reduccion de TA del defensor que aplica el atacante por Artes Marciales:
 *  - general: reduce toda la TA (Dumah -2/-6).
 *  - soft: reduce SOLO la TA blanda (Hakyoukuken -2 / Infinity=anula).
 * Maximo por canal (no se apilan dos artes del mismo canal; hoy hay una de cada).
 * @param {object} actor
 * @returns {{general:number, soft:number}}
 */
export function martialArtArmorReduction(actor) {
  let general = 0;
  let soft = 0;
  for (const art of actorArts(actor)) {
    const tr = getMartialArtSpecial(art?.system?.canonicalId, gradeOf(art))?.taReduction;
    if (!tr) continue;
    const amount = Number(tr.amount) || 0;
    if (tr.onlySoft) soft = Math.max(soft, amount);
    else general = Math.max(general, amount);
  }
  return { general, soft };
}

/**
 * TA adicional plana (a TODAS las TA del propio actor) por Artes Marciales: Rex Frame
 * +3/+6 contra todo. Maximo entre artes.
 * @param {object} actor
 * @returns {number}
 */
export function martialArtFlatArmor(actor) {
  let value = 0;
  for (const art of actorArts(actor)) {
    const ea = getMartialArtSpecial(art?.system?.canonicalId, gradeOf(art))?.extraArmor;
    if (ea?.value) value = Math.max(value, Number(ea.value) || 0);
  }
  return value;
}

/**
 * True si alguna Arte Marcial del actor DOBLA la ventaja de la calidad Precisa
 * (Enuth): el penalizador de apuntado/maniobra ya reducido por Precisa se reduce otra
 * vez a la mitad.
 * @param {object} actor
 * @returns {boolean}
 */
export function martialArtDoublesPrecise(actor) {
  return actorArts(actor).some(
    art => !!getMartialArtSpecial(art?.system?.canonicalId, gradeOf(art))?.doublePrecise
  );
}

/**
 * Factor de reduccion del penalizador de Ataques Apuntados que un Arte Marcial aporta POR
 * SI MISMO (Sambo Supremo: 0.5 = mitad). 1 = sin reduccion. Independiente de la calidad
 * Precisa: cuando ambas concurren, la acumulacion al cuarto la maneja doublePrecise.
 * @param {object} actor
 * @returns {number} min factor entre las artes del actor
 */
export function martialArtAimedPenaltyFactor(actor) {
  let factor = 1;
  for (const art of actorArts(actor)) {
    const f = getMartialArtSpecial(art?.system?.canonicalId, gradeOf(art))?.aimedPenaltyFactor;
    if (f != null && Number(f) < factor) factor = Number(f);
  }
  return factor;
}

/**
 * True si alguna Arte Marcial del actor provoca DESANGRAMIENTO DIRECTO: cualquier dano
 * causado desangra al defensor aunque NO haya critico (Dumah Arcano).
 * @param {object} actor
 * @returns {boolean}
 */
export function martialArtCausesDirectBleeding(actor) {
  return actorArts(actor).some(
    art => !!getMartialArtSpecial(art?.system?.canonicalId, gradeOf(art))?.directBleeding
  );
}

/**
 * Tablas de ataque (tipos de critico/TA) que las Artes Marciales del actor permiten
 * ELEGIR al atacar con el perfil "Artes Marciales": 'impact' (CON) siempre disponible
 * (golpe basico); las artes ANADEN opciones -> Dumah 'cut'/'thrust' (FIL/PEN), Velez
 * 'energy' (ENE). Se UNEN entre artes. El valor elegido viaja como armorType y define
 * tanto la TA del defensor como la tabla de criticos. Fundamento: Dominus Exxet.
 * @param {object} actor
 * @returns {string[]} subconjunto de ['impact','cut','thrust','energy']
 */
export function martialArtAllowedAttackTables(actor) {
  const tables = new Set(['impact']);
  for (const art of actorArts(actor)) {
    const at = getMartialArtSpecial(art?.system?.canonicalId, gradeOf(art))?.attackTables;
    if (!Array.isArray(at)) continue;
    for (const t of at) tables.add(t);
  }
  return [...tables];
}

/**
 * True si alguna Arte Marcial del actor permite usar PODer en los chequeos enfrentados
 * de maniobras (Velez Arcano: "Permite usar POD para chequeos"). El dialogo de control
 * enfrentado ofrece POD como caracteristica elegible ademas de las de la maniobra.
 * @param {object} actor
 * @returns {boolean}
 */
export function martialArtAllowsPowerChecks(actor) {
  return actorArts(actor).some(
    art => !!getMartialArtSpecial(art?.system?.canonicalId, gradeOf(art))?.powerChecks
  );
}
