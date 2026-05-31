/**
 * @jest-environment node
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

import {
  applySingleActiveEffectChange,
  resolveChangeMode
} from './activeEffectApplicator.js';

const KEY = 'system.combat.attack.final.value';
const makeActor = v => ({ system: { combat: { attack: { final: { value: v } } } } });

describe('AE applicator', () => {
  test('resolveChangeMode handles numeric and string modes', () => {
    expect(resolveChangeMode(2)).toBe('add');
    expect(resolveChangeMode(5)).toBe('override');
    expect(resolveChangeMode('add')).toBe('add');
    expect(resolveChangeMode('weird')).toBe('add');
  });

  test('add (Anima penalty: negative value subtracts)', () => {
    const actor = makeActor(120);
    applySingleActiveEffectChange(actor, {}, { key: KEY, type: 'add', value: '-30' });
    expect(actor.system.combat.attack.final.value).toBe(90);
  });

  test('numeric mode 2 (add) works like string "add"', () => {
    const actor = makeActor(50);
    applySingleActiveEffectChange(actor, {}, { key: KEY, mode: 2, value: '20' });
    expect(actor.system.combat.attack.final.value).toBe(70);
  });

  test('override coerces numeric string to number', () => {
    const actor = makeActor(50);
    applySingleActiveEffectChange(actor, {}, { key: KEY, type: 'override', value: '0' });
    expect(actor.system.combat.attack.final.value).toBe(0);
  });

  test('add-mode deposits a synthetics record carrying the change predicate (Phase 3)', () => {
    const actor = makeActor(120);
    applySingleActiveEffectChange(
      actor,
      { name: 'Flanqueo', id: 'eff1' },
      { key: KEY, type: 'add', value: '-30', predicate: ['target:flanked'] }
    );
    expect(actor.system.combat.attack.final.value).toBe(90); // write is unconditional
    const recs = actor.synthetics.modifiers[KEY];
    expect(recs).toHaveLength(1);
    expect(recs[0]).toMatchObject({
      value: -30, source: 'Flanqueo', mode: 'add', predicate: ['target:flanked']
    });
  });

  test('add-mode without a predicate deposits a record with predicate null', () => {
    const actor = makeActor(120);
    applySingleActiveEffectChange(actor, { name: 'Herida' }, { key: KEY, type: 'add', value: '-10' });
    expect(actor.synthetics.modifiers[KEY][0].predicate).toBeNull();
  });
});
