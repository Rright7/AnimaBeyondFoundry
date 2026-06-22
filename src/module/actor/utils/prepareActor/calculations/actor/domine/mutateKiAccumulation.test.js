import { mutateKiAccumulationStrength } from './mutateDomineData.js';

// final = max(base[tabla] + bono + ajuste_por_penalizador, 0); half = floor(final/2).
function makeData(base, bonus = 0, penalty = 0) {
  return {
    general: { modifiers: { allActions: { final: { value: penalty } } } },
    domine: {
      kiAccumulation: {
        strength: {
          base: { value: base },
          bonus: { value: bonus },
          final: { value: 0 },
          half: { value: 0 }
        }
      }
    }
  };
}

const finalOf = data => {
  mutateKiAccumulationStrength(data);
  return data.domine.kiAccumulation.strength;
};

describe('mutateKiAccumulation (bono de Acumulación)', () => {
  test('sin bono ni penalizador: final = base', () => {
    expect(finalOf(makeData(2)).final.value).toBe(2);
  });

  test('el bono se suma a la base de tabla', () => {
    const acc = finalOf(makeData(2, 1));
    expect(acc.final.value).toBe(3);
    expect(acc.half.value).toBe(1);
  });

  test('el bono puede superar el tope de tabla (4)', () => {
    expect(finalOf(makeData(4, 2)).final.value).toBe(6);
  });

  test('el penalizador de todas las acciones reduce (base+bono)', () => {
    // penalty -20 -> ceil(-1) = -1 -> final = max(2 + 1 - 1, 0) = 2
    expect(finalOf(makeData(2, 1, -20)).final.value).toBe(2);
  });

  test('suelo 0: un bono negativo grande no baja de 0', () => {
    expect(finalOf(makeData(1, -5)).final.value).toBe(0);
  });

  test('bono ausente (undefined) se trata como 0', () => {
    const data = makeData(2);
    delete data.domine.kiAccumulation.strength.bonus;
    expect(finalOf(data).final.value).toBe(2);
  });
});
