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

  test('initiative effect adds to kiBonus.initiative', () => {
    const data = makeData({ kiSkills: [inner('increasedSpeed')] });
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.initiative.value).toBe(10);
  });

  test('Ki armor uses Math.max — arcaneArmor wins over energyArmor', () => {
    const data = makeData({
      kiSkills: [inner('energyArmor'), inner('arcaneArmor')]
    });
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.energyArmor.value).toBe(4);
  });

  test('majorArmor has no passive contribution', () => {
    const data = makeData({ kiSkills: [inner('majorArmor')] });
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.energyArmor.value).toBe(0);
  });

  test('damage abilities accumulate', () => {
    const data = makeData({
      kiSkills: [inner('weaponAuraExtension'), inner('increasedDamage')]
    });
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.damage.value).toBe(20);
  });

  test('ability without wired effects does not contribute', () => {
    const data = makeData({ kiSkills: [inner('presenceExtrusion')] });
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.damage.value).toBe(0);
  });
});

describe('applyKiSkillsModifiers — lookup and canonical mirroring', () => {
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

  test('homebrew name leaves the user CM untouched', () => {
    const data = makeData({
      kiSkills: [
        { _id: 'h', name: 'Homebrew', system: { martialKnowledge: { value: 50 } } }
      ]
    });
    applyKiSkillsModifiers(data);
    expect(data.domine.kiSkills[0].system.martialKnowledge.value).toBe(50);
  });

  test('canonical tree (parent, depth) is mirrored', () => {
    const data = makeData({
      kiSkills: [uiTyped('Extensión del aura al arma')]
    });
    applyKiSkillsModifiers(data);
    expect(data.domine.kiSkills[0].system.tree).toMatchObject({
      parent: 'presenceExtrusion',
      depth: 1
    });
  });
});

describe('applyKiSkillsModifiers — tree prefix and Nemesis', () => {
  test('children get a box-drawing prefix', () => {
    const data = makeData({
      kiSkills: [
        uiTyped('Extrusión de presencia'),
        uiTyped('Armadura de energía')
      ]
    });
    applyKiSkillsModifiers(data);
    expect(data.domine.kiSkills[1].system.tree.prefix).toBe('└── ');
  });

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
});

describe('applyKiSkillsModifiers — robustness', () => {
  test('no abilities → zero bonuses', () => {
    const data = makeData();
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.damage.value).toBe(0);
    expect(data.general.modifiers.kiBonus.initiative.value).toBe(0);
    expect(data.general.modifiers.kiBonus.energyArmor.value).toBe(0);
  });

  test('missing domine block does not throw', () => {
    const data = { general: { modifiers: {} } };
    expect(() => applyKiSkillsModifiers(data)).not.toThrow();
  });

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

describe('applyKiSkillsModifiers — abfFlow metadata', () => {
  test('declares both Ki and Nemesis as input deps', () => {
    expect(applyKiSkillsModifiers.abfFlow.deps).toEqual([
      'system.domine.kiSkills',
      'system.domine.nemesisSkills'
    ]);
  });
});

describe('computeKiSkillTreePrefixes', () => {
  test('empty list yields empty result', () => {
    expect(computeKiSkillTreePrefixes([])).toEqual([]);
  });

  test('grandchild of last branch drops the vertical line', () => {
    expect(computeKiSkillTreePrefixes([0, 1, 2])).toEqual([
      '',
      '└── ',
      '    └── '
    ]);
  });

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
