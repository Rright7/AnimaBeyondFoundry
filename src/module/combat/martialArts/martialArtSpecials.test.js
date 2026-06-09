import {
  getMartialArtSpecial,
  martialArtManeuverPenaltyFactor,
  martialArtSpecialEffects,
  martialArtOpposedCheckBonus
} from './martialArtSpecials.js';

const art = (canonicalId, grade) => ({ system: { canonicalId, grade: { value: grade } } });
const actor = (...arts) => ({ system: { domine: { martialArts: arts } } });

describe('getMartialArtSpecial', () => {
  test('devuelve el descriptor del arte/grado', () => {
    expect(getMartialArtSpecial('grappling', 'base').maneuverPenaltyReduction.factor).toBe(0.5);
    expect(getMartialArtSpecial('grappling', 'advanced').maneuverPenaltyReduction.factor).toBe(0);
    expect(getMartialArtSpecial('boxeo', 'advanced').counterAttackBonus).toBe(10);
  });
  test('null si no hay descriptor', () => {
    expect(getMartialArtSpecial('boxeo', 'base')).toBeNull();
    expect(getMartialArtSpecial('shotokan', 'supreme')).toBeNull();
  });
});

describe('martialArtManeuverPenaltyFactor', () => {
  test('Grappling base = mitad; avanzado = sin penalizador (presa/derribo)', () => {
    expect(martialArtManeuverPenaltyFactor(actor(art('grappling', 'base')), 'presa')).toBe(0.5);
    expect(martialArtManeuverPenaltyFactor(actor(art('grappling', 'advanced')), 'derribo')).toBe(0);
  });

  test('no aplica a maniobras no listadas', () => {
    expect(martialArtManeuverPenaltyFactor(actor(art('pankration', 'base')), 'derribo')).toBe(1);
    expect(martialArtManeuverPenaltyFactor(actor(art('pankration', 'base')), 'presa')).toBe(0.5);
  });

  test('toma la mejor (menor) reduccion entre varias artes', () => {
    const a = actor(art('sambo', 'base'), art('grappling', 'advanced'));
    // sambo derribo = 0.5; grappling no cubre derribo a 0... grappling SI cubre derribo (0)
    expect(martialArtManeuverPenaltyFactor(a, 'derribo')).toBe(0);
  });

  test('counterOnly (Aikido) solo cuenta al contraatacar', () => {
    const a = actor(art('aikido', 'advanced'));
    expect(martialArtManeuverPenaltyFactor(a, 'presa')).toBe(1); // ataque normal: no reduce
    expect(martialArtManeuverPenaltyFactor(a, 'presa', { isCounterAttack: true })).toBe(0); // contra: sin penalizador
  });

  test('sin artes -> factor 1', () => {
    expect(martialArtManeuverPenaltyFactor(actor(), 'presa')).toBe(1);
    expect(martialArtManeuverPenaltyFactor({}, 'presa')).toBe(1);
  });
});

describe('martialArtSpecialEffects', () => {
  test('agrega contraataque: suma bono, producto multiplicador, max dano-FUE', () => {
    const a = actor(art('boxeo', 'advanced'), art('selene', 'base'), art('aikido', 'supreme'));
    const e = martialArtSpecialEffects(a);
    expect(e.counterAttackBonus).toBe(10); // Boxeo
    expect(e.counterAttackMultiplier).toBe(2); // Selene x2
    expect(e.counterDamageFromEnemyStr).toBe(4); // Aikido supremo
  });

  test('sin artes con special -> neutro', () => {
    const e = martialArtSpecialEffects(actor(art('shotokan', 'supreme')));
    expect(e).toEqual({
      counterAttackBonus: 0,
      counterAttackMultiplier: 1,
      counterDamageFromEnemyStr: 0,
      opposedCheckBonuses: []
    });
  });
});

describe('martialArtOpposedCheckBonus', () => {
  test('Kardad da bono defensivo a Presa/Derribo; no ofensivo', () => {
    const a = actor(art('kardad', 'advanced'));
    expect(martialArtOpposedCheckBonus(a, 'presa', 'defender')).toBe(3);
    expect(martialArtOpposedCheckBonus(a, 'presa', 'attacker')).toBe(0);
  });

  test('Melkaiah da bono ofensivo a Presa/Derribo', () => {
    const a = actor(art('melkaiah', 'base'));
    expect(martialArtOpposedCheckBonus(a, 'derribo', 'attacker')).toBe(3);
  });
});
