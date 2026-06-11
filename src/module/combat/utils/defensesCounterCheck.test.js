import { defensesCounterCheck, freeDefensesFor } from './defensesCounterCheck.js';

describe('defensesCounterCheck (penalizador por defensa multiple)', () => {
  test('progresion base sin exenciones (0/-30/-50/-70/-90, clamp)', () => {
    expect(defensesCounterCheck(0)).toBe(0);
    expect(defensesCounterCheck(1)).toBe(-30);
    expect(defensesCounterCheck(2)).toBe(-50);
    expect(defensesCounterCheck(3)).toBe(-70);
    expect(defensesCounterCheck(4)).toBe(-90);
    expect(defensesCounterCheck(7)).toBe(-90); // clamp a la 5a+
  });

  test('freeDefenses desplaza la progresion N pasos', () => {
    // N=1 (Lama Avanzado): 1a (0) y 2a (1) a 0; la 3a (2) -> -30
    expect(defensesCounterCheck(0, { freeDefenses: 1 })).toBe(0);
    expect(defensesCounterCheck(1, { freeDefenses: 1 })).toBe(0);
    expect(defensesCounterCheck(2, { freeDefenses: 1 })).toBe(-30);
    expect(defensesCounterCheck(3, { freeDefenses: 1 })).toBe(-50);
    // N=2 (Lama Supremo / Lama Tsu Base)
    expect(defensesCounterCheck(2, { freeDefenses: 2 })).toBe(0);
    expect(defensesCounterCheck(3, { freeDefenses: 2 })).toBe(-30);
  });

  test('neverPenalty = exencion total (siempre 0, incluso 6a defensa)', () => {
    expect(defensesCounterCheck(2, { neverPenalty: true })).toBe(0);
    expect(defensesCounterCheck(5, { neverPenalty: true })).toBe(0);
  });
});

describe('freeDefensesFor (Artes Marciales + extra manual)', () => {
  const art = (canonicalId, grade) => ({ system: { canonicalId, grade: { value: grade } } });
  const actor = (arts = [], manual = 0) => ({
    system: {
      domine: { martialArts: arts },
      general: { settings: { extraDefensesBonus: { value: manual } } }
    }
  });

  test('Lama Avanzado (1) + extra manual (2) = 3; never false', () => {
    expect(freeDefensesFor(actor([art('lama', 'advanced')], 2))).toEqual({
      freeDefenses: 3,
      neverPenalty: false
    });
  });

  test('Lama Tsu Arcano -> neverPenalty true', () => {
    expect(freeDefensesFor(actor([art('lamaTsu', 'arcane')]))).toEqual({
      freeDefenses: 0,
      neverPenalty: true
    });
  });

  test('sin artes ni manual -> {0,false}', () => {
    expect(freeDefensesFor(actor())).toEqual({ freeDefenses: 0, neverPenalty: false });
    expect(freeDefensesFor({})).toEqual({ freeDefenses: 0, neverPenalty: false });
  });
});
