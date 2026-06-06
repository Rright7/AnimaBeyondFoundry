/**
 * @jest-environment node
 *
 * Phase 3.5 — the op builder must read a predicate off the effect's flags and
 * propagate it to the synthetics record the applicator deposits. Per-change
 * (`animabf.flowChangePredicates[index]`) takes precedence over an effect-level
 * predicate (`animabf.flowPredicate`); absent flags => predicate null.
 */

globalThis.foundry = globalThis.foundry ?? {};
globalThis.foundry.utils = globalThis.foundry.utils ?? {};
globalThis.foundry.utils.getProperty = (obj, path) =>
  path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
globalThis.foundry.utils.setProperty = (obj, path, value) => {
  const parts = path.split('.');
  const last = parts.pop();
  const target = parts.reduce((acc, k) => {
    if (acc[k] == null || typeof acc[k] !== 'object') acc[k] = {};
    return acc[k];
  }, obj);
  target[last] = value;
};

import { buildActiveEffectChangeOps_forChange } from './buildActiveEffectOps.js';

const KEY = 'system.combat.attack.final.value';
const makeActor = v => ({ system: { combat: { attack: { final: { value: v } } } } });
const makeEffect = (flags = {}) => ({
  id: 'eff1',
  priority: 0,
  name: 'Flanqueo',
  getFlag: (scope, key) => (scope === 'animabf' ? flags[key] : undefined)
});

/** Build the op(s) for one add-mode change and apply them to a fresh actor. */
function depositedRecord(effect, change = { key: KEY, mode: 2, value: '-30' }) {
  const ops = buildActiveEffectChangeOps_forChange(effect, 0, change);
  expect(ops).toHaveLength(1);
  const actor = makeActor(120);
  ops[0].apply(actor);
  return actor.synthetics.modifiers[KEY]?.[0] ?? null;
}

describe('buildActiveEffectOps — predicate propagation (Phase 3.5)', () => {
  test('per-change predicate (flowChangePredicates[index]) reaches the record', () => {
    const rec = depositedRecord(makeEffect({ flowChangePredicates: [['target:flanked']] }));
    expect(rec.predicate).toEqual(['target:flanked']);
    expect(rec.value).toBe(-30);
  });

  test('effect-level predicate (flowPredicate) applies when no per-change one', () => {
    const rec = depositedRecord(makeEffect({ flowPredicate: ['self:effect:cargando'] }));
    expect(rec.predicate).toEqual(['self:effect:cargando']);
  });

  test('per-change predicate takes precedence over effect-level', () => {
    const rec = depositedRecord(
      makeEffect({ flowChangePredicates: [['per:change']], flowPredicate: ['effect:level'] })
    );
    expect(rec.predicate).toEqual(['per:change']);
  });

  test('no predicate flags => record predicate is null (backward compatible)', () => {
    const rec = depositedRecord(makeEffect({}));
    expect(rec.predicate).toBeNull();
  });

  test('an empty per-change predicate falls back to the effect-level one', () => {
    const rec = depositedRecord(
      makeEffect({ flowChangePredicates: [[]], flowPredicate: ['effect:level'] })
    );
    expect(rec.predicate).toEqual(['effect:level']);
  });
});
