import { AttackConfigurationDialog } from '../../../dialogs/AttackConfigurationDialog.js';
import { getSnapshotTargets } from '../getSnapshotTargets.js';

/**
 * Launch a combat maneuver by opening AttackConfigurationDialog with the
 * maneuver penalty pre-applied. The slug is propagated through the attack
 * chat message and into the combat result so that the chat hook can auto-post
 * the opposed-check card once damage is resolved.
 *
 * Validation: maneuver Item + slug + registry definition; attacker token on
 * scene; at least one target selected. Weapon restrictions are NOT enforced
 * (table decision).
 */
export function executeCombatManeuver(sheet, e) {
  const maneuverId = e.currentTarget.dataset.maneuverId;
  if (!maneuverId) return;

  const item = sheet.actor?.items?.get(maneuverId);
  if (!item) return ui.notifications.warn('Maniobra no encontrada.');

  const slug = item.system?.slug?.value;
  if (!slug) {
    return ui.notifications.warn(
      `La maniobra "${item.name}" no tiene slug; no se puede ejecutar.`
    );
  }

  const def = game.animabf?.maneuvers?.get?.(slug);
  if (!def) {
    return ui.notifications.warn(
      `Slug "${slug}" no encontrado en el registry de maniobras.`
    );
  }

  const attackerToken = sheet.token ?? sheet.actor?.getActiveTokens?.()[0];
  if (!attackerToken) {
    return ui.notifications.warn('No hay token del atacante en la escena.');
  }

  const snapshotTargets = getSnapshotTargets();
  if (!snapshotTargets || snapshotTargets.length === 0) {
    return ui.notifications.warn(
      'Selecciona un objetivo antes de ejecutar una maniobra.'
    );
  }

  const weapons = sheet.actor.system?.combat?.weapons ?? [];
  const equipped = weapons.find(w => w.system?.equipped?.value);
  const maneuverPenalty = def.getAttackPenalty(equipped);

  new AttackConfigurationDialog(
    {
      attacker: attackerToken,
      weaponId: equipped?._id,
      targets: snapshotTargets,
      maneuverSlug: slug,
      maneuverItemName: item.name,
      maneuverPenalty
    },
    { allowed: true }
  );
}
