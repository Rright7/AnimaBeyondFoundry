import {
  getCombatHandWeapons,
  getActiveTurnShield,
  isRodela,
  isTwoHandedGrip
} from './getCombatHandWeapons.js';

const w = ({
  shield = false,
  unarmed = false,
  size = 'medium',
  manage = 'one_hand',
  grip = 'one-handed',
  hand = 'none'
} = {}) => ({
  system: {
    isShield: { value: shield },
    isUnarmed: { value: unarmed },
    size: { value: size },
    manageabilityType: { value: manage },
    oneOrTwoHanded: { value: grip },
    handSlot: { value: hand }
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

  test('one_or_two_hands elegida a dos manos tambien cuenta sola', () => {
    const a = w({ hand: 'main', manage: 'one_or_two_hands', grip: 'two-handed' });
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
  test('one_or_two_hands segun eleccion', () => {
    expect(isTwoHandedGrip(w({ manage: 'one_or_two_hands', grip: 'two-handed' }))).toBe(true);
    expect(isTwoHandedGrip(w({ manage: 'one_or_two_hands', grip: 'one-handed' }))).toBe(false);
  });
  test('one_hand nunca', () => {
    expect(isTwoHandedGrip(w({ manage: 'one_hand' }))).toBe(false);
  });
});
