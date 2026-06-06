import { getAimedZones } from '../../../module/combat/criticalTables.js';
import { composeAimedPenalty } from '../../../module/equipment/qualities/composeWeaponEffects.js';

/**
 * Returns the 16 aimed zones (Tabla 45) ready for the AttackConfigurationDialog
 * <select>: each entry has { id, penalty, label } so the template can render
 * "Cabeza −60" without splicing strings in HBS.
 *
 * Pass the equipped weapon to apply weapon-quality modifiers per zone
 * (e.g. Precisa halves the penalty). When weapon is undefined, the raw
 * Tabla 45 values are used.
 *
 * Usage:
 *   {{#each (aimedZonesWithPenalty this.attacker.combat.weapon)}}
 *     <option value='{{id}}'>{{label}} {{penaltyLabel}}</option>
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
  fn: function (weapon) {
    // Handlebars passes its options object as the last argument; if the
    // template called the helper with no arguments, what we receive in
    // `weapon` is that options object, not a weapon. Detect and ignore.
    const isOptions =
      weapon && typeof weapon === 'object' && 'hash' in weapon && 'name' in weapon;
    const effectiveWeapon = isOptions ? undefined : weapon;

    return getAimedZones().map(({ id, penalty: rawPenalty }) => {
      let penalty = rawPenalty;
      if (effectiveWeapon) {
        const composed = composeAimedPenalty(rawPenalty, {
          weapon: effectiveWeapon,
          aimedZone: id
        });
        penalty = composed.penalty;
      }
      return {
        id,
        penalty,
        penaltyLabel: formatPenalty(penalty),
        label: localizeZone(id)
      };
    });
  }
};
