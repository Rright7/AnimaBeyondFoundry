/**
 * Ensure an ActiveEffect exists on `actor` linked to the given effect-type
 * `item`. If one already exists (matched by origin -> item.uuid), it is
 * returned unchanged. Otherwise a new AE is created from the item's stored
 * `system.effectData` and its id is written back to the item flag
 * `animabf.linkedEffectId`.
 *
 * This is the single source of truth used by every drop-effect entry point:
 *   - Drop on an open actor sheet (`ABFActorSheet#_onDropItem`)
 *   - Drop on a token in the canvas (`dropCanvasData` hook)
 *   - Drop on an actor in the sidebar (`ABFActorDirectory#_onDrop`)
 *   - Programmatic / macro `createItem` (`createItem` hook)
 *
 * @param {Actor} actor
 * @param {Item} item — an item of type "effect"
 * @returns {Promise<ActiveEffect|null>}
 */
// Module-level in-flight set to dedupe concurrent calls for the same item.
// Two entry points (e.g. _onDropItem manual call + the `createItem` hook)
// may fire near-simultaneously for the same drop; the AE created by the
// first call has not yet propagated to actor.effects.contents when the
// second call's findEffectByItemOrigin runs, so without this guard we end
// up creating two AEs that apply the same change twice.
const _inFlight = new Set();

export async function ensureLinkedEffectForItem(actor, item) {
  if (!actor || !item) return null;

  const flightKey = `${actor.id}:${item.id}`;

  // Cheap fast-path: already linked → nothing to do.
  const existing = findEffectByItemOrigin(actor, item);
  if (existing) return existing;

  // Lock SYNCHRONOUSLY before any await so a concurrent call within the same
  // microtask sees the flag and bails out. Set.has/add are synchronous.
  if (_inFlight.has(flightKey)) {
    // The other concurrent call will create the AE; do nothing here.
    return null;
  }
  _inFlight.add(flightKey);

  try {
    return await _createAEForItem(actor, item);
  } finally {
    _inFlight.delete(flightKey);
  }
}

async function _createAEForItem(actor, item) {

  const rawBaseData = item.system?.effectData ?? {};
  // Ignore any persisted origin and the compendium `disabled` flag: when an
  // effect is dropped onto an actor we always want it active by default so
  // its modifiers apply immediately without an extra click on the sheet.
  const { origin: _ignoredOrigin, disabled: _ignoredDisabled, ...baseData } = rawBaseData;

  const data = foundry.utils.mergeObject(
    {
      name: item.name,
      icon: item.img || 'icons/svg/aura.svg',
      origin: item.uuid
    },
    baseData,
    { inplace: false }
  );
  // Force-active regardless of source data
  data.disabled = false;

  const [created] = await actor.createEmbeddedDocuments('ActiveEffect', [data]);

  // Only run the item-side sync if something actually needs to change. The
  // AE.create above already triggered the derived-data flow; an unnecessary
  // item.update would trigger it again and double-apply additive changes.
  if (created && typeof item.update === 'function') {
    const itemActive = !!item.system?.active;
    const itemDisabled = !!item.system?.effectData?.disabled;
    if (!itemActive || itemDisabled) {
      try {
        await item.update({
          'system.active': true,
          'system.effectData.disabled': false
        });
      } catch (e) {
        // best-effort
      }
    }
  }

  if (created && typeof item.setFlag === 'function') {
    try {
      await item.setFlag('animabf', 'linkedEffectId', created.id);
    } catch (e) {
      // best-effort; the AE is created regardless
    }
  }

  return created ?? null;
}

/**
 * Find an AE on `actor` whose origin points to `item`. Strict equality first;
 * falls back to matching the trailing `.Item.<id>` segment for unlinked tokens
 * where item.uuid is prefixed with Scene/Token.
 *
 * @param {Actor} actor
 * @param {Item} item
 * @returns {ActiveEffect|null}
 */
export function findEffectByItemOrigin(actor, item) {
  if (!actor?.effects || !item) return null;

  const uuid = item.uuid ?? '';
  const tail = `.Item.${item.id ?? ''}`;

  for (const e of actor.effects.contents) {
    if (!e?.origin) continue;
    if (e.origin === uuid) return e;
    if (tail && e.origin.endsWith(tail)) return e;
  }
  return null;
}

/**
 * Remove the ActiveEffect that ensureLinkedEffectForItem created for `item`,
 * if it is still present on `actor`. Counterpart to the create path: an
 * effect Item carries its modifiers in `system.effectData`, which we
 * materialise as a *separate* AE on the actor (origin -> item.uuid). When the
 * Item is deleted Foundry cascades only the AEs *embedded in the Item*
 * (`item.effects`), NOT this externally-created one, so without an explicit
 * cleanup it lingers and keeps applying its changes forever — the symptom
 * being a "Cargando" modifier that survives toggling the maneuver off.
 *
 * Matching is by linked flag first (authoritative), then by origin as a
 * fallback for AEs created before the flag existed.
 *
 * @param {Actor} actor
 * @param {Item} item — the effect Item being deleted
 * @returns {Promise<number>} how many AEs were removed
 */
export async function removeLinkedEffectForItem(actor, item) {
  if (!actor?.effects || !item) return 0;

  const linkedId = item.getFlag?.('animabf', 'linkedEffectId') ?? null;
  const toDelete = new Set();

  // 1) Authoritative: the AE id we stored on the item when we created it.
  if (linkedId && actor.effects.get(linkedId)) {
    toDelete.add(linkedId);
  }

  // 2) Fallback: any AE whose origin still points at this item (covers AEs
  // created before linkedEffectId was written, or if the flag was lost).
  const uuid = item.uuid ?? '';
  const tail = `.Item.${item.id ?? ''}`;
  for (const e of actor.effects.contents) {
    if (!e?.origin) continue;
    if (e.origin === uuid || (tail && e.origin.endsWith(tail))) {
      toDelete.add(e.id);
    }
  }

  if (toDelete.size === 0) return 0;

  await actor.deleteEmbeddedDocuments('ActiveEffect', [...toDelete]);
  return toDelete.size;
}
