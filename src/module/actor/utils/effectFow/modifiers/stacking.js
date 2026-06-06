// /module/actor/utils/effectFow/modifiers/stacking.js
//
// Modifier stacking for AnimaBeyondFoundry — Anima RAW.
//
// Core Exxet (Edición Revisada), p.7, verbatim:
//   "todos los bonificadores se suman sin importar su procedencia. Existen
//    algunas excepciones a esto, como ocurre con la acción de Cargar, en las
//    que un bonificador puede sustituir directamente a otro, pero por norma
//    general el cómputo final de un valor parte de la suma de todos los
//    modificadores que le afectan."
//
// So the DEFAULT and dominant rule is: EVERYTHING SUMS, regardless of source.
// There are no modifier "types" that suppress each other in Anima.
//
// The single RAW exception is substitution (e.g. Cargar): one modifier
// directly replaces another. We model that — and only that — with an opt-in
// `group`: modifiers sharing a non-empty `group` are mutually exclusive and
// collapse to a single survivor (the most favourable bonus / most punishing
// penalty), which then sums normally with everything else. Nothing that omits
// `group` is ever suppressed. This also conveniently de-dupes the same effect
// applied twice when it declares a group.
//
// Phase 3 — conditional modifiers: a modifier may carry a `predicate` (see
// ../predicates/Predicate.js). When stacking is given a set of roll options,
// any modifier whose predicate does NOT pass is dropped BEFORE the rules above
// run. With no options argument, predicates are ignored entirely, so existing
// behaviour is unchanged (fully backward-compatible).
//
// Canonical modifier shape produced by rule sources (Active Effects, equipment
// qualities, maneuvers, future rule elements):
//
//   { slug, label, value, group, source, predicate }
//
//     - value     : signed number (delta). Non-numeric/NaN treated as 0.
//     - group     : optional substitution/exclusivity bucket. Absent => sums.
//     - source    : optional provenance string for the chat breakdown.
//     - predicate : optional array of predicate statements (Phase 3).

import { testPredicate } from '../predicates/Predicate.js';

/**
 * Coerce a modifier's value to a finite signed number (0 on garbage).
 * @param {{value:any}} m
 * @returns {number}
 */
function numValue(m) {
  const n = Number(m?.value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Keep only modifiers whose predicate passes against `options`. Modifiers
 * without a predicate always pass. When `options` is undefined/null, NO
 * predicate filtering happens at all (backward-compatible: callers that don't
 * supply roll options get the old, unconditional behaviour).
 *
 * @param {object[]} modifiers
 * @param {Set<string>|string[]|null|undefined} options
 * @returns {object[]}
 */
function filterByPredicate(modifiers, options) {
  if (options === undefined || options === null) return modifiers;
  return modifiers.filter(m => {
    const pred = m?.predicate;
    if (!Array.isArray(pred) || pred.length === 0) return true;
    return testPredicate(pred, options);
  });
}

/**
 * Resolve a flat list of modifiers into the subset that applies.
 *
 * Steps:
 *   1. (Phase 3) drop modifiers whose predicate fails against `options`.
 *   2. Ungrouped modifiers ALL pass through (Anima: everything sums).
 *   3. Grouped modifiers collapse to one surviving bonus + one penalty per
 *      group (substitution — the Cargar exception).
 *   4. Inert zero-valued modifiers are dropped. Input order is preserved.
 *
 * @param {object[]} modifiers
 * @param {Set<string>|string[]|null} [options] roll options for predicate tests
 * @returns {object[]}
 */
export function resolveStacking(modifiers, options) {
  if (!Array.isArray(modifiers) || modifiers.length === 0) return [];

  const candidates = filterByPredicate(modifiers, options);

  const groupWinners = new Map(); // group -> { bonus?, penalty? }
  const survivors = new Set();

  for (const m of candidates) {
    const value = numValue(m);
    if (value === 0) continue; // inert

    const group = typeof m?.group === 'string' ? m.group.trim() : '';
    if (!group) {
      survivors.add(m); // ungrouped always sums
      continue;
    }

    // Grouped: keep best bonus / worst penalty (substitution).
    const isBonus = value > 0;
    const slot = isBonus ? 'bonus' : 'penalty';
    const bucket = groupWinners.get(group) ?? {};
    const current = bucket[slot];
    if (!current) {
      bucket[slot] = m;
    } else if (isBonus) {
      bucket[slot] = value > numValue(current) ? m : current;
    } else {
      bucket[slot] = value < numValue(current) ? m : current;
    }
    groupWinners.set(group, bucket);
  }

  for (const bucket of groupWinners.values()) {
    if (bucket.bonus) survivors.add(bucket.bonus);
    if (bucket.penalty) survivors.add(bucket.penalty);
  }

  // Preserve original order, restricted to candidates that survived.
  return candidates.filter(m => survivors.has(m));
}

/**
 * Sum the applied modifiers to a single signed total.
 * @param {object[]} modifiers
 * @param {Set<string>|string[]|null} [options]
 * @returns {number}
 */
export function sumModifiers(modifiers, options) {
  return resolveStacking(modifiers, options).reduce((acc, m) => acc + numValue(m), 0);
}

/**
 * Full breakdown: applied modifiers and total, for the chat traceability line.
 * @param {object[]} modifiers
 * @param {Set<string>|string[]|null} [options]
 * @returns {{ applied: object[], total: number }}
 */
export function applyStackingRules(modifiers, options) {
  const applied = resolveStacking(modifiers, options);
  const total = applied.reduce((acc, m) => acc + numValue(m), 0);
  return { applied, total };
}
