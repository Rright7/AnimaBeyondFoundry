import { getAimedZones } from '../../../module/combat/criticalTables.js';

/**
 * Returns the 16 aimed zones (Tabla 45) ready for the AttackConfigurationDialog
 * <select>: each entry has { id, penalty, label } so the template can render
 * "Cabeza −60" without splicing strings in HBS.
 *
 * Usage:
 *   {{#each (aimedZonesWithPenalty)}}
 *     <option value='{{id}}'>{{label}} {{penalty}}</option>
 *   {{/each}}
 */
const ZONE_LABEL_KEYS = {
  head: 'anima.combat.aimedZone.head',
  eye: 'anima.combat.aimedZone.eye',
  neck: 'anima.combat.aimedZone.neck',
  heart: 'anima.combat.aimedZone.heart',
  groin: 'anima.combat.aimedZone.groin',
  arm: 'anima.combat.aimedZone.arm',
  thigh: 'anima.combat.aimedZone.thigh',
  calf: 'anima.combat.aimedZone.calf',
  hand: 'anima.combat.aimedZone.hand',
  foot: 'anima.combat.aimedZone.foot',
  shoulder: 'anima.combat.aimedZone.shoulder',
  elbow: 'anima.combat.aimedZone.elbow',
  wrist: 'anima.combat.aimedZone.wrist',
  knee: 'anima.combat.aimedZone.knee',
  abdomen: 'anima.combat.aimedZone.abdomen',
  torso: 'anima.combat.aimedZone.torso'
};

const localizeZone = id => {
  const key = ZONE_LABEL_KEYS[id];
  if (!key) return id;
  return game.i18n?.has?.(key) ? game.i18n.localize(key) : id;
};

// U+2212 MINUS SIGN — looks balanced next to the label
// ("Ojo −100") instead of the cramped ASCII hyphen ("Ojo -100").
const formatPenalty = penalty => {
  if (penalty < 0) return `−${Math.abs(penalty)}`;
  if (penalty > 0) return `+${penalty}`;
  return '0';
};

export const aimedZonesWithPenaltyHelper = {
  name: 'aimedZonesWithPenalty',
  fn: function () {
    return getAimedZones().map(({ id, penalty }) => ({
      id,
      penalty,
      penaltyLabel: formatPenalty(penalty),
      label: localizeZone(id)
    }));
  }
};
