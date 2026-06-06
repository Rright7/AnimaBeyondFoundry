/**
 * Returns the list of aimed-zone options declared by a maneuver's definition,
 * keyed by canonical zone ID. Used by the maneuver card to render the
 * zone selector for maneuvers like Inutilizar (arm / thigh).
 *
 * Usage:
 *   {{#each (combatManeuverAimedZoneOptions slug)}} ... {{/each}}
 *
 * Returns an empty array when the maneuver has no aimed-zone options.
 */
export const combatManeuverAimedZoneOptionsHelper = {
  name: 'combatManeuverAimedZoneOptions',
  fn: function (slug) {
    if (!slug) return [];
    const def = game.animabf?.maneuvers?.get?.(slug);
    if (!def) return [];
    const opts = Array.isArray(def.aimedZoneOptions) ? def.aimedZoneOptions : [];
    return opts;
  }
};
