import { calculateCounterAttackBonus } from '../calculateCounterAttackBonus';

describe('calculateCounterAttackBonus', () => {
  test('should calculate counter attack bonus', () => {
    let bonus = calculateCounterAttackBonus(100, 200);

    expect(bonus).toEqual(50);

    bonus = calculateCounterAttackBonus(100, 167);

    expect(bonus).toEqual(30);

    bonus = calculateCounterAttackBonus(100, 1000);

    expect(bonus).toEqual(150);
  });

  test('Artes Marciales: Selene (multiplier x2) dobla el bono de margen antes del tope', () => {
    // margen½ = 50 (atk100,def200); x2 = 100
    expect(calculateCounterAttackBonus(100, 200, { multiplier: 2 })).toBe(100);
    // x2 sobre 50 = 100, pero con margenes grandes el tope +150 sigue mandando
    expect(calculateCounterAttackBonus(100, 1000, { multiplier: 2 })).toBe(150);
  });

  test('Artes Marciales: Boxeo (flat +10) se suma tras el multiplicador, antes del tope', () => {
    expect(calculateCounterAttackBonus(100, 200, { flat: 10 })).toBe(60); // 50 + 10
    expect(calculateCounterAttackBonus(100, 200, { multiplier: 2, flat: 10 })).toBe(110); // 50*2 + 10
    // empate (margen 0) + Boxeo: 0 + 10
    expect(calculateCounterAttackBonus(100, 100, { flat: 10 })).toBe(10);
    // el tope +150 se aplica al total final
    expect(calculateCounterAttackBonus(100, 400, { multiplier: 2, flat: 100 })).toBe(150); // 150*2+100 -> cap
  });
});
