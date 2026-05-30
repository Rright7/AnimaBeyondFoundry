import {
  SELECTORS,
  isSelector,
  resolveSelector,
  selectorNames
} from './selectorResolver.js';

describe('selectorResolver', () => {
  test('1->1 alias resolves to its single path', () => {
    expect(resolveSelector('attack')).toEqual(['system.combat.attack.final.value']);
    expect(resolveSelector('block')).toEqual(['system.combat.block.final.value']);
    expect(resolveSelector('dodge')).toEqual(['system.combat.dodge.final.value']);
  });

  test('1->N domain "defense" fans out to block + dodge', () => {
    expect(resolveSelector('defense')).toEqual([
      'system.combat.block.final.value',
      'system.combat.dodge.final.value'
    ]);
  });

  test('magic projection selectors', () => {
    expect(resolveSelector('magicProjection')).toEqual([
      'system.mystic.magicProjection.final.value'
    ]);
    expect(resolveSelector('magicProjectionOffensive')).toEqual([
      'system.mystic.magicProjection.imbalance.offensive.final.value'
    ]);
    expect(resolveSelector('magicProjectionImbalance')).toEqual([
      'system.mystic.magicProjection.imbalance.offensive.final.value',
      'system.mystic.magicProjection.imbalance.defensive.final.value'
    ]);
  });

  test('psychic projection selectors', () => {
    expect(resolveSelector('psychicProjectionDefensive')).toEqual([
      'system.psychic.psychicProjection.imbalance.defensive.final.value'
    ]);
    expect(resolveSelector('psychicProjectionImbalance')).toEqual([
      'system.psychic.psychicProjection.imbalance.offensive.final.value',
      'system.psychic.psychicProjection.imbalance.defensive.final.value'
    ]);
  });

  test('raw path passes through unchanged (backward compatible)', () => {
    const raw = 'system.combat.attack.final.value';
    expect(resolveSelector(raw)).toEqual([raw]);
  });

  test('raw path without system. prefix is normalised', () => {
    expect(resolveSelector('combat.attack.final.value')).toEqual([
      'system.combat.attack.final.value'
    ]);
  });

  test('empty / invalid input returns []', () => {
    expect(resolveSelector('')).toEqual([]);
    expect(resolveSelector(null)).toEqual([]);
    expect(resolveSelector(undefined)).toEqual([]);
  });

  test('isSelector distinguishes selectors from raw paths', () => {
    expect(isSelector('attack')).toBe(true);
    expect(isSelector('defense')).toBe(true);
    expect(isSelector('system.combat.attack.final.value')).toBe(false);
    expect(isSelector('nonexistent')).toBe(false);
  });

  test('returned arrays are copies (mutating result does not corrupt registry)', () => {
    const r = resolveSelector('defense');
    r.push('x');
    expect(SELECTORS.defense).toHaveLength(2);
  });

  test('selectorNames lists all selectors', () => {
    const names = selectorNames();
    expect(names).toContain('attack');
    expect(names).toContain('magicProjectionImbalance');
    expect(names.length).toBe(Object.keys(SELECTORS).length);
  });
});
