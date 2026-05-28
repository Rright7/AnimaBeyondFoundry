/**
 * Open the sheet of a combat maneuver Item owned by this actor.
 */
export function openCombatManeuver(sheet, e) {
  const maneuverId = e.currentTarget.dataset.maneuverId;
  if (!maneuverId) return;

  const item = sheet.actor?.items?.get(maneuverId);
  if (!item) return ui.notifications.warn('Maniobra no encontrada.');

  item.sheet?.render(true);
}
