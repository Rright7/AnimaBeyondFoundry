import { mutateAllActionsModifier } from './mutateAllActionsModifier';

// data minimo para el mutador (base/special + cansancio + reduccion de R.Dolor).
const mkData = ({
  base = 0,
  special = 0,
  painBase = 0,
  painReduction = 0,
  fatigue = 4,
  maxFatigue = 4,
  autoFatigue = true,
  painImmune = 0,
  painHalf = 0,
  physicalLackBase = 0,
  physicalLackImmune = 0
} = {}) => ({
  general: {
    modifiers: {
      allActions: {
        base: { value: base },
        special: { value: special },
        painPenalty: { base: { value: painBase }, fatigue: { value: 0 }, final: { value: 0 } },
        painReduction: { value: painReduction },
        physicalLack: { base: { value: physicalLackBase }, final: { value: 0 } },
        otherFinal: { value: 0 },
        final: { value: 0 }
      },
      kiBonus: {
        painImmune: { value: painImmune },
        painHalf: { value: painHalf },
        physicalLackImmune: { value: physicalLackImmune }
      }
    }
  },
  automationOptions: { calculateFatigueModifier: { value: autoFatigue } },
  characteristics: { secondaries: { fatigue: { value: fatigue, max: maxFatigue } } }
});

const finalOf = data => {
  mutateAllActionsModifier(data);
  return data.general.modifiers.allActions.final.value;
};

describe('mutateAllActionsModifier + Resistir el dolor', () => {
  it('sin cansancio: final = base + special', () => {
    expect(finalOf(mkData({ base: -5, special: -10, fatigue: 4, maxFatigue: 4 }))).toBe(-15);
  });

  it('con cansancio y sin reduccion: aplica el penalizador entero', () => {
    // fatigue 2 -> -40
    expect(finalOf(mkData({ fatigue: 2, maxFatigue: 4 }))).toBe(-40);
  });

  it('la reduccion de R.Dolor recorta el penalizador por cansancio', () => {
    // -40 + 30 = -10
    expect(finalOf(mkData({ fatigue: 2, maxFatigue: 4, painReduction: 30 }))).toBe(-10);
  });

  it('la reduccion no convierte el penalizador en bonus (tope 0)', () => {
    // -40 + 80 = +40 -> capado a 0
    expect(finalOf(mkData({ fatigue: 2, maxFatigue: 4, painReduction: 80 }))).toBe(0);
  });

  it('sin cansancio la reduccion no da bonus', () => {
    // sin penalizador que cancelar -> la reduccion no hace nada
    expect(finalOf(mkData({ base: -5, fatigue: 4, maxFatigue: 4, painReduction: 50 }))).toBe(-5);
  });

  it('la reduccion no toca base/special (solo el penalizador reducible)', () => {
    // base -20 (manual) + cansancio -40, reduccion 40 -> base -20 + (-40+40=0) = -20
    expect(finalOf(mkData({ base: -20, fatigue: 2, maxFatigue: 4, painReduction: 40 }))).toBe(-20);
  });

  it('el campo Dolor/Cansancio penaliza como el cansancio', () => {
    // sin cansancio, painPenalty.base -30 -> final = -30
    expect(finalOf(mkData({ fatigue: 4, maxFatigue: 4, painBase: -30 }))).toBe(-30);
  });

  it('la reduccion recorta cansancio + Dolor/Cansancio juntos', () => {
    // cansancio -40 + dolor -30 = -70, reduccion 50 -> -20
    expect(
      finalOf(mkData({ fatigue: 2, maxFatigue: 4, painBase: -30, painReduction: 50 }))
    ).toBe(-20);
  });

  it('base/special (otros) se suman aparte y no se reducen', () => {
    // base -20 (otros) + dolor -30, reduccion 30 -> base -20 + (-30+30=0) = -20
    expect(finalOf(mkData({ base: -20, painBase: -30, painReduction: 30 }))).toBe(-20);
  });

  it('painPenalty.final = lo manual + el cansancio automatico', () => {
    // base manual -30 + cansancio 2 (-40) = -70
    const data = mkData({ fatigue: 2, maxFatigue: 4, painBase: -30 });
    mutateAllActionsModifier(data);
    expect(data.general.modifiers.allActions.painPenalty.final.value).toBe(-70);
  });

  it('painPenalty.final YA refleja la reduccion de R.Dolor (es lo que se ve)', () => {
    // dolor -30, reduccion 20 -> la casilla muestra el neto -10 (no -30)
    const data = mkData({ painBase: -30, painReduction: 20, fatigue: 4, maxFatigue: 4 });
    mutateAllActionsModifier(data);
    expect(data.general.modifiers.allActions.painPenalty.final.value).toBe(-10);
    // y el total aplicado a las acciones coincide (solo dolor, sin otros)
    expect(data.general.modifiers.allActions.final.value).toBe(-10);
  });

  it('la reduccion cuenta como magnitud: -20 reduce igual que 20', () => {
    const pos = mkData({ painBase: -30, painReduction: 20, fatigue: 4, maxFatigue: 4 });
    const neg = mkData({ painBase: -30, painReduction: -20, fatigue: 4, maxFatigue: 4 });
    mutateAllActionsModifier(pos);
    mutateAllActionsModifier(neg);
    expect(pos.general.modifiers.allActions.painPenalty.final.value).toBe(-10);
    expect(neg.general.modifiers.allActions.painPenalty.final.value).toBe(-10);
  });

  it('Acciones (otherFinal) muestra solo lo "otro", sin el dolor/cansancio', () => {
    // base -5 (otros) + dolor -30: otherFinal -5, final -35
    const data = mkData({ base: -5, painBase: -30, fatigue: 4, maxFatigue: 4 });
    mutateAllActionsModifier(data);
    expect(data.general.modifiers.allActions.otherFinal.value).toBe(-5);
    expect(data.general.modifiers.allActions.final.value).toBe(-35);
  });

  it('Esencia de Vacio (painImmune) elimina el penalizador por dolor/cansancio', () => {
    // dolor -30 + cansancio 2 (-40) = -70, pero painImmune -> 0
    const data = mkData({ painBase: -30, fatigue: 2, maxFatigue: 4, painImmune: 1 });
    mutateAllActionsModifier(data);
    expect(data.general.modifiers.allActions.painPenalty.final.value).toBe(0);
    expect(data.general.modifiers.allActions.final.value).toBe(0);
  });

  it('Eliminacion de penalizadores (painHalf) reduce a la mitad el dolor/cansancio', () => {
    // -70 -> mitad -35
    const data = mkData({ painBase: -30, fatigue: 2, maxFatigue: 4, painHalf: 1 });
    mutateAllActionsModifier(data);
    expect(data.general.modifiers.allActions.painPenalty.final.value).toBe(-35);
    expect(data.general.modifiers.allActions.final.value).toBe(-35);
  });

  it('eliminar (Esencia) manda sobre reducir a la mitad (Eliminacion)', () => {
    const data = mkData({
      painBase: -30,
      fatigue: 2,
      maxFatigue: 4,
      painImmune: 1,
      painHalf: 1
    });
    mutateAllActionsModifier(data);
    expect(data.general.modifiers.allActions.painPenalty.final.value).toBe(0);
  });

  it('separa internamente dolor (base) y cansancio (fatigue); final = suma', () => {
    // dolor manual -30 + cansancio 2 (-40)
    const data = mkData({ painBase: -30, fatigue: 2, maxFatigue: 4 });
    mutateAllActionsModifier(data);
    const pp = data.general.modifiers.allActions.painPenalty;
    expect(pp.base.value).toBe(-30); // dolor (sin tocar)
    expect(pp.fatigue.value).toBe(-40); // cansancio automatico, aparte
    expect(pp.final.value).toBe(-70); // suma visible
  });
});

