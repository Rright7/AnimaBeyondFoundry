import { computeTechniqueCost } from './computeTechniqueCost';
import { buildTechniqueViewModel } from './techniqueBuilder';

const makeItem = (build, name = 'Golpe bajo') => ({
  id: 't1',
  name,
  system: {
    build,
    computed: computeTechniqueCost(build),
    description: { value: 'desc' }
  }
});

describe('buildTechniqueViewModel', () => {
  test('costString y effectsSummary de un efecto primario', () => {
    const build = {
      level: 1,
      effects: [
        {
          effectId: 'habilidad-de-ataque',
          role: 'primary',
          tierOptions: ['+50'],
          maintMode: 'none',
          kiByCharacteristic: { dexterity: 5 },
          maintKiByCharacteristic: {}
        }
      ],
      disadvantages: [],
      redistribution: {}
    };
    const vm = buildTechniqueViewModel(makeItem(build));
    expect(vm.costString).toBe('DES 5');
    expect(vm.effectsSummary).toBe('Habilidad de Ataque (+50)');
    expect(vm.effectRows[0].charString).toContain('DES');
    expect(vm.effectRows[0].isPrimary).toBe(true);
    expect(vm.description).toBe('desc');
  });

  test('resumen incluye el modo de mantenimiento', () => {
    const build = {
      level: 2,
      effects: [
        {
          effectId: 'habilidad-de-ataque',
          role: 'primary',
          tierOptions: ['+50'],
          maintMode: 'maintained',
          kiByCharacteristic: { dexterity: 9 },
          maintKiByCharacteristic: { dexterity: 4 }
        }
      ],
      disadvantages: [],
      redistribution: {}
    };
    const vm = buildTechniqueViewModel(makeItem(build));
    expect(vm.effectsSummary).toBe('Habilidad de Ataque (+50, Mantenido)');
    // coste con mantenimiento entre paréntesis
    expect(vm.costString).toBe('DES 9 (4)');
  });

  test('item vacío no rompe', () => {
    const vm = buildTechniqueViewModel({ id: 'x', name: '', system: {} });
    expect(vm.effectRows).toEqual([]);
    expect(vm.costString).toBe('');
    expect(vm.effectsSummary).toBe('');
  });

  test('estado de uso: técnica mantenida activa', () => {
    const build = {
      level: 1,
      effects: [
        {
          effectId: 'habilidad-de-ataque',
          role: 'primary',
          tierOptions: ['+50'],
          maintMode: 'maintained',
          kiByCharacteristic: { dexterity: 9 },
          maintKiByCharacteristic: { dexterity: 4 }
        }
      ],
      disadvantages: [],
      redistribution: {}
    };
    const item = makeItem(build);
    item.flags = { animabf: { active: true, remaining: 0 } };
    const vm = buildTechniqueViewModel(item);
    expect(vm.isMantenida).toBe(true);
    expect(vm.isInstant).toBe(false);
    expect(vm.active).toBe(true);
    expect(vm.kiMaintTotal).toBeGreaterThan(0);
  });

  test('estado de uso: técnica instantánea', () => {
    const build = {
      level: 1,
      effects: [
        {
          effectId: 'habilidad-de-ataque',
          role: 'primary',
          tierOptions: ['+10'],
          maintMode: 'none',
          kiByCharacteristic: { dexterity: 2 },
          maintKiByCharacteristic: {}
        }
      ],
      disadvantages: [],
      redistribution: {}
    };
    const vm = buildTechniqueViewModel(makeItem(build));
    expect(vm.isInstant).toBe(true);
    expect(vm.isMantenida).toBe(false);
    expect(vm.active).toBe(false);
    expect(vm.kiActiveTotal).toBe(2);
  });
});
