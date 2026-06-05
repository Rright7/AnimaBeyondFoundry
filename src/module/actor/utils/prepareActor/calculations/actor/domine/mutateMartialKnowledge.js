const CM_LISTS = ['kiSkills', 'nemesisSkills', 'techniques'];

// CM usado = Σ CM de Habilidades de Ki/Némesis (lo escribe applyKiSkillsModifiers) + Técnicas.
export const mutateMartialKnowledgeUsed = data => {
  const domine = data.domine ?? {};
  let used = 0;
  for (const listName of CM_LISTS) {
    for (const item of domine[listName] ?? []) {
      used += Number(item?.system?.martialKnowledge?.value) || 0;
    }
  }

  const mk = domine.martialKnowledge;
  const max = mk.max.value || 0;
  mk.used.value = used;
  mk.available.value = max - used;
  mk.excess.value = used > max;
};

mutateMartialKnowledgeUsed.abfFlow = {
  deps: [
    'system.domine.kiSkills.system.martialKnowledge.value',
    'system.domine.nemesisSkills.system.martialKnowledge.value',
    'system.domine.techniques',
    'system.domine.martialKnowledge.max.value'
  ],
  mods: [
    'system.domine.martialKnowledge.used.value',
    'system.domine.martialKnowledge.available.value',
    'system.domine.martialKnowledge.excess.value'
  ]
};
