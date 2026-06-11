import { mutateActiveTechniqueCharacteristics } from './mutateActiveTechniqueCharacteristics.js';

const characteristic = (value, special = 0) => ({
  base: { value },
  special: { value: special },
  final: { value: value + special },
  mod: { value: 0 }
});

const technique = ({ active = true, effects = [] } = {}) => ({
  flags: { animabf: { active } },
  // Por defecto los efectos de prueba PERDURAN (mantenidos): un Tipo Acción ya no
  // se auto-aplica mientras la técnica está activa (ver test específico).
  system: { build: { effects: effects.map(e => ({ maintMode: 'maintained', ...e })) } }
});

const makeData = (techniques, { agilitySpecial = 0 } = {}) => ({
  domine: { techniques },
  characteristics: {
    primaries: {
      agility: characteristic(8, agilitySpecial),
      strength: characteristic(7),
      dexterity: characteristic(6)
    }
  }
});

describe('mutateActiveTechniqueCharacteristics', () => {
  test('Capacidad Incrementada AGI +5 adds to agility.special.value', () => {
    const data = makeData([
      technique({ effects: [{ effectId: 'capacidad-incrementada-agi', tierOptions: ['+5'] }] })
    ]);
    mutateActiveTechniqueCharacteristics(data);
    expect(data.characteristics.primaries.agility.special.value).toBe(5);
  });

  test('accumulates onto an existing special bonus', () => {
    const data = makeData(
      [technique({ effects: [{ effectId: 'capacidad-incrementada-agi', tierOptions: ['+3'] }] })],
      { agilitySpecial: 2 }
    );
    mutateActiveTechniqueCharacteristics(data);
    expect(data.characteristics.primaries.agility.special.value).toBe(5);
  });

  test('Tipo Acción (no mantenido) NO persiste: no toca la característica', () => {
    const data = makeData([
      technique({
        effects: [{ effectId: 'capacidad-incrementada-agi', maintMode: 'none', tierOptions: ['+5'] }]
      })
    ]);
    mutateActiveTechniqueCharacteristics(data);
    expect(data.characteristics.primaries.agility.special.value).toBe(0);
  });

  test('inactive technique leaves characteristics untouched', () => {
    const data = makeData([
      technique({
        active: false,
        effects: [{ effectId: 'capacidad-incrementada-agi', tierOptions: ['+8'] }]
      })
    ]);
    mutateActiveTechniqueCharacteristics(data);
    expect(data.characteristics.primaries.agility.special.value).toBe(0);
  });

  test('resistance effects do not touch characteristics', () => {
    const data = makeData([
      technique({
        effects: [{ effectId: 'incremento-de-resistencia-fisica', tierOptions: ['+50 RF'] }]
      })
    ]);
    mutateActiveTechniqueCharacteristics(data);
    expect(data.characteristics.primaries.agility.special.value).toBe(0);
    expect(data.characteristics.primaries.strength.special.value).toBe(0);
  });

  test('deposits provenance on the characteristic final path when an actor is given', () => {
    const data = makeData([
      {
        name: 'Garra Veloz',
        id: 'tB',
        flags: { animabf: { active: true } },
        system: {
          build: {
            effects: [{ effectId: 'capacidad-incrementada-agi', maintMode: 'maintained', tierOptions: ['+5'] }]
          }
        }
      }
    ]);
    const actor = {};
    mutateActiveTechniqueCharacteristics(data, actor);
    // special.value updated AND provenance deposited on the rolled (final) path
    expect(data.characteristics.primaries.agility.special.value).toBe(5);
    const recs =
      actor.synthetics.modifiers['system.characteristics.primaries.agility.final.value'];
    expect(recs).toHaveLength(1);
    expect(recs[0]).toMatchObject({ value: 5, mode: 'add', source: 'Garra Veloz' });
  });
});
