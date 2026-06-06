/**
 * Resolve an opposed characteristic check for a combat maneuver.
 *
 * Anima Core: `D10 + característica` (con regla del 10: sacar 10 → vuelve a
 * tirar y suma). Cada participante elige su característica entre las que
 * permite la maniobra.
 *
 * Modificadores del control para el atacante:
 *   - %daño < 100 → modificador `attackerPenaltyUnder100` (típicamente -3)
 *   - %daño >= 200 → modificador `attackerBonusOver200` (típicamente +3)
 *
 * Modificadores adicionales del defensor:
 *   - Cuadrúpedo: +3 al control si la maniobra es Derribo
 */

/**
 * @typedef {import('../ManeuverDefinition.js').ManeuverDefinition} ManeuverDefinition
 */

/**
 * @typedef {object} OpposedCheckInput
 * @property {ManeuverDefinition} maneuver
 * @property {Actor} attacker
 * @property {Actor} defender
 * @property {string} attackerStat — selected stat slug (e.g. 'strength')
 * @property {string} defenderStat
 * @property {number} damagePercent — % damage dealt by the attack (drives the modifier)
 * @property {boolean} [defenderIsQuadruped=false]
 * @property {number} [attackerExtraMod=0] — manual mod the attacker added in the UI
 * @property {number} [defenderExtraMod=0] — manual mod the defender added in the UI
 */

/**
 * @typedef {object} OpposedCheckResult
 * @property {number} attackerRoll — d10 (or higher with 10s exploding)
 * @property {number} attackerStatValue
 * @property {number} attackerDamageMod
 * @property {number} attackerExtraMod
 * @property {number} attackerTotal
 * @property {number} defenderRoll
 * @property {number} defenderStatValue
 * @property {number} defenderQuadrupedBonus
 * @property {number} defenderExtraMod
 * @property {number} defenderTotal
 * @property {number} difference — attackerTotal - defenderTotal
 * @property {boolean} attackerWins
 */

/**
 * Roll a D10 with Anima's "regla del 10": if the die shows 10, it is replaced
 * by 12 (no recursive re-rolls — the die does NOT explode).
 * Max possible: 12. Returns an object with both the displayed face and the
 * effective value, so callers can render "10→12" or just "12".
 * @returns {Promise<{face: number, value: number}>}
 */
export async function rollOpenD10() {
  const r = new Roll('1d10');
  await r.evaluate();
  const face = r.total;
  const value = face === 10 ? 12 : face;
  return { face, value };
}

/**
 * Read a characteristic's final value from an actor.
 * @param {Actor} actor
 * @param {string} stat — slug like 'strength' | 'dexterity' | 'agility'
 * @returns {number}
 */
export function getCharacteristicValue(actor, stat) {
  const v = actor?.system?.characteristics?.primaries?.[stat]?.final?.value;
  return Number(v) || 0;
}

/**
 * Resolve the opposed check end-to-end. Rolls both d10s and returns a result.
 *
 * @param {OpposedCheckInput} input
 * @returns {Promise<OpposedCheckResult>}
 */
export async function resolveOpposedCheck(input) {
  const {
    maneuver,
    attacker,
    defender,
    attackerStat,
    defenderStat,
    damagePercent,
    defenderIsQuadruped = false,
    attackerExtraMod = 0,
    defenderExtraMod = 0
  } = input;

  const attackerStatValue = getCharacteristicValue(attacker, attackerStat);
  const defenderStatValue = getCharacteristicValue(defender, defenderStat);

  const attackerDamageMod = maneuver.getOpposedCheckModifierFromDamage(damagePercent);
  const defenderQuadrupedBonus = maneuver.grantsQuadrupedBonus && defenderIsQuadruped ? 3 : 0;

  const attackerRollObj = await rollOpenD10();
  const defenderRollObj = await rollOpenD10();
  const attackerRoll = attackerRollObj.value;
  const defenderRoll = defenderRollObj.value;

  const attackerTotal =
    attackerRoll + attackerStatValue + attackerDamageMod + Number(attackerExtraMod || 0);
  const defenderTotal =
    defenderRoll + defenderStatValue + defenderQuadrupedBonus + Number(defenderExtraMod || 0);

  const difference = attackerTotal - defenderTotal;
  const attackerWins = difference > 0;

  return {
    attackerRoll,
    attackerStatValue,
    attackerDamageMod,
    attackerExtraMod: Number(attackerExtraMod || 0),
    attackerTotal,
    defenderRoll,
    defenderStatValue,
    defenderQuadrupedBonus,
    defenderExtraMod: Number(defenderExtraMod || 0),
    defenderTotal,
    difference,
    attackerWins
  };
}
