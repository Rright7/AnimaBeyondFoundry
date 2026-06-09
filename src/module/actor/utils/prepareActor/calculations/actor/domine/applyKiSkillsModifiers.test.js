import {
  applyKiSkillsModifiers,
  computeKiSkillTreePrefixes
} from './applyKiSkillsModifiers.js';

function makeData({ kiSkills = [], nemesisSkills = [] } = {}) {
  return {
    domine: { kiSkills, nemesisSkills },
    general: { modifiers: {} }
  };
}

function inner(canonicalId) {
  return { _id: `inner-${canonicalId}`, system: { canonicalId } };
}

function uiTyped(name) {
  return { _id: `ui-${name}`, name, system: {} };
}

describe('applyKiSkillsModifiers — passive effects', () => {
  test('damage effect adds to kiBonus.damage', () => {
    const data = makeData({ kiSkills: [inner('weaponAuraExtension')] });
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.damage.value).toBe(10);
  });

  test('Ki armor uses Math.max — arcaneArmor wins over energyArmor', () => {
    const data = makeData({
      kiSkills: [inner('energyArmor'), inner('arcaneArmor')]
    });
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.energyArmor.value).toBe(4);
  });

  test('ability without wired effects does not contribute', () => {
    const data = makeData({ kiSkills: [inner('majorArmor')] });
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.energyArmor.value).toBe(0);
  });
});

describe('applyKiSkillsModifiers — resistances, barrier and dynamic values', () => {
  test('Dominio físico adds +10 to the physical resistance bucket', () => {
    const data = makeData({ kiSkills: [inner('physicalDomain')] });
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.resistances.physical.value).toBe(10);
  });

  test('Cuerpo de Vacío adds +20 to every resistance', () => {
    const data = makeData({ nemesisSkills: [inner('voidBody')] });
    applyKiSkillsModifiers(data);
    const r = data.general.modifiers.kiBonus.resistances;
    for (const k of ['physical', 'disease', 'poison', 'magic', 'psychic']) {
      expect(r[k].value).toBe(20);
    }
  });

  test('damage reduction uses Math.max — Noht (30) beats Armadura de vacío (10)', () => {
    const data = makeData({
      nemesisSkills: [inner('voidArmor'), inner('noht')]
    });
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.damageReduction.value).toBe(30);
  });
});

describe('applyKiSkillsModifiers — active Ki techniques', () => {
  // Los efectos de resistencia de una técnica activa PERDURAN (mantenidos): es el
  // caso normal (Coraza de Ki, etc.). Un Tipo Acción ya no se auto-aplicaría.
  const technique = (active, effects) => ({
    flags: { animabf: { active } },
    system: { build: { effects: effects.map(e => ({ maintMode: 'maintained', ...e })) } }
  });

  test('active technique raises the physical resistance bucket', () => {
    const data = makeData();
    data.domine.techniques = [
      technique(true, [
        { effectId: 'incremento-de-resistencia-fisica', tierOptions: ['+50 RF'] }
      ])
    ];
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.resistances.physical.value).toBe(50);
  });

  test('inactive technique contributes nothing', () => {
    const data = makeData();
    data.domine.techniques = [
      technique(false, [
        { effectId: 'incremento-de-resistencia-magica', tierOptions: ['+50 RM'] }
      ])
    ];
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.resistances.magic.value).toBe(0);
  });

  test('technique resistance stacks on top of a Ki skill bonus', () => {
    const data = makeData({ kiSkills: [inner('physicalDomain')] });
    data.domine.techniques = [
      technique(true, [
        { effectId: 'incremento-de-resistencia-fisica', tierOptions: ['+20 RF'] }
      ])
    ];
    applyKiSkillsModifiers(data);
    // Dominio físico (+10) + técnica (+20)
    expect(data.general.modifiers.kiBonus.resistances.physical.value).toBe(30);
  });

  test('deposits resistance provenance on the final path when an actor is given', () => {
    const data = makeData();
    data.domine.techniques = [
      {
        name: 'Coraza de Ki',
        id: 'tA',
        flags: { animabf: { active: true } },
        system: {
          build: {
            effects: [{ effectId: 'incremento-de-resistencia-magica', maintMode: 'maintained', tierOptions: ['+50 RM'] }]
          }
        }
      }
    ];
    const actor = {};
    applyKiSkillsModifiers(data, actor);
    const recs =
      actor.synthetics.modifiers[
        'system.characteristics.secondaries.resistances.magic.final.value'
      ];
    expect(recs).toHaveLength(1);
    expect(recs[0]).toMatchObject({ value: 50, mode: 'add', source: 'Coraza de Ki' });
  });
});

