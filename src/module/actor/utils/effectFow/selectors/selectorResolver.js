// /module/actor/utils/effectFow/selectors/selectorResolver.js
//
// Logical selectors for Active Effect changes (Phase 2).
//
// An effect change targets a data path. Writing the raw absolute path
// ("system.combat.attack.final.value") in every effect is verbose and
// error-prone. A SELECTOR is a short logical name ("attack") that resolves to
// one or more absolute paths.
//
// Two flavours, handled uniformly:
//   - 1->1 alias: "attack" -> "system.combat.attack.final.value"
//   - 1->N domain: "defense" -> [block.final, dodge.final]; one change writes
//     several stats. Magic/psychic projections have an offensive AND a
//     defensive imbalance, so "magicProjectionImbalance" fans out to both.
//
// Fully backward-compatible: a value that is NOT a known selector is treated
// as a raw path and returned as-is (after the usual `system.` normalisation).
// So existing effects that store raw paths keep working untouched.
//
// The registry below is the single source of truth for selector -> path(s).
// `attributeDerivationMap.ATTRIBUTE_PATHS` (used by the chat breakdown) is a
// related but separate, read-only map keyed by ROLL attribute; this one is
// keyed by the SELECTOR an effect author writes. They overlap on purpose but
// serve different consumers.

import { normalizePath } from '../ops/normalizePaths.js';

const C = 'system.combat';
const P = 'system.characteristics.primaries';
const SEC = 'system.characteristics.secondaries';
const MOD = 'system.general.modifiers';
const MAG = 'system.mystic.magicProjection';
const PSY = 'system.psychic.psychicProjection';
const KI = 'system.domine.kiAccumulation';

/**
 * Selector registry. Each value is an array of absolute target paths (use an
 * array even for 1->1 so the resolver shape is uniform). Keep keys camelCase,
 * English (project convention: internal ids in English).
 */
export const SELECTORS = {
  // ── Combat ────────────────────────────────────────────────
  attack: [`${C}.attack.final.value`],
  block: [`${C}.block.final.value`],
  dodge: [`${C}.dodge.final.value`],
  // Domain: a generic defensive modifier hits both parada and esquiva.
  defense: [`${C}.block.final.value`, `${C}.dodge.final.value`],
  wearArmor: [`${C}.wearArmor.final.value`],
  damageReduction: [`${C}.damageReduction.final.value`],

  // ── Action modifiers ──────────────────────────────────────
  allActions: [`${MOD}.allActions.final.value`],
  physicalActions: [`${MOD}.physicalActions.final.value`],
  extraDamage: [`${MOD}.extraDamage.final.value`],

  // ── Initiative ────────────────────────────────────────────
  initiative: [`${SEC}.initiative.final.value`],

  // ── Primary characteristics (final) ───────────────────────
  strength: [`${P}.strength.final.value`],
  dexterity: [`${P}.dexterity.final.value`],
  agility: [`${P}.agility.final.value`],
  constitution: [`${P}.constitution.final.value`],
  power: [`${P}.power.final.value`],
  willPower: [`${P}.willPower.final.value`],
  perception: [`${P}.perception.final.value`],
  intelligence: [`${P}.intelligence.final.value`],

  // ── Magic projection ──────────────────────────────────────
  // Global projection value.
  magicProjection: [`${MAG}.final.value`],
  // The two imbalance slots, individually…
  magicProjectionOffensive: [`${MAG}.imbalance.offensive.final.value`],
  magicProjectionDefensive: [`${MAG}.imbalance.defensive.final.value`],
  // …and a domain that hits BOTH imbalance slots at once.
  magicProjectionImbalance: [
    `${MAG}.imbalance.offensive.final.value`,
    `${MAG}.imbalance.defensive.final.value`
  ],

  // ── Psychic projection ────────────────────────────────────
  psychicProjection: [`${PSY}.final.value`],
  psychicProjectionOffensive: [`${PSY}.imbalance.offensive.final.value`],
  psychicProjectionDefensive: [`${PSY}.imbalance.defensive.final.value`],
  psychicProjectionImbalance: [
    `${PSY}.imbalance.offensive.final.value`,
    `${PSY}.imbalance.defensive.final.value`
  ],

  // ── Magic accumulation ────────────────────────────────────
  actMain: [`system.mystic.act.main.final.value`],

  // ── Ki accumulation (per characteristic) ──────────────────
  kiAccumulationStrength: [`${KI}.strength.final.value`],
  kiAccumulationDexterity: [`${KI}.dexterity.final.value`],
  kiAccumulationAgility: [`${KI}.agility.final.value`],
  kiAccumulationConstitution: [`${KI}.constitution.final.value`],
  kiAccumulationPower: [`${KI}.power.final.value`],
  kiAccumulationWillPower: [`${KI}.willPower.final.value`]
};

/**
 * True if `key` is a registered logical selector (not a raw path).
 * @param {string} key
 * @returns {boolean}
 */
export function isSelector(key) {
  return typeof key === 'string' && Object.prototype.hasOwnProperty.call(SELECTORS, key);
}

/**
 * Resolve a change `key` (selector OR raw path) to the list of absolute target
 * paths it writes. Always returns an array:
 *   - known selector  -> its registered path(s) (1 or N)
 *   - raw path        -> [normalised path]  (backward-compatible passthrough)
 *   - empty / invalid -> []
 *
 * @param {string} key
 * @returns {string[]}
 */
export function resolveSelector(key) {
  if (!key || typeof key !== 'string') return [];
  if (isSelector(key)) return SELECTORS[key].slice();
  return [normalizePath(key)];
}

/**
 * The list of all selector names, for UI dropdowns / validation.
 * @returns {string[]}
 */
export function selectorNames() {
  return Object.keys(SELECTORS);
}
