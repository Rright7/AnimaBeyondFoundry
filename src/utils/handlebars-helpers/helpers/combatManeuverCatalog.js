/**
 * Builds the full combat-maneuver catalog for the actor's maneuvers tab.
 *
 * Returns ALL canonical maneuvers from the registry (always present — no
 * embedded Item needed) merged with any CUSTOM maneuvers the actor owns
 * (dragged or hand-created) whose slug is NOT one of the canonical ones, so a
 * previously-dragged canonical maneuver never appears twice.
 *
 * Usage in HBS:
 *   {{#with (combatManeuverCatalog system.combat.combatManeuvers) as |list|}}
 *     {{#each list as |maneuver|}} ... {{/each}}
 *   {{/with}}
 *
 * Each entry shape:
 *   { slug, name, img, isCanonical, _id }
 *     - canonical: _id = null, name = localize(def.nameKey), img = def.icon
 *     - custom:    _id = item._id, name/img/slug taken from the embedded Item
 *
 * Backward-safe: if the registry is unavailable, returns just the custom list
 * mapped to the entry shape (so the tab still renders what the actor owns).
 */
export const combatManeuverCatalogHelper = {
  name: 'combatManeuverCatalog',
  fn: function (customManeuvers) {
    const custom = Array.isArray(customManeuvers) ? customManeuvers : [];

    const registry = (typeof game !== 'undefined' && game?.animabf?.maneuvers) || null;
    const localize = key =>
      typeof game !== 'undefined' && game?.i18n?.localize ? game.i18n.localize(key) : key;

    const canonical = [];
    const canonicalSlugs = new Set();

    const defs = registry && typeof registry.all === 'function' ? registry.all() : [];
    for (const def of defs) {
      if (!def?.slug) continue;
      canonicalSlugs.add(def.slug);
      const localized = def.nameKey ? localize(def.nameKey) : null;
      canonical.push({
        slug: def.slug,
        // Fall back to the slug if the i18n key is missing (localize returns
        // the key unchanged when there's no translation).
        name: localized && localized !== def.nameKey ? localized : def.slug,
        img: def.icon || 'icons/svg/sword.svg',
        isCanonical: true,
        isMaster: Array.isArray(def.predicate) && def.predicate.includes('self:mastery:attack'),
        _id: null
      });
    }

    // Custom maneuvers: keep only those not already covered by a canonical
    // card (dedupe by slug). Slug-less custom maneuvers are always kept.
    const extras = [];
    for (const item of custom) {
      const slug = item?.system?.slug?.value ?? '';
      if (slug && canonicalSlugs.has(slug)) continue;
      extras.push({
        slug,
        name: item?.name ?? '',
        img: item?.img ?? 'icons/svg/sword.svg',
        isCanonical: false,
        isMaster: false,
        _id: item?._id ?? null
      });
    }

    return [...canonical, ...extras];
  }
};
