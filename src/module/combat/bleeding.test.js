import {
  bleedingActionPenalty,
  advanceBleeding,
  isImmuneToBleeding,
  critTypeCausesBleeding,
  ASALTOS_PER_PV,
  REGEN_IMMUNITY_THRESHOLD
} from './bleeding.js';

describe('bleedingActionPenalty (-10 por cada 5 PV)', () => {
  test.each([
    [0, 0],
    [4, 0],
    [5, -10],
    [9, -10],
    [10, -20],
    [23, -40]
  ])('pvLost=%i → %i', (pv, expected) => {
    expect(bleedingActionPenalty(pv)).toBe(expected);
  });

  test('coerce entradas inválidas a 0', () => {
    expect(bleedingActionPenalty(undefined)).toBe(0);
    expect(bleedingActionPenalty('abc')).toBe(0);
    expect(bleedingActionPenalty(-3)).toBe(0);
  });
});

describe('advanceBleeding (1 PV cada 20 asaltos)', () => {
  test('un asalto no llega al umbral: sin pérdida', () => {
    expect(advanceBleeding({ pvLost: 0, asaltos: 0 }, 1)).toEqual({
      pvLost: 0, asaltos: 1, pvApplied: 0
    });
  });

  test('cruzar 20 asaltos aplica 1 PV', () => {
    expect(advanceBleeding({ pvLost: 0, asaltos: 19 }, 1)).toEqual({
      pvLost: 1, asaltos: 20, pvApplied: 1
    });
  });

  test('avanzar 20 de golpe aplica 1 PV', () => {
    expect(advanceBleeding({ pvLost: 2, asaltos: 0 }, ASALTOS_PER_PV)).toEqual({
      pvLost: 3, asaltos: 20, pvApplied: 1
    });
  });

  test('avanzar 45 desde 0 aplica 2 PV (cruza 20 y 40)', () => {
    expect(advanceBleeding({ pvLost: 0, asaltos: 0 }, 45)).toEqual({
      pvLost: 2, asaltos: 45, pvApplied: 2
    });
  });

  test('estado inválido se normaliza', () => {
    expect(advanceBleeding(null, 20)).toEqual({ pvLost: 1, asaltos: 20, pvApplied: 1 });
  });
});

describe('isImmuneToBleeding', () => {
  const actor = (over = {}) => ({
    system: { characteristics: { secondaries: { regenerationType: { final: { value: over.regen ?? 0 } } }, isMass: over.isMass, critImmune: over.critImmune } }
  });

  test(`regen >= ${REGEN_IMMUNITY_THRESHOLD} → inmune`, () => {
    expect(isImmuneToBleeding(actor({ regen: 6 }))).toBe(true);
    expect(isImmuneToBleeding(actor({ regen: 10 }))).toBe(true);
  });
  test('regen < 6 → no inmune', () => {
    expect(isImmuneToBleeding(actor({ regen: 5 }))).toBe(false);
    expect(isImmuneToBleeding(actor({ regen: 0 }))).toBe(false);
  });
  test('isMass / critImmune → inmune', () => {
    expect(isImmuneToBleeding(actor({ isMass: true }))).toBe(true);
    expect(isImmuneToBleeding(actor({ critImmune: true }))).toBe(true);
  });
  test('actor/mock incompleto → no inmune (no lanza)', () => {
    expect(isImmuneToBleeding(undefined)).toBe(false);
    expect(isImmuneToBleeding({})).toBe(false);
  });
});

describe('critTypeCausesBleeding (físico sí, energía no)', () => {
  test('físicos desangran', () => {
    expect(critTypeCausesBleeding('cut')).toBe(true);
    expect(critTypeCausesBleeding('impact')).toBe(true);
    expect(critTypeCausesBleeding('thrust')).toBe(true);
  });
  test('energía no desangra', () => {
    expect(critTypeCausesBleeding('heat')).toBe(false);
    expect(critTypeCausesBleeding('cold')).toBe(false);
    expect(critTypeCausesBleeding('electricity')).toBe(false);
  });
  test('tipo ausente → por defecto desangra (físico)', () => {
    expect(critTypeCausesBleeding('')).toBe(true);
    expect(critTypeCausesBleeding(undefined)).toBe(true);
  });
});
