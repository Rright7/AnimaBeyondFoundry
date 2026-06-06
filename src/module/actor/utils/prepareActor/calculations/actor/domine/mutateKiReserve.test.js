import { mutateKiReserve } from './mutateDomineData.js';

const ACCUMS = ['strength', 'agility', 'dexterity', 'constitution', 'willPower', 'power'];

// Construye el nodo kiAccumulation con un valor de kiPoints.final por característica
// (lista de 6), un `current` inicial y un `modifier` para la reserva.
function makeData(finals, current = 0, modifier = 0) {
  const kiAccumulation = {};
  ACCUMS.forEach((accum, i) => {
    kiAccumulation[accum] = { kiPoints: { final: { value: finals[i] ?? 0 } } };
  });
  kiAccumulation.reserve = {
    base: { value: 0 },
    modifier: { value: modifier },
    max: { value: 0 },
    current: { value: current }
  };
  return { domine: { kiAccumulation } };
}

describe('mutateKiReserve', () => {
  test('base = suma de los kiPoints; max = base (sin modificador)', () => {
    const data = makeData([10, 10, 8, 10, 10, 10]); // = 58
    mutateKiReserve(data);
    expect(data.domine.kiAccumulation.reserve.base.value).toBe(58);
    expect(data.domine.kiAccumulation.reserve.max.value).toBe(58);
  });

  test('max = base + modificador (artefactos/extra, suma o resta)', () => {
    const plus = makeData([10, 10, 8, 10, 10, 10], null, 20);
    mutateKiReserve(plus);
    expect(plus.domine.kiAccumulation.reserve.max.value).toBe(78); // 58 + 20

    const minus = makeData([10, 10, 8, 10, 10, 10], null, -10);
    mutateKiReserve(minus);
    expect(minus.domine.kiAccumulation.reserve.max.value).toBe(48); // 58 - 10
  });

  test('arranca llena solo cuando no se ha inicializado (null)', () => {
    const data = makeData([10, 10, 8, 10, 10, 10], null);
    mutateKiReserve(data);
    expect(data.domine.kiAccumulation.reserve.current.value).toBe(58);
  });

  test('una reserva agotada (0) se queda en 0, NO se rellena sola', () => {
    const data = makeData([10, 10, 8, 10, 10, 10], 0);
    mutateKiReserve(data);
    expect(data.domine.kiAccumulation.reserve.current.value).toBe(0);
  });

  test('respeta una reserva actual ya gastada (>0 y <=max)', () => {
    const data = makeData([10, 10, 8, 10, 10, 10], 45);
    mutateKiReserve(data);
    expect(data.domine.kiAccumulation.reserve.current.value).toBe(45);
  });

  test('acota la reserva actual al máximo y los negativos a 0', () => {
    const over = makeData([10, 10, 8, 10, 10, 10], 999);
    mutateKiReserve(over);
    expect(over.domine.kiAccumulation.reserve.current.value).toBe(58);

    const under = makeData([10, 10, 8, 10, 10, 10], -5);
    mutateKiReserve(under);
    expect(under.domine.kiAccumulation.reserve.current.value).toBe(0);
  });
});
