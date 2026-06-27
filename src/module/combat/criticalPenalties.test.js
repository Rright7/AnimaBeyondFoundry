import { accumulatePenalty } from './criticalPenalties';

describe('accumulatePenalty (penalizadores de critico acumulan)', () => {
  it('resta la magnitud al bucket (mas negativo)', () => {
    expect(accumulatePenalty(0, 30)).toBe(-30);
    expect(accumulatePenalty(-30, 20)).toBe(-50); // un segundo critico apila
  });

  it('magnitud 0 no cambia nada', () => {
    expect(accumulatePenalty(-40, 0)).toBe(-40);
  });

  it('ignora magnitudes negativas (nunca da bonus)', () => {
    expect(accumulatePenalty(-10, -50)).toBe(-10);
  });

  it('valores no numericos -> 0', () => {
    expect(accumulatePenalty(undefined, undefined)).toBe(0);
    expect(accumulatePenalty(NaN, NaN)).toBe(0);
  });
});
