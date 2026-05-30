import { testPredicate } from '../../actor/utils/effectFow/predicates/Predicate.js';
import { buildGrappleOptions } from '../../actor/utils/effectFow/rollOptions/rollOptions.js';
import { crush } from './definitions/crush.js';

// Mocks mimic the minimal Actor surface the option builder reads. Grappling is
// DERIVED from the live "Apresando" effect item on the attacker, not a flag.
// Note: the system uses "Parálisis completa" as the single standard name for
// the full-grapple paralysis ("total" is the same state, not used as a name).
const mkFlags = f => ({ getFlag: (_s, k) => f[k] });
const attacker = ({ apresando, wasUnarmed }) => ({
  type: 'character',
  ...mkFlags({ grappleWasUnarmed: wasUnarmed }),
  items: {
    contents: apresando
      ? [{ type: 'effect', name: 'Apresando', system: { active: true } }]
      : []
  }
});
const defenderWith = paralysis => ({
  items: { contents: paralysis ? [{ type: 'effect', name: paralysis, system: { active: true } }] : [] }
});

function crushPasses(att, def) {
  return testPredicate(crush.predicate, buildGrappleOptions(att, def));
}

describe('Aplastar (crush) predicate', () => {
  test('the maneuver declares a non-empty predicate', () => {
    expect(Array.isArray(crush.predicate)).toBe(true);
    expect(crush.predicate.length).toBeGreaterThan(0);
  });

  test('passes with Parálisis parcial (table correction)', () => {
    expect(crushPasses(attacker({ apresando: true, wasUnarmed: true }), defenderWith('Parálisis parcial'))).toBe(true);
  });

  test('passes with Parálisis completa', () => {
    expect(crushPasses(attacker({ apresando: true, wasUnarmed: true }), defenderWith('Parálisis completa'))).toBe(true);
  });

  test('fails when not grappling (no Apresando effect)', () => {
    expect(crushPasses(attacker({ apresando: false, wasUnarmed: true }), defenderWith('Parálisis completa'))).toBe(false);
  });

  test('fails when the grapple used weapons', () => {
    expect(crushPasses(attacker({ apresando: true, wasUnarmed: false }), defenderWith('Parálisis completa'))).toBe(false);
  });

  test('fails when the defender has no paralysis', () => {
    expect(crushPasses(attacker({ apresando: true, wasUnarmed: true }), defenderWith(null))).toBe(false);
  });

  test('fails with only Parálisis menor (not in the allowed set)', () => {
    expect(crushPasses(attacker({ apresando: true, wasUnarmed: true }), defenderWith('Parálisis menor'))).toBe(false);
  });
});

describe('Aplastar — grapple state derives from the effect (regression)', () => {
  // Bug: weaponed Presa -> remove effects by hand -> unarmed Presa still warned
  // "solo sin armas". Root cause: grappling read from a stale flag, and
  // wasUnarmed read from the wrong actor. Now grappling derives from the live
  // "Apresando" effect, and wasUnarmed is gated behind it.

  test('removing the Apresando effect drops the grapple (no stale flag)', () => {
    const att = attacker({ apresando: false, wasUnarmed: true });
    expect(buildGrappleOptions(att, defenderWith('Parálisis completa')).has('self:grappling')).toBe(false);
    expect(crushPasses(att, defenderWith('Parálisis completa'))).toBe(false);
  });

  test('a lingering unarmed flag never leaks without an active grapple', () => {
    const att = attacker({ apresando: false, wasUnarmed: true });
    expect(buildGrappleOptions(att, defenderWith('Parálisis completa')).has('self:grapple:unarmed')).toBe(false);
  });

  test('fresh unarmed Presa allows Aplastar even after a previous weaponed one', () => {
    const att = attacker({ apresando: true, wasUnarmed: true });
    expect(crushPasses(att, defenderWith('Parálisis parcial'))).toBe(true);
  });
});
