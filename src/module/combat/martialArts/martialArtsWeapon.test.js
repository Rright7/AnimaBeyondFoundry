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
  it('NO inyecta Ataque/Parada/Turno en .special (es el bono manual del jugador)', () => {
    const w = mkWeapon(true);
    w.system.attack.special.value = 3; // bono manual previo del jugador
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
    // El bono del arte se suma en calculateWeaponAttack/Block/Initiative, no aqui:
    // .special queda intacto (el bono manual se conserva).
    expect(w.system.attack.special.value).toBe(3);
    expect(w.system.block.special.value).toBe(0);
    expect(w.system.initiative.special.value).toBe(0);
  });

  it('daño: formula custom (brawl 10+FUE) y conserva el bono manual de daño', () => {
    const w = mkWeapon(true);
    w.system.damage.special.value = 7; // bono manual del jugador
    applyMartialArtsWeaponBonuses(
      w,
      mkData({}, { characteristics: { primaries: { strength: { mod: 5 } } } })
    );
    expect(w.system.useCustomFormula.value).toBe(true);
    expect(w.system.damage.special.value).toBe(7); // preservado, NO forzado a 0
    expect(w.system.damage.formula.value).toBe('15'); // 10 + 5
  });

  it('daño: arte de POD (Tai Chi) usa su Daño Base con POD, no el brawl de FUE', () => {
    const w = mkWeapon(true);
    applyMartialArtsWeaponBonuses(
      w,
      mkData(
        {},
        {
          domine: {
            martialArts: [{ system: { canonicalId: 'taiChi', grade: { value: 'base' } } }]
          },
          characteristics: { primaries: { strength: { mod: 20 }, power: { mod: 5 } } }
        }
      )
    );
    // Tai Chi base = 20 + 1xPOD(5) = 25; brawl = 10 + FUE(20) = 30. Antes Math.max -> 30 (FUE);
    // ahora usa el Dano Base del arte (POD) = 25, sin que el FUE lo pise.
    expect(w.system.damage.formula.value).toBe('25');
  });

  it('no toca armas normales (no-op si no es el perfil)', () => {
    const w = mkWeapon(false);
    applyMartialArtsWeaponBonuses(w, mkData({ attack: { value: 20 } }));
    expect(w.system.attack.special.value).toBe(0);
    expect(w.system.useCustomFormula).toBeUndefined();
  });
});
