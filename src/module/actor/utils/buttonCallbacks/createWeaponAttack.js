import { AttackConfigurationDialog } from '../../../dialogs/AttackConfigurationDialog.js';
import { getSnapshotTargets } from '../getSnapshotTargets.js';

/**
 * Open AttackConfigurationDialog with the selected weapon locked.
 */
export function createWeaponAttack(sheet, e) {
  const weaponId = e.currentTarget.dataset.weaponId;
  if (!weaponId) return ui.notifications.warn('ID de arma no válido.');

  const weapon = sheet.actor?.items?.get(weaponId);
  if (!weapon) return ui.notifications.warn('Arma no encontrada.');

  const attackerToken = sheet.token ?? sheet.actor?.getActiveTokens?.()[0];
  if (!attackerToken) return ui.notifications.warn('No attacker token found.');

  const snapshotTargets = getSnapshotTargets();

  // Modo del boton: 'ranged' (Lanzar/Disparar) abre el ataque como proyectil; cualquier
  // otro (boton Atacar) = melee. El dialogo ya no tiene checkbox de proyectil.
  const mode = e.currentTarget.dataset.attackMode === 'ranged' ? 'ranged' : 'melee';

  new AttackConfigurationDialog(
    { attacker: attackerToken, weaponId, targets: snapshotTargets, mode },
    { allowed: true }
  );
}
