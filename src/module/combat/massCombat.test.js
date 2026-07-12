import {
  massLifePool,
  tabla1Bonus,
  massAttackBonus,
  isMassActor,
  massActorAttackBonus,
  massComponentCount,
  massSurvivingCount,
  massOffensiveAbility,
  massAdjustedDamage,
  areaDamageMultiplier,
  survivingComponents,
  massResistanceOutcome,
  massResistanceDifficultyBonus
} from './massCombat';

describe('massLifePool (PV agregados)', () => {
  it('normal <=100: PV/50 redondeado x nº (ejemplos del manual)', () => {
    expect(massLifePool({ count: 10, pv: 140 })).toBe(1000); // 10 soldados 140 PV
    expect(massLifePool({ count: 25, pv: 210 })).toBe(5000); // 25 pretorianos 210 PV
    expect(massLifePool({ count: 30, pv: 100 })).toBe(3000); // Excel Masa (1)
    expect(massLifePool({ count: 2, pv: 100 })).toBe(200); // Excel Hombres pez
  });

  it('normal >100: 100 primeros + 10/25 por extra', () => {
    // 1200 soldados 120 PV -> 100*100 + 10*1100 = 21000
    expect(massLifePool({ count: 1200, pv: 120 })).toBe(21000);
    // PV>=250: extra suma 25
    expect(massLifePool({ count: 200, pv: 300 })).toBe(300 * 100 + 25 * 100);
  });

  it('acumulacion <=50: base(PV/100) + (n-1)*mitad', () => {
    // 10 cadaveres animados 345 PV -> 300 + 9*150 = 1650
    expect(massLifePool({ count: 10, pv: 345, accumulates: true })).toBe(1650);
  });

  it('acumulacion >50: nº * 100 (PV<1000) o 250', () => {
    expect(massLifePool({ count: 60, pv: 500, accumulates: true })).toBe(6000);
    expect(massLifePool({ count: 60, pv: 1200, accumulates: true })).toBe(15000);
  });

  it('robusto: 0 enemigos o 0 PV -> 0', () => {
    expect(massLifePool({ count: 0, pv: 100 })).toBe(0);
    expect(massLifePool({ count: 10, pv: 0 })).toBe(0);
  });
});

describe('tabla1Bonus (Tabla 1)', () => {
  it('tramos exactos', () => {
    expect(tabla1Bonus(2)).toBe(0);
    expect(tabla1Bonus(3)).toBe(30);
    expect(tabla1Bonus(5)).toBe(50);
    expect(tabla1Bonus(10)).toBe(70);
    expect(tabla1Bonus(15)).toBe(90);
    expect(tabla1Bonus(25)).toBe(110);
    expect(tabla1Bonus(50)).toBe(130);
    expect(tabla1Bonus(100)).toBe(150);
    expect(tabla1Bonus(500)).toBe(150);
  });
  it('fraccionario (count/adversaries)', () => {
    expect(tabla1Bonus(7.5)).toBe(50); // 30/4
  });
});

describe('massOffensiveAbility', () => {
  it('desorganizada = medio bono (Excel Masa 1: 90 + 110/2 = 145)', () => {
    expect(
      massOffensiveAbility({ baseAttack: 90, count: 30, adversaries: 1, disorganized: true })
    ).toBe(145);
  });
  it('menos de 3 por oponente -> sin bono (Excel Hombres pez: 90)', () => {
    expect(
      massOffensiveAbility({ baseAttack: 90, count: 2, adversaries: 1, disorganized: true })
    ).toBe(90);
  });
  it('organizada, repartida entre adversarios (manual: 20 guardias, 4 pers -> +50)', () => {
    expect(massOffensiveAbility({ baseAttack: 0, count: 20, adversaries: 4 })).toBe(50);
    // 500 soldados / 4 -> 125 por oponente -> +150
    expect(massOffensiveAbility({ baseAttack: 0, count: 500, adversaries: 4 })).toBe(150);
  });
});

describe('massAttackBonus (Tabla 1 por nº total, SIN dividir)', () => {
  it('tabla1(count); mitad si desorganizada', () => {
    expect(massAttackBonus({ count: 5 })).toBe(50);
    expect(massAttackBonus({ count: 30 })).toBe(110);
    expect(massAttackBonus({ count: 30, disorganized: true })).toBe(55);
    expect(massAttackBonus({ count: 2 })).toBe(0);
  });
});

