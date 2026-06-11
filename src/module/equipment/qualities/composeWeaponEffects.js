import { equipmentQualityRegistry } from './EquipmentQualityRegistry.js';
import { martialArtAimedPenaltyFactor } from '../../combat/martialArts/martialArtSpecials.js';

/**
 * Read all `weaponQuality` Items embedded in a weapon and return the live
 * definitions registered in the registry. Items whose slug is unknown
 * (loaded before registry init, or stale) are skipped silently — the
 * weapon still works, just without the unknown quality's effects.
 *
 * @param {Item|object|null|undefined} weapon
 * @returns {import('./EquipmentQualityDefinition.js').EquipmentQualityDefinition[]}
 */
export function getWeaponQualityDefinitions(weapon) {
  if (!weapon) return [];

  // Two storage shapes are supported:
  //   - Item document with .items collection (rare for sub-items inside a
  //     parent Item, kept for forward compatibility).
  //   - Plain object stored in actor.system.combat.weapons[].qualities[]
  //     after Foundry serializes; this is the path we use day-to-day.
  const slugs = readQualitySlugs(weapon);
  if (slugs.length === 0) return [];

  const defs = [];
  for (const slug of slugs) {
    const def = equipmentQualityRegistry.get(slug);
    if (def) defs.push(def);
  }
  return defs;
}

function readQualitySlugs(weapon) {
  // Preferred storage: weapon.system.qualities.value = ['precise', ...]
  const arr = weapon.system?.qualities?.value;
  if (Array.isArray(arr)) {
    return arr.map(s => String(s).toLowerCase()).filter(Boolean);
  }
  return [];
}

/**
 * Apply every quality's `modifyAimedPenalty` hook to the given penalty,
 * left-to-right in registration order. Quality gates (meleeOnly) are
 * honored.
 *
 * @param {number} penalty
 * @param {object} ctx — context passed to each hook
 * @param {Item|object} ctx.weapon
 * @returns {{ penalty: number, appliedBy: string[] }}
 */
export function composeAimedPenalty(penalty, ctx) {
  const defs = getWeaponQualityDefinitions(ctx?.weapon);
  let current = Number(penalty || 0);
  const appliedBy = [];
  for (const def of defs) {
    if (typeof def.modifyAimedPenalty !== 'function') continue;
    if (def.isGatedOutFor(ctx.weapon)) continue;
    const next = def.modifyAimedPenalty(current, ctx);
    if (Number.isFinite(next) && next !== current) {
      current = next;
      appliedBy.push(def.slug);
    }
  }

  // Sambo Supremo reduce a la mitad los Apuntados POR SI MISMO, pero SOLO cuerpo a cuerpo
  // (igual que Precisa, que es meleeOnly). Si el arma tiene Precisa ACTIVA, precise.js ya
  // aplico el cuarto acumulado (doublePrecise) -> no reducir otra vez. No se anade a
  // appliedBy: el slug se mostraria sin traducir en el flavor; el penalizador reducido basta.
  const preciseActive = defs.some(
    d =>
      d.slug === 'precise' &&
      typeof d.modifyAimedPenalty === 'function' &&
      !d.isGatedOutFor(ctx?.weapon)
  );
  if (!preciseActive && !ctx?.weapon?.system?.isRanged?.value) {
    const maFactor = martialArtAimedPenaltyFactor(ctx?.actor);
    if (maFactor !== 1) {
      const next = Math.trunc(current * maFactor) || 0;
      if (next !== current) current = next;
    }
  }

  return { penalty: current, appliedBy };
}

/**
 * Apply every quality's `modifyManeuverPenalty` hook to the given penalty.
 * The hook receives ctx.maneuverSlug so a quality can be selective.
 *
 * @param {number} penalty
 * @param {object} ctx
 * @param {Item|object} ctx.weapon
 * @param {string} ctx.maneuverSlug
 * @returns {{ penalty: number, appliedBy: string[] }}
 */
export function composeManeuverPenalty(penalty, ctx) {
  const defs = getWeaponQualityDefinitions(ctx?.weapon);
  let current = Number(penalty || 0);
  const appliedBy = [];
  for (const def of defs) {
    if (typeof def.modifyManeuverPenalty !== 'function') continue;
    if (def.isGatedOutFor(ctx.weapon)) continue;
    const next = def.modifyManeuverPenalty(current, ctx);
    if (Number.isFinite(next) && next !== current) {
      current = next;
      appliedBy.push(def.slug);
    }
  }
  return { penalty: current, appliedBy };
}
