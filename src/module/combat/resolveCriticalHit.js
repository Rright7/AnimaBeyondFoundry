import { lookupLocation, determineCriticalEffects } from './criticalTables.js';

/**
 * @typedef {object} CriticalHitInput
 * @property {number} baseCriticalValue — finalDamage + critBonus + critDamageBonus
 * @property {Actor} defenderActor
 * @property {boolean} [aimed=false] — was the attack aimed?
 * @property {string|null} [aimedWhere=null] — body zone ID if aimed
 * @property {boolean} [isDamageAccumulator=false] — creature uses damage accumulation
 * @property {boolean} [isMass=false] — target is a mass/swarm (immune to crits)
 * @property {boolean} [critImmune=false] — target is immune to criticals
 */

/**
 * @typedef {object} CriticalHitResult
 * @property {boolean} resolved — true if the critical was fully resolved
 * @property {boolean} immune — true if target was immune
 * @property {string|null} immuneReason — 'mass' | 'critImmune' | null
 * @property {number} critLevelRoll — d100 rolled for critical level
 * @property {number} critLevelRaw — critLevelRoll + baseCriticalValue (before accumulation halving and cap)
 * @property {number} critLevel — final critical level (after halving for accumulation + cap at 200)
 * @property {number} phRoll — d100 rolled for PhR
 * @property {number} phBase — defender's RF base value
 * @property {number} phTotal — phRoll + phBase
 * @property {boolean} phPassed — phTotal >= critLevel
 * @property {number} failureLevel — critLevel - phTotal (0 if passed)
 * @property {{ zone: string, group: string, isLimb?: boolean, isVulnerable?: boolean }|null} location
 * @property {number} locationRoll — d100 for location (0 if not rolled)
 * @property {import('./criticalTables.js').CriticalEffects} effects
 */

/**
 * Resolve a critical hit through the full Anima sequence:
 * 1. Check exceptions (mass, immunity, accumulation)
 * 2. Roll critical level (d100 + baseCriticalValue)
 * 3. Cap at 200 (excess halved)
 * 4. Defender rolls PhR (RF)
 * 5. If failed: determine location (if failureLevel > 50) and effects
 *
 * @param {CriticalHitInput} input
 * @returns {Promise<CriticalHitResult>}
 */
export async function resolveCriticalHit(input) {
  const {
    baseCriticalValue,
    defenderActor,
    aimed = false,
    aimedWhere = null,
    isDamageAccumulator = false,
    isMass = false,
    critImmune = false
  } = input;

  // ── Immunity checks ──────────────────────────────────────────
  if (isMass) {
    return buildImmuneResult('mass');
  }
  if (critImmune) {
    return buildImmuneResult('critImmune');
  }

  // ── Step 1: Roll critical level ──────────────────────────────
  // d100 without open roll, without fumble
  const critLevelRoll = await rollPlainD100();
  let critLevelRaw = critLevelRoll + baseCriticalValue;

  // Damage accumulation creatures: level halved before cap
  if (isDamageAccumulator) {
    critLevelRaw = Math.floor(critLevelRaw / 2);
  }

  // Cap at 200: excess is halved
  let critLevel = critLevelRaw;
  if (critLevel > 200) {
    critLevel = 200 + Math.floor((critLevelRaw - 200) / 2);
  }

  // ── Step 2: Defender rolls PhR (RF) ──────────────────────────
  const phBase = defenderActor.system?.characteristics?.secondaries?.resistances
    ?.physical?.final?.value ?? 0;

  const resistanceDie = defenderActor.system?.general?.diceSettings?.resistanceDie?.value
    ?? '1d100';

  const phRoll = await rollFormula(resistanceDie);
  const phTotal = phRoll + phBase;
  const phPassed = phTotal >= critLevel;
  const failureLevel = phPassed ? 0 : critLevel - phTotal;

  // ── Step 3: Location (only if failureLevel > 50) ─────────────
  let location = null;
  let locationRoll = 0;

  if (!phPassed && failureLevel > 50) {
    if (aimed && aimedWhere) {
      // Aimed attack: location is predetermined
      location = mapAimedToLocation(aimedWhere);
      locationRoll = 0;
    } else {
      locationRoll = await rollPlainD100();
      location = lookupLocation(locationRoll);
    }
  }

  // ── Step 4: Determine effects ────────────────────────────────
  const effects = determineCriticalEffects(failureLevel, location);

  return {
    resolved: true,
    immune: false,
    immuneReason: null,
    critLevelRoll,
    critLevelRaw,
    critLevel,
    phRoll,
    phBase,
    phTotal,
    phPassed,
    failureLevel,
    location,
    locationRoll,
    effects
  };
}

// ─── Helpers ──────────────────────────────────────────────────────

function buildImmuneResult(reason) {
  return {
    resolved: true,
    immune: true,
    immuneReason: reason,
    critLevelRoll: 0,
    critLevelRaw: 0,
    critLevel: 0,
    phRoll: 0,
    phBase: 0,
    phTotal: 0,
    phPassed: true,
    failureLevel: 0,
    location: null,
    locationRoll: 0,
    effects: determineCriticalEffects(0, null)
  };
}

/**
 * Roll a plain d100 (no open roll, no fumble).
 * @returns {Promise<number>}
 */
async function rollPlainD100() {
  const roll = new Roll('1d100');
  await roll.evaluate();
  return roll.total;
}

/**
 * Roll an arbitrary formula (for resistanceDie which may be custom).
 * @param {string} formula
 * @returns {Promise<number>}
 */
async function rollFormula(formula) {
  const roll = new Roll(formula);
  await roll.evaluate();
  return roll.total;
}

/**
 * Map an aimed zone ID to a location entry compatible with determineCriticalEffects.
 * @param {string} aimedWhere
 * @returns {{ zone: string, group: string, isLimb?: boolean, isVulnerable?: boolean }}
 */
function mapAimedToLocation(aimedWhere) {
  const mapping = {
    head: { zone: 'head', group: 'head', isVulnerable: true },
    eye: { zone: 'head', group: 'head', isVulnerable: true },
    neck: { zone: 'head', group: 'head', isVulnerable: true },
    heart: { zone: 'heart', group: 'torso', isVulnerable: true },
    torso: { zone: 'chest', group: 'torso' },
    abdomen: { zone: 'stomach', group: 'torso' },
    shoulder: { zone: 'shoulder', group: 'torso' },
    arm: { zone: 'leftUpperArm', group: 'leftArm', isLimb: true },
    elbow: { zone: 'leftLowerArm', group: 'leftArm', isLimb: true },
    wrist: { zone: 'leftHand', group: 'leftArm', isLimb: true },
    hand: { zone: 'leftHand', group: 'leftArm', isLimb: true },
    groin: { zone: 'stomach', group: 'torso' },
    thigh: { zone: 'leftThigh', group: 'leftLeg', isLimb: true },
    knee: { zone: 'leftCalf', group: 'leftLeg', isLimb: true },
    calf: { zone: 'leftCalf', group: 'leftLeg', isLimb: true },
    foot: { zone: 'leftFoot', group: 'leftLeg', isLimb: true }
  };
  return mapping[aimedWhere] ?? { zone: aimedWhere, group: 'torso' };
}
