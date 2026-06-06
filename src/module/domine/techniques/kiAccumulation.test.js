import {
  accumulateKiStep,
  concentratedShortfall,
  techniqueRoundStep,
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

describe('techniqueRoundStep', () => {
  test('mantenida: gasta Ki de mantenimiento y no cambia duración', () => {
    const s = techniqueRoundStep({ flags: { anyMaintained: true }, remaining: 0, kiMaint: 4 });
    expect(s.maintSpent).toBe(4);
    expect(s.sustained).toBe(false);
    expect(s.nextActive).toBe(true);
    expect(s.snapshot).toEqual({ active: true, remaining: 0, maint: 4 });
  });

  test('sostenida menor: descuenta 1 de duración', () => {
    const s = techniqueRoundStep({ flags: { anySostMenor: true }, remaining: 5 });
    expect(s.sustained).toBe(true);
    expect(s.nextActive).toBe(true);
    expect(s.nextRemaining).toBe(4);
    expect(s.maintSpent).toBe(0);
    expect(s.snapshot).toEqual({ active: true, remaining: 5, maint: 0 });
  });

  test('sostenida que expira: remaining 1 -> 0 y se desactiva; el snapshot permite revertir', () => {
    const s = techniqueRoundStep({ flags: { anySostMayor: true }, remaining: 1 });
    expect(s.nextActive).toBe(false);
    expect(s.nextRemaining).toBe(0);
    // El snapshot guarda el estado PRE-paso: revertir restaura activa con duración 1.
    expect(s.snapshot).toEqual({ active: true, remaining: 1, maint: 0 });
  });

  test('mantenida + sostenida: gasta mantenimiento y además descuenta duración', () => {
    const s = techniqueRoundStep({
      flags: { anyMaintained: true, anySostMenor: true },
      remaining: 3,
      kiMaint: 2
    });
    expect(s.maintSpent).toBe(2);
    expect(s.nextRemaining).toBe(2);
    expect(s.nextActive).toBe(true);
  });

  test('mantenida sin coste de mantenimiento: no gasta', () => {
    const s = techniqueRoundStep({ flags: { anyMaintained: true }, remaining: 0, kiMaint: 0 });
    expect(s.maintSpent).toBe(0);
  });

  test('round-trip: aplicar el paso y revertir desde el snapshot restaura el estado original', () => {
    const before = { active: true, remaining: 1, kiMaint: 4 };
    const s = techniqueRoundStep({
      flags: { anySostMenor: true, anyMaintained: true },
      remaining: before.remaining,
      kiMaint: before.kiMaint
    });
    // forward: expira (active false, remaining 0) y gasta 4 de mantenimiento.
    expect(s.nextActive).toBe(false);
    expect(s.nextRemaining).toBe(0);
    // revert desde snapshot: estado original + reembolso del mantenimiento gastado.
    expect(s.snapshot.active).toBe(before.active);
    expect(s.snapshot.remaining).toBe(before.remaining);
    expect(s.snapshot.maint).toBe(before.kiMaint);
  });
});
