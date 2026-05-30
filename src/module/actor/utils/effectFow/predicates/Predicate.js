// /module/actor/utils/effectFow/predicates/Predicate.js
//
// Minimal predicate engine (Phase 3), inspired by PF2e's Predicate.
//
// A predicate is an array of "statements" tested against a SET of roll options
// (atomic boolean facts about the current context, e.g. "self:condition:prone",
// "target:flanked"). The predicate passes when EVERY statement is true (an
// empty predicate passes trivially).
//
// A statement is one of:
//   - atomic string:  "self:condition:prone"        → true iff in the option set
//   - { not: <stmt> }                                → negation
//   - { and: [<stmt>, ...] }                          → all true
//   - { or:  [<stmt>, ...] }                          → at least one true
//
// Compound statements nest arbitrarily. This is deliberately a SUBSET of PF2e's
// predicate language (no binary operators gte/lt yet) — enough to express
// conditional modifiers ("apply only if the target is flanked") without the
// full machinery. Binary ops can be added later without breaking this API.
//
// Pure and self-contained: no Foundry / actor dependencies. The option set is
// produced elsewhere (see ../rollOptions/rollOptions.js).

/**
 * Coerce the options argument to a Set<string> for O(1) membership tests.
 * Accepts a Set, an array, or null/undefined (→ empty set).
 * @param {Set<string>|string[]|null|undefined} options
 * @returns {Set<string>}
 */
function toOptionSet(options) {
  if (options instanceof Set) return options;
  if (Array.isArray(options)) return new Set(options);
  return new Set();
}

/**
 * Test a single statement against the option set.
 * @param {string|object} statement
 * @param {Set<string>} domain
 * @returns {boolean}
 */
function testStatement(statement, domain) {
  // Atomic option.
  if (typeof statement === 'string') {
    return domain.has(statement);
  }

  if (statement && typeof statement === 'object') {
    if ('not' in statement) {
      return !testStatement(statement.not, domain);
    }
    if ('and' in statement) {
      const arr = Array.isArray(statement.and) ? statement.and : [];
      return arr.every(s => testStatement(s, domain));
    }
    if ('or' in statement) {
      const arr = Array.isArray(statement.or) ? statement.or : [];
      return arr.some(s => testStatement(s, domain));
    }
  }

  // Unknown statement shape → never matches (fail closed).
  return false;
}

/**
 * Test a predicate (array of statements) against a set of roll options.
 * An empty / missing predicate passes. All statements must be true.
 *
 * @param {Array<string|object>|null|undefined} predicate
 * @param {Set<string>|string[]} options
 * @returns {boolean}
 */
export function testPredicate(predicate, options) {
  if (!Array.isArray(predicate) || predicate.length === 0) return true;
  const domain = toOptionSet(options);
  return predicate.every(s => testStatement(s, domain));
}

/**
 * Small OO wrapper around testPredicate, mirroring PF2e's `Predicate` shape so
 * call sites can read naturally: `new Predicate(p).test(options)`.
 */
export class Predicate {
  /** @param {Array<string|object>} statements */
  constructor(statements = []) {
    this.statements = Array.isArray(statements) ? statements : [];
  }

  /**
   * @param {Set<string>|string[]} options
   * @returns {boolean}
   */
  test(options) {
    return testPredicate(this.statements, options);
  }

  /** True when the predicate has no statements (always passes). */
  get isEmpty() {
    return this.statements.length === 0;
  }

  /**
   * Convenience static so callers don't have to instantiate.
   * @param {Array<string|object>} predicate
   * @param {Set<string>|string[]} options
   * @returns {boolean}
   */
  static test(predicate, options) {
    return testPredicate(predicate, options);
  }
}
