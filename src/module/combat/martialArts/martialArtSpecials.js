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
    supreme: { maneuverPenaltyReduction: { maneuvers: ['presa', 'derribo'], factor: 0 } }
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
    supreme: { maneuverPenaltyReduction: { maneuvers: ['derribo', 'desarme', 'presa'], factor: 0.5 } }
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