describe('applyKiSkillsModifiers — traza (provenance) de habilidades de Ki', () => {
  const PHYS = 'system.characteristics.secondaries.resistances.physical.final.value';

  test('una habilidad de Ki con resistencia deposita provenance en el path final', () => {
    const data = makeData({
      kiSkills: [{ name: 'Mi Dominio', system: { canonicalId: 'physicalDomain' } }]
    });
    const actor = {};
    applyKiSkillsModifiers(data, actor);
    const recs = actor.synthetics.modifiers[PHYS];
    expect(recs).toHaveLength(1);
    expect(recs[0]).toMatchObject({ value: 10, source: 'Mi Dominio' });
  });

  test('habilidad de Ki + técnica en la MISMA resistencia: dos contribuciones distintas', () => {
    const data = makeData({
      kiSkills: [{ name: 'Mi Dominio', system: { canonicalId: 'physicalDomain' } }]
    });
    data.domine.techniques = [
      {
        name: 'Coraza de Ki',
        id: 'tA',
        flags: { animabf: { active: true } },
        system: {
          build: {
            effects: [{ effectId: 'incremento-de-resistencia-fisica', maintMode: 'maintained', tierOptions: ['+50 RF'] }]
          }
        }
      }
    ];
    const actor = {};
    applyKiSkillsModifiers(data, actor);
    // El bucket suma ambas; la traza NO oculta ninguna (slugs distintos).
    expect(data.general.modifiers.kiBonus.resistances.physical.value).toBe(60);
    const recs = actor.synthetics.modifiers[PHYS];
    expect(recs).toHaveLength(2);
    expect(recs.map(r => r.source).sort()).toEqual(['Coraza de Ki', 'Mi Dominio']);
  });

  test('resistanceAll (Cuerpo de Vacío) deposita en las 5 resistencias', () => {
    const data = makeData({ nemesisSkills: [inner('voidBody')] });
    const actor = {};
    applyKiSkillsModifiers(data, actor);
    for (const k of ['physical', 'disease', 'poison', 'magic', 'psychic']) {
      const recs =
        actor.synthetics.modifiers[
          `system.characteristics.secondaries.resistances.${k}.final.value`
        ];
      expect(recs).toHaveLength(1);
      expect(recs[0]).toMatchObject({ value: 20 });
    }
  });

  test('sin actor no deposita y no rompe', () => {
    const data = makeData({ kiSkills: [inner('physicalDomain')] });
    expect(() => applyKiSkillsModifiers(data)).not.toThrow();
  });
});

describe('applyKiSkillsModifiers — lookup and mirroring', () => {
  test('UI-added ability matched by name applies its effect', () => {
    const data = makeData({
      kiSkills: [uiTyped('Extensión del aura al arma')]
    });
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.damage.value).toBe(10);
  });

  test('canonical CM is mirrored onto the item', () => {
    const data = makeData({ kiSkills: [uiTyped('Arm. arcana')] });
    applyKiSkillsModifiers(data);
    expect(data.domine.kiSkills[0].system.martialKnowledge.value).toBe(10);
  });
});

describe('applyKiSkillsModifiers — Nemesis and canonical sort', () => {
  test('Nemesis list is processed independently (CM + prefix)', () => {
    const data = makeData({
      nemesisSkills: [
        uiTyped('Armadura de vacío'),
        uiTyped('Noht')
      ]
    });
    applyKiSkillsModifiers(data);
    expect(data.domine.nemesisSkills[0].system.martialKnowledge.value).toBe(20);
    expect(data.domine.nemesisSkills[1].system.tree.prefix).toBe('└── ');
  });

  test('out-of-order abilities are reordered to canonical DFS', () => {
    const data = makeData({
      kiSkills: [
        uiTyped('Aura de combate'),
        uiTyped('Extrusión de presencia')
      ]
    });
    applyKiSkillsModifiers(data);
    const names = data.domine.kiSkills.map(k => k.name);
    expect(names.indexOf('Aura de combate')).toBeLessThan(
      names.indexOf('Extrusión de presencia')
    );
  });
});

describe('applyKiSkillsModifiers — robustness', () => {
  test('idempotent: running twice yields the same totals', () => {
    const data = makeData({ kiSkills: [inner('weaponAuraExtension')] });
    applyKiSkillsModifiers(data);
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.damage.value).toBe(10);
  });

  test('removing the ability removes the bonus on the next run', () => {
    const data = makeData({ kiSkills: [inner('weaponAuraExtension')] });
    applyKiSkillsModifiers(data);
    data.domine.kiSkills = [];
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.damage.value).toBe(0);
  });
});

describe('computeKiSkillTreePrefixes', () => {
  test('mixed tree: 0,1,2,2,1,0 matches the in-book layout', () => {
    expect(computeKiSkillTreePrefixes([0, 1, 2, 2, 1, 0])).toEqual([
      '',
      '├── ',
      '│   ├── ',
      '│   └── ',
      '└── ',
      ''
    ]);
  });
});
