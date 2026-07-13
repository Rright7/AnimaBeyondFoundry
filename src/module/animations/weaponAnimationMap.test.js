import {
  weaponTypeFor,
  weaponAttackEffect,
  weaponMeleeType,
  weaponMeleeEffect,
  weaponImpactEffect,
  weaponReactionEffect
} from './weaponAnimationMap.js';

describe('weaponAnimationMap — tipo de arma por nombre', () => {
  test('melee por nombre con longest-match', () => {
    expect(weaponTypeFor({ weaponName: 'Espada bastarda', critic: 'cut' })).toBe('sword');
    expect(weaponTypeFor({ weaponName: 'Mandoble', critic: 'cut' })).toBe('greatsword');
    expect(weaponTypeFor({ weaponName: 'Hacha a dos manos', critic: 'cut' })).toBe('greataxe');
    expect(weaponTypeFor({ weaponName: 'Gran martillo de guerra', critic: 'impact' })).toBe('warhammer');
    expect(weaponTypeFor({ weaponName: 'Alabarda', critic: 'cut' })).toBe('polearm');
    expect(weaponTypeFor({ weaponName: 'Katana', critic: 'cut' })).toBe('sword');
    expect(weaponTypeFor({ weaponName: 'Daga de parada', critic: 'thrust' })).toBe('dagger');
  });

  test('a distancia por palabra clave de proyectil', () => {
    expect(weaponTypeFor({ weaponName: 'Arco largo', critic: 'thrust', isRanged: true, shotType: 'shot' })).toBe('bow');
    expect(weaponTypeFor({ weaponName: 'Ballesta pesada', critic: 'thrust', isRanged: true, shotType: 'shot' })).toBe('crossbow');
    expect(weaponTypeFor({ weaponName: 'Arcabuz', critic: 'impact', isRanged: true, shotType: 'shot' })).toBe('firearm');
    expect(weaponTypeFor({ weaponName: 'Honda', critic: 'impact', isRanged: true, shotType: 'shot' })).toBe('sling');
    // arrojadiza melee (daga lanzada) sin palabra clave de proyectil -> thrown
    expect(weaponTypeFor({ weaponName: 'Daga', critic: 'thrust', isRanged: true, shotType: 'throw' })).toBe('thrown');
  });

  test('fallback por critico cuando el nombre no casa', () => {
    expect(weaponTypeFor({ weaponName: 'Chisme inventado', critic: 'cut' })).toBe('sword');
    expect(weaponTypeFor({ weaponName: 'Chisme inventado', critic: 'thrust' })).toBe('spear');
    expect(weaponTypeFor({ weaponName: 'Chisme inventado', critic: 'impact' })).toBe('mace');
  });
});

describe('weaponAnimationMap — efectos', () => {
  test('ataque: proyectil (ranged) vs swing melee', () => {
    const bow = weaponAttackEffect('bow');
    expect(bow.ranged).toBe(true);
    expect(Array.isArray(bow.file)).toBe(true);
    const sword = weaponAttackEffect('sword');
    expect(sword.ranged).toBe(false);
    expect(sword.file.length).toBeGreaterThan(0);
    // tipo desconocido -> melee sword
    expect(weaponAttackEffect('inexistente').file).toEqual(weaponAttackEffect('sword').file);
  });

  test('melee-only: todo se anima como cuerpo a cuerpo (incluso armas a distancia)', () => {
    expect(weaponMeleeType('Espada bastarda', 'cut')).toBe('sword');
    // un arma a distancia por nombre (arco) degrada a melee por critico (thrust -> spear)
    expect(weaponMeleeType('Arco largo', 'thrust')).toBe('spear');
    const bowMelee = weaponMeleeEffect('Arco largo', 'thrust');
    expect(Array.isArray(bowMelee)).toBe(true);
    expect(bowMelee).not.toEqual(weaponAttackEffect('bow').file);
    // nombre desconocido -> melee por critico
    expect(weaponMeleeType('Chisme raro', 'impact')).toBe('mace');
  });

  test('impacto por critico + generico', () => {
    expect(weaponImpactEffect('cut')).toBeTruthy();
    expect(weaponImpactEffect('thrust')).toBeTruthy();
    expect(weaponImpactEffect('impact')).toBeTruthy();
    expect(weaponImpactEffect('desconocido')).toEqual(weaponImpactEffect('generic'));
  });

  test('reaccion por tipo de defensa (escudo/parada/esquiva distintas)', () => {
    expect(weaponReactionEffect('shield')).toBeTruthy();
    expect(weaponReactionEffect('dodge')).toBeTruthy();
    expect(weaponReactionEffect('block')).toBeTruthy();
    expect(weaponReactionEffect('shield')).not.toEqual(weaponReactionEffect('dodge'));
  });
});
