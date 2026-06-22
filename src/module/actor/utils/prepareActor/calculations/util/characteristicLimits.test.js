import {
  characteristicCap,
  realCharacteristicValue,
  PHYSICAL_CHARACTERISTIC_KEYS,
  SYSTEM_CHARACTERISTIC_CEILING
} from './characteristicLimits.js';

describe('characteristicCap', () => {
  const physical = [...PHYSICAL_CHARACTERISTIC_KEYS];

  it('caps physical characteristics at 10 without Inhumanidad/Zen', () => {
    for (const key of physical) {
      expect(characteristicCap(key, { inhuman: false, zen: false })).toBe(10);
    }
  });

  it('raises physical cap to 13 with Inhumanidad', () => {
    for (const key of physical) {
      expect(characteristicCap(key, { inhuman: true, zen: false })).toBe(13);
    }
  });

  it('raises physical cap to the system ceiling (20) with Zen', () => {
    for (const key of physical) {
      expect(characteristicCap(key, { inhuman: false, zen: true })).toBe(20);
    }
  });

  it('Zen prevails over Inhumanidad', () => {
    expect(characteristicCap('strength', { inhuman: true, zen: true })).toBe(20);
  });

  it('keeps psychic characteristics at the system ceiling regardless of flags', () => {
    for (const key of ['intelligence', 'perception', 'power', 'willPower']) {
      expect(characteristicCap(key, { inhuman: false, zen: false })).toBe(
        SYSTEM_CHARACTERISTIC_CEILING
      );
      expect(characteristicCap(key, { inhuman: true, zen: true })).toBe(
        SYSTEM_CHARACTERISTIC_CEILING
      );
    }
  });

  it('defaults missing flags to the human cap', () => {
    expect(characteristicCap('strength')).toBe(10);
  });
});

describe('realCharacteristicValue', () => {
  it('devuelve base+special SIN el tope de Inhumanidad/Zen', () => {
    // CON 11 (real) aunque el valor mostrado se cape a 10 sin Inhumanidad.
    expect(realCharacteristicValue({ base: { value: 11 }, special: { value: 0 } })).toBe(11);
    expect(realCharacteristicValue({ base: { value: 8 }, special: { value: 3 } })).toBe(11);
  });

  it('acota al techo del sistema (20) y a 0 por abajo', () => {
    expect(realCharacteristicValue({ base: { value: 18 }, special: { value: 5 } })).toBe(20);
    expect(realCharacteristicValue({ base: { value: 2 }, special: { value: -10 } })).toBe(0);
  });

  it('trata valores ausentes como 0', () => {
    expect(realCharacteristicValue({})).toBe(0);
    expect(realCharacteristicValue(undefined)).toBe(0);
    expect(realCharacteristicValue({ base: { value: 10 } })).toBe(10);
  });
});
