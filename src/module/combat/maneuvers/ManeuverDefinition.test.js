import { ManeuverDefinition } from './ManeuverDefinition.js';

// Derribo: -30 base, -60 con arma CORTA que NO sea desarmado.
const derribo = new ManeuverDefinition({
  slug: 'derribo',
  attackPenalty: -30,
  attackPenaltyByWeaponSize: { small: -30 }
});

const weapon = ({ size, isUnarmed }) => ({
  system: {
    size: size ? { value: size } : undefined,
    isUnarmed: { value: !!isUnarmed }
  }
});

describe('ManeuverDefinition.getAttackPenalty — extra por tamaño y excepcion de desarmado', () => {
  test('arma corta REAL (small, no desarmado) -> -60', () => {
    expect(derribo.getAttackPenalty(weapon({ size: 'small', isUnarmed: false }))).toBe(-60);
  });

  test('DESARMADO / perfil AM (small pero isUnarmed) -> -30 (no aplica el extra de arma corta)', () => {
    expect(derribo.getAttackPenalty(weapon({ size: 'small', isUnarmed: true }))).toBe(-30);
  });

  test('arma media -> -30 (sin extra)', () => {
    expect(derribo.getAttackPenalty(weapon({ size: 'medium', isUnarmed: false }))).toBe(-30);
  });

  test('sin arma -> -30', () => {
    expect(derribo.getAttackPenalty(undefined)).toBe(-30);
  });
});
