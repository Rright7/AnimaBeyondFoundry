/**
 * Builds a compact one-line summary of a combat maneuver's rules,
 * read live from the ManeuverDefinition registry.
 *
 * Usage in HBS:
 *   {{combatManeuverRulesSummary slug}}
 *
 * Output examples:
 *   "-40 ataque · vs TA 0 · FUE/DES vs FUE/AGI"
 *   "-30 ataque · vs TA 0 · FUE/DES vs FUE/AGI · cuadrúpedo +3"
 *
 * Returns an empty string if the slug is missing or unknown.
 */

const STAT_SHORT = {
  strength: 'FUE',
  dexterity: 'DES',
  agility: 'AGI',
  constitution: 'CON',
  intelligence: 'INT',
  perception: 'PER',
  power: 'POD',
  willPower: 'VOL'
};

const formatStats = stats =>
  (stats ?? []).map(s => STAT_SHORT[s] ?? s.toUpperCase()).join('/');

export const combatManeuverRulesSummaryHelper = {
  name: 'combatManeuverRulesSummary',
  fn: function (slug) {
    if (!slug) return '';
    const def = game.animabf?.maneuvers?.get?.(slug);
    if (!def) return '';

    const parts = [];

    const penalty = def.attackPenalty ?? 0;
    if (penalty !== 0) parts.push(`${penalty > 0 ? '+' : ''}${penalty} ataque`);

    if (def.forceTAZero) parts.push('vs TA 0');

    const att = formatStats(def.attackerStats);
    const dfn = formatStats(def.defenderStats);
    if (att && dfn) parts.push(`${att} vs ${dfn}`);

    if (def.grantsQuadrupedBonus) parts.push('cuadrúpedo +3');

    return parts.join(' · ');
  }
};
