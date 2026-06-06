import {
  clampDelayRounds,
  isDelayedDamageDue,
  splitDueDelayedDamage,
  makeDelayedDamageEntry,
  MAX_DELAY_ROUNDS
} from './delayedDamage.js';

describe('clampDelayRounds (rango 1-5)', () => {
  test.each([
    [1, 1], [3, 3], [5, 5],
    [6, 5], [99, 5],
    [0, 0], [-2, 0], ['', 0], [undefined, 0], ['abc', 0], [2.9, 2]
  ])('%p → %i', (input, expected) => {
    expect(clampDelayRounds(input)).toBe(expected);
  });
  test('MAX = 5', () => expect(MAX_DELAY_ROUNDS).toBe(5));
});

describe('isDelayedDamageDue', () => {
  test('vence cuando dueRound <= ronda actual', () => {
    expect(isDelayedDamageDue({ dueRound: 3 }, 3)).toBe(true);
    expect(isDelayedDamageDue({ dueRound: 2 }, 5)).toBe(true);
    expect(isDelayedDamageDue({ dueRound: 4 }, 3)).toBe(false);
  });
  test('datos malformados → no vence', () => {
    expect(isDelayedDamageDue({}, 3)).toBe(false);
    expect(isDelayedDamageDue({ dueRound: 'x' }, 3)).toBe(false);
    expect(isDelayedDamageDue({ dueRound: 3 }, undefined)).toBe(false);
  });
});

describe('splitDueDelayedDamage', () => {
  test('separa vencidos y pendientes conservando el resto', () => {
    const list = [
      { dueRound: 2, amount: 10 },
      { dueRound: 5, amount: 20 },
      { dueRound: 3, amount: 30 }
    ];
    const { due, pending } = splitDueDelayedDamage(list, 3);
    expect(due.map(e => e.amount)).toEqual([10, 30]);
    expect(pending.map(e => e.amount)).toEqual([20]);
  });
  test('entradas malformadas se conservan en pending (no se pierde daño)', () => {
    const { due, pending } = splitDueDelayedDamage([{ amount: 5 }], 10);
    expect(due).toEqual([]);
    expect(pending).toHaveLength(1);
  });
  test('entrada no-array → vacíos', () => {
    expect(splitDueDelayedDamage(null, 1)).toEqual({ due: [], pending: [] });
  });
});

describe('makeDelayedDamageEntry', () => {
  test('construye con dueRound = ronda + retraso', () => {
    expect(makeDelayedDamageEntry({ currentRound: 4, delayRounds: 3, amount: 66, attackerId: 'a1' }))
      .toEqual({ dueRound: 7, amount: 66, attackerId: 'a1', bleeding: true });
  });
  test('redondea el daño y respeta bleeding=false', () => {
    expect(makeDelayedDamageEntry({ currentRound: 0, delayRounds: 1, amount: 12.6, bleeding: false }))
      .toEqual({ dueRound: 1, amount: 13, attackerId: '', bleeding: false });
  });
  test('retraso inválido o daño <= 0 → null', () => {
    expect(makeDelayedDamageEntry({ currentRound: 1, delayRounds: 0, amount: 10 })).toBeNull();
    expect(makeDelayedDamageEntry({ currentRound: 1, delayRounds: 3, amount: 0 })).toBeNull();
    expect(makeDelayedDamageEntry({ currentRound: 1, delayRounds: 8, amount: 0 })).toBeNull();
  });
  test('retraso > 5 se capa a 5', () => {
    expect(makeDelayedDamageEntry({ currentRound: 2, delayRounds: 9, amount: 10 }).dueRound).toBe(7);
  });
});
