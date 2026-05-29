/**
 * Toggle the Active Effect declared by a status-toggle maneuver on the
 * given actor.
 *
 *   - If the actor does NOT have an effect Item named `def.statusEffectName`,
 *     copy it from the system's effects compendium and add it as an Item to
 *     the actor (matching how the rest of the AE engine handles toggles).
 *   - If the actor already has it, delete it.
 *
 * Posts a short chat message announcing the state change so the table and
 * the GM can see it.
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

  const speaker = ChatMessage.getSpeaker({ actor });
  await ChatMessage.create({
    speaker,
    content: `<p><strong>${actor.name}</strong> está ahora <em>${effectName}</em>.</p>`
  });
}
