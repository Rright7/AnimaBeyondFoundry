import {
  getCombatHandWeapons,
  defaultCombatWeapon,
  getActiveTurnShield,
  isRodela,
  isTwoHandedGrip,
  hasWeaponQuality,
  manageabilityFromQualities,
  GRIP_QUALITY_SLUGS,
  gripQualityForManageability,
  manageabilityForGripQuality,
  computeWeaponGripSync
} from './getCombatHandWeapons.js';

const w = ({
  shield = false,
  unarmed = false,
  size = 'medium',
  manage = 'one_hand',
  grip = 'one-handed',
  hand = 'none',
  quals = [],
  equipped = false,
  id
} = {}) => ({
  _id: id,
  system: {
    isShield: { value: shield },
    isUnarmed: { value: unarmed },
    size: { value: size },
    manageabilityType: { value: manage },
    oneOrTwoHanded: { value: grip },
    handSlot: { value: hand },
    qualities: { value: quals },
    equipped: { value: equipped }
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

describe('defaultCombatWeapon', () => {
  test('prefiere el arma EN LA MANO sobre la primera equipada (el bug de Precisa)', () => {
    // Arrojadiza equipada pero SIN empuñar + espada precisa en la mano hábil.
    const ranged = w({ id: 'jabalina', hand: 'none', equipped: true });
    const inHand = w({ id: 'espada', hand: 'main', equipped: true, quals: ['precise'] });
    expect(defaultCombatWeapon([ranged, inHand])).toBe(inHand);
  });

  test('nada en la mano + preferUnarmed -> perfil Desarmado antes que la equipada', () => {
    const ranged = w({ id: 'jabalina', hand: 'none', equipped: true });
    const unarmed = w({ id: 'desarmado', unarmed: true, quals: ['precise'] });
    expect(defaultCombatWeapon([ranged, unarmed], { preferUnarmed: true })).toBe(unarmed);
  });

  test('sin preferUnarmed cae a la primera equipada (no a Desarmado)', () => {
    const ranged = w({ id: 'jabalina', hand: 'none', equipped: true });
    const unarmed = w({ id: 'desarmado', unarmed: true });
    expect(defaultCombatWeapon([ranged, unarmed])).toBe(ranged);
  });

  test('sin manos ni Desarmado -> primera equipada (fallback)', () => {
    const a = w({ id: 'a', hand: 'none', equipped: true });
    expect(defaultCombatWeapon([a], { preferUnarmed: true })).toBe(a);
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

describe('mapeo agarre <-> manageabilityType', () => {
  test('las tres cualidades de agarre', () => {
    expect(GRIP_QUALITY_SLUGS).toEqual(['oneHand', 'twoHanded', 'oneOrTwoHanded']);
  });
  test('manageabilityType -> cualidad', () => {
    expect(gripQualityForManageability('one_hand')).toBe('oneHand');
    expect(gripQualityForManageability('two_hands')).toBe('twoHanded');
    expect(gripQualityForManageability('one_or_two_hands')).toBe('oneOrTwoHanded');
    expect(gripQualityForManageability('zzz')).toBeNull();
  });
  test('cualidad -> manageabilityType', () => {
    expect(manageabilityForGripQuality('oneHand')).toBe('one_hand');
    expect(manageabilityForGripQuality('twoHanded')).toBe('two_hands');
    expect(manageabilityForGripQuality('oneOrTwoHanded')).toBe('one_or_two_hands');
    expect(manageabilityForGripQuality('grappling')).toBeNull();
  });
});

describe('computeWeaponGripSync', () => {
  test('sin cambios -> parche vacio', () => {
    expect(computeWeaponGripSync({ currentManage: 'one_hand', currentQualities: ['oneHand'] })).toEqual(
      {}
    );
  });

  test('cambia el selector -> sustituye la cualidad de agarre (quita la anterior)', () => {
    expect(
      computeWeaponGripSync({
        currentManage: 'one_hand',
        currentQualities: ['oneHand', 'grappling'],
        changedManage: 'two_hands'
      })
    ).toEqual({ qualities: ['grappling', 'twoHanded'] });
  });

  test('cambia el selector en arma sin agarre previo -> añade la cualidad', () => {
    expect(
      computeWeaponGripSync({
        currentManage: 'one_hand',
        currentQualities: [],
        changedManage: 'one_or_two_hands'
      })
    ).toEqual({ qualities: ['oneOrTwoHanded'] });
  });

  test('arrastrar una cualidad de agarre nueva -> exclusividad (deja la ultima) + sincroniza selector', () => {
    expect(
      computeWeaponGripSync({
        currentManage: 'one_hand',
        changedQualities: ['oneHand', 'grappling', 'twoHanded']
      })
    ).toEqual({ qualities: ['grappling', 'twoHanded'], manageabilityType: 'two_hands' });
  });

  test('qualities con un solo agarre que no cuadra con el selector -> sincroniza selector', () => {
    expect(
      computeWeaponGripSync({
        currentManage: 'one_or_two_hands',
        changedQualities: ['twoHanded']
      })
    ).toEqual({ manageabilityType: 'two_hands' });
  });

  test('qualities ya consistentes -> no toca el selector', () => {
    expect(
      computeWeaponGripSync({
        currentManage: 'one_hand',
        changedQualities: ['oneHand', 'throwable']
      })
    ).toEqual({});
  });
});
