import {
  KI_SKILLS,
  findKiSkillById,
  findKiSkillByName
} from '../../../../excelImporter/kiSkills/kiSkills.js';
import { activeTechniqueModifiers } from '../../../../../../domine/techniques/activeTechniqueModifiers';
import { depositModifier } from '../../../../effectFow/modifiers/synthetics.js';

const RESISTANCE_KEYS = ['physical', 'disease', 'poison', 'magic', 'psychic'];
const RESISTANCE_TARGET = {
  resistancePhysical: 'physical',
  resistanceDisease: 'disease',
  resistancePoison: 'poison',
  resistanceMagic: 'magic',
  resistancePsychic: 'psychic'
};

/**
 * Acumula un efecto canónico { target, operation:'add'|'set', value } en los
 * buckets `totals`. 'add' suma; 'set' toma el máximo (armaduras/barreras no apilan).
 * @param {object} totals
 * @param {{target:string, operation:string, value:number}} eff
 */
function accumulateEffect(totals, eff) {
  const value = Number(eff.value) || 0;
  const target = eff.target;
  if (eff.operation === 'add') {
    if (target === 'damage') totals.damage += value;
    else if (target === 'initiative') totals.initiative += value;
    else if (target === 'resistanceAll')
      RESISTANCE_KEYS.forEach(k => (totals.resistances[k] += value));
    else if (RESISTANCE_TARGET[target])
      totals.resistances[RESISTANCE_TARGET[target]] += value;
  } else if (eff.operation === 'set') {
    if (target === 'energyArmor')
      totals.energyArmor = Math.max(totals.energyArmor, value);
    else if (target === 'damageReduction')
      totals.damageReduction = Math.max(totals.damageReduction, value);
  }
}

/**
 * Walk every Ki and Nemesis ability present on the actor sheet and accumulate
 * the passive modifiers declared in their canonical effects[] into read-only
 * buckets at system.general.modifiers.kiBonus.
 *
 * Effect schema: { target, operation: 'add'|'set', value:number }
 *   targets: damage | initiative | energyArmor | damageReduction |
 *            resistancePhysical | resistanceDisease | resistancePoison |
 *            resistanceMagic | resistancePsychic | resistanceAll
 *   'add' accumulates; 'set' takes the max (non-stacking, e.g. armours/barriers).
 *
 * Side effects on each matched ability item: system.martialKnowledge.value,
 * system.tree.{parent,depth,prefix}. Both lists are reordered into canonical
 * DFS order (derived data only; the actor source is untouched).
 *
 * @param {import('../../../../../../types/Actor').ABFActorDataSourceData} data
 * @param {object} [actor] documento del actor (para depositar provenance en synthetics)
 */
export const applyKiSkillsModifiers = (data, actor) => {
  const kiSkills = data.domine?.kiSkills ?? [];
  const nemesisSkills = data.domine?.nemesisSkills ?? [];

  sortByCanonicalOrder(kiSkills);
  sortByCanonicalOrder(nemesisSkills);

  const totals = {
    damage: 0,
    initiative: 0,
    energyArmor: 0,
    damageReduction: 0,
    resistances: { physical: 0, disease: 0, poison: 0, magic: 0, psychic: 0 }
  };
  enrichListFromCanonical(kiSkills, totals, actor);
  enrichListFromCanonical(nemesisSkills, totals, actor);

  // Técnicas de Ki activas (F6): sus efectos persistentes de resistencias se
  // suman a los mismos buckets. (Las características van por su propio mutador.)
  const techMods = activeTechniqueModifiers(data);
  for (const eff of techMods.kiBonusEffects) {
    accumulateEffect(totals, eff);
  }
  // Provenance para el chat: una entrada por técnica/resistencia, sobre el path
  // `.final.value` (el que se tira desde la hoja).
  for (const rec of techMods.records) {
    if (rec.scope !== 'bucket') continue;
    // Turno (Incrementar Turno): la traza va sobre el path de iniciativa.
    if (rec.target === 'initiative') {
      depositModifier(actor, {
        path: 'system.characteristics.secondaries.initiative.final.value',
        value: rec.value,
        source: rec.source,
        slug: rec.slug ? `technique:${rec.slug}:initiative` : undefined
      });
      continue;
    }
    const key = RESISTANCE_TARGET[rec.target];
    if (!key) continue;
    depositModifier(actor, {
      path: `system.characteristics.secondaries.resistances.${key}.final.value`,
      value: rec.value,
      source: rec.source,
      slug: rec.slug ? `technique:${rec.slug}:${rec.target}` : undefined
    });
  }

  populateTreePrefixes(kiSkills);
  populateTreePrefixes(nemesisSkills);

  const m = data.general.modifiers;
  m.kiBonus = m.kiBonus ?? {};
  m.kiBonus.damage = { value: totals.damage };
  m.kiBonus.initiative = { value: totals.initiative };
  m.kiBonus.energyArmor = { value: totals.energyArmor };
  m.kiBonus.damageReduction = { value: totals.damageReduction };
  m.kiBonus.resistances = {
    physical: { value: totals.resistances.physical },
    disease: { value: totals.resistances.disease },
    poison: { value: totals.resistances.poison },
    magic: { value: totals.resistances.magic },
    psychic: { value: totals.resistances.psychic }
  };
};