describe('isMassActor / massActorAttackBonus (leen el system del actor)', () => {
  // Vida a tope por defecto -> todos los componentes vivos.
  const sys = (defenseType, count, disorganized = false, pv = 100, life = null) => ({
    general: {
      settings: {
        defenseType: { value: defenseType },
        mass: {
          count: { value: count },
          baseLife: { value: pv },
          disorganized: { value: disorganized }
        }
      }
    },
    characteristics: {
      secondaries: {
        lifePoints: { value: life ?? massLifePool({ count, pv }) }
      }
    }
  });
  it('detecta la masa y devuelve su bono de HA (a vida plena)', () => {
    expect(isMassActor(sys('mass', 30))).toBe(true);
    expect(isMassActor(sys('', 30))).toBe(false);
    expect(massActorAttackBonus(sys('mass', 30))).toBe(110);
    expect(massActorAttackBonus(sys('mass', 30, true))).toBe(55);
    expect(massActorAttackBonus(sys('', 30))).toBe(0);
    expect(massActorAttackBonus(undefined)).toBe(0);
  });
  it('massComponentCount lee el nº ORIGINAL de componentes', () => {
    expect(massComponentCount(sys('mass', 30))).toBe(30);
    expect(massComponentCount(undefined)).toBe(0);
  });
  it('massSurvivingCount y el bono BAJAN al perder PV', () => {
    // 30 enemigos, 100 PV -> pool 3000. A 900 quedan 9 vivos -> tabla1(9)=50.
    expect(massSurvivingCount(sys('mass', 30))).toBe(30); // vida plena
    expect(massSurvivingCount(sys('mass', 30, false, 100, 900))).toBe(9);
    expect(massActorAttackBonus(sys('mass', 30, false, 100, 900))).toBe(50);
    expect(massSurvivingCount(sys('mass', 30, false, 100, 0))).toBe(0);
    expect(massSurvivingCount(undefined)).toBe(0);
  });
});

describe('massAdjustedDamage', () => {
  it('fisico +50% (redondeo abajo), magico x2', () => {
    expect(massAdjustedDamage(60)).toBe(90);
    expect(massAdjustedDamage(50)).toBe(75);
    expect(massAdjustedDamage(60, { magic: true })).toBe(120);
    expect(massAdjustedDamage(50, { magic: true })).toBe(100);
    expect(massAdjustedDamage(55)).toBe(82); // floor(82.5)
  });
});

describe('areaDamageMultiplier (Tabla 2)', () => {
  it('tramos (manual: 5 adv -> x4; 15 -> x5)', () => {
    expect(areaDamageMultiplier(1)).toBe(1);
    expect(areaDamageMultiplier(2)).toBe(2);
    expect(areaDamageMultiplier(3)).toBe(3);
    expect(areaDamageMultiplier(5)).toBe(4);
    expect(areaDamageMultiplier(15)).toBe(5);
    expect(areaDamageMultiplier(25)).toBe(10);
    expect(areaDamageMultiplier(100)).toBe(10); // 100 NO es >100
    expect(areaDamageMultiplier(101)).toBe(15);
    expect(areaDamageMultiplier(1000)).toBe(25);
  });
});

describe('survivingComponents', () => {
  it('normal: vivos = vida restante / PV redondeado (manual: 15 drones a 900 PV -> 9)', () => {
    expect(survivingComponents({ lifeRemaining: 900, count: 15, pv: 100 })).toBe(9);
    expect(survivingComponents({ lifeRemaining: 3000, count: 30, pv: 100 })).toBe(30);
    expect(survivingComponents({ lifeRemaining: 0, count: 30, pv: 100 })).toBe(0);
    expect(survivingComponents({ lifeRemaining: 250, count: 30, pv: 100 })).toBe(2); // floor(250/100)
  });
  it('acumulacion', () => {
    // base 300, half 150; rem 1650 -> 1 + ceil((1650-300)/150) = 1 + 9 = 10
    expect(
      survivingComponents({ lifeRemaining: 1650, count: 10, pv: 345, accumulates: true })
    ).toBe(10);
    // rem por debajo de la base -> 1
    expect(
      survivingComponents({ lifeRemaining: 200, count: 10, pv: 345, accumulates: true })
    ).toBe(1);
  });
});

describe('massResistanceOutcome', () => {
  it('cuatro tramos por margen', () => {
    expect(massResistanceOutcome(50).tier).toBe('passClean');
    expect(massResistanceOutcome(30).tier).toBe('passPartial');
    expect(massResistanceOutcome(-10).tier).toBe('failPartial');
    expect(massResistanceOutcome(-50).tier).toBe('failFull');
  });
  it('escalado de negativos (manual: falla por 10 -> -40 pasa a -20)', () => {
    const o = massResistanceOutcome(-10); // failPartial: mitad, redondeo arriba
    expect(o.negFactor).toBe(0.5);
    expect(o.negRound).toBe('up');
    expect(Math.ceil(40 * o.negFactor)).toBe(20);
  });
  it('fraccion afectada (manual: supera por 30 -> ~1/3, 7 de 20)', () => {
    const o = massResistanceOutcome(30);
    expect(Math.round(20 * o.affected)).toBe(7);
  });
});

describe('massResistanceDifficultyBonus', () => {
  it('+20 si <=10, +50 si mas', () => {
    expect(massResistanceDifficultyBonus(10)).toBe(20);
    expect(massResistanceDifficultyBonus(11)).toBe(50);
  });
});
