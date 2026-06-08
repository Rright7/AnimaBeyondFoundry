import { maxFatiguePerAction } from './fatigue.js';

const mkActor = kiSkills => ({ system: { domine: { kiSkills } } });

describe('maxFatiguePerAction', () => {
  it('por defecto 2 (sin la habilidad / actor vacio)', () => {
    expect(maxFatiguePerAction(mkActor([]))).toBe(2);
    expect(maxFatiguePerAction({})).toBe(2);
    expect(maxFatiguePerAction(undefined)).toBe(2);
  });

  it('5 con "Uso de la energia necesaria" por canonicalId', () => {
    expect(
      maxFatiguePerAction(mkActor([{ system: { canonicalId: 'necessaryEnergyUse' } }]))
    ).toBe(5);
  });

  it('5 detectando por nombre (con tildes)', () => {
    expect(
      maxFatiguePerAction(mkActor([{ name: 'Uso de la energía necesaria', system: {} }]))
    ).toBe(5);
  });

  it('otras habilidades de ki no suben el tope', () => {
    expect(maxFatiguePerAction(mkActor([{ system: { canonicalId: 'kiControl' } }]))).toBe(2);
  });
});
