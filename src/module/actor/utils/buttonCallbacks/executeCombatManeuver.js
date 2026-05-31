import { AttackConfigurationDialog } from '../../../dialogs/AttackConfigurationDialog.js';
import { getSnapshotTargets } from '../getSnapshotTargets.js';
import { toggleStatusManeuver } from '../toggleStatusManeuver.js';
import { runSubGrappleManeuver } from '../../../combat/maneuvers/subGrappleRunner.js';

/**
 * Launch a combat maneuver by opening AttackConfigurationDialog with the
 * maneuver context (slug, aimed, aimedZone). For aimed maneuvers (Inutilizar,
 * Inconsciencia) the dialog receives aimed=true and aimedWhere so the critical
 * resolution knows the zone.
 *
 * The weapon-DEPENDENT penalty (aimed/base penalty, weapon qualities like
 * Precisa, and the non-bludgeoning -40) is NOT computed here: it depends on the
 * weapon the player SELECTS in the dialog (which may differ from the first
 * equipped one when several are equipped). AttackConfigurationDialog computes it
 * at roll time from the selected weapon via resolveManeuverAttackPenalty.
 *
 * For status-toggle maneuvers (e.g. Cargar) we short-circuit before the
 * attack dialog and just toggle the associated Active Effect on the actor.
 *
 * Validation: maneuver Item + slug + registry definition; attacker token on
 * scene; at least one target selected. Weapon restrictions are NOT enforced
 * (table decision).
 */
export function executeCombatManeuver(sheet, e) {
  const ds = e.currentTarget.dataset;

  // The maneuver may come from a CUSTOM embedded Item (data-maneuver-id) or
  // from a CANONICAL registry maneuver rendered straight in the tab
  // (data-maneuver-slug, no embedded Item). Resolve both shapes.
  const item = ds.maneuverId ? sheet.actor?.items?.get(ds.maneuverId) : null;
  if (ds.maneuverId && !item) return ui.notifications.warn('Maniobra no encontrada.');

  const slug = item ? item.system?.slug?.value : ds.maneuverSlug;
  if (!slug) {
    return ui.notifications.warn('La maniobra no tiene slug; no se puede ejecutar.');
  }

  const def = game.animabf?.maneuvers?.get?.(slug);
  if (!def) {
    return ui.notifications.warn(
      `Slug "${slug}" no encontrado en el registry de maniobras.`
    );
  }

  // Display name + a minimal item-like object so the runners that expect an
  // Item (toggleStatusManeuver / runSubGrappleManeuver — they read .name and
  // .system.slug.value) also work for canonical maneuvers with no embedded Item.
  const name = item?.name ?? game.i18n?.localize?.(def.nameKey) ?? slug;
  const maneuver = item ?? { name, system: { slug: { value: slug } } };

  // Status-toggle maneuvers (e.g. Cargar): not an attack — toggles a named
  // Active Effect on the actor and posts a short chat note. Does not
  // require selected targets nor an attacker token in the scene.
  if (def.isStatusToggle) {
    return toggleStatusManeuver(sheet.actor, def, maneuver);
  }

  // Sub-grapple maneuvers (Aplastar): skip the attack dialog and go
  // straight to the opposed-check phase. Validation lives in the helper.
  if (def.noAttackPhase) {
    return runSubGrappleManeuver(sheet.actor, def, maneuver);
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

  // Resolve aimed zone: either fixed by the definition (Inconsciencia → head)
  // or chosen by the player via the card's <select>.
  let aimedZone = '';
  let aimed = false;
  if (def.aimedZone) {
    aimedZone = def.aimedZone;
    aimed = true;
  } else if (Array.isArray(def.aimedZoneOptions) && def.aimedZoneOptions.length > 0) {
    // Read from the <select> the user picked on the card.
    const card = e.currentTarget.closest('.combat-maneuver-card');
    const select = card?.querySelector('.combat-maneuver-card__zone-select');
    aimedZone = select?.value || def.aimedZoneOptions[0];
    aimed = true;
  }

  // Open the attack dialog with the maneuver context. The weapon-dependent
  // penalty (aimed/base + qualities like Precisa + non-bludgeoning -40) is
  // computed INSIDE the dialog from the SELECTED weapon via
  // resolveManeuverAttackPenalty — not from `equipped`. `weaponId` below is only
  // the dropdown's default selection. `maneuverWasUnarmed` is likewise recomputed
  // by the dialog from the selected weapon.
  new AttackConfigurationDialog(
    {
      attacker: attackerToken,
      weaponId: equipped?._id,
      targets: snapshotTargets,
      maneuverSlug: slug,
      maneuverItemName: name,
      aimed,
      aimedZone
    },
    { allowed: true }
  );
}
