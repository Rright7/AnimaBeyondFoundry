import {
  martialArtUnarmedDamage,
  buildMartialArtView,
  findMartialArtByName,
  GRADE_ES_TO_KEY,
  martialArtsAdditionalAttack
} from './martialArtCatalog.js';

const actorWith = (arts, strMod = 5, powMod = 3) => ({
  system: {
    domine: { martialArts: arts },
    characteristics: {
      primaries: { strength: { mod: strMod }, power: { mod: powMod } }
    }
  }
});
const art = (id, grade) => ({ name: id, system: { canonicalId: id, grade: { value: grade } } });

describe('martialArtUnarmedDamage', () => {
  it('Shotokan Supremo: 50 + FUE', () => {
    expect(martialArtUnarmedDamage(actorWith([art('shotokan', 'supreme')]))).toEqual({
      base: 55,
      bonus: 0
    });
  });

  it('Tai Chi Supremo usa POD: 20 + 2xPOD', () => {
    expect(martialArtUnarmedDamage(actorWith([art('taiChi', 'supreme')], 5, 3))).toEqual({
      base: 26,
      bonus: 0
    });
  });

  it('elige el MAYOR Daño Base y suma bonos de daño de Avanzadas', () => {
    const a = actorWith([
      art('shotokan', 'supreme'), // 55
      art('aikido', 'supreme'), // 15
      art('hakyoukuken', 'arcane') // base null, bono +30
    ]);
    expect(martialArtUnarmedDamage(a)).toEqual({ base: 55, bonus: 30 });
  });

  it('sin artes: base null, bono 0', () => {
    expect(martialArtUnarmedDamage(actorWith([]))).toEqual({ base: null, bonus: 0 });
  });
});

describe('buildMartialArtView', () => {
  it('Shotokan Supremo: summary con HA, CM y Daño', () => {
    const v = buildMartialArtView(art('shotokan', 'supreme'));
    expect(v.known).toBe(true);
    expect(v.gradeLabel).toBe('Supremo');
    expect(v.summary).toContain('HA +20');
    expect(v.summary).toContain('CM +20');
    expect(v.summary).toContain('Daño 50 + FUE');
  });

  it('Aikido Avanzado: requisitos del manual, especial y opciones de grado', () => {
    const v = buildMartialArtView(art('aikido', 'advanced'));
    expect(v.requirements).toContain('Trucos de manos 40');
    expect(v.special).toContain('contraataque');
    expect(v.gradeOptions.map(o => o.value)).toEqual(['base', 'advanced', 'supreme']);
    expect(v.gradeOptions.find(o => o.value === 'advanced').selected).toBe(true);
  });

  it('Velez (avanzada): opciones de grado base/arcane', () => {
    const v = buildMartialArtView(art('velez', 'base'));
    expect(v.gradeOptions.map(o => o.value)).toEqual(['base', 'arcane']);
  });

  it('findMartialArtByName resuelve nombres (case-insensible) y GRADE_ES_TO_KEY mapea', () => {
    expect(findMartialArtByName('Shotokan')).toBe('shotokan');
    expect(findMartialArtByName('Kung Fu')).toBe('kungFu');
    expect(findMartialArtByName('MALLA-YUDDHA')).toBe('mallaYuddha');
    expect(findMartialArtByName('Inventada')).toBe(null);
    expect(GRADE_ES_TO_KEY.avanzado).toBe('advanced');
    expect(GRADE_ES_TO_KEY.supremo).toBe('supreme');
    expect(GRADE_ES_TO_KEY.arcano).toBe('arcane');
  });

  it('arte desconocida: known=false, summary avisa de recrear', () => {
    const v = buildMartialArtView(art('noexiste', 'base'));
    expect(v.known).toBe(false);
    expect(v.summary).toContain('recrear');
  });
});

describe('martialArtsAdditionalAttack (Kempo)', () => {
  it('sin Kempo: sin override', () => {
    expect(martialArtsAdditionalAttack(actorWith([art('aikido', 'base')]))).toEqual({
      penalty: null,
      extraAttacks: 0
    });
  });
  it('Kempo Base: penalizador -15, sin extra', () => {
    expect(martialArtsAdditionalAttack(actorWith([art('kempo', 'base')]))).toEqual({
      penalty: 15,
      extraAttacks: 0
    });
  });
  it('Kempo Avanzado: -10', () => {
    expect(martialArtsAdditionalAttack(actorWith([art('kempo', 'advanced')]))).toEqual({
      penalty: 10,
      extraAttacks: 0
    });
  });
  it('Kempo Supremo: -10 + 1 ataque adicional extra', () => {
    expect(martialArtsAdditionalAttack(actorWith([art('kempo', 'supreme')]))).toEqual({
      penalty: 10,
      extraAttacks: 1
    });
  });
});
