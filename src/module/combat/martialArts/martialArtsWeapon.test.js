import {
  applyMartialArtsWeaponBonuses,
  isMartialArtsProfileWeapon
} from './martialArtsWeapon.js';

const mkWeapon = isProfile => ({
  name: 'Artes Marciales',
  system: {
    isMartialArtsProfile: { value: isProfile },
    attack: { special: { value: 0 } },
    block: { special: { value: 0 } },
    damage: { special: { value: 0 } },
    initiative: { special: { value: 0 } }
  }
});

// data = actor.system. martialArtUnarmedDamage lee domine.martialArts + characteristics.
const mkData = (b, extra = {}) => ({
  general: { modifiers: { martialArtBonus: b } },
  ...extra
});

describe('isMartialArtsProfileWeapon', () => {
  it('detecta el flag', () => {
    expect(isMartialArtsProfileWeapon(mkWeapon(true))).toBe(true);
    expect(isMartialArtsProfileWeapon(mkWeapon(false))).toBe(false);
    expect(isMartialArtsProfileWeapon({})).toBe(false);
  });
});

describe('applyMartialArtsWeaponBonuses', () => {
  it('inyecta HA+Maestro, Parada+Maestro y Turno desde los buckets', () => {
    const w = mkWeapon(true);
    applyMartialArtsWeaponBonuses(
      w,
      mkData({
        attack: { value: 20 },
        masterAttack: { value: 5 },
        block: { value: 10 },
        masterDefense: { value: 15 },
        turn: { value: 10 }
      })
    );
    expect(w.system.attack.special.value).toBe(25); // 20 + 5
    expect(w.system.block.special.value).toBe(25); // 10 + 15
    expect(w.system.initiative.special.value).toBe(10);
  });

  it('daño: sin artes -> brawl 10+FUE via formula custom', () => {
    const w = mkWeapon(true);
    applyMartialArtsWeaponBonuses(
      w,
      mkData({}, { characteristics: { primaries: { strength: { mod: 5 } } } })
    );
    expect(w.system.useCustomFormula.value).toBe(true);
    expect(w.system.damage.special.value).toBe(0);
    expect(w.system.damage.formula.value).toBe('15'); // 10 + 5
  });

  it('no toca armas normales (no-op si no es el perfil)', () => {
    const w = mkWeapon(false);
    applyMartialArtsWeaponBonuses(w, mkData({ attack: { value: 20 } }));
    expect(w.system.attack.special.value).toBe(0);
    expect(w.system.useCustomFormula).toBeUndefined();
  });
});
