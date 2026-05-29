/**
 * Post a chat message containing the opposed-check card for a combat maneuver.
 *
 * Initial flag state (under flags[animabf.id]):
 *   {
 *     kind: 'maneuverOpposedCheck',
 *     maneuverSlug, maneuverItemName, maneuverIcon,
 *     attackerId, attackerName, attackerTokenUuid,
 *     defenderId, defenderName, defenderTokenUuid,
 *     damagePercent: 100,
 *     attackerRoll: null,  // filled when attacker rolls
 *     defenderRoll: null,  // filled when defender rolls
 *     resolution: null     // filled automatically when both rolls present
 *   }
 *
 * The chat template (maneuver-opposed-check.hbs) renders the 3 states based on
 * which sub-fields are populated.
 */

const SYSTEM_ID = 'animabf';

/**
 * @param {object} input
 * @param {string} input.maneuverSlug
 * @param {string} input.maneuverItemName
 * @param {string} [input.maneuverIcon]
 * @param {Actor} input.attackerActor
 * @param {Actor} input.defenderActor
 * @param {string} [input.attackerTokenUuid]
 * @param {string} [input.defenderTokenUuid]
 * @returns {Promise<ChatMessage|null>}
 */
export async function postManeuverOpposedCheck({
  maneuverSlug,
  maneuverItemName,
  maneuverIcon,
  attackerActor,
  defenderActor,
  attackerTokenUuid = null,
  defenderTokenUuid = null,
  damagePercent = 100,
  // Persisted so post-resolution hooks can decide e.g. whether the
  // resulting Presa allows Aplastar (RAW: solo si fue sin armas).
  maneuverWasUnarmed = false
}) {
  if (!attackerActor || !defenderActor) {
    ui.notifications?.error('postManeuverOpposedCheck: actores faltan.');
    return null;
  }

  const flagsData = {
    kind: 'maneuverOpposedCheck',
    maneuverSlug,
    maneuverItemName,
    maneuverIcon: maneuverIcon ?? 'icons/svg/sword.svg',
    attackerId: attackerActor.id,
    attackerName: attackerActor.name,
    attackerTokenUuid,
    defenderId: defenderActor.id,
    defenderName: defenderActor.name,
    defenderTokenUuid,
    defenderIsQuadruped: false,
    damagePercent: Number(damagePercent) || 100,
    maneuverWasUnarmed: !!maneuverWasUnarmed,
    attackerRoll: null,
    defenderRoll: null,
    resolution: null
  };

  const flavor = `<strong>${attackerActor.name}</strong> usa <strong>${maneuverItemName}</strong> contra <strong>${defenderActor.name}</strong>`;

  return ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: attackerActor }),
    flavor,
    content: '<!-- maneuver opposed check card (rendered via flags) -->',
    flags: { [SYSTEM_ID]: flagsData }
  });
}
