/**
 * Open the sheet of a combat maneuver.
 *
 * - CUSTOM maneuver (data-maneuver-id): open the embedded Item's own sheet.
 * - CANONICAL maneuver (data-maneuver-slug, no embedded Item): open the
 *   matching entry in the `combat-maneuvers` compendium so its full
 *   description is visible (read-only catalog entry).
 */
export async function openCombatManeuver(sheet, e) {
  const ds = e.currentTarget.dataset;

  if (ds.maneuverId) {
    const item = sheet.actor?.items?.get(ds.maneuverId);
    if (!item) return ui.notifications.warn('Maniobra no encontrada.');
    return item.sheet?.render(true);
  }

  const slug = ds.maneuverSlug;
  if (!slug) return;

  const pack =
    game.packs?.get?.('animabf.combat-maneuvers') ??
    game.packs?.find?.(p => p?.metadata?.name === 'combat-maneuvers');
  if (!pack) {
    return ui.notifications.info(`Maniobra "${slug}": no hay compendio para abrir.`);
  }

  const docs = await pack.getDocuments();
  const doc = docs.find(d => d?.system?.slug?.value === slug);
  if (!doc) {
    return ui.notifications.info(
      `No se encontró "${slug}" en el compendio de maniobras.`
    );
  }

  return doc.sheet?.render(true);
}
