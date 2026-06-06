import {
  accumulateKiStep,
  concentratedShortfall,
  KI_CHAR_KEYS
} from './kiAccumulation.js';

const zero = () => Object.fromEntries(KI_CHAR_KEYS.map(c => [c, 0]));

describe('accumulateKiStep', () => {
  test('activación (firstStep): aporta la tasa completa desde cero', () => {
    const out = accumulateKiStep({
      accumulated: zero(),
      rates: { ...zero(), dexterity: 5, agility: 2 },
      firstStep: true
    });
    expect(out.dexterity).toBe(5);
    expect(out.agility).toBe(2);
  });

  test('secuencia sin plena (DES Acu 5): 5 -> 8 -> 11', () => {
    const base = { rates: { ...zero(), dexterity: 5 } };
    const t1 = accumulateKiStep({ ...base, accumulated: zero(), firstStep: true });
    expect(t1.dexterity).toBe(5);
    const t2 = accumulateKiStep({ ...base, accumulated: t1 }); // 5 + ⌈5/2⌉ = 8
    expect(t2.dexterity).toBe(8);
    const t3 = accumulateKiStep({ ...base, accumulated: t2 }); // 8 + 3 = 11
    expect(t3.dexterity).toBe(11);
  });

  test('secuencia con plena (DES Acu 5): 5 -> 10 -> 15', () => {
    const base = { rates: { ...zero(), dexterity: 5 }, full: true };
    const t1 = accumulateKiStep({ ...base, accumulated: zero(), firstStep: true });
    const t2 = accumulateKiStep({ ...base, accumulated: t1 });
    const t3 = accumulateKiStep({ ...base, accumulated: t2 });
    expect([t1.dexterity, t2.dexterity, t3.dexterity]).toEqual([5, 10, 15]);
  });

  test('tasas bajas también apilan (Acu 1 sin plena): 1 -> 2 -> 3', () => {
    const base = { rates: { ...zero(), dexterity: 1 } };
    const t1 = accumulateKiStep({ ...base, accumulated: zero(), firstStep: true });
    const t2 = accumulateKiStep({ ...base, accumulated: t1 });
    const t3 = accumulateKiStep({ ...base, accumulated: t2 });
    expect([t1.dexterity, t2.dexterity, t3.dexterity]).toEqual([1, 2, 3]);
  });

  test('SIN tope: apila más allá de los Puntos de Ki/reserva', () => {
    // 9 -> +⌈4/2⌉=2 -> 11 (no se corta en 10); la reserva limita el gasto, no esto.
    const out = accumulateKiStep({
      accumulated: { ...zero(), dexterity: 9 },
      rates: { ...zero(), dexterity: 4 }
    });
    expect(out.dexterity).toBe(11);
  });

  test('selected: sólo acumula las características seleccionadas', () => {
    const out = accumulateKiStep({
      accumulated: { ...zero(), dexterity: 4, power: 2 },
      rates: { ...zero(), dexterity: 2, power: 2 },
      selected: { ...Object.fromEntries(KI_CHAR_KEYS.map(c => [c, false])), dexterity: true }
    });
    expect(out.dexterity).toBe(5); // 4 + ⌈2/2⌉
    expect(out.power).toBe(2); // no seleccionada -> sin cambios
  });
});

describe('concentratedShortfall', () => {
  test('detecta características con concentrado insuficiente', () => {
    const cost = { dexterity: { active: 10 }, strength: { active: 3 } };
    const accumulated = { ...zero(), dexterity: 6, strength: 3 };
    const short = concentratedShortfall(cost, accumulated);
    expect(short).toEqual([{ char: 'dexterity', need: 10, have: 6 }]);
  });

  test('sin déficit cuando hay concentrado suficiente', () => {
    const cost = { dexterity: { active: 10 }, strength: { active: 3 } };
    const accumulated = { ...zero(), dexterity: 10, strength: 5 };
    expect(concentratedShortfall(cost, accumulated)).toEqual([]);
  });

  test('ignora costes 0 / ausentes', () => {
    expect(concentratedShortfall({}, zero())).toEqual([]);
  });
});
