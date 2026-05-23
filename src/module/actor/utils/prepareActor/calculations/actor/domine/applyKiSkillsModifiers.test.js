import {
  applyKiSkillsModifiers,
  computeKiSkillTreePrefixes
} from './applyKiSkillsModifiers.js';
import { KI_SKILLS } from '../../../../excelImporter/kiSkills/kiSkills.js';

function makeData({ kiSkills = [] } = {}) {
  return {
    domine: { kiSkills },
    general: { modifiers: {} }
  };
}

function kiSkillItem(canonicalId) {
  return { _id: `inner-${canonicalId}`, system: { canonicalId } };
}

describe('canonical effects data shape', () => {
  test('weaponAuraExtension adds +10 damage', () => {
    const entry = KI_SKILLS.find(s => s.id === 'weaponAuraExtension');
    expect(entry.effects).toEqual([{ target: 'damage', operation: 'add', value: 10 }]);
  });

  test('increasedDamage adds +10 damage', () => {
    const entry = KI_SKILLS.find(s => s.id === 'increasedDamage');
    expect(entry.effects).toEqual([{ target: 'damage', operation: 'add', value: 10 }]);
  });

  test('increasedSpeed adds +10 initiative', () => {
    const entry = KI_SKILLS.find(s => s.id === 'increasedSpeed');
    expect(entry.effects).toEqual([{ target: 'initiative', operation: 'add', value: 10 }]);
  });

  test('energyArmor provides 2 TA energy armor (set, not add)', () => {
    const entry = KI_SKILLS.find(s => s.id === 'energyArmor');
    expect(entry.effects).toEqual([{ target: 'energyArmor', operation: 'set', value: 2 }]);
  });

  test('majorArmor has no passive effects', () => {
    const entry = KI_SKILLS.find(s => s.id === 'majorArmor');
    expect(entry.effects).toEqual([]);
  });

  test('arcaneArmor provides 4 TA energy armor (set, not add)', () => {
    const entry = KI_SKILLS.find(s => s.id === 'arcaneArmor');
    expect(entry.effects).toEqual([{ target: 'energyArmor', operation: 'set', value: 4 }]);
  });

  test('other abilities still have empty effects', () => {
    const presenceExtrusion = KI_SKILLS.find(s => s.id === 'presenceExtrusion');
    expect(presenceExtrusion.effects).toEqual([]);
  });
});

describe('applyKiSkillsModifiers — single ability', () => {
  test('Extensión del aura al arma → +10 damage', () => {
    const data = makeData({ kiSkills: [kiSkillItem('weaponAuraExtension')] });
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.damage.value).toBe(10);
  });

  test('Daño incrementado → +10 damage', () => {
    const data = makeData({ kiSkills: [kiSkillItem('increasedDamage')] });
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.damage.value).toBe(10);
  });

  test('Velocidad incrementada → +10 initiative', () => {
    const data = makeData({ kiSkills: [kiSkillItem('increasedSpeed')] });
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.initiative.value).toBe(10);
  });

  test('Armadura de energía → 2 TA', () => {
    const data = makeData({ kiSkills: [kiSkillItem('energyArmor')] });
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.energyArmor.value).toBe(2);
  });

  test('Arm. arcana → 4 TA', () => {
    const data = makeData({ kiSkills: [kiSkillItem('arcaneArmor')] });
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.energyArmor.value).toBe(4);
  });
});

describe('applyKiSkillsModifiers — Ki armor no-stacking rule', () => {
  test('energyArmor + majorArmor → 2', () => {
    const data = makeData({
      kiSkills: [kiSkillItem('energyArmor'), kiSkillItem('majorArmor')]
    });
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.energyArmor.value).toBe(2);
  });

  test('energyArmor + arcaneArmor → 4', () => {
    const data = makeData({
      kiSkills: [kiSkillItem('energyArmor'), kiSkillItem('arcaneArmor')]
    });
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.energyArmor.value).toBe(4);
  });

  test('all three → 4 (arcane prevails)', () => {
    const data = makeData({
      kiSkills: [
        kiSkillItem('energyArmor'),
        kiSkillItem('majorArmor'),
        kiSkillItem('arcaneArmor')
      ]
    });
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.energyArmor.value).toBe(4);
  });

  test('order does not matter (arcane first)', () => {
    const data = makeData({
      kiSkills: [kiSkillItem('arcaneArmor'), kiSkillItem('energyArmor')]
    });
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.energyArmor.value).toBe(4);
  });
});

