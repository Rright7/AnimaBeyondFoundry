import { withstandPainReduction } from './withstandPainReduction';

describe('withstandPainReduction (Tabla 15)', () => {
  it('por debajo de 80 no reduce nada', () => {
    expect(withstandPainReduction(0)).toBe(0);
    expect(withstandPainReduction(79)).toBe(0);
  });

  it('devuelve la reduccion del umbral alcanzado', () => {
    expect(withstandPainReduction(80)).toBe(10);
    expect(withstandPainReduction(120)).toBe(20);
    expect(withstandPainReduction(140)).toBe(30);
    expect(withstandPainReduction(180)).toBe(40);
    expect(withstandPainReduction(240)).toBe(50);
    expect(withstandPainReduction(280)).toBe(60);
    expect(withstandPainReduction(320)).toBe(70);
    expect(withstandPainReduction(440)).toBe(80);
  });

  it('entre umbrales mantiene la reduccion del umbral inferior', () => {
    expect(withstandPainReduction(119)).toBe(10);
    expect(withstandPainReduction(139)).toBe(20);
    expect(withstandPainReduction(439)).toBe(70);
  });

  it('por encima del maximo se queda en 80', () => {
    expect(withstandPainReduction(500)).toBe(80);
    expect(withstandPainReduction(1000)).toBe(80);
  });

  it('valores no numericos -> 0', () => {
    expect(withstandPainReduction(undefined)).toBe(0);
    expect(withstandPainReduction(NaN)).toBe(0);
  });
});
