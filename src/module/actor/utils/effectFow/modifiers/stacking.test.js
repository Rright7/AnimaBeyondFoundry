import {
  resolveStacking,
  sumModifiers,
  applyStackingRules
} from './stacking.js';

const mod = (value, extra = {}) => ({ slug: 's', label: 'l', value, ...extra });

describe('Anima stacking — everything sums (RAW: Core Exxet p.7)', () => {
  test('all ungrouped bonuses sum regardless of source', () => {
    const mods = [mod(10), mod(15), mod(5)];
    expect(sumModifiers(mods)).toBe(30);
    expect(resolveStacking(mods)).toHaveLength(3);
  });

  test('all penalties sum', () => {
    expect(sumModifiers([mod(-10), mod(-20), mod(-5)])).toBe(-35);
  });

  test('bonuses and penalties sum together', () => {
    expect(sumModifiers([mod(20), mod(-5), mod(10)])).toBe(25);
  });

  test('drops inert zero-valued modifiers', () => {
    const mods = [mod(0), mod(7)];
    expect(resolveStacking(mods)).toHaveLength(1);
    expect(sumModifiers(mods)).toBe(7);
  });

  test('coerces non-numeric values to 0', () => {
    expect(sumModifiers([mod('abc'), mod(5)])).toBe(5);
    expect(sumModifiers([mod('10'), mod(5)])).toBe(15);
  });

  test('handles empty / invalid input', () => {
    expect(resolveStacking([])).toEqual([]);
    expect(resolveStacking(null)).toEqual([]);
    expect(sumModifiers(undefined)).toBe(0);
  });

  test('preserves input order of survivors', () => {
    const { applied } = applyStackingRules([mod(1), mod(2), mod(3)]);
    expect(applied.map(m => m.value)).toEqual([1, 2, 3]);
  });
});

describe('group — substitution (the Cargar exception)', () => {
  test('within a group, the best bonus substitutes the rest', () => {
    const mods = [
      mod(10, { slug: 'charge', group: 'cargar' }),
      mod(30, { slug: 'other', group: 'cargar' })
    ];
    const applied = resolveStacking(mods);
    expect(applied).toHaveLength(1);
    expect(applied[0].slug).toBe('other');
    expect(sumModifiers(mods)).toBe(30); // substitution, not 40
  });

  test('within a group, the worst penalty survives', () => {
    expect(sumModifiers([
      mod(-10, { group: 'g' }),
      mod(-20, { group: 'g' })
    ])).toBe(-20);
  });

  test('a group keeps one bonus AND one penalty, summed together', () => {
    const mods = [
      mod(10, { slug: 'b1', group: 'g' }),
      mod(30, { slug: 'b2', group: 'g' }),
      mod(-5, { slug: 'p1', group: 'g' }),
      mod(-20, { slug: 'p2', group: 'g' })
    ];
    expect(sumModifiers(mods)).toBe(10); // 30 + (-20)
  });

  test('grouped substitution coexists with ungrouped sums', () => {
    const mods = [
      mod(10, { slug: 'a', group: 'cargar' }),
      mod(30, { slug: 'b', group: 'cargar' }), // group keeps 30
      mod(5, { slug: 'flat' })                  // ungrouped, sums
    ];
    expect(sumModifiers(mods)).toBe(35); // 30 + 5
  });

  test('different groups each substitute internally, then sum', () => {
    const mods = [
      mod(10, { slug: 'a', group: 'cargar' }),
      mod(20, { slug: 'b', group: 'cargar' }), // -> 20
      mod(40, { slug: 'c', group: 'postura' }) // -> 40
    ];
    expect(sumModifiers(mods)).toBe(60); // 20 + 40 (both sum)
  });

  test('group de-dupes the same effect applied twice', () => {
    const mods = [
      mod(10, { slug: 'charging', group: 'cargar' }),
      mod(10, { slug: 'charging', group: 'cargar' })
    ];
    expect(sumModifiers(mods)).toBe(10);
  });
});

describe('applyStackingRules — breakdown', () => {
  test('returns survivors and total', () => {
    const mods = [
      mod(15, { source: 'Habilidad' }),
      mod(-2, { source: 'Herida' }),
      mod(10, { source: 'Flanco' })
    ];
    const { applied, total } = applyStackingRules(mods);
    expect(total).toBe(23);
    expect(applied.map(m => m.source)).toEqual(['Habilidad', 'Herida', 'Flanco']);
  });
});
