/**
 * Canonical critical hit tables for Anima Beyond Fantasy.
 * Source: Core Exxet pp.96-98, Pantalla del Director p7.
 * Validated by Julian 2026-05-27.
 */

// ─── Location Table (Tabla 51) ────────────────────────────────────

const LOCATION_TABLE = [
  { min: 1, max: 10, zone: 'ribs', group: 'torso' },
  { min: 11, max: 20, zone: 'shoulder', group: 'torso' },
  { min: 21, max: 30, zone: 'stomach', group: 'torso' },
  { min: 31, max: 35, zone: 'kidneys', group: 'torso' },
  { min: 36, max: 48, zone: 'chest', group: 'torso' },
  { min: 49, max: 50, zone: 'heart', group: 'torso', isVulnerable: true },
  { min: 51, max: 54, zone: 'leftUpperArm', group: 'leftArm', isLimb: true },
  { min: 55, max: 58, zone: 'leftLowerArm', group: 'leftArm', isLimb: true },
  { min: 59, max: 60, zone: 'leftHand', group: 'leftArm', isLimb: true },
  { min: 61, max: 64, zone: 'rightUpperArm', group: 'rightArm', isLimb: true },
  { min: 65, max: 68, zone: 'rightLowerArm', group: 'rightArm', isLimb: true },
  { min: 69, max: 70, zone: 'rightHand', group: 'rightArm', isLimb: true },
  { min: 71, max: 74, zone: 'leftThigh', group: 'leftLeg', isLimb: true },
  { min: 75, max: 78, zone: 'leftCalf', group: 'leftLeg', isLimb: true },
  { min: 79, max: 80, zone: 'leftFoot', group: 'leftLeg', isLimb: true },
  { min: 81, max: 84, zone: 'rightThigh', group: 'rightLeg', isLimb: true },
  { min: 85, max: 88, zone: 'rightCalf', group: 'rightLeg', isLimb: true },
  { min: 89, max: 90, zone: 'rightFoot', group: 'rightLeg', isLimb: true },
  { min: 91, max: 100, zone: 'head', group: 'head', isVulnerable: true }
];

/**
 * Look up a hit location from a d100 roll.
 * @param {number} roll — 1-100
 * @returns {{ zone: string, group: string, isLimb?: boolean, isVulnerable?: boolean }}
 */
export function lookupLocation(roll) {
  const clamped = Math.max(1, Math.min(100, Math.floor(roll)));
  const entry = LOCATION_TABLE.find(e => clamped >= e.min && clamped <= e.max);
  return entry ?? LOCATION_TABLE[0];
}

// ─── Aimed Attack Penalties ───────────────────────────────────────

const AIMED_PENALTIES = {
  eye: -100,
  neck: -80,
  head: -60,
  elbow: -60,
  heart: -60,
  groin: -60,
  foot: -50,
  hand: -40,
  knee: -40,
  wrist: -40,
  shoulder: -30,
  abdomen: -20,
  arm: -20,
  thigh: -20,
  calf: -10,
  torso: -10
};

/**
 * Get the attack penalty for aiming at a specific body part.
 * @param {string} zone — English ID
 * @returns {number} — negative penalty value, or 0 if unknown
 */
export function getAimedPenalty(zone) {
  return AIMED_PENALTIES[zone] ?? 0;
}

/**
 * All valid aimed zones with their penalties (for UI dropdowns).
 * @returns {Array<{ id: string, penalty: number }>}
 */
export function getAimedZones() {
  return Object.entries(AIMED_PENALTIES)
    .map(([id, penalty]) => ({ id, penalty }))
    .sort((a, b) => a.penalty - b.penalty);
}

// ─── Critical Effects Resolution ──────────────────────────────────

/**
 * @typedef {object} CriticalEffects
 * @property {number} actionPenalty — total penalty to all actions
 * @property {number} painPenalty — portion from pain (recovers per regeneration)
 * @property {number} physicalPenalty — portion from physical damage (slow recovery)
 * @property {boolean} limbDestroyed — arm/leg destroyed or amputated
 * @property {boolean} unconscious — knocked out
 * @property {boolean} death — instant death
 * @property {boolean} deathTimer — dying in CON minutes without medical attention
 * @property {string|null} destroyedLimb — which limb, if limbDestroyed
 */

/**
 * Determine the mechanical effects of a critical hit from the failure level.
 * @param {number} failureLevel — critLevel - phRollTotal (positive = failed)
 * @param {{ zone: string, group: string, isLimb?: boolean, isVulnerable?: boolean }|null} location
 * @returns {CriticalEffects}
 */
export function determineCriticalEffects(failureLevel, location) {
  const base = {
    actionPenalty: 0,
    painPenalty: 0,
    physicalPenalty: 0,
    limbDestroyed: false,
    unconscious: false,
    death: false,
    deathTimer: false,
    destroyedLimb: null
  };

  if (failureLevel <= 0) return base;

  base.actionPenalty = failureLevel;

  if (failureLevel <= 50) {
    // All pain, recovers per regeneration
    base.painPenalty = failureLevel;
    return base;
  }

  // 51+: mitad dolor, mitad fisico. Las DOS mitades se redondean hacia ABAJO (un
  // failureLevel impar pierde 1 punto en favor del defensor): 75 -> 37 y 37, no 38/37.
  base.painPenalty = Math.floor(failureLevel / 2);
  base.physicalPenalty = Math.floor(failureLevel / 2);

  if (location?.zone === 'head') {
    base.unconscious = true;
  }

  if (failureLevel > 100) {
    // 101+: limb destruction or death
    if (location?.isLimb) {
      base.limbDestroyed = true;
      base.destroyedLimb = location.group;
    }
    if (location?.zone === 'head' || location?.zone === 'heart') {
      base.death = true;
    }
  }

  if (failureLevel > 150) {
    // 151+: unconscious regardless + death timer
    base.unconscious = true;
    base.deathTimer = true;
  }

  return base;
}
