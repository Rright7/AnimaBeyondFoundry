import {
  characteristicCap,
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
