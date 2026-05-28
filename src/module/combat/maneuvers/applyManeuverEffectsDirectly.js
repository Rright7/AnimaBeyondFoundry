/**
 * Family A — non-opposed-check maneuvers.
 *
 * When a maneuver's ManeuverDefinition has noOpposedCheck = true, there is
 * no D10 vs D10 phase: if the attack landed and damage% cleared the threshold,
 * the maneuver's effects are applied directly to the relevant actors and a
 * compact info card is posted in chat.
 *
 * Used by Engatillar (Amenazado → defender) and, in the future, by other
 * Family-A maneuvers. Inutilizar and Inconsciencia do declare an effect via
 * resolveEffects but their full mechanic also depends on the critical
 * resolution; the AE here is applied as the base outcome and the critical
 * hook may layer additional state (Inconsciente, etc.) on top.
 */

const SYSTEM_ID = 'animabf';

async function applyEffectByName(actor, effectName) {
  const pack = game.packs.get(`${SYSTEM_ID}.effects`);
  if (!pack) return false;
  const docs = await pack.getDocuments();
  const source = docs.find(d => d.name === effectName);
  if (!source) {
    ui.notifications?.warn(
      `Efecto "${effectName}" no encontrado en el compendio.`
    );
    return false;
  }
  const data = source.toObject();
  delete data._id;
  delete data._key;
  delete data.folder;
  await actor.createEmbeddedDocuments('Item', [data]);
  return true;
}

/**
 * @param {object} input
 * @param {import('./ManeuverDefinition.js').ManeuverDefinition} input.maneuver
 * @param {string} input.maneuverItemName
 * @param {Actor} input.attackerActor
 * @param {Actor} input.defenderActor
 * @param {number} input.damagePercent
 */
export async function applyManeuverEffectsDirectly({
  maneuver,
  maneuverItemName,
  attackerActor,
  defenderActor,
  damagePercent
}) {
  if (!game.user.isGM) return;
  if (!maneuver || !attackerActor || !defenderActor) return;

  // resolveEffects expects a ManeuverResolution-shaped object; treat the
  // landed hit as automatic success since there is no opposed check.
  const effects = maneuver.resolveEffects({
    attackHit: true,
    damagePercent,
    opposedSuccess: true,
    opposedDifference: 0,
    attacker: attackerActor,
    defender: defenderActor
  });

  const applied = [];
  for (const ef of effects) {
    if (!ef.effectSlug) continue;
    const target = ef.target === 'attacker' ? attackerActor : defenderActor;
    if (!target) continue;
    const ok = await applyEffectByName(target, ef.effectSlug);
    if (ok) applied.push(`<strong>${ef.effectSlug}</strong> → ${target.name}`);
  }

  const appliedText = applied.length
    ? `Aplicado: ${applied.join(' · ')}`
    : 'Sin efectos aplicables.';

  const flavor =
    `<strong>${attackerActor.name}</strong> usa <strong>${maneuverItemName}</strong> ` +
    `contra <strong>${defenderActor.name}</strong> (daño ${damagePercent}%)`;

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: attackerActor }),
    flavor,
    content: `<div class="maneuver-direct-result"><i class="fas fa-check"></i> ${appliedText}</div>`,
    flags: {
      [SYSTEM_ID]: {
        kind: 'maneuverDirectResult',
        maneuverSlug: maneuver.slug,
        maneuverItemName,
        attackerId: attackerActor.id,
        defenderId: defenderActor.id,
        damagePercent
      }
    }
  });
}
