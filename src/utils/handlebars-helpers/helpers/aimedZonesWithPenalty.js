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
  fn: function (weapon, actor) {
    // Handlebars passes its options object as the LAST argument. Detectarlo tanto si
    // se llamo con (weapon, actor), solo (weapon) o sin args, para no confundir las
    // opciones con un arma/actor. El actor es necesario para que el desplegable
    // refleje los efectos de Artes Marciales sobre el penalizador (Sambo Supremo dobla
    // la ventaja de Precisa), igual que la tirada real.
    const isOptions = v => v && typeof v === 'object' && 'hash' in v && 'name' in v;
    let effectiveWeapon = weapon;
    let effectiveActor = actor;
    if (isOptions(effectiveActor)) effectiveActor = undefined; // llamado solo con weapon
    if (isOptions(effectiveWeapon)) {
      effectiveWeapon = undefined; // llamado sin args
      effectiveActor = undefined;
    }

    return getAimedZones().map(({ id, penalty: rawPenalty }) => {
      let penalty = rawPenalty;
      if (effectiveWeapon) {
        const composed = composeAimedPenalty(rawPenalty, {
          weapon: effectiveWeapon,
          actor: effectiveActor,
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
