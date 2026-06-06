import {
  kiPointsFromCharacteristic,
  kiAccumulationFromCharacteristic
} from './kiTable.js';

describe('kiTable — Puntos de Ki (car + máx(0, car-10))', () => {
  it('iguala la característica hasta 10', () => {
    expect(kiPointsFromCharacteristic(1)).toBe(1);
    expect(kiPointsFromCharacteristic(8)).toBe(8);
    expect(kiPointsFromCharacteristic(10)).toBe(10);
  });

  it('cuenta doble por encima de 10', () => {
    expect(kiPointsFromCharacteristic(11)).toBe(12);
    expect(kiPointsFromCharacteristic(13)).toBe(16);
    expect(kiPointsFromCharacteristic(15)).toBe(20);
    expect(kiPointsFromCharacteristic(20)).toBe(30);
  });

  it('0 o negativo -> 0', () => {
    expect(kiPointsFromCharacteristic(0)).toBe(0);
    expect(kiPointsFromCharacteristic(-3)).toBe(0);
  });
});

describe('kiTable — Acumulación (Tabla_Acum, Ficha Anima v8.7.0)', () => {
  it('por tramos 1-9/10-12/13-15/16+', () => {
    expect(kiAccumulationFromCharacteristic(0)).toBe(0);
    [1, 5, 9].forEach(c => expect(kiAccumulationFromCharacteristic(c)).toBe(1));
    [10, 11, 12].forEach(c => expect(kiAccumulationFromCharacteristic(c)).toBe(2));
    [13, 14, 15].forEach(c => expect(kiAccumulationFromCharacteristic(c)).toBe(3));
    [16, 18, 20].forEach(c => expect(kiAccumulationFromCharacteristic(c)).toBe(4));
  });

  it('satura en 4 por encima de 20', () => {
    expect(kiAccumulationFromCharacteristic(25)).toBe(4);
  });
});
