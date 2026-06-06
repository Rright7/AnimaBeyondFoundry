import {
  areaRadiusMeters,
  DAMAGE_MULTIPLIER,
  SELECT_TARGETS_PENALTY,
  MIN_PROJECTILES
} from './lluviaProyectiles.js';

describe('areaRadiusMeters', () => {
  it('CF<=50 → 1 m por cada 20 de Habilidad', () => {
    expect(areaRadiusMeters(240, false)).toBe(12);
    expect(areaRadiusMeters(200, false)).toBe(10);
    expect(areaRadiusMeters(219, false)).toBe(10); // floor
  });

  it('CF>50 → 1 m por cada 40 de Habilidad', () => {
    expect(areaRadiusMeters(240, true)).toBe(6);
    expect(areaRadiusMeters(239, true)).toBe(5); // floor
  });

  it('no-numérico o negativo → 0', () => {
    expect(areaRadiusMeters(undefined, false)).toBe(0);
    expect(areaRadiusMeters(null, true)).toBe(0);
    expect(areaRadiusMeters(-10, true)).toBe(0);
  });
});

describe('constantes RAW', () => {
  it('dobla el daño, -50 al elegir blancos, mínimo 5 proyectiles', () => {
    expect(DAMAGE_MULTIPLIER).toBe(2);
    expect(SELECT_TARGETS_PENALTY).toBe(-50);
    expect(MIN_PROJECTILES).toBe(5);
  });
});