/**
 * Adds the Ki damage-reduction bucket (Barrera de Daño: Armadura de vacío, Noht,
 * Escudo físico) onto the combat damage reduction final value. Runs after the
 * typed node computes the final (toposort: overwrite before this modify).
 *
 * @param {import('../../../../../../types/Actor').ABFActorDataSourceData} data
 */
export const mutateKiDamageReduction = data => {
  const ki = data.general?.modifiers?.kiBonus?.damageReduction?.value ?? 0;
  if (!ki) return;
  const dr = data.combat?.damageReduction;
  if (dr?.final) dr.final.value = (dr.final.value ?? 0) + ki;
};

mutateKiDamageReduction.abfFlow = {
  deps: ['system.general.modifiers.kiBonus.damageReduction.value'],
  mods: ['system.combat.damageReduction.final.value']
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

function enrichListFromCanonical(list, totals, actor) {
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
      accumulateEffect(totals, eff);
      depositKiSkillResistance(actor, skill, canonical, eff);
      depositKiSkillInitiative(actor, skill, canonical, eff);
    }
  }
}

/**
 * Deposita en synthetics la provenance de un efecto de RESISTENCIA de una
 * habilidad de Ki/Nemesis, para que la linea 'Mod:' del chat cuadre con el total
 * (igual que hacen las tecnicas). Solo resistencias con operation:'add'.
 * depositModifier ignora un actor falsy, asi que los tests que llaman
 * applyKiSkillsModifiers(data) sin actor siguen funcionando.
 */
function depositKiSkillResistance(actor, skill, canonical, eff) {
  if (!actor || eff?.operation !== 'add') return;
  const value = Number(eff.value) || 0;
  if (!value) return;
  const keys =
    eff.target === 'resistanceAll'
      ? RESISTANCE_KEYS
      : RESISTANCE_TARGET[eff.target]
      ? [RESISTANCE_TARGET[eff.target]]
      : [];
  if (!keys.length) return;
  const id = skill?.system?.canonicalId ?? canonical.id;
  for (const key of keys) {
    depositModifier(actor, {
      path: `system.characteristics.secondaries.resistances.${key}.final.value`,
      value,
      source: skill?.name ?? canonical.name,
      slug: `kiSkill:${id}:${key}`
    });
  }
}

/**
 * Deposita en synthetics la provenance del bono de INICIATIVA de una habilidad de
 * Ki/Nemesis, para que la linea 'Mod:' del chat incluya esa fuente igual que el
 * Turno de Artes Marciales. Solo target 'initiative' con operation:'add'.
 * depositModifier ignora un actor falsy (los tests sin actor siguen funcionando).
 */
function depositKiSkillInitiative(actor, skill, canonical, eff) {
  if (!actor || eff?.operation !== 'add' || eff?.target !== 'initiative') return;
  const value = Number(eff.value) || 0;
  if (!value) return;
  const id = skill?.system?.canonicalId ?? canonical.id;
  depositModifier(actor, {
    path: 'system.characteristics.secondaries.initiative.final.value',
    value,
    source: skill?.name ?? canonical.name,
    slug: `kiSkill:${id}:initiative`
  });
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
  deps: ['system.domine.kiSkills', 'system.domine.nemesisSkills', 'system.domine.techniques'],
  mods: [
    'system.general.modifiers.kiBonus.damage.value',
    'system.general.modifiers.kiBonus.initiative.value',
    'system.general.modifiers.kiBonus.energyArmor.value',
    'system.general.modifiers.kiBonus.damageReduction.value',
    'system.general.modifiers.kiBonus.resistances.physical.value',
    'system.general.modifiers.kiBonus.resistances.disease.value',
    'system.general.modifiers.kiBonus.resistances.poison.value',
    'system.general.modifiers.kiBonus.resistances.magic.value',
    'system.general.modifiers.kiBonus.resistances.psychic.value',
    'system.domine.kiSkills.system.martialKnowledge.value',
    'system.domine.kiSkills.system.tree.depth',
    'system.domine.kiSkills.system.tree.prefix',
    'system.domine.nemesisSkills.system.martialKnowledge.value',
    'system.domine.nemesisSkills.system.tree.depth',
    'system.domine.nemesisSkills.system.tree.prefix'
  ]
};
