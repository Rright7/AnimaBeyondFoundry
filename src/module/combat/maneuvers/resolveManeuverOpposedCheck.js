/**
 * When both attacker and defender have rolled, compute the outcome and apply
 * the maneuver's Active Effects via the effects compendium.
 *
 * Called by the chat hook when flags.attackerRoll and flags.defenderRoll are
 * both populated and flags.resolution is still null. Only the GM should run
 * this (we guard inside).
 */

const SYSTEM_ID = 'animabf';

async function applyEffectToActor(actor, effectName) {
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
 * @param {ChatMessage} msg
 */
export async function resolveManeuverOpposedCheck(msg) {
  if (!game.user.isGM) return;
  if (!msg) return;

  const flags = msg.getFlag(SYSTEM_ID, undefined) ?? msg.flags?.[SYSTEM_ID];
  if (!flags) return;
  if (flags.kind !== 'maneuverOpposedCheck') return;
  if (flags.resolution) return;
  if (!flags.attackerRoll || !flags.defenderRoll) return;

  const def = game.animabf?.maneuvers?.get?.(flags.maneuverSlug);
  if (!def) {
    ui.notifications?.warn(
      `Maniobra "${flags.maneuverSlug}" no encontrada en el registry.`
    );
    return;
  }

  // Resolve via the stored token refs first (token uuid or token id) so
  // unlinked tokens map to their own on-map token actor instead of the base
  // sidebar actor. Falls back to the actor id for legacy data.
  const { resolveActorFromRef } = await import(
    '../../actor/utils/resolveActorForRoll.js'
  );
  const attackerActor =
    resolveActorFromRef(flags.attackerTokenUuid) ??
    resolveActorFromRef(flags.attackerId);
  const defenderActor =
    resolveActorFromRef(flags.defenderTokenUuid) ??
    resolveActorFromRef(flags.defenderId);

  const difference = flags.attackerRoll.total - flags.defenderRoll.total;
  const attackerWins = difference > 0;

  const effects = def.resolveEffects({
    attackHit: true,
    damagePercent: flags.damagePercent,
    opposedSuccess: attackerWins,
    opposedDifference: Math.abs(difference),
    attacker: attackerActor,
    defender: defenderActor
  });

  const appliedNames = [];
  for (const ef of effects) {
    if (!ef.effectSlug) continue;
    const target = ef.target === 'attacker' ? attackerActor : defenderActor;
    if (!target) continue;
    const ok = await applyEffectToActor(target, ef.effectSlug);
    if (ok) appliedNames.push(`<strong>${ef.effectSlug}</strong> → ${target.name}`);
  }

  // Relational state for Presa: when the attacker wins, both actors get
  // bidirectional flags pointing at each other, plus the "was unarmed"
  // detail required by sub-Presa maneuvers like Aplastar.
  //
  // Detection of unarmed: an actor "fought unarmed" if the equipped weapon
  // is missing or its system marks it as unarmed=true. This is conservative
  // enough — false positives are limited to e.g. someone presando con
  // garras innatas que no estén modeladas con allowsPresa, which is
  // acceptable: in those cases Aplastar makes RAW sense anyway.
  if (
    flags.maneuverSlug === 'presa' &&
    attackerWins &&
    attackerActor &&
    defenderActor
  ) {
    try {
      const equipped = attackerActor.system?.combat?.weapons?.find(
        w => w?.system?.equipped?.value
      );
      const wasUnarmed =
        flags.maneuverWasUnarmed ?? (!equipped || !!equipped?.system?.isUnarmed?.value);

      // Build stable token refs (token uuid preferred) for both actors. Storing
      // a token ref — not a bare actor id — is what makes the grapple point at
      // the correct on-map token for UNLINKED tokens, where two tokens of the
      // same base actor share an actor id.
      const { buildActorRef } = await import(
        '../../actor/utils/resolveActorForRoll.js'
      );
      const attackerRef = buildActorRef({
        actor: attackerActor,
        tokenUuid: flags.attackerTokenUuid
      });
      const defenderRef = buildActorRef({
        actor: defenderActor,
        tokenUuid: flags.defenderTokenUuid
      });

      // Relational pointers between the two actors (token refs).
      await attackerActor.setFlag(SYSTEM_ID, 'grappling', defenderRef);
      await defenderActor.setFlag(SYSTEM_ID, 'grappledBy', attackerRef);

      // Relational sources (per-defender): "was unarmed" belongs to THIS
      // attacker->defender pairing, not to the attacker globally. Record it on
      // the attacker's "Apresando" effect item under system.sources, keyed by
      // the defender's token ref (upsert), so two attackers / two grapples
      // never clobber each other. The key matches what buildGrappleOptions
      // derives for the defender, so the lookup is consistent.
      const apresando = attackerActor.items?.find(
        i => i.type === 'effect' && i.name === 'Apresando'
      );
      if (apresando) {
        try {
          const { upsertGrappleSource } = await import('./grappleSources.js');
          const next = upsertGrappleSource(
            apresando.system?.sources,
            defenderRef,
            wasUnarmed
          );
          await apresando.update({ 'system.sources': next });
        } catch (e) {
          console.warn('[ABF] failed to write grapple sources:', e);
        }
      }

      // `grappleWasUnarmed` flag: single-target fallback. Written to the
      // resolved value so it never carries a stale value from a previous grapple.
      await attackerActor.setFlag(SYSTEM_ID, 'grappleWasUnarmed', !!wasUnarmed);
    } catch (err) {
      console.warn('[ABF] failed to set grapple relational flags:', err);
    }
  }

  const effectsAppliedText = appliedNames.length
    ? `Aplicado: ${appliedNames.join(' · ')}`
    : '';

  const winnerText = attackerWins
    ? `<strong>${attackerActor?.name ?? 'Atacante'} gana por ${Math.abs(difference)}</strong>`
    : `<strong>${defenderActor?.name ?? 'Defensor'} resiste</strong>`;

  const resolution = {
    attackerWins,
    difference: Math.abs(difference),
    text: effectsAppliedText ? `${winnerText} · ${effectsAppliedText}` : winnerText
  };

  await msg.setFlag(SYSTEM_ID, 'resolution', resolution);

  // Update outcome classes on roll cells (win/loss color)
  await msg.update({
    [`flags.${SYSTEM_ID}.attackerRoll.outcomeClass`]: attackerWins
      ? 'maneuver-opposed-check__total--win'
      : 'maneuver-opposed-check__total--loss',
    [`flags.${SYSTEM_ID}.defenderRoll.outcomeClass`]: attackerWins
      ? 'maneuver-opposed-check__total--loss'
      : 'maneuver-opposed-check__total--win'
  });
}
