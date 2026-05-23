import {
  findKiSkillById,
  findKiSkillByName
} from '../../../../excelImporter/kiSkills/kiSkills.js';

/**
 * Walk every Ki/Nemesis ability present on the actor sheet and accumulate
 * the passive modifiers declared in their canonical effects[] into a read-only
 * bucket at system.general.modifiers.kiBonus.
 *
 * Side effects on each matched kiSkill item:
 *   - system.martialKnowledge.value ← canonical CM
 *   - system.tree.{parent, depth}   ← canonical position in the in-book tree
 *   - system.tree.prefix            ← ASCII box-drawing prefix
 *
 * @param {import('../../../../../../types/Actor').ABFActorDataSourceData} data
 */
export const applyKiSkillsModifiers = data => {
  const kiSkills = data.domine?.kiSkills ?? [];

  let damageBonus = 0;
  let initiativeBonus = 0;
  let energyArmorTA = 0;

  for (const kiSkill of kiSkills) {
    const canonicalId = kiSkill?.system?.canonicalId;
    const name = kiSkill?.name;

    let canonical = canonicalId ? findKiSkillById(canonicalId) : undefined;
    if (!canonical && name) {
      canonical = findKiSkillByName(name);
    }
    if (!canonical) continue;

    if (kiSkill.system && canonical.martialKnowledge != null) {
      kiSkill.system.martialKnowledge = kiSkill.system.martialKnowledge ?? {
        value: 0
      };
      kiSkill.system.martialKnowledge.value = canonical.martialKnowledge;
    }

    if (kiSkill.system && canonical.tree) {
      kiSkill.system.tree = {
        parent: canonical.tree.parent ?? null,
        depth: canonical.tree.depth ?? 0
      };
    }

    for (const eff of canonical.effects ?? []) {
      if (eff.operation === 'add') {
        if (eff.target === 'damage') {
          damageBonus += eff.value;
        } else if (eff.target === 'initiative') {
          initiativeBonus += eff.value;
        }
      } else if (eff.operation === 'set') {
        if (eff.target === 'energyArmor') {
          energyArmorTA = Math.max(energyArmorTA, eff.value);
        }
      }
    }
  }

  const depths = kiSkills.map(k => k?.system?.tree?.depth ?? 0);
  const prefixes = computeKiSkillTreePrefixes(depths);
  for (let i = 0; i < kiSkills.length; i++) {
    if (!kiSkills[i]?.system) continue;
    kiSkills[i].system.tree = kiSkills[i].system.tree ?? {
      parent: null,
      depth: 0
    };
    kiSkills[i].system.tree.prefix = prefixes[i];
  }

  data.general.modifiers.kiBonus = data.general.modifiers.kiBonus ?? {
    damage: { value: 0 },
    initiative: { value: 0 },
    energyArmor: { value: 0 }
  };
  data.general.modifiers.kiBonus.damage = { value: damageBonus };
  data.general.modifiers.kiBonus.initiative = { value: initiativeBonus };
  data.general.modifiers.kiBonus.energyArmor = { value: energyArmorTA };
};

/**
 * Given an array of depths in DFS order, return for each row the ASCII
 * box-drawing prefix that visually connects it to its parent.
 *
 * @param {number[]} depths
 * @returns {string[]}
 */
export function computeKiSkillTreePrefixes(depths) {
  const n = depths.length;
  const prefixes = new Array(n);
  for (let i = 0; i < n; i++) {
    const d = depths[i] | 0;
    if (d === 0) {
      prefixes[i] = '';
      continue;
    }
    let prefix = '';
    for (let l = 1; l < d; l++) {
      prefix += hasFollowingSiblingAtLevel(depths, i, l) ? '│   ' : '    ';
    }
    prefix += hasFollowingSiblingAtLevel(depths, i, d) ? '├── ' : '└── ';
    prefixes[i] = prefix;
  }
  return prefixes;
}

function hasFollowingSiblingAtLevel(depths, i, level) {
  for (let j = i + 1; j < depths.length; j++) {
    if (depths[j] < level) return false;
    if (depths[j] === level) return true;
  }
  return false;
}

applyKiSkillsModifiers.abfFlow = {
  deps: ['system.domine.kiSkills'],
  mods: [
    'system.general.modifiers.kiBonus.damage.value',
    'system.general.modifiers.kiBonus.initiative.value',
    'system.general.modifiers.kiBonus.energyArmor.value',
    'system.domine.kiSkills.system.martialKnowledge.value',
    'system.domine.kiSkills.system.tree.depth',
    'system.domine.kiSkills.system.tree.prefix'
  ]
};
