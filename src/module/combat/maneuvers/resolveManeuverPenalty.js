import { getAimedPenalty } from '../criticalTables.js';
import {
  composeAimedPenalty,
  composeManeuverPenalty
} from '../../equipment/qualities/composeWeaponEffects.js';

/**
 * Resolve the attack penalty of a combat maneuver against a SPECIFIC weapon —
 * the one selected in the attack dialog at roll time, NOT the first weapon with
 * the "equipped" checkbox on the sheet (ambiguous when several are equipped).
 *
 * Order (RAW):
 *   1. base: aimed → Tabla 45 (`getAimedPenalty(zone)`); else `def.getAttackPenalty(weapon)`
 *      (weapon size can matter).
 *   2. weapon qualities (e.g. Precisa) via `composeAimedPenalty` / `composeManeuverPenalty`
 *      — Precisa halves ONLY this aimed/base penalty.
 *   3. `requiresImpactCritic` extra (e.g. Inconsciencia −40 for a non-impact weapon),
 *      added AFTER the qualities so a quality never halves it.
 *
 * Pure: no UI side effects. Returns the breakdown so the caller can surface it
 * in the chat.
 *
 * @param {object} params
 * @param {object} params.def            ManeuverDefinition
 * @param {object|null} [params.weapon]   selected weapon Item/data (undefined → unarmed)
 * @param {boolean} [params.aimed]
 * @param {string} [params.aimedZone]
 * @param {object} [params.actor]         passed through to the quality composer ctx
 * @returns {{ penalty: number, appliedBy: string[], nonImpactExtra: number }}
 */
export function resolveManeuverAttackPenalty({ def, weapon, aimed, aimedZone, actor } = {}) {
  if (!def) return { penalty: 0, appliedBy: [], nonImpactExtra: 0 };

  // 1. Base penalty.
  let penalty =
    aimed && aimedZone ? getAimedPenalty(aimedZone) : def.getAttackPenalty(weapon);

  // 2. Weapon qualities (Precisa, ...). Only the aimed/base penalty is halved.
  let appliedBy = [];
  if (weapon) {
    const composed =
      aimed && aimedZone
        ? composeAimedPenalty(penalty, { weapon, actor, maneuverSlug: def.slug, aimedZone })
        : composeManeuverPenalty(penalty, { weapon, actor, maneuverSlug: def.slug });
    penalty = composed.penalty;
    appliedBy = composed.appliedBy ?? [];
  }

  // 3. requiresImpactCritic extra (after qualities → NOT halved by Precisa).
  let nonImpactExtra = 0;
  if (def.requiresImpactCritic && weapon) {
    const primaryCritic = weapon.system?.critic?.primary?.value;
    if (primaryCritic && primaryCritic !== 'impact') {
      nonImpactExtra = Number(def.nonImpactCriticExtraPenalty ?? 0);
      penalty += nonImpactExtra;
    }
  }

  return { penalty, appliedBy, nonImpactExtra };
}
