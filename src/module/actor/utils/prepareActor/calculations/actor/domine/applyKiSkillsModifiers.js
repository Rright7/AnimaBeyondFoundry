import {
  KI_SKILLS,
  findKiSkillById,
  findKiSkillByName
} from '../../../../excelImporter/kiSkills/kiSkills.js';

/**
 * Walk every Ki and Nemesis ability present on the actor sheet and accumulate
 * the passive modifiers declared in their canonical effects[] into a read-only
 * bucket at system.general.modifiers.kiBonus.
 *
 * Side effects on each matched ability item (Ki or Nemesis):
 *   - system.martialKnowledge.value ← canonical CM
 *   - system.tree.{parent, depth}   ← canonical position in the in-book tree
 *   - system.tree.prefix            ← ASCII box-drawing prefix
 *
 * Both lists (kiSkills, nemesisSkills) are also reordered in-place into the
 * canonical DFS order so that — after the user deletes and re-adds an
 * ability — it slots back under its parent instead of dangling at the end.
 * The reorder only mutates the derived data passed in (system), never the
 * actor source, so persistence stays whatever the user typed.
 *
 * @param {import('../../../../../../types/Actor').ABFActorDataSourceData} data
 */
export const applyKiSkillsModifiers = data => {
  const kiSkills = data.domine?.kiSkills ?? [];
  const nemesisSkills = data.domine?.nemesisSkills ?? [];

  sortByCanonicalOrder(kiSkills);
  sortByCanonicalOrder(nemesisSkills);

  const totals = { damage: 0, initiative: 0, energyArmor: 0 };
  enrichListFromCanonical(kiSkills, totals);
  enrichListFromCanonical(nemesisSkills, totals);

  populateTreePrefixes(kiSkills);
  populateTreePrefixes(nemesisSkills);

  data.general.modifiers.kiBonus = data.general.modifiers.kiBonus ?? {
    damage: { value: 0 },
    initiative: { value: 0 },
    energyArmor: { value: 0 }
  };
  data.general.modifiers.kiBonus.damage = { value: totals.damage };
  data.general.modifiers.kiBonus.initiative = { value: totals.initiative };
  data.general.modifiers.kiBonus.energyArmor = { value: totals.energyArmor };
};

const CANONICAL_INDEX = (() => {
  const map = new Map();
  KI_SKILLS.forEach((entry, idx) => map.set(entry.id, idx));
  return map;
})();

/**
 * Reorder the list in-place to match KI_SKILLS canonical order. Items whose
 * canonical id can't be resolved (homebrew or unrecognised name) keep their
 * relative order and are appended at the end. Stable sort.
 */
function sortByCanonicalOrder(list) {
  if (list.length < 2) return;
  list.sort((a, b) => canonicalIndexOf(a) - canonicalIndexOf(b));
}

function canonicalIndexOf(skill) {
  const id = skill?.system?.canonicalId;
  if (id && CANONICAL_INDEX.has(id)) return CANONICAL_INDEX.get(id);
  const byName = skill?.name ? findKiSkillByName(skill.name) : undefined;
  if (byName && CANONICAL_INDEX.has(byName.id)) return CANONICAL_INDEX.get(byName.id);
  return Number.POSITIVE_INFINITY;
}

function enrichListFromCanonical(list, totals) {
  for (const skill of list) {
    const canonicalId = skill?.system?.canonicalId;
    const name = skill?.name;

    let canonical = canonicalId ? findKiSkillById(canonicalId) : undefined;
    if (!canonical && name) {
      canonical = findKiSkillByName(name);
    }
    if (!canonical) continue;

    if (skill.system && canonical.martialKnowledge != null) {
      skill.system.martialKnowledge = skill.system.martialKnowledge ?? {
        value: 0
      };
      skill.system.martialKnowledge.value = canonical.martialKnowledge;
    }

    if (skill.system && canonical.tree) {
      skill.system.tree = {
        parent: canonical.tree.parent ?? null,
        depth: canonical.tree.depth ?? 0
      };
    }

    for (const eff of canonical.effects ?? []) {
      if (eff.operation === 'add') {
        if (eff.target === 'damage') totals.damage += eff.value;
        else if (eff.target === 'initiative') totals.initiative += eff.value;
      } else if (eff.operation === 'set') {
        if (eff.target === 'energyArmor') {
          totals.energyArmor = Math.max(totals.energyArmor, eff.value);
        }
      }
    }
  }
}

function populateTreePrefixes(list) {
  const depths = list.map(k => k?.system?.tree?.depth ?? 0);
  const prefixes = computeKiSkillTreePrefixes(depths);
  for (let i = 0; i < list.length; i++) {
    if (!list[i]?.system) continue;
    list[i].system.tree = list[i].system.tree ?? { parent: null, depth: 0 };
    list[i].system.tree.prefix = prefixes[i];
  }
}

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
  deps: ['system.domine.kiSkills', 'system.domine.nemesisSkills'],
  mods: [
    'system.general.modifiers.kiBonus.damage.value',
    'system.general.modifiers.kiBonus.initiative.value',
    'system.general.modifiers.kiBonus.energyArmor.value',
    'system.domine.kiSkills.system.martialKnowledge.value',
    'system.domine.kiSkills.system.tree.depth',
    'system.domine.kiSkills.system.tree.prefix',
    'system.domine.nemesisSkills.system.martialKnowledge.value',
    'system.domine.nemesisSkills.system.tree.depth',
    'system.domine.nemesisSkills.system.tree.prefix'
  ]
};
