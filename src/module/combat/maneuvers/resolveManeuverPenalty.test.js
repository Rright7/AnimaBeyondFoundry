/**
 * @jest-environment node
 */

import { resolveManeuverAttackPenalty } from './resolveManeuverPenalty.js';
// Register the real weapon qualities (precise, ...) into the singleton registry
// so composeAimedPenalty/composeManeuverPenalty resolve them.
import '../../equipment/qualities/index.js';

// getAimedPenalty('head') === -60 (criticalTables AIMED_PENALTIES).
const weapon = ({ qualities = [], critic = 'cut', ranged = false, size = 'medium' } = {}) => ({
  system: {
    qualities: { value: qualities },
    critic: { primary: { value: critic } },
    isRanged: { value: ranged },
    size: { value: size }
  }
});

// Inconsciencia-like: aimed to head, requires impact critic, -40 if not impact.
const inconsciencia = {
  slug: 'inconsciencia',
  requiresImpactCritic: true,
  nonImpactCriticExtraPenalty: -40,
  getAttackPenalty: () => 0
};

describe('resolveManeuverAttackPenalty', () => {
  test('aimed head, non-impact weapon, NO Precise → -60 + (-40) = -100', () => {
    const r = resolveManeuverAttackPenalty({
      def: inconsciencia, weapon: weapon({ critic: 'cut' }), aimed: true, aimedZone: 'head'
    });
    expect(r.penalty).toBe(-100);
    expect(r.nonImpactExtra).toBe(-40);
    expect(r.appliedBy).toEqual([]);
  });

  test('aimed head, non-impact + Precise → -60 halved to -30, THEN -40 = -70 (Precise not on the -40)', () => {
    const r = resolveManeuverAttackPenalty({
      def: inconsciencia, weapon: weapon({ qualities: ['precise'], critic: 'cut' }), aimed: true, aimedZone: 'head'
    });
    expect(r.penalty).toBe(-70);
    expect(r.appliedBy).toContain('precise');
    expect(r.nonImpactExtra).toBe(-40);
  });

  test('aimed head, impact weapon (no -40) → -60', () => {
    const r = resolveManeuverAttackPenalty({
      def: inconsciencia, weapon: weapon({ critic: 'impact' }), aimed: true, aimedZone: 'head'
    });
    expect(r.penalty).toBe(-60);
    expect(r.nonImpactExtra).toBe(0);
  });

  test('aimed head, impact + Precise → -30', () => {
    const r = resolveManeuverAttackPenalty({
      def: inconsciencia, weapon: weapon({ qualities: ['precise'], critic: 'impact' }), aimed: true, aimedZone: 'head'
    });
    expect(r.penalty).toBe(-30);
  });

  test('the bug it fixes: same def, the WEAPON decides the penalty', () => {
    const precise = resolveManeuverAttackPenalty({
      def: inconsciencia, weapon: weapon({ qualities: ['precise'], critic: 'cut' }), aimed: true, aimedZone: 'head'
    });
    const plain = resolveManeuverAttackPenalty({
      def: inconsciencia, weapon: weapon({ critic: 'cut' }), aimed: true, aimedZone: 'head'
    });
    expect(precise.penalty).toBe(-70);
    expect(plain.penalty).toBe(-100);
  });

  test('no def → zeros', () => {
    expect(resolveManeuverAttackPenalty({ def: null, weapon: weapon(), aimed: true, aimedZone: 'head' }))
      .toEqual({ penalty: 0, appliedBy: [], nonImpactExtra: 0 });
  });

  test('non-aimed maneuver uses def.getAttackPenalty(weapon) (weapon size matters)', () => {
    const derribo = {
      slug: 'derribo',
      requiresImpactCritic: false,
      getAttackPenalty: w => (w?.system?.size?.value === 'small' ? -60 : -30)
    };
    expect(resolveManeuverAttackPenalty({ def: derribo, weapon: weapon({ size: 'medium' }), aimed: false }).penalty)
      .toBe(-30);
    expect(resolveManeuverAttackPenalty({ def: derribo, weapon: weapon({ size: 'small' }), aimed: false }).penalty)
      .toBe(-60);
  });
});
