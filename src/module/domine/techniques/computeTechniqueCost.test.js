import { computeTechniqueCost } from './computeTechniqueCost';

// Casos fundamentados en EFFECT_CATALOG "Habilidad de Ataque":
//  +10  -> kiPrimary 2, kiSecondary 4, cm 5,  level 1
//  +50  -> kiPrimary 5, kiSecondary 8, cm 15, sMe 8, maint 4, level 1
//  +200 -> kiPrimary 30, cm 50, level 3
// Característica primaria: dexterity; opcionales {agility:2, strength:2, power:2, willPower:3}.

const primary = (option, extra = {}) => ({
  effectId: 'habilidad-de-ataque',
  role: 'primary',
  tierOptions: [option],
  maintMode: 'none',
  kiByCharacteristic: {},
  maintKiByCharacteristic: {},
  ...extra
});

describe('computeTechniqueCost', () => {
  test('efecto primario simple: floor de CM por nivel y Ki base', () => {
    const c = computeTechniqueCost({
      level: 1,
      effects: [primary('+50', { kiByCharacteristic: { dexterity: 5 } })]
    });
    expect(c.kiEffectsSum).toBe(5); // kiPrimary
    expect(c.kiActiveTotal).toBe(5);
    expect(c.cmEffectsSum).toBe(15); // cm
    expect(c.cmTotal).toBe(20); // floor nivel 1 (15 < 20)
    expect(c.cmCeiling).toBe(50);
    expect(c.costByCharacteristic.dexterity.active).toBe(5);
    expect(c.levelRequired).toBe(1);
    expect(c.isValid).toBe(true);
  });

  test('Combinable cobra +10·Nv CM y +3·Nv Ki (fiel al Excel)', () => {
    const c = computeTechniqueCost({
      level: 1,
      combinable: true,
      effects: [primary('+50', { kiByCharacteristic: { dexterity: 5 } })]
    });
    expect(c.cmTotal).toBe(25); // 15 + 10
    expect(c.kiActiveTotal).toBe(8); // 5 + 3
    // El sobrecoste de Combinable debe absorberse en la redistribución (AM41).
    expect(c.validations.modificacionDeCostes).toBe(true);
  });

  test('sobrecoste de Ki por característica OPCIONAL', () => {
    const c = computeTechniqueCost({
      level: 1,
      // +10 como primario (kiPrimary 2) pero pagando con strength (opcional, +2)
      effects: [primary('+10', { kiByCharacteristic: { strength: 2 } })]
    });
    expect(c.perEffect[0].kiEffect).toBe(4); // 2 base + 2 sobrecoste opcional
    expect(c.kiEffectsSum).toBe(4);
  });

  test('la primaria NO añade sobrecoste', () => {
    const c = computeTechniqueCost({
      level: 1,
      effects: [primary('+10', { kiByCharacteristic: { dexterity: 2 } })]
    });
    expect(c.perEffect[0].kiEffect).toBe(2); // sólo el Ki base
  });

  test('Sostenimiento Menor: suma sMe al Ki y 20·Nv al CM', () => {
    const c = computeTechniqueCost({
      level: 2,
      effects: [
        primary('+50', { maintMode: 'sustainMinor', kiByCharacteristic: { dexterity: 13 } })
      ]
    });
    expect(c.kiEffectsSum).toBe(13); // 5 base + 8 sMe
    expect(c.cmTotal).toBe(55); // 15 + 20·2 = 55 (> floor 40)
    expect(c.validations.errorEnSostenidos).toBe(false); // nivel 2, efecto nivel 1
  });

  test('Sostenimiento Menor + Mayor coexisten -> SUMA de sobrecostes (fiel al Excel)', () => {
    const c = computeTechniqueCost({
      level: 2,
      effects: [
        primary('+50', { maintMode: 'sustainMinor', kiByCharacteristic: { dexterity: 13 } }),
        {
          effectId: 'habilidad-de-ataque',
          role: 'secondary',
          tierOptions: ['+50'],
          maintMode: 'sustainMajor',
          kiByCharacteristic: { dexterity: 22 }
        }
      ]
    });
    // 15 + 15 (CM de ambos efectos) + 20·2 (menor) + 30·2 (mayor) = 130
    expect(c.cmTotal).toBe(130);
  });

  test('desventaja resta CM (tope 50%) y el floor por nivel manda', () => {
    const c = computeTechniqueCost({
      level: 3,
      effects: [primary('+200', { kiByCharacteristic: { dexterity: 30 } })],
      disadvantages: [{ disadvantageId: 'agotamiento', option: '-6 Cansancio' }]
    });
    expect(c.cmDisadvSum).toBe(-15);
    expect(c.cmTotal).toBe(60); // 50 - 15 = 35 -> floor nivel 3 = 60
    expect(c.levelRequired).toBe(3);
    expect(c.validations.desventajasLimite).toBe(false); // 15 <= 50/2
  });

  test('Mantenido: Ki por asalto desde col H y +10·Nv CM', () => {
    const c = computeTechniqueCost({
      level: 1,
      effects: [
        primary('+50', {
          maintMode: 'maintained',
          kiByCharacteristic: { dexterity: 9 },
          maintKiByCharacteristic: { dexterity: 4 }
        })
      ]
    });
    expect(c.kiMaintTotal).toBe(4); // col H (+50 -> maint 4)
    expect(c.kiEffectsSum).toBe(9); // 5 base + 4 mant embebido
    expect(c.cmTotal).toBe(25); // 15 + 10·1
  });

  test('bandera unSoloPrimario cuando falta el primario', () => {
    const c = computeTechniqueCost({
      level: 1,
      effects: [{ effectId: 'habilidad-de-ataque', role: 'secondary', tierOptions: ['+10'] }]
    });
    expect(c.validations.unSoloPrimario).toBe(true);
  });

  test('build vacío no rompe', () => {
    const c = computeTechniqueCost({});
    expect(c.cmTotal).toBe(20); // floor nivel 1
    expect(c.kiActiveTotal).toBe(0);
    expect(c.validations.unSoloPrimario).toBe(true); // 0 primarios
  });
});
