import {
  getMartialArtSpecial,
  martialArtManeuverPenaltyFactor,
  martialArtSpecialEffects,
  martialArtOpposedCheckBonus,
  martialArtExtraDefenses,
  martialArtCritBonus,
  martialArtArmorReduction,
  martialArtFlatArmor,
  martialArtDoublesPrecise,
  martialArtAllowedAttackTables,
  martialArtAllowsPowerChecks,
  martialArtGrantsFullManeuverDamage,
  martialArtAimedPenaltyFactor,
  martialArtCausesDirectBleeding
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
  test('Sambo Supremo dobla Precisa; otros grados/artes no', () => {
    expect(martialArtDoublesPrecise(actor(art('sambo', 'supreme')))).toBe(true);
    expect(martialArtDoublesPrecise(actor(art('sambo', 'advanced')))).toBe(false);
    expect(martialArtDoublesPrecise(actor(art('enuth', 'base')))).toBe(false);
    expect(martialArtDoublesPrecise(actor(art('boxeo', 'advanced')))).toBe(false);
  });
});

describe('martialArtAllowedAttackTables', () => {
  test('Dumah permite FIL/PEN desde Base y se mantiene en Arcano', () => {
    expect(martialArtAllowedAttackTables(actor(art('dumah', 'base')))).toEqual([
      'impact',
      'cut',
      'thrust'
    ]);
    expect(martialArtAllowedAttackTables(actor(art('dumah', 'arcane')))).toEqual([
      'impact',
      'cut',
      'thrust'
    ]);
  });

  test('Velez permite ENE solo en Arcano (en Base, solo CON)', () => {
    expect(martialArtAllowedAttackTables(actor(art('velez', 'base')))).toEqual(['impact']);
    expect(martialArtAllowedAttackTables(actor(art('velez', 'arcane')))).toEqual([
      'impact',
      'energy'
    ]);
  });

  test('CON (impact) siempre disponible aunque el arte no aporte tablas', () => {
    expect(martialArtAllowedAttackTables(actor(art('boxeo', 'advanced')))).toEqual(['impact']);
    expect(martialArtAllowedAttackTables(actor())).toEqual(['impact']);
    expect(martialArtAllowedAttackTables({})).toEqual(['impact']);
  });

  test('varias artes UNEN sus tablas sin duplicar', () => {
    const a = actor(art('dumah', 'base'), art('velez', 'arcane'));
    expect(martialArtAllowedAttackTables(a)).toEqual(['impact', 'cut', 'thrust', 'energy']);
  });

  test('descriptor: Dumah base/arcano declaran attackTables', () => {
    expect(getMartialArtSpecial('dumah', 'base').attackTables).toEqual(['cut', 'thrust']);
    expect(getMartialArtSpecial('dumah', 'arcane').attackTables).toEqual(['cut', 'thrust']);
    expect(getMartialArtSpecial('velez', 'arcane').attackTables).toEqual(['energy']);
  });
});

describe('martialArtAllowsPowerChecks', () => {
  test('Velez Arcano permite POD en chequeos; Base no', () => {
    expect(martialArtAllowsPowerChecks(actor(art('velez', 'arcane')))).toBe(true);
    expect(martialArtAllowsPowerChecks(actor(art('velez', 'base')))).toBe(false);
  });
  test('otras artes o sin artes -> false', () => {
    expect(martialArtAllowsPowerChecks(actor(art('dumah', 'arcane')))).toBe(false);
    expect(martialArtAllowsPowerChecks(actor(art('boxeo', 'advanced')))).toBe(false);
    expect(martialArtAllowsPowerChecks(actor())).toBe(false);
    expect(martialArtAllowsPowerChecks({})).toBe(false);
  });
  test('descriptor: velez.arcane declara powerChecks', () => {
    expect(getMartialArtSpecial('velez', 'arcane').powerChecks).toBe(true);
  });
});

describe('martialArtGrantsFullManeuverDamage', () => {
  test('Grappling Supremo concede dano completo en Presa y Derribo', () => {
    const a = actor(art('grappling', 'supreme'));
    expect(martialArtGrantsFullManeuverDamage(a, 'presa')).toBe(true);
    expect(martialArtGrantsFullManeuverDamage(a, 'derribo')).toBe(true);
  });
  test('Grappling Base/Avanzado NO conceden dano completo (siguen a la mitad)', () => {
    expect(martialArtGrantsFullManeuverDamage(actor(art('grappling', 'base')), 'derribo')).toBe(false);
    expect(martialArtGrantsFullManeuverDamage(actor(art('grappling', 'advanced')), 'presa')).toBe(false);
  });
  test('no aplica a otras maniobras ni otras artes ni sin slug', () => {
    expect(martialArtGrantsFullManeuverDamage(actor(art('grappling', 'supreme')), 'desarme')).toBe(false);
    expect(martialArtGrantsFullManeuverDamage(actor(art('sambo', 'supreme')), 'derribo')).toBe(false);
    expect(martialArtGrantsFullManeuverDamage(actor(art('grappling', 'supreme')), '')).toBe(false);
    expect(martialArtGrantsFullManeuverDamage(actor(), 'presa')).toBe(false);
  });
  test('descriptor: grappling.supreme declara fullDamageManeuvers', () => {
    expect(getMartialArtSpecial('grappling', 'supreme').fullDamageManeuvers).toEqual(['presa', 'derribo']);
  });
});

describe('martialArtAimedPenaltyFactor', () => {
  test('Sambo Supremo reduce apuntados a la mitad (0.5) por si mismo', () => {
    expect(martialArtAimedPenaltyFactor(actor(art('sambo', 'supreme')))).toBe(0.5);
  });
  test('Sambo Base/Avanzado y otras artes no reducen apuntados (1)', () => {
    expect(martialArtAimedPenaltyFactor(actor(art('sambo', 'base')))).toBe(1);
    expect(martialArtAimedPenaltyFactor(actor(art('sambo', 'advanced')))).toBe(1);
    expect(martialArtAimedPenaltyFactor(actor(art('grappling', 'supreme')))).toBe(1);
    expect(martialArtAimedPenaltyFactor(actor())).toBe(1);
  });
  test('descriptor: sambo.supreme declara aimedPenaltyFactor', () => {
    expect(getMartialArtSpecial('sambo', 'supreme').aimedPenaltyFactor).toBe(0.5);
  });
});

describe('martialArtCausesDirectBleeding', () => {
  test('Dumah Arcano desangra directamente; Base no', () => {
    expect(martialArtCausesDirectBleeding(actor(art('dumah', 'arcane')))).toBe(true);
    expect(martialArtCausesDirectBleeding(actor(art('dumah', 'base')))).toBe(false);
  });
  test('otras artes o sin artes -> false', () => {
    expect(martialArtCausesDirectBleeding(actor(art('hakyoukuken', 'arcane')))).toBe(false);
    expect(martialArtCausesDirectBleeding(actor())).toBe(false);
  });
  test('descriptor: dumah.arcane declara directBleeding', () => {
    expect(getMartialArtSpecial('dumah', 'arcane').directBleeding).toBe(true);
  });
});
