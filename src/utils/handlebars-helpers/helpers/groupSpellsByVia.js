const VIA_LABEL_PREFIX = 'anima.ui.mystic.spell.via.';
const UNASSIGNED_KEY = 'unassigned';

const localizeVia = key => {
  const fallback = key === UNASSIGNED_KEY ? 'Sin via' : key;
  return game?.i18n?.localize(`${VIA_LABEL_PREFIX}${key}.title`) ?? fallback;
};

// Groups the flat spell list by `system.via.value` so the grimoire renders one
// collapsible section per via. Spells are ordered by level; vias alphabetically
// by localized name, with the unassigned bucket pushed to the end.
export const groupSpellsByVia = {
  name: 'groupSpellsByVia',
  fn(spells) {
    const list = Array.isArray(spells) ? spells : [];

    const groups = new Map();
    for (const spell of list) {
      const key = spell?.system?.via?.value || UNASSIGNED_KEY;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(spell);
    }

    const result = [...groups.entries()].map(([viaKey, viaSpells]) => {
      const sorted = [...viaSpells].sort(
        (a, b) =>
          (Number(a?.system?.level?.value) || 0) -
          (Number(b?.system?.level?.value) || 0)
      );
      const label = localizeVia(viaKey);
      return {
        viaKey,
        label,
        count: sorted.length,
        headerLabel: `${label} (${sorted.length})`,
        contractKey: `spell-via-${viaKey}`,
        spells: sorted
      };
    });

    result.sort((a, b) => {
      if (a.viaKey === UNASSIGNED_KEY) return 1;
      if (b.viaKey === UNASSIGNED_KEY) return -1;
      return a.label.localeCompare(b.label, 'es');
    });

    return result;
  }
};
