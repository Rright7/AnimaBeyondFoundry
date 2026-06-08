import { martialArtUnarmedDamage, buildMartialArtView } from './martialArtCatalog.js';

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

  it('arte desconocida: known=false, summary avisa de recrear', () => {
    const v = buildMartialArtView(art('noexiste', 'base'));
    expect(v.known).toBe(false);
    expect(v.summary).toContain('recrear');
  });
});
