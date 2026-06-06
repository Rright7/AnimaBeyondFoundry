/**
 * Return a short suffix to append to a quality chip when the quality has
 * a meaningful parameter set on this item. Currently formats:
 *
 *   grappling.grappleStrength: 10 → " (10)"
 *
 * Other slugs return "" so the chip just shows the localized name.
 *
 * Usage in HBS:
 *   {{equipmentQualitiesLabel (jsonArray slug)}}{{equipmentQualityParamSuffix slug system.qualityParams.value}}
 *
 * Kept narrow on purpose: when a quality grows new parameters in the
 * future (e.g. complex with hasMastery), add the rendering here.
 */
export const equipmentQualityParamSuffixHelper = {
  name: 'equipmentQualityParamSuffix',
  fn: function (slug, params) {
    if (!slug || !params || typeof params !== 'object') return '';
    const block = params[slug];
    if (!block || typeof block !== 'object') return '';

    if (slug === 'grappling' && Number.isFinite(block.grappleStrength)) {
      return ` (${block.grappleStrength})`;
    }
    return '';
  }
};
