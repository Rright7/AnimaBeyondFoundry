import {
  findKiSkillById,
  findKiSkillByName
} from '../actor/utils/excelImporter/kiSkills/kiSkills.js';

export const KI_ATTACK_ELEMENTS = [
  { id: 'fire', canonicalId: 'elementalAttackFire', critic: 'heat' },
  {
    id: 'air',
    canonicalId: 'elementalAttackAir',
    critic: 'electricity'
  },
  {
    id: 'water',
    canonicalId: 'elementalAttackWater',
    critic: 'cold'
  },
  {
    id: 'earth',
    canonicalId: 'elementalAttackEarth',
    critic: 'impact'
  },
  { id: 'light', canonicalId: 'elementalAttackLight' },
  { id: 'darkness', canonicalId: 'elementalAttackDarkness' }
];

export function normalizeKiElement(value) {
  return KI_ATTACK_ELEMENTS.some(element => element.id === value) ? value : '';
}

export function ownedKiAttackElements(actor) {
  const owned = new Set(
    (actor?.system?.domine?.kiSkills ?? []).map(skill => {
      const canonical = skill.system?.canonicalId
        ? findKiSkillById(skill.system?.canonicalId, skill.name)
        : undefined;
      return (canonical ?? findKiSkillByName(skill.name ?? ''))?.id;
    })
  );
  return KI_ATTACK_ELEMENTS.filter(element => owned.has(element.canonicalId));
}

/** Resolve per-attack choices without changing the actor or weapon's prepared data. */
export function resolveKiElementalAttack(
  actor,
  weapon,
  elementId,
  critic,
  martialTables
) {
  const element = ownedKiAttackElements(actor).find(entry => entry.id === elementId);
  const primary = weapon?.system?.critic?.primary?.value ?? 'impact';
  const secondary = weapon?.system?.critic?.secondary?.value;
  const baseTables = martialTables ?? [primary, secondary];
  const critics = [
    ...new Set([...baseTables, element?.critic].filter(value => value && value !== '-'))
  ];
  const selectedCritic = critics.includes(critic) ? critic : critics[0] ?? primary;
  const usesSecondary =
    selectedCritic !== primary &&
    (selectedCritic === secondary ||
      (selectedCritic === element?.critic && !martialTables?.includes(selectedCritic)));
  return {
    element: element?.id ?? '',
    critics,
    critic: selectedCritic,
    damageBonus: element?.id === 'earth' && primary === 'impact' ? 10 : 0,
    secondaryPenalty: usesSecondary ? -10 : 0
  };
}