describe('applyKiSkillsModifiers — combinations', () => {
  test('two damage abilities stack', () => {
    const data = makeData({
      kiSkills: [kiSkillItem('weaponAuraExtension'), kiSkillItem('increasedDamage')]
    });
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.damage.value).toBe(20);
  });

  test('damage + initiative populate both buckets', () => {
    const data = makeData({
      kiSkills: [kiSkillItem('weaponAuraExtension'), kiSkillItem('increasedSpeed')]
    });
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.damage.value).toBe(10);
    expect(data.general.modifiers.kiBonus.initiative.value).toBe(10);
  });

  test('numeric and energyArmor buckets are independent', () => {
    const data = makeData({
      kiSkills: [
        kiSkillItem('increasedDamage'),
        kiSkillItem('increasedSpeed'),
        kiSkillItem('arcaneArmor')
      ]
    });
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.damage.value).toBe(10);
    expect(data.general.modifiers.kiBonus.initiative.value).toBe(10);
    expect(data.general.modifiers.kiBonus.energyArmor.value).toBe(4);
  });

  test('abilities without wired effects do not contribute', () => {
    const data = makeData({
      kiSkills: [
        kiSkillItem('presenceExtrusion'),
        kiSkillItem('weaponAuraExtension')
      ]
    });
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.damage.value).toBe(10);
  });
});

describe('applyKiSkillsModifiers — edge cases', () => {
  test('no kiSkills yields zero bonuses', () => {
    const data = makeData();
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.damage.value).toBe(0);
    expect(data.general.modifiers.kiBonus.initiative.value).toBe(0);
    expect(data.general.modifiers.kiBonus.energyArmor.value).toBe(0);
  });

  test('missing domine block does not throw', () => {
    const data = { general: { modifiers: {} } };
    expect(() => applyKiSkillsModifiers(data)).not.toThrow();
    expect(data.general.modifiers.kiBonus.damage.value).toBe(0);
  });

  test('unrecognised name yields no bonus', () => {
    const data = makeData({
      kiSkills: [{ _id: 'foo', name: 'something random', system: {} }]
    });
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.damage.value).toBe(0);
  });

  test('hand-typed UI ability is matched by name', () => {
    const data = makeData({
      kiSkills: [{ _id: 'ui1', name: 'Extensión del aura al arma', system: {} }]
    });
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.damage.value).toBe(10);
  });

  test('hand-typed kiSkill gets canonical martialKnowledge populated', () => {
    const data = makeData({
      kiSkills: [{ _id: 'ui2', name: 'Extensión del aura al arma', system: {} }]
    });
    applyKiSkillsModifiers(data);
    expect(data.domine.kiSkills[0].system.martialKnowledge.value).toBe(10);
  });

  test('canonical CM overrides user value', () => {
    const data = makeData({
      kiSkills: [
        {
          _id: 'ui3',
          name: 'Arm. arcana',
          system: { martialKnowledge: { value: 999 } }
        }
      ]
    });
    applyKiSkillsModifiers(data);
    expect(data.domine.kiSkills[0].system.martialKnowledge.value).toBe(10);
  });

  test('unknown name leaves martialKnowledge untouched', () => {
    const data = makeData({
      kiSkills: [
        {
          _id: 'ui4',
          name: 'Habilidad homebrew',
          system: { martialKnowledge: { value: 50 } }
        }
      ]
    });
    applyKiSkillsModifiers(data);
    expect(data.domine.kiSkills[0].system.martialKnowledge.value).toBe(50);
  });

  test('canonical tree populated on matched abilities', () => {
    const data = makeData({
      kiSkills: [{ _id: 'ui5', name: 'Extensión del aura al arma', system: {} }]
    });
    applyKiSkillsModifiers(data);
    expect(data.domine.kiSkills[0].system.tree.parent).toBe('presenceExtrusion');
    expect(data.domine.kiSkills[0].system.tree.depth).toBe(1);
  });

  test('root abilities get depth 0', () => {
    const data = makeData({
      kiSkills: [{ _id: 'ui6', name: 'Uso del Ki', system: {} }]
    });
    applyKiSkillsModifiers(data);
    expect(data.domine.kiSkills[0].system.tree.depth).toBe(0);
  });

  test('idempotent: running twice yields the same buckets', () => {
    const data = makeData({ kiSkills: [kiSkillItem('weaponAuraExtension')] });
    applyKiSkillsModifiers(data);
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.damage.value).toBe(10);
  });

  test('removing a kiSkill removes its bonus on next run', () => {
    const data = makeData({ kiSkills: [kiSkillItem('weaponAuraExtension')] });
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.damage.value).toBe(10);
    data.domine.kiSkills = [];
    applyKiSkillsModifiers(data);
    expect(data.general.modifiers.kiBonus.damage.value).toBe(0);
  });
});

