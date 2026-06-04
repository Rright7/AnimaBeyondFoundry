import {
  ARMOR_TA_KEYS,
  clashBreaks,
  resolveQualityHit,
  bodyEntereza,
  unarmedParryDamage,
  degradeArmorTA
} from './breakage.js';

describe('clashBreaks', () => {
  it('rompe cuando D10 + rotura supera la entereza rival', () => {
    expect(clashBreaks(7, 6, 12)).toBe(true); // 13 > 12
  });

  it('no rompe cuando iguala la entereza (debe SUPERAR)', () => {
    expect(clashBreaks(6, 6, 12)).toBe(false); // 12 > 12 → false
  });

  it('no rompe cuando queda por debajo', () => {
    expect(clashBreaks(1, 6, 12)).toBe(false); // 7 > 12 → false
  });

  it('tolera valores no numéricos como 0', () => {
    expect(clashBreaks(undefined, null, NaN)).toBe(false);
    expect(clashBreaks(5, undefined, -1)).toBe(true); // 5 > -1
  });
});

describe('resolveQualityHit', () => {
  it('arma con calidad >= 5 no se destruye, baja un grado', () => {
    expect(resolveQualityHit(15)).toEqual({ destroyed: false, newQuality: 10 });
    expect(resolveQualityHit(10)).toEqual({ destroyed: false, newQuality: 5 });
    expect(resolveQualityHit(5)).toEqual({ destroyed: false, newQuality: 0 });
  });

  it('arma con calidad < 5 se destruye', () => {
    expect(resolveQualityHit(0)).toEqual({ destroyed: true, newQuality: 0 });
    expect(resolveQualityHit(4)).toEqual({ destroyed: true, newQuality: 4 });
  });
});

describe('bodyEntereza', () => {
  it('es la mayor de Constitución o Destreza', () => {
    expect(bodyEntereza(8, 11)).toBe(11);
    expect(bodyEntereza(13, 9)).toBe(13);
    expect(bodyEntereza(undefined, 7)).toBe(7);
  });
});

describe('unarmedParryDamage', () => {
  it('5 daño por cada unidad de margen sobre la entereza corporal', () => {
    expect(unarmedParryDamage({ d10: 8, rotura: 6, entereza: 10 })).toBe(20); // (14-10)*5
    expect(unarmedParryDamage({ d10: 5, rotura: 6, entereza: 10 })).toBe(5); // (11-10)*5
  });

  it('sin daño si no supera la entereza', () => {
    expect(unarmedParryDamage({ d10: 3, rotura: 6, entereza: 10 })).toBe(0); // 9-10 < 0
    expect(unarmedParryDamage({ d10: 4, rotura: 6, entereza: 10 })).toBe(0); // 10-10 = 0
  });

  it('la maestría ignora el control (0 daño)', () => {
    expect(unarmedParryDamage({ d10: 10, rotura: 6, entereza: 10, mastery: true })).toBe(0);
  });
});

describe('degradeArmorTA', () => {
  it('baja cada TA 1 punto con mínimo 0', () => {
    const { values } = degradeArmorTA({
      cut: 4,
      impact: 2,
      thrust: 3,
      heat: 1,
      electricity: 0,
      cold: 1,
      energy: 0
    });
    expect(values).toEqual({
      cut: 3,
      impact: 1,
      thrust: 2,
      heat: 0,
      electricity: 0,
      cold: 0,
      energy: 0
    });
  });

  it('inservible solo cuando TODAS las TA llegan a 0', () => {
    expect(degradeArmorTA({ cut: 1, impact: 1, thrust: 1, heat: 1, electricity: 1, cold: 1, energy: 1 }).useless).toBe(true);
    expect(degradeArmorTA({ cut: 4, impact: 0, thrust: 0, heat: 0, electricity: 0, cold: 0, energy: 0 }).useless).toBe(false);
  });

  it('cubre todas las claves de TA aunque falten en la entrada', () => {
    const { values } = degradeArmorTA({ cut: 2 });
    expect(Object.keys(values).sort()).toEqual([...ARMOR_TA_KEYS].sort());
    expect(values.cut).toBe(1);
    expect(values.energy).toBe(0);
  });
});
