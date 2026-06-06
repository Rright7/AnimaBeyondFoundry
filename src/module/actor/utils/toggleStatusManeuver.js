/**
 * Toggle the Active Effect declared by a status-toggle maneuver on the
 * given actor.
 *
 *   - If the actor does NOT have an effect Item named `def.statusEffectName`,
 *     copy it from the system's effects compendium and add it as an Item to
 *     the actor (matching how the rest of the AE engine handles toggles).
 *   - If the actor already has it, delete it.
 *
 * The system's global `createItem` hook (registered in animabf.js) takes
 * care of linking the AE via ensureLinkedEffectForItem automatically, so
 * we do NOT call the helper here — doing so would create a duplicate AE.
 *
 * Used by Cargar; will be reused by future status maneuvers (e.g. Atacar a
 * la ofensiva, A la defensiva).
 */
export async function toggleStatusManeuver(actor, def, maneuverItem) {
  if (!actor || !def?.isStatusToggle || !def?.statusEffectName) {
    ui.notifications?.warn('toggleStatusManeuver: argumentos inválidos.');
    return;
  }

  const effectName = String(def.statusEffectName);

  // Look for an existing effect Item with the same name already on the actor.
  const existing = actor.items?.find(
    i => i.type === 'effect' && i.name === effectName
  );

  if (existing) {
    await existing.delete();
    // Some status maneuvers also flip a persistent flag in system data so
    // a prepareActor derivedFn can react (e.g. Montado, which adjusts
    // attack/block/dodge by reading the ride skill).
    await maybeUpdatePersistentFlag(actor, def, false);
    const speaker = ChatMessage.getSpeaker({ actor });
    await ChatMessage.create({
      speaker,
      content: `<p><strong>${actor.name}</strong> deja de estar <em>${effectName}</em>.</p>`
    });
    return;
  }

  // Fetch the source effect Item from the system effects compendium.
  const pack = game.packs?.get(`${game.animabf.id}.effects`);
  if (!pack) {
    return ui.notifications?.warn('Compendio de efectos no encontrado.');
  }

  // Compendium documents are loaded lazily — getDocuments() returns full Items
  // with all of their data.
  const docs = await pack.getDocuments();
  const source = docs.find(d => d.name === effectName);
  if (!source) {
    return ui.notifications?.warn(
      `Efecto "${effectName}" no encontrado en el compendio.`
    );
  }

  // Clone its data and add it to the actor.
  const data = source.toObject();
  // Make sure the new effect is active immediately — the compendium copy is
  // typically stored as disabled so it doesn't auto-apply on import.
  if (data.system?.effectData) {
    data.system.effectData.disabled = false;
  }
  data.system.active = true;

  await actor.createEmbeddedDocuments('Item', [data]);

  await maybeUpdatePersistentFlag(actor, def, true);

  const speaker = ChatMessage.getSpeaker({ actor });
  await ChatMessage.create({
    speaker,
    content: `<p><strong>${actor.name}</strong> está ahora <em>${effectName}</em>.</p>`
  });
}

/**
 * Flips a persistent boolean flag in `actor.system` for status maneuvers
 * whose effects can't be expressed as static AE changes (e.g. Montado,
 * which derives modifiers from the ride skill value). The mapping from
 * slug → flag path lives here, narrow on purpose: when a new conditional
 * status arrives, declare it.
 */
async function maybeUpdatePersistentFlag(actor, def, value) {
  const slug = def?.slug;
  const path = SLUG_TO_FLAG_PATH[slug];
  if (!path) return;
  try {
    await actor.update({ [path]: !!value });
  } catch (err) {
    console.warn(
      `[ABF] toggleStatusManeuver: failed to update ${path}:`,
      err
    );
  }
}

const SLUG_TO_FLAG_PATH = {
  mounted: 'system.combat.mounted.value'
};
