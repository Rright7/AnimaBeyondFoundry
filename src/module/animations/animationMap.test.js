import { effectFor, impactKeyForArmorType, projectileKeyFor } from './animationMap.js';

describe('impactKeyForArmorType', () => {
  it('mapea las tablas fisicas a su impacto', () => {
    expect(impactKeyForArmorType('cut')).toBe('impactCut');
    expect(impactKeyForArmorType('thrust')).toBe('impactThrust');
    expect(impactKeyForArmorType('impact')).toBe('impactImpact');
  });

  it('agrupa las tablas no fisicas en impacto de energia', () => {
    for (const t of ['energy', 'heat', 'cold', 'electricity']) {
      expect(impactKeyForArmorType(t)).toBe('impactEnergy');
    }
  });

  it('cae a golpe generico para "-", vacio o desconocido', () => {
    expect(impactKeyForArmorType('-')).toBe('impactImpact');
    expect(impactKeyForArmorType('')).toBe('impactImpact');
    expect(impactKeyForArmorType(undefined)).toBe('impactImpact');
    expect(impactKeyForArmorType('xyz')).toBe('impactImpact');
  });
});

describe('projectileKeyFor', () => {
  it('usa proyectil de energia para tablas no fisicas (gana a throw/shot)', () => {
    expect(projectileKeyFor('energy', 'throw')).toBe('projectileEnergy');
    expect(projectileKeyFor('heat', 'shot')).toBe('projectileEnergy');
  });

  it('distingue arrojadiza (throw) de disparada (resto)', () => {
    expect(projectileKeyFor('cut', 'throw')).toBe('projectileThrown');
    expect(projectileKeyFor('thrust', 'shot')).toBe('projectileArrow');
    expect(projectileKeyFor('impact', '')).toBe('projectileArrow');
  });
});

describe('effectFor', () => {
  it('devuelve los candidatos de una clave conocida', () => {
    expect(Array.isArray(effectFor('impactCut'))).toBe(true);
    expect(effectFor('projectileEnergy').length).toBeGreaterThan(0);
  });

  it('devuelve null para una clave no mapeada', () => {
    expect(effectFor('noExiste')).toBeNull();
  });
});
