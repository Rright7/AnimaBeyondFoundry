import {
  resetSynthetics,
  getSynthetics,
  depositModifier,
  readModifiers
} from './synthetics.js';

const ATTACK = 'system.combat.attack.final.value';
const DODGE = 'system.combat.dodge.final.value';

describe('synthetics mailbox', () => {
  test('resetSynthetics creates an empty modifiers map', () => {
    const actor = {};
    const s = resetSynthetics(actor);
    expect(s.modifiers).toEqual({});
    expect(actor.synthetics).toBe(s);
  });

  test('resetSynthetics wipes previous deposits', () => {
    const actor = {};
    depositModifier(actor, { path: ATTACK, value: 10, source: 'Cargando' });
    expect(readModifiers(actor, ATTACK)).toHaveLength(1);
    resetSynthetics(actor);
    expect(readModifiers(actor, ATTACK)).toHaveLength(0);
  });

  test('deposits and reads a single contribution', () => {
    const actor = {};
    depositModifier(actor, { path: ATTACK, value: 10, source: 'Cargando', slug: 'charging' });
    const recs = readModifiers(actor, ATTACK);
    expect(recs).toHaveLength(1);
    expect(recs[0]).toMatchObject({ path: ATTACK, value: 10, source: 'Cargando', slug: 'charging', mode: 'add' });
  });

  test('ignores non-finite and zero values', () => {
    const actor = {};
    depositModifier(actor, { path: ATTACK, value: NaN, source: 'x' });
    depositModifier(actor, { path: ATTACK, value: 0, source: 'y' });
    depositModifier(actor, { path: ATTACK, value: 'abc', source: 'z' });
    expect(readModifiers(actor, ATTACK)).toHaveLength(0);
  });

  test('no-ops on missing actor or path', () => {
    expect(() => depositModifier(null, { path: ATTACK, value: 1 })).not.toThrow();
    const actor = {};
    depositModifier(actor, { value: 1 });
    expect(getSynthetics(actor).modifiers).toEqual({});
  });

  test('accumulates multiple contributions on the same path (Anima: all stack)', () => {
    const actor = {};
    depositModifier(actor, { path: ATTACK, value: 10, source: 'Cargando' });
    depositModifier(actor, { path: ATTACK, value: -5, source: 'Herida' });
    const recs = readModifiers(actor, ATTACK);
    expect(recs).toHaveLength(2);
    expect(recs.reduce((a, r) => a + r.value, 0)).toBe(5);
  });

  test('reads across multiple paths keeping distinct contributions', () => {
    const actor = {};
    depositModifier(actor, { path: ATTACK, value: 10, source: 'Cargando', slug: 'charging' });
    depositModifier(actor, { path: DODGE, value: -20, source: 'Cargando', slug: 'charging' });
    expect(readModifiers(actor, [ATTACK, DODGE])).toHaveLength(2);
  });

  test('getSynthetics tolerates a malformed pre-existing container', () => {
    const actor = { synthetics: 'broken' };
    expect(getSynthetics(actor).modifiers).toEqual({});
  });
});
