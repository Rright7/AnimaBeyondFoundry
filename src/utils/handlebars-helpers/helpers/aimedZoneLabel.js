/**
 * Returns the localized label for an aimed-zone canonical ID
 * (e.g. 'arm' → 'Brazo', 'thigh' → 'Pierna').
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

export const aimedZoneLabelHelper = {
  name: 'aimedZoneLabel',
  fn: function (zone) {
    if (!zone) return '';
    const key = ZONE_LABEL_KEYS[zone];
    if (!key) return zone;
    return game.i18n.has(key) ? game.i18n.localize(key) : zone;
  }
};
