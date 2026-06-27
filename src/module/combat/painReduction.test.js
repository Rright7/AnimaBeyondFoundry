import { painReductionDivisor, applyPainReduction } from './painReduction';

describe('painReductionDivisor (fuente unica del factor de reduccion)', () => {
  it('sin habilidades -> 1', () => {
    expect(painReductionDivisor({})).toBe(1);
    expect(painReductionDivisor(undefined)).toBe(1);
  });

  it('Eliminacion de penalizadores (painHalf=1) -> 2 (mitad)', () => {
    expect(painReductionDivisor({ painHalf: { value: 1 } })).toBe(2);
  });

  it('dos mitades (painHalf=2) -> 4 (cuarto)', () => {
    expect(painReductionDivisor({ painHalf: { value: 2 } })).toBe(4);
  });

  it('Esencia de Vacio (painImmune) -> Infinity y manda sobre painHalf', () => {
    expect(painReductionDivisor({ painImmune: { value: 1 } })).toBe(Infinity);
    expect(
      painReductionDivisor({ painImmune: { value: 1 }, painHalf: { value: 2 } })
    ).toBe(Infinity);
  });
});

describe('applyPainReduction (penalizador <= 0, ceil hacia 0)', () => {
  it('divisor 1 no cambia', () => {
    expect(applyPainReduction(-30, 1)).toBe(-30);
  });

  it('mitad (divisor 2)', () => {
    expect(applyPainReduction(-30, 2)).toBe(-15);
    expect(applyPainReduction(-25, 2)).toBe(-12); // ceil(-12.5)
  });

  it('cuarto (divisor 4)', () => {
    expect(applyPainReduction(-50, 4)).toBe(-12); // ceil(-12.5)
    expect(applyPainReduction(-40, 4)).toBe(-10);
  });

  it('inmune (Infinity) -> 0', () => {
    expect(applyPainReduction(-50, Infinity)).toBe(0);
  });

  it('un penalizador positivo se capa a 0', () => {
    expect(applyPainReduction(5, 2)).toBe(0);
  });
});
