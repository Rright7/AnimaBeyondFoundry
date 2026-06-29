import { pointBlankAttackBonus } from './pointBlank';

describe('pointBlankAttackBonus (a bocajarro: +30 solo al disparado)', () => {
  it('disparado (shot) a bocajarro -> +30', () => {
    expect(pointBlankAttackBonus('shot', true)).toBe(30);
  });

  it('lanzado (throw) a bocajarro -> 0 (sin bono al ataque)', () => {
    expect(pointBlankAttackBonus('throw', true)).toBe(0);
  });

  it('disparado pero NO a bocajarro -> 0', () => {
    expect(pointBlankAttackBonus('shot', false)).toBe(0);
  });

  it('robusto ante tipos/flags raros', () => {
    expect(pointBlankAttackBonus('', true)).toBe(0);
    expect(pointBlankAttackBonus(undefined, true)).toBe(0);
    expect(pointBlankAttackBonus('shot', undefined)).toBe(0);
    expect(pointBlankAttackBonus('shot', 0)).toBe(0);
  });
});
