import { recoverPain, recoverPainStep } from './painRecovery';

describe('recoverPain (dolor -> 0 por asalto)', () => {
  it('acerca el penalizador 5 hacia 0', () => {
    expect(recoverPain(-40)).toBe(-35);
    expect(recoverPain(-10)).toBe(-5);
  });

  it('no se pasa de 0 (tope)', () => {
    expect(recoverPain(-5)).toBe(0);
    expect(recoverPain(-3)).toBe(0);
  });

  it('sin dolor (>= 0) no hace nada', () => {
    expect(recoverPain(0)).toBe(0);
    expect(recoverPain(7)).toBe(0); // positivo no da bonus
  });

  it('respeta un ritmo distinto', () => {
    expect(recoverPain(-40, 10)).toBe(-30);
    expect(recoverPain(-8, 20)).toBe(0);
  });

  it('valores no numericos -> 0', () => {
    expect(recoverPain(undefined)).toBe(0);
    expect(recoverPain(NaN)).toBe(0);
  });
});

describe('recoverPainStep (el SUFRIDO baja rate; la base escala por el divisor)', () => {
  it('sin reduccion (divisor 1): la base baja rate', () => {
    expect(recoverPainStep(-50, { rate: 5, divisor: 1 })).toBe(-45);
  });

  it('a la mitad (divisor 2): la base baja el DOBLE para que el sufrido baje 5', () => {
    // base -50, sufrido -25; tras el paso base -40, sufrido -20 (baja 5).
    expect(recoverPainStep(-50, { rate: 5, divisor: 2 })).toBe(-40);
  });

  it('a un cuarto (divisor 4): la base baja x4 para que el sufrido baje 5', () => {
    expect(recoverPainStep(-50, { rate: 5, divisor: 4 })).toBe(-30);
  });

  it('la mitad clava el sufrido a 0 en 5 asaltos (-25 -> 0)', () => {
    let base = -50; // sufrido inicial -25
    for (let i = 0; i < 5; i++) base = recoverPainStep(base, { rate: 5, divisor: 2 });
    expect(base).toBe(0);
  });

  it('inmune (divisor Infinity): el sufrido ya es 0, la base usa el ritmo normal', () => {
    expect(recoverPainStep(-50, { rate: 5, divisor: Infinity })).toBe(-45);
  });

  it('no se pasa de 0 con el ritmo escalado', () => {
    expect(recoverPainStep(-8, { rate: 5, divisor: 2 })).toBe(0);
  });

  it('sin dolor (>= 0) no hace nada', () => {
    expect(recoverPainStep(0, { rate: 5, divisor: 2 })).toBe(0);
  });

  it('rate por defecto = 5, divisor por defecto = 1', () => {
    expect(recoverPainStep(-50, { divisor: 2 })).toBe(-40);
    expect(recoverPainStep(-50)).toBe(-45);
  });
});
