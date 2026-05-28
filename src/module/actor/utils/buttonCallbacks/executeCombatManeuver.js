import { getSnapshotTargets } from '../getSnapshotTargets.js';
import { postManeuverOpposedCheck } from '../../../combat/maneuvers/postManeuverOpposedCheck.js';

/**
 * Launch a combat maneuver: post the opposed-check chat card directly.
 *
 * Validation:
 *  - Maneuver Item + slug + registry definition must resolve.
 *  - Attacker token must exist on the scene.
 *  - At least one target must be selected.
 *  - Weapon restrictions are NOT enforced (table decision).
 *
 * Note: this is the "social" flow — no AttackConfigurationDialog. The attack
 * roll with penalty and damage is rolled separately by the player; the GM
 * adjusts %damage on the opposed-check card if needed (defaults to 100%).
 * This keeps the integration surface minimal: the combat flow is untouched.
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

  const firstTarget = snapshotTargets[0];
  const defenderToken = canvas.tokens?.get?.(firstTarget.tokenId)
    ?? canvas.tokens?.placeables?.find?.(t => t.document?.uuid === firstTarget.tokenUuid);
  const defenderActor = defenderToken?.actor
    ?? game.actors?.get?.(firstTarget.actorId);

  if (!defenderActor) {
    return ui.notifications.warn('No se pudo resolver el defensor.');
  }

  postManeuverOpposedCheck({
    maneuverSlug: slug,
    maneuverItemName: item.name,
    maneuverIcon: item.img,
    attackerActor: sheet.actor,
    defenderActor,
    attackerTokenUuid: attackerToken?.document?.uuid ?? null,
    defenderTokenUuid: defenderToken?.document?.uuid ?? null
  });
}
