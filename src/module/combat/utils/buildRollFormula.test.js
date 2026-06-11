import { buildRollFormula } from './buildRollFormula.js';

describe('buildRollFormula', () => {
  test('omite los terminos a 0 (caso defensa de la captura)', () => {
    // 1d100xa + 165 + 0 + (-30) + (0) + (0) + (0)  ->  limpio
    expect(buildRollFormula('1d100xa', [165, 0, -30, 0, 0, 0])).toBe('1d100xa + 165 - 30');
  });

  test('solo el dado si no hay sumandos no nulos', () => {
    expect(buildRollFormula('1d100xa', [0, 0])).toBe('1d100xa');
    expect(buildRollFormula('1d100xa')).toBe('1d100xa');
  });

  test('positivos y negativos con su signo', () => {
    expect(buildRollFormula('1d10', [5, -3, 2])).toBe('1d10 + 5 - 3 + 2');
  });

  test('un termino base a 0 tambien se omite (sin "+ 0")', () => {
    expect(buildRollFormula('1d100xa', [0, 15])).toBe('1d100xa + 15');
  });

  test('valores no numericos (null/undefined/NaN) cuentan como 0', () => {
    expect(buildRollFormula('1d100', [null, undefined, NaN, 10])).toBe('1d100 + 10');
  });
});
