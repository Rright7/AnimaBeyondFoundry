/**
 * Helpers for reading semantic properties out of a weapon's free-text
 * `system.special.value` field. The original system never modeled these
 * as structured flags, so we match by case-insensitive substring against
 * the localized keywords used by tables in es / en / fr.
 *
 * Keep the keyword lists narrow on purpose: false-positives here turn
 * into silently-applied combat modifiers.
 */

const PRECISE_KEYWORDS = [
  // es
  'precisa',
  // en
  'precise',
  // fr
  'précise',
  'precise' // (en is already there, but keep clarity)
];

/**
 * @param {Item|object|undefined|null} weapon
 * @returns {boolean} true when the weapon has the "Precise" property AND
 *   is melee (RAW: the benefit explicitly does NOT apply to thrown /
 *   projectile attacks).
 */
export function isPreciseMelee(weapon) {
  if (!weapon) return false;
  const ranged = !!weapon.system?.isRanged?.value;
  if (ranged) return false;

  const special = String(weapon.system?.special?.value ?? '').toLowerCase();
  if (!special) return false;

  // Match as a whole word so "imprecisa" or similar don't trigger.
  // Special is usually a comma-separated list; we accept any token whose
  // lowercased value equals one of the keywords.
  const tokens = special.split(/[\s,;]+/).filter(Boolean);
  return tokens.some(t => PRECISE_KEYWORDS.includes(t));
}

/**
 * Halve a penalty (negative number) when the weapon is Precise+melee.
 * Truncates toward zero so -50 → -25, -30 → -15, -10 → -5.
 *
 * @param {number} penalty — original penalty (typically negative)
 * @param {Item|object} weapon
 * @returns {{ penalty: number, applied: boolean }}
 */
export function applyPreciseDiscount(penalty, weapon) {
  if (!isPreciseMelee(weapon)) return { penalty, applied: false };
  const halved = Math.trunc(Number(penalty || 0) / 2);
  return { penalty: halved, applied: true };
}
