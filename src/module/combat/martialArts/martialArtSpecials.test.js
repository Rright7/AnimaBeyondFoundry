import {
  getMartialArtSpecial,
  martialArtManeuverPenaltyFactor,
  martialArtSpecialEffects,
  martialArtOpposedCheckBonus,
  martialArtExtraDefenses,
  martialArtCritBonus,
  martialArtArmorReduction,
  martialArtFlatArmor,
  martialArtDoublesPrecise
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

describe('martialArtExtraDefenses', () => {
  test('Lama: avanzado 1, supremo 2', () => {
    expect(martialArtExtraDefenses(actor(art('lama', 'advanced')))).toEqual({ count: 1, never: false });
    expect(martialArtExtraDefenses(actor(art('lama', 'supreme')))).toEqual({ count: 2, never: false });
  });

  test('Lama Tsu: base 2, arcano exencion total (never)', () => {
    expect(martialArtExtraDefenses(actor(art('lamaTsu', 'base')))).toEqual({ count: 2, never: false });
    expect(martialArtExtraDefenses(actor(art('lamaTsu', 'arcane')))).toEqual({ count: 0, never: true });
  });

  test('varias artes: SE SUMAN los count y OR del never', () => {
    // Lama Supremo (2) + Lama Tsu Base (2) => 4 (se suman, RAW)
    expect(martialArtExtraDefenses(actor(art('lama', 'supreme'), art('lamaTsu', 'base')))).toEqual({
      count: 4,
      never: false
    });
    // Lama Avanzado (1) + Lama Tsu Arcano (never): count 1 (Arcano no aporta count), never true
    expect(martialArtExtraDefenses(actor(art('lama', 'advanced'), art('lamaTsu', 'arcane')))).toEqual({
      count: 1,
      never: true
    });
  });

  test('arte sin defensas extra (Boxeo) o sin artes -> {0,false}', () => {
    expect(martialArtExtraDefenses(actor(art('boxeo', 'advanced')))).toEqual({ count: 0, never: false });
    expect(martialArtExtraDefenses(actor())).toEqual({ count: 0, never: false });
  });
});

describe('martialArtCritBonus', () => {
  test('Moai Thai supremo +20 siempre', () => {
    expect(martialArtCritBonus(actor(art('moaiThai', 'supreme')))).toBe(20);
  });
  test('Asakusen +20 SOLO si apuntado', () => {
    const a = actor(art('asakusen', 'arcane'));
    expect(martialArtCritBonus(a)).toBe(0);
    expect(martialArtCritBonus(a, { aimed: true })).toBe(20);
  });
  test('Enuth +20/+50 SOLO con Inconsciencia', () => {
    const a = actor(art('enuth', 'base'));
    expect(martialArtCritBonus(a)).toBe(0);
    expect(martialArtCritBonus(a, { maneuverSlug: 'inconsciencia' })).toBe(20);
    expect(martialArtCritBonus(actor(art('enuth', 'arcane')), { maneuverSlug: 'inconsciencia' })).toBe(50);
  });
  test('Hakyoukuken +20/+40 siempre', () => {
    expect(martialArtCritBonus(actor(art('hakyoukuken', 'base')))).toBe(20);
    expect(martialArtCritBonus(actor(art('hakyoukuken', 'arcane')))).toBe(40);
  });
  test('varias artes criticas SUMAN', () => {
    expect(martialArtCritBonus(actor(art('moaiThai', 'supreme'), art('hakyoukuken', 'base')))).toBe(40);
  });
});

describe('martialArtArmorReduction', () => {
  test('Dumah reduce TA general -2/-6', () => {
    expect(martialArtArmorReduction(actor(art('dumah', 'base')))).toEqual({ general: 2, soft: 0 });
    expect(martialArtArmorReduction(actor(art('dumah', 'arcane')))).toEqual({ general: 6, soft: 0 });
  });
  test('Hakyoukuken reduce SOLO TA blanda (-2 / anula=Infinity)', () => {
    expect(martialArtArmorReduction(actor(art('hakyoukuken', 'base')))).toEqual({ general: 0, soft: 2 });
    expect(martialArtArmorReduction(actor(art('hakyoukuken', 'arcane')))).toEqual({ general: 0, soft: 999 });
  });
  test('sin reduccion -> {0,0}', () => {
    expect(martialArtArmorReduction(actor(art('boxeo', 'advanced')))).toEqual({ general: 0, soft: 0 });
  });
});

describe('martialArtFlatArmor', () => {
  test('Rex Frame +3/+6; sin el -> 0', () => {
    expect(martialArtFlatArmor(actor(art('rexFrame', 'base')))).toBe(3);
    expect(martialArtFlatArmor(actor(art('rexFrame', 'arcane')))).toBe(6);
    expect(martialArtFlatArmor(actor(art('boxeo', 'advanced')))).toBe(0);
  });
});

describe('martialArtDoublesPrecise', () => {
  test('Enuth dobla Precisa; otras no', () => {
    expect(martialArtDoublesPrecise(actor(art('enuth', 'base')))).toBe(true);
    expect(martialArtDoublesPrecise(actor(art('enuth', 'arcane')))).toBe(true);
    expect(martialArtDoublesPrecise(actor(art('boxeo', 'advanced')))).toBe(false);
  });
});
