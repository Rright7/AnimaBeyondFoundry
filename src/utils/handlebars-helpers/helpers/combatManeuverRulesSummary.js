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

import { martialArtManeuverPenaltyFactor } from '../../../module/combat/martialArts/martialArtSpecials.js';

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

// Handlebars pasa su objeto options como ULTIMO argumento; detectarlo para no confundirlo
// con el actor cuando el helper se llama solo con (slug).
const isOptions = v => v && typeof v === 'object' && 'hash' in v && 'name' in v;

export const combatManeuverRulesSummaryHelper = {
  name: 'combatManeuverRulesSummary',
  fn: function (slug, actor) {
    if (!slug) return '';
    const def = game.animabf?.maneuvers?.get?.(slug);
    if (!def) return '';

    let effectiveActor = actor;
    if (isOptions(effectiveActor)) effectiveActor = undefined;

    const parts = [];

    let penalty = def.attackPenalty ?? 0;
    // Reflejar el penalizador YA reducido por las Artes Marciales del actor (Grappling
    // mitad/sin, Sambo, Pankration...), para que el preview coincida con la tirada. Sin
    // isCounterAttack: las reducciones counterOnly (Aikido/Malla) solo valen en contraataque.
    if (penalty !== 0 && effectiveActor) {
      const factor = martialArtManeuverPenaltyFactor(effectiveActor, slug);
      if (factor !== 1) penalty = Math.round(penalty * factor);
    }
    if (penalty !== 0) parts.push(`${penalty > 0 ? '+' : ''}${penalty} ataque`);

    if (def.forceTAZero) parts.push('vs TA 0');

    const att = formatStats(def.attackerStats);
    const dfn = formatStats(def.defenderStats);
    if (att && dfn) parts.push(`${att} vs ${dfn}`);

    if (def.grantsQuadrupedBonus) parts.push('cuadrúpedo +3');

    return parts.join(' · ');
  }
};
