import {
  getCombatHandWeapons,
  getActiveTurnShield,
  isRodela,
  isTwoHandedGrip,
  hasWeaponQuality,
  manageabilityFromQualities
} from './getCombatHandWeapons.js';

const w = ({
  shield = false,
  unarmed = false,
  size = 'medium',
  manage = 'one_hand',
  grip = 'one-handed',
  hand = 'none',
  quals = []
} = {}) => ({
  system: {
    isShield: { value: shield },
    isUnarmed: { value: unarmed },
    size: { value: size },
    manageabilityType: { value: manage },
    oneOrTwoHanded: { value: grip },
    handSlot: { value: hand },
    qualities: { value: quals }
  }
});

describe('getCombatHandWeapons', () => {
  test('equipada SIN mano asignada no cuenta (fuente unica = manos)', () => {
    expect(getCombatHandWeapons([w({ hand: 'none' })])).toEqual([]);
  });

  test('un arma en mano habil', () => {
    const a = w({ hand: 'main' });
    expect(getCombatHandWeapons([a])).toEqual([a]);
  });

  test('dos armas: habil + torpe', () => {
    const a = w({ hand: 'main' });
    const b = w({ hand: 'off' });
    expect(getCombatHandWeapons([a, b])).toEqual([a, b]);
  });

  test('arma a dos manos (two_hands) ocupa ambas -> cuenta sola', () => {
    const a = w({ hand: 'main', manage: 'two_hands' });
    const b = w({ hand: 'off' });
    expect(getCombatHandWeapons([a, b])).toEqual([a]);
  });

  test('arma asignada a dos manos (both) ocupa ambas -> cuenta sola', () => {
    const a = w({ hand: 'both', manage: 'one_or_two_hands' });
    const b = w({ hand: 'off' });
    expect(getCombatHandWeapons([a, b])).toEqual([a]);
  });

  test('escudos y armas de cuerpo entero no entran en la pareja', () => {
    const shield = w({ shield: true, hand: 'off' });
    const unarmed = w({ unarmed: true, hand: 'main' });
    expect(getCombatHandWeapons([shield, unarmed])).toEqual([]);
  });
});

describe('getActiveTurnShield', () => {
  test('rodela (escudo pequeno) penaliza por estar equipada, sin mano', () => {
    const r = w({ shield: true, size: 'small', hand: 'none' });
    expect(getActiveTurnShield([r])).toBe(r);
    expect(isRodela(r)).toBe(true);
  });

  test('escudo mediano/grande solo penaliza si esta en mano', () => {
    const noHand = w({ shield: true, size: 'medium', hand: 'none' });
    expect(getActiveTurnShield([noHand])).toBeNull();
    const inHand = w({ shield: true, size: 'big', hand: 'off' });
    expect(getActiveTurnShield([inHand])).toBe(inHand);
  });

  test('un arma no-escudo nunca es escudo activo', () => {
    expect(getActiveTurnShield([w({ hand: 'main' })])).toBeNull();
  });
});

describe('isTwoHandedGrip', () => {
  test('two_hands puro', () => {
    expect(isTwoHandedGrip(w({ manage: 'two_hands' }))).toBe(true);
  });
  test('one_or_two_hands: dos manos solo si handSlot both', () => {
    expect(isTwoHandedGrip(w({ manage: 'one_or_two_hands', hand: 'both' }))).toBe(true);
    expect(isTwoHandedGrip(w({ manage: 'one_or_two_hands', hand: 'main' }))).toBe(false);
    expect(isTwoHandedGrip(w({ manage: 'one_or_two_hands', hand: 'none' }))).toBe(false);
  });
  test('one_hand nunca', () => {
    expect(isTwoHandedGrip(w({ manage: 'one_hand' }))).toBe(false);
  });
});

describe('manageabilityFromQualities', () => {
  test('twoHanded -> two_hands', () => {
    expect(manageabilityFromQualities(w({ quals: ['twoHanded'] }))).toBe('two_hands');
  });
  test('oneOrTwoHanded gana en prioridad', () => {
    expect(
      manageabilityFromQualities(w({ quals: ['twoHanded', 'oneOrTwoHanded'] }))
    ).toBe('one_or_two_hands');
  });
  test('oneHand -> one_hand', () => {
    expect(manageabilityFromQualities(w({ quals: ['oneHand'] }))).toBe('one_hand');
  });
  test('sin cualidad de manejabilidad -> null (respeta el selector)', () => {
    expect(manageabilityFromQualities(w({ quals: ['grappling'] }))).toBeNull();
    expect(manageabilityFromQualities(w())).toBeNull();
  });
});

describe('hasWeaponQuality', () => {
  test('detecta la cualidad (case-insensitive)', () => {
    expect(hasWeaponQuality(w({ quals: ['noStrengthDouble'] }), 'nostrengthdouble')).toBe(true);
    expect(hasWeaponQuality(w({ quals: ['twoHanded'] }), 'noStrengthDouble')).toBe(false);
  });
});
