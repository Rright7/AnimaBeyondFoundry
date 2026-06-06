// /module/combat/maneuvers/grappleSources.js
//
// Relational sources for the "Apresando" (grappling) effect.
//
// A grapple is RELATIONAL: an attacker grapples a SPECIFIC defender, and the
// detail "was it done unarmed?" belongs to THAT pairing — not to the attacker
// globally. Modelling it as a single flag broke when the same attacker grappled
// twice (weaponed then unarmed) or when two attackers grappled different
// victims: the later value clobbered the earlier one.
//
// So the "Apresando" effect item carries a list under `system.sources`, one
// entry per grappled defender:
//
//   system.sources: [
//     { targetId: "<defenderActorId>", wasUnarmed: true|false }
//   ]
//
// Keyed by targetId (the pf2e "origin+slug" idea, here slug is fixed to the
// Apresando effect and the relational key is the target). Upsert-by-targetId
// means re-grappling the same defender UPDATES its entry instead of leaking a
// stale value; grappling a new defender ADDS an entry.
//
// Pure data helpers (no Foundry calls): they take and return the plain
// `sources` array so callers can read it from an item and write it back with a
// single update. Defensive against missing/garbage input.

/**
 * Normalise any stored value into a clean array of source entries.
 * @param {any} sources
 * @returns {{targetId:string, wasUnarmed:boolean}[]}
 */
export function readGrappleSources(sources) {
  if (!Array.isArray(sources)) return [];
  return sources
    .filter(s => s && typeof s.targetId === 'string' && s.targetId.length > 0)
    .map(s => ({ targetId: s.targetId, wasUnarmed: !!s.wasUnarmed }));
}

/**
 * Insert or update the entry for `targetId`. Returns a NEW array (does not
 * mutate the input). If an entry for that target exists, it is replaced (so
 * `wasUnarmed` reflects the latest grapple against that defender).
 *
 * @param {any} sources current stored value
 * @param {string} targetId defender actor id
 * @param {boolean} wasUnarmed whether this grapple was performed unarmed
 * @returns {{targetId:string, wasUnarmed:boolean}[]}
 */
export function upsertGrappleSource(sources, targetId, wasUnarmed) {
  const list = readGrappleSources(sources);
  if (!targetId) return list;
  const next = list.filter(s => s.targetId !== targetId);
  next.push({ targetId, wasUnarmed: !!wasUnarmed });
  return next;
}

/**
 * Remove the entry for `targetId`. Returns a NEW array.
 * @param {any} sources
 * @param {string} targetId
 * @returns {{targetId:string, wasUnarmed:boolean}[]}
 */
export function removeGrappleSource(sources, targetId) {
  return readGrappleSources(sources).filter(s => s.targetId !== targetId);
}

/**
 * Find the source entry for a given defender, or null.
 * @param {any} sources
 * @param {string} targetId
 * @returns {{targetId:string, wasUnarmed:boolean}|null}
 */
export function findGrappleSource(sources, targetId) {
  if (!targetId) return null;
  return readGrappleSources(sources).find(s => s.targetId === targetId) ?? null;
}

/**
 * Whether the grapple against `targetId` was performed unarmed. False if there
 * is no entry for that defender.
 * @param {any} sources
 * @param {string} targetId
 * @returns {boolean}
 */
export function grappleWasUnarmedAgainst(sources, targetId) {
  return !!findGrappleSource(sources, targetId)?.wasUnarmed;
}