describe('mutateAllActionsModifier + Carencias fisicas', () => {
  it('penaliza toda accion, aparte del dolor/cansancio', () => {
    // dolor -30 + carencias -20, sin cansancio: final = -50
    const data = mkData({ painBase: -30, physicalLackBase: -20, fatigue: 4, maxFatigue: 4 });
    mutateAllActionsModifier(data);
    expect(data.general.modifiers.allActions.physicalLack.final.value).toBe(-20);
    expect(data.general.modifiers.allActions.final.value).toBe(-50);
  });

  it('R.Dolor NO reduce las carencias fisicas (solo el dolor/cansancio)', () => {
    // cansancio -40 + carencias -20, reduccion 40 -> (-40+40=0) + (-20) = -20
    const data = mkData({
      fatigue: 2,
      maxFatigue: 4,
      physicalLackBase: -20,
      painReduction: 40
    });
    mutateAllActionsModifier(data);
    expect(data.general.modifiers.allActions.final.value).toBe(-20);
  });

  it('Esencia de Vacio (painImmune) NO toca las carencias fisicas', () => {
    // dolor -30 -> 0 por painImmune, pero carencias -20 se quedan
    const data = mkData({
      painBase: -30,
      physicalLackBase: -20,
      painImmune: 1,
      fatigue: 4,
      maxFatigue: 4
    });
    mutateAllActionsModifier(data);
    expect(data.general.modifiers.allActions.painPenalty.final.value).toBe(0);
    expect(data.general.modifiers.allActions.physicalLack.final.value).toBe(-20);
    expect(data.general.modifiers.allActions.final.value).toBe(-20);
  });

  it('Uno con la Nada (physicalLackImmune) elimina las carencias fisicas', () => {
    const data = mkData({
      physicalLackBase: -40,
      physicalLackImmune: 1,
      fatigue: 4,
      maxFatigue: 4
    });
    mutateAllActionsModifier(data);
    expect(data.general.modifiers.allActions.physicalLack.final.value).toBe(0);
    expect(data.general.modifiers.allActions.final.value).toBe(0);
  });
});
