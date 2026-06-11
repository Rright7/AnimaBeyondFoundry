import { precise } from './precise.js';

const withArt = (canonicalId, grade) => ({
  system: { domine: { martialArts: [{ system: { canonicalId, grade: { value: grade } } }] } }
});
const noArt = { system: { domine: { martialArts: [] } } };

describe('precise.modifyAimedPenalty', () => {
  test('sin Sambo Supremo: la mitad (Precisa)', () => {
    expect(precise.modifyAimedPenalty(-60, { actor: noArt })).toBe(-30);
    expect(precise.modifyAimedPenalty(-100, { actor: noArt })).toBe(-50);
    expect(precise.modifyAimedPenalty(0, { actor: noArt })).toBe(0);
  });

  test('Sambo Supremo: un CUARTO redondeado hacia arriba (hacia 0) en grupos de 5', () => {
    const ctx = { actor: withArt('sambo', 'supreme') };
    expect(precise.modifyAimedPenalty(-60, ctx)).toBe(-15); // /4 = -15
    expect(precise.modifyAimedPenalty(-100, ctx)).toBe(-25); // /4 = -25
    expect(precise.modifyAimedPenalty(-50, ctx)).toBe(-10); // -12.5 -> -10
    expect(precise.modifyAimedPenalty(-30, ctx)).toBe(-5); // -7.5 -> -5
    expect(precise.modifyAimedPenalty(-10, ctx)).toBe(0); // -2.5 -> 0
  });

  test('Sambo no-supremo NO cuadruplica (solo la mitad de Precisa)', () => {
    expect(precise.modifyAimedPenalty(-60, { actor: withArt('sambo', 'advanced') })).toBe(-30);
  });
});

describe('precise.modifyManeuverPenalty', () => {
  test('Engatillar: la mitad; Sambo NO afecta a maniobras', () => {
    const ctx = { maneuverSlug: 'engatillar', actor: withArt('sambo', 'supreme') };
    expect(precise.modifyManeuverPenalty(-60, ctx)).toBe(-30); // solo Precisa, no 1/4
  });
  test('otra maniobra: sin cambio', () => {
    expect(precise.modifyManeuverPenalty(-40, { maneuverSlug: 'derribo' })).toBe(-40);
  });
});
