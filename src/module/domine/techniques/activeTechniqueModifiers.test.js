import {
  techniquePersistentBonuses,
  activeTechniqueModifiers
} from './activeTechniqueModifiers.js';

const effect = (effectId, ...tierOptions) => ({ effectId, tierOptions });

const technique = ({ active = true, effects = [] } = {}) => ({
  flags: { animabf: { active } },
  system: { build: { effects } }
});

describe('techniquePersistentBonuses', () => {
  test('Capacidad Incrementada AGI +5 -> characteristics.agility', () => {
    const b = techniquePersistentBonuses([effect('capacidad-incrementada-agi', '+5')]);
    expect(b.characteristics).toEqual({ agility: 5 });
    expect(b.kiBonusEffects).toEqual([]);
  });

  test('Incremento de Resistencia Física +50 RF -> kiBonus add', () => {
    const b = techniquePersistentBonuses([
      effect('incremento-de-resistencia-fisica', '+50 RF')
    ]);
    expect(b.kiBonusEffects).toEqual([
      { target: 'resistancePhysical', operation: 'add', value: 50 }
    ]);
    expect(b.characteristics).toEqual({});
  });

  test('non-numeric option ("Incremento también a RE") contributes 0 and is skipped', () => {
    const b = techniquePersistentBonuses([
      effect('incremento-de-resistencia-fisica', 'Incremento también a RE')
    ]);
    expect(b.kiBonusEffects).toEqual([]);
  });

  test('unmapped effect (combat) is ignored — stays narrative', () => {
    const b = techniquePersistentBonuses([effect('habilidad-de-ataque', '+50')]);
    expect(b).toEqual({ characteristics: {}, kiBonusEffects: [] });
  });

  test('FUE and DES map to strength/dexterity', () => {
    const b = techniquePersistentBonuses([
      effect('capacidad-incrementada-fue', '+3'),
      effect('capacidad-incrementada-des', '+2')
    ]);
    expect(b.characteristics).toEqual({ strength: 3, dexterity: 2 });
  });
});

describe('activeTechniqueModifiers', () => {
  test('only active techniques contribute', () => {
    const data = {
      domine: {
        techniques: [
          technique({ active: true, effects: [effect('capacidad-incrementada-agi', '+5')] }),
          technique({ active: false, effects: [effect('capacidad-incrementada-agi', '+8')] })
        ]
      }
    };
    expect(activeTechniqueModifiers(data).characteristics).toEqual({ agility: 5 });
  });

  test('aggregates the same characteristic across two active techniques', () => {
    const data = {
      domine: {
        techniques: [
          technique({ effects: [effect('capacidad-incrementada-agi', '+5')] }),
          technique({ effects: [effect('capacidad-incrementada-agi', '+2')] })
        ]
      }
    };
    expect(activeTechniqueModifiers(data).characteristics).toEqual({ agility: 7 });
  });

  test('mixes characteristics and resistance buckets', () => {
    const data = {
      domine: {
        techniques: [
          technique({
            effects: [
              effect('capacidad-incrementada-fue', '+4'),
              effect('incremento-de-resistencia-magica', '+30 RM')
            ]
          })
        ]
      }
    };
    const m = activeTechniqueModifiers(data);
    expect(m.characteristics).toEqual({ strength: 4 });
    expect(m.kiBonusEffects).toEqual([
      { target: 'resistanceMagic', operation: 'add', value: 30 }
    ]);
  });

  test('no techniques -> empty modifiers', () => {
    expect(activeTechniqueModifiers({})).toEqual({
      characteristics: {},
      kiBonusEffects: [],
      records: []
    });
  });

  test('records carry the technique name (source) and slug per effect', () => {
    const data = {
      domine: {
        techniques: [
          {
            name: 'Puño de Hierro',
            id: 'tech1',
            flags: { animabf: { active: true } },
            system: {
              build: {
                effects: [
                  effect('capacidad-incrementada-fue', '+4'),
                  effect('incremento-de-resistencia-fisica', '+50 RF')
                ]
              }
            }
          }
        ]
      }
    };
    expect(activeTechniqueModifiers(data).records).toEqual([
      { scope: 'characteristic', target: 'strength', value: 4, source: 'Puño de Hierro', slug: 'tech1' },
      { scope: 'bucket', target: 'resistancePhysical', value: 50, source: 'Puño de Hierro', slug: 'tech1' }
    ]);
  });
});