describe('applyKiSkillsModifiers — abfFlow metadata', () => {
  test('declares kiSkills as input dep', () => {
    expect(applyKiSkillsModifiers.abfFlow.deps).toContain('system.domine.kiSkills');
  });

  test('declares all mods (kiBonus + CM + tree.depth + tree.prefix)', () => {
    expect(applyKiSkillsModifiers.abfFlow.mods).toEqual([
      'system.general.modifiers.kiBonus.damage.value',
      'system.general.modifiers.kiBonus.initiative.value',
      'system.general.modifiers.kiBonus.energyArmor.value',
      'system.domine.kiSkills.system.martialKnowledge.value',
      'system.domine.kiSkills.system.tree.depth',
      'system.domine.kiSkills.system.tree.prefix'
    ]);
  });
});

describe('computeKiSkillTreePrefixes', () => {
  test('empty list yields empty result', () => {
    expect(computeKiSkillTreePrefixes([])).toEqual([]);
  });

  test('only root rows get empty prefix', () => {
    expect(computeKiSkillTreePrefixes([0, 0, 0])).toEqual(['', '', '']);
  });

  test('single child uses └──', () => {
    expect(computeKiSkillTreePrefixes([0, 1])).toEqual(['', '└── ']);
  });

  test('two children: ├── then └──', () => {
    expect(computeKiSkillTreePrefixes([0, 1, 1])).toEqual(['', '├── ', '└── ']);
  });

  test('grandchild of non-last branch keeps vertical line', () => {
    expect(computeKiSkillTreePrefixes([0, 1, 2, 1])).toEqual([
      '',
      '├── ',
      '│   └── ',
      '└── '
    ]);
  });

  test('grandchild of last branch drops vertical line', () => {
    expect(computeKiSkillTreePrefixes([0, 1, 2])).toEqual([
      '',
      '└── ',
      '    └── '
    ]);
  });

  test('matches the user screenshot layout', () => {
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

describe('applyKiSkillsModifiers — tree prefix integration', () => {
  test('root row gets empty prefix', () => {
    const data = makeData({
      kiSkills: [{ _id: 't1', name: 'Uso del Ki', system: {} }]
    });
    applyKiSkillsModifiers(data);
    expect(data.domine.kiSkills[0].system.tree.prefix).toBe('');
  });

  test('last child of root gets └── prefix', () => {
    const data = makeData({
      kiSkills: [
        { _id: 't2a', name: 'Uso del Ki', system: {} },
        { _id: 't2b', name: 'Extrusión de presencia', system: {} },
        { _id: 't2c', name: 'Armadura de energía', system: {} }
      ]
    });
    applyKiSkillsModifiers(data);
    expect(data.domine.kiSkills[2].system.tree.prefix).toBe('└── ');
  });
});
