/**
 * Delete a combat maneuver Item owned by this actor, with confirmation.
 */
export async function deleteCombatManeuver(sheet, e) {
  const maneuverId = e.currentTarget.dataset.maneuverId;
  if (!maneuverId) return;

  const item = sheet.actor?.items?.get(maneuverId);
  if (!item) return;

  const DialogV2 = foundry.applications?.api?.DialogV2;
  const title = game.i18n.localize('anima.ui.combat.combatManeuvers.delete');
  const content = `<p>${game.i18n.format('anima.ui.combat.combatManeuvers.deleteConfirm', { name: item.name })}</p>`;

  let confirmed = false;
  if (DialogV2) {
    confirmed = await DialogV2.confirm({
      window: { title },
      content,
      rejectClose: false,
      modal: true
    }).catch(() => false);
  } else {
    confirmed = await Dialog.confirm({ title, content, defaultYes: false });
  }

  if (!confirmed) return;

  await item.delete();
}
