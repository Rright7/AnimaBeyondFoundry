import { AttackConfigurationDialog } from '../../../dialogs/AttackConfigurationDialog.js';
import { getSnapshotTargets } from '../getSnapshotTargets.js';
import { getAimedPenalty } from '../../../combat/criticalTables.js';
import { toggleStatusManeuver } from '../toggleStatusManeuver.js';
import { runSubGrappleManeuver } from '../../../combat/maneuvers/subGrappleRunner.js';
import {
  composeAimedPenalty,
  composeManeuverPenalty
} from '../../../equipment/qualities/composeWeaponEffects.js';

/**
 * Launch a combat maneuver by opening AttackConfigurationDialog with the
 * maneuver penalty pre-applied. For aimed maneuvers (Inutilizar,
 * Inconsciencia) the dialog also receives aimed=true and aimedWhere so the
 * critical resolution knows the zone, and the penalty is computed from the
 * aimed zone (Tabla 45) instead of from the static attackPenalty.
 *
 * For Inconsciencia: the weapon's critic type is inspected; if it is not
 * impact-type, the extra penalty declared in the ManeuverDefinition is
 * added on top (and the user is warned).
 *
 * For status-toggle maneuvers (e.g. Cargar) we short-circuit before the
 * attack dialog and just toggle the associated Active Effect on the actor.
 *
 * Precise weapons (melee): the aimed-attack penalty and the Engatillar
 * penalty are halved automatically when the equipped weapon is Precise
 * and not ranged.
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

  // Status-toggle maneuvers (e.g. Cargar): not an attack — toggles a named
  // Active Effect on the actor and posts a short chat note. Does not
  // require selected targets nor an attacker token in the scene.
  if (def.isStatusToggle) {
    return toggleStatusManeuver(sheet.actor, def, item);
  }

  // Sub-grapple maneuvers (Aplastar): skip the attack dialog and go
  // straight to the opposed-check phase. Validation lives in the helper.
  if (def.noAttackPhase) {
    return runSubGrappleManeuver(sheet.actor, def, item);
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

  // Compute the attack penalty. For aimed maneuvers, prefer the Tabla 45
  // penalty for the chosen zone. Otherwise fall back to the static penalty.
  let maneuverPenalty;
  if (aimed && aimedZone) {
    maneuverPenalty = getAimedPenalty(aimedZone);
  } else {
    maneuverPenalty = def.getAttackPenalty(equipped);
  }

  // Inconsciencia: if a bludgeoning weapon is required and the equipped one
  // is not, add the declared extra penalty and warn the user.
  if (def.requiresImpactCritic && equipped) {
    const primaryCritic = equipped.system?.critic?.primary?.value;
    if (primaryCritic && primaryCritic !== 'impact') {
      const extra = Number(def.nonImpactCriticExtraPenalty ?? 0);
      if (extra !== 0) {
        maneuverPenalty += extra;
        ui.notifications.info(
          `${item.name} con arma no-contundente: ${extra} adicional (total ${maneuverPenalty}).`
        );
      }
    }
  }

  // Apply weapon-quality modifiers to the maneuver penalty.
  //
  // Two distinct paths, never both: one would be double-counting since
  // Precisa (and any future quality that halves penalties) lives in both
  // hooks for two distinct call sites. Here we pick ONE based on whether
  // this maneuver is aimed or not.
  //
  // RAW alignment:
  //  - aimed maneuvers (Inutilizar, Inconsciencia, ...) → composeAimedPenalty
  //    runs the modifyAimedPenalty hooks (Precisa halves Tabla 45 penalty).
  //  - non-aimed maneuvers (Engatillar) → composeManeuverPenalty runs the
  //    modifyManeuverPenalty hooks (Precisa halves only when slug=engatillar).
  //
  // Other future hooks will plug in here with no code change.
  if (equipped) {
    const before = maneuverPenalty;
    const composed = aimed
      ? composeAimedPenalty(maneuverPenalty, {
          weapon: equipped,
          actor: sheet.actor,
          maneuverSlug: slug,
          aimedZone
        })
      : composeManeuverPenalty(maneuverPenalty, {
          weapon: equipped,
          actor: sheet.actor,
          maneuverSlug: slug
        });
    if (composed.appliedBy.length) {
      ui.notifications.info(
        `${item.name}: cualidades [${composed.appliedBy.join(', ')}] ` +
          `modifican el penalizador (${before} → ${composed.penalty}).`
      );
      maneuverPenalty = composed.penalty;
    }
  }

  // RAW for some sub-maneuvers (Aplastar) requires that the parent Presa
  // was performed without weapons. Capture this here so the post-combat
  // resolver can persist it as a relational flag on the actors.
  const wasUnarmed = !equipped || !!equipped.system?.unarmed?.value;

  new AttackConfigurationDialog(
    {
      attacker: attackerToken,
      weaponId: equipped?._id,
      targets: snapshotTargets,
      maneuverSlug: slug,
      maneuverItemName: item.name,
      maneuverPenalty,
      maneuverWasUnarmed: wasUnarmed,
      aimed,
      aimedZone
    },
    { allowed: true }
  );
}
