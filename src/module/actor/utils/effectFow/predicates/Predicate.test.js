import { testPredicate, Predicate } from './Predicate.js';

const OPTS = new Set([
  'self:condition:prone',
  'self:effect:cargando',
  'target:flanked'
]);

describe('testPredicate', () => {
  test('empty / missing predicate passes', () => {
    expect(testPredicate([], OPTS)).toBe(true);
    expect(testPredicate(null, OPTS)).toBe(true);
    expect(testPredicate(undefined, OPTS)).toBe(true);
  });

  test('atomic statement membership', () => {
    expect(testPredicate(['self:condition:prone'], OPTS)).toBe(true);
    expect(testPredicate(['self:condition:blind'], OPTS)).toBe(false);
  });

  test('array of statements is an implicit AND', () => {
    expect(testPredicate(['self:condition:prone', 'target:flanked'], OPTS)).toBe(true);
    expect(testPredicate(['self:condition:prone', 'self:condition:blind'], OPTS)).toBe(false);
  });

  test('not', () => {
    expect(testPredicate([{ not: 'self:condition:blind' }], OPTS)).toBe(true);
    expect(testPredicate([{ not: 'self:condition:prone' }], OPTS)).toBe(false);
  });

  test('and', () => {
    expect(testPredicate([{ and: ['self:condition:prone', 'target:flanked'] }], OPTS)).toBe(true);
    expect(testPredicate([{ and: ['self:condition:prone', 'x'] }], OPTS)).toBe(false);
  });

  test('or', () => {
    expect(testPredicate([{ or: ['x', 'target:flanked'] }], OPTS)).toBe(true);
    expect(testPredicate([{ or: ['x', 'y'] }], OPTS)).toBe(false);
  });

  test('nested compounds', () => {
    // prone AND (x OR NOT blind)
    const p = [{ and: ['self:condition:prone', { or: ['x', { not: 'self:condition:blind' }] }] }];
    expect(testPredicate(p, OPTS)).toBe(true);
  });

  test('unknown statement shape fails closed', () => {
    expect(testPredicate([{ foo: 1 }], OPTS)).toBe(false);
    expect(testPredicate([42], OPTS)).toBe(false);
  });

  test('accepts an array as the options argument', () => {
    expect(testPredicate(['self:condition:prone'], ['self:condition:prone'])).toBe(true);
  });
});

describe('Predicate class', () => {
  test('test() delegates to testPredicate', () => {
    expect(new Predicate(['target:flanked']).test(OPTS)).toBe(true);
    expect(new Predicate(['nope']).test(OPTS)).toBe(false);
  });

  test('isEmpty', () => {
    expect(new Predicate([]).isEmpty).toBe(true);
    expect(new Predicate(['x']).isEmpty).toBe(false);
  });

  test('static test', () => {
    expect(Predicate.test(['self:condition:prone'], OPTS)).toBe(true);
  });

  test('constructor tolerates non-array input', () => {
    expect(new Predicate(null).isEmpty).toBe(true);
  });
});
