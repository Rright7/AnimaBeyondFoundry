/**
 * Returns the list of "delay rounds" options (1..5) for a maneuver that lets the
 * attacker declare a delay before rolling (Daño retrasado). Empty array if the
 * maneuver's definition does not enable it.
 *
 * Usage:
 *   {{#each (combatManeuverDelayRoundsOptions slug)}} ... {{/each}}
 */
export const combatManeuverDelayRoundsOptionsHelper = {
  name: 'combatManeuverDelayRoundsOptions',
  fn: function (slug) {
    if (!slug) return [];
    const def = game.animabf?.maneuvers?.get?.(slug);
    if (!def?.hasDelayRoundsOption) return [];
    return ['1', '2', '3', '4', '5'];
  }
};
