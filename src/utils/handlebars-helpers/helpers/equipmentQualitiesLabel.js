/**
 * Render the equipment-quality slugs stored in `qualities.value` as a
 * single comma-separated string of localized labels. Used by the weapon
 * sheet to display the read-only "Especial" field.
 *
 * Usage in HBS:
 *   {{equipmentQualitiesLabel system.qualities.value}}
 *
 * Returns "" when the array is empty or the registry is not ready yet.
 */
export const equipmentQualitiesLabelHelper = {
  name: 'equipmentQualitiesLabel',
  fn: function (slugs) {
    if (!Array.isArray(slugs) || slugs.length === 0) return '';

    const registry = game.animabf?.equipmentQualities;
    if (!registry?.get) return slugs.join(', ');

    const labels = [];
    for (const slug of slugs) {
      const def = registry.get(String(slug));
      if (!def) {
        labels.push(String(slug));
        continue;
      }
      const key = def.nameKey;
      labels.push(
        key && game.i18n?.has?.(key) ? game.i18n.localize(key) : def.slug
      );
    }
    return labels.join(', ');
  }
};
