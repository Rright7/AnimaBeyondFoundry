/**
 * Apply a maneuver effect (an AE from the effects compendium) to the
 * attacker or defender of a resolved maneuver. Invoked from the
 * `maneuver-result.hbs` chat card button.
 */

export const action = 'animabf-apply-maneuver-effect';

export default async function applyManeuverEffectActionHandler(message, _html, ds) {
  try {
    if (!game.user.isGM) {
      ui.notifications?.warn('Solo el GM puede aplicar efectos de maniobras.');
      return;
    }

    const msg = game.messages.get(ds.messageId ?? message.id);
    if (!msg) return;

    const animabf = msg.flags?.animabf ?? {};
    if (animabf.kind !== 'maneuverResult') return;

    const effectSlug = ds.effectSlug ?? ds['effect-slug'];
    const target = ds.target;
    if (!effectSlug || !target) return;

    const targetActorId =
      target === 'attacker' ? animabf.attackerId : animabf.defenderId;
    const targetActor = game.actors?.get?.(targetActorId);
    if (!targetActor) {
      ui.notifications?.warn(`Actor objetivo no encontrado: ${targetActorId}`);
      return;
    }

    // Find the effect item in the compendium by name.
    const pack = game.packs.get('animabf.effects');
    if (!pack) {
      ui.notifications?.warn('Compendio de efectos no encontrado.');
      return;
    }
    const docs = await pack.getDocuments();
    const sourceItem = docs.find(d => d.name === effectSlug);
    if (!sourceItem) {
      ui.notifications?.warn(`Efecto "${effectSlug}" no encontrado en el compendio.`);
      return;
    }

    // Drop it onto the target actor (the createItem hook will link the AE).
    const itemData = sourceItem.toObject();
    delete itemData._id;
    delete itemData._key;
    delete itemData.folder;
    await targetActor.createEmbeddedDocuments('Item', [itemData]);

    ui.notifications?.info(`"${effectSlug}" aplicado a ${targetActor.name}.`);
  } catch (err) {
    console.error('[ABF] applyManeuverEffect failed:', err);
    ui.notifications?.error('Error al aplicar el efecto de maniobra.');
  }
}
