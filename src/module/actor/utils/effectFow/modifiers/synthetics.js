// /module/actor/utils/effectFow/modifiers/synthetics.js
//
// The "synthetics" mailbox: a per-actor collection where every rule source
// (Active Effects today; equipment qualities, maneuvers and rule elements
// tomorrow) DEPOSITS the modifiers it contributes, keyed by the data path it
// affects. This decouples "who contributes" from "what the final value is".
//
// Inspired by PF2e's actor.synthetics.modifiers[selector], adapted to Anima.
// The mailbox stores each contribution with its provenance so (a) the chat
// traceability line can be built from one reliable place and (b) Anima's
// stacking rule (see ./stacking.js) can be applied to a path's contributions.
// In Anima everything sums regardless of source; the only exception is
// substitution (the Cargar exception), modelled with the opt-in `group`.
//
// This layer is intentionally non-invasive: depositing here does NOT change
// any computed value. The existing effectFow keeps writing final values as
// before; the mailbox merely records, in parallel, what each source added.
//
// Entry shape (a "modifier record"):
//   { path, value, source, slug, mode, group }
//     - path   : absolute actor data path targeted
//     - value  : signed numeric delta contributed (add-mode only)
//     - source : human-readable provenance for the breakdown (effect name)
//     - slug   : stable id of the source (effect slug / id), for de-dupe
//     - mode   : the change mode ('add' for now)
//     - group  : optional exclusivity bucket (combat stances)

/**
 * Reset the synthetics container at the start of a prepare cycle. Idempotent.
 * @param {object} actor
 * @returns {{ modifiers: Record<string, object[]> }}
 */
export function resetSynthetics(actor) {
  if (!actor) return { modifiers: {} };
  actor.synthetics = { modifiers: {} };
  return actor.synthetics;
}

/**
 * Get the synthetics container, creating an empty one if absent or malformed
 * (without wiping a valid existing one).
 * @param {object} actor
 * @returns {{ modifiers: Record<string, object[]> }}
 */
export function getSynthetics(actor) {
  if (!actor) return { modifiers: {} };
  if (!actor.synthetics || typeof actor.synthetics !== 'object') {
    actor.synthetics = { modifiers: {} };
  }
  if (!actor.synthetics.modifiers || typeof actor.synthetics.modifiers !== 'object') {
    actor.synthetics.modifiers = {};
  }
  return actor.synthetics;
}

/**
 * Deposit a modifier record into the mailbox under its target path. No-ops on
 * a missing actor/path or a non-finite / zero value.
 *
 * @param {object} actor
 * @param {object} record
 * @param {string} record.path
 * @param {number} record.value
 * @param {string} [record.source]
 * @param {string} [record.slug]
 * @param {string} [record.mode]
 * @param {string} [record.group]
 * @returns {void}
 */
export function depositModifier(actor, record) {
  if (!actor || !record?.path) return;
  const value = Number(record.value);
  if (!Number.isFinite(value) || value === 0) return;

  const synth = getSynthetics(actor);
  const list = (synth.modifiers[record.path] ??= []);
  list.push({
    path: record.path,
    value,
    source: record.source ?? 'AE',
    slug: record.slug ?? null,
    mode: record.mode ?? 'add',
    group: typeof record.group === 'string' ? record.group : null
  });
}

/**
 * Read all modifier records deposited for any of the given paths, in deposit
 * order. Accepts a single path or an array (a logical attribute mapping to
 * several data paths can collect from all of them). De-dupes a contribution
 * that targets multiple requested paths.
 *
 * @param {object} actor
 * @param {string|string[]} paths
 * @returns {object[]}
 */
export function readModifiers(actor, paths) {
  const synth = getSynthetics(actor);
  const list = Array.isArray(paths) ? paths : [paths];
  const out = [];
  const seen = new Set();
  for (const p of list) {
    for (const rec of synth.modifiers[p] ?? []) {
      const key = `${rec.slug ?? rec.source}|${rec.value}|${rec.path}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(rec);
    }
  }
  return out;
}
