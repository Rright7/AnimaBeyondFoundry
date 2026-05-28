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
export async function ensureLinkedEffectForItem(actor, item) {
  if (!actor || !item) return null;

  // Look up existing AE by origin first.
  const existing = findEffectByItemOrigin(actor, item);
  if (existing) return existing;

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

  // Keep the item's own `active` flag and stored `effectData.disabled` in sync
  // so the sheet UI shows the effect as enabled too.
  if (typeof item.update === 'function') {
    try {
      await item.update({
        'system.active': true,
        'system.effectData.disabled': false
      });
    } catch (e) {
      // best-effort
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
