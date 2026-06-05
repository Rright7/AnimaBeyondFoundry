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
