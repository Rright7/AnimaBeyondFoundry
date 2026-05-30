// /module/actor/utils/effectFow/rollOptions/rollOptions.js
//
// Roll options (Phase 3): a per-actor Set of atomic boolean facts about the
// current context, e.g. "self:type:character", "self:effect:derribado".
// Predicates (see ../predicates/Predicate.js) are tested against this set so a
// modifier or a maneuver can apply conditionally with no hard-coding.
//
// Two builders:
//   - buildRollOptions(actor): the actor's own facts (self:*). Populated once
//     at the start of the effect flow; stored on actor.rollOptions.
//   - buildGrappleOptions(attacker, defender): a COMBINED set for two-actor
//     checks like Aplastar — the attacker's facts as self:* plus the
//     defender's relevant facts projected as defender:*. Built on demand by
//     the maneuver runner, not stored.
//
// Convention: option strings are lower-case, colon-separated, prefixed by the
// subject ("self:" / "defender:"). Slugs are derived from item names (effects
// have no own slug field in animabf — the name is the identity).

import { grappleWasUnarmedAgainst } from '../../../../combat/maneuvers/grappleSources.js';

const SYSTEM_ID = 'animabf';

// The effect item that represents "this actor is holding a grapple". Source of
// truth for `self:grappling`: deriving the state from the live effect item
// (instead of a persistent flag) makes it self-correcting — remove the effect
// by hand and the actor stops grappling immediately, no stale flag lingering.
const GRAPPLING_EFFECT_NAME = 'Apresando';

/**
 * Slugify a display name into an option-safe token: lower-case, accents
 * stripped, non-alphanumerics collapsed to single hyphens, trimmed.
 *   "Ceguera parcial" -> "ceguera-parcial"
 *   "Parálisis completa" -> "paralisis-completa"
 *
 * @param {string} name
 * @returns {string}
 */
export function slugifyOption(name) {
  return String(name ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * The active effect-type items of an actor (defensive against shapes/missing).
 * @param {object} actor
 * @returns {object[]}
 */
function activeEffectItems(actor) {
  const items = actor?.items?.contents ?? actor?.items ?? [];
  return [...items].filter(
    it => it && it.type === 'effect' && it.system?.active !== false
  );
}

/**
 * True if the actor currently has an active effect item with the given name
 * (case-insensitive, trimmed).
 * @param {object} actor
 * @param {string} name
 * @returns {boolean}
 */
function hasActiveEffectNamed(actor, name) {
  const target = slugifyOption(name);
  return activeEffectItems(actor).some(it => slugifyOption(it.name) === target);
}

/**
 * Candidate keys that identify a defender in the grapple sources list, most
 * specific first: token uuid, token id, then actor id. Mirrors the ref that
 * resolveManeuverOpposedCheck stores (token uuid preferred) while still
 * matching legacy actor-id-keyed sources and bare mock actors in unit tests.
 * Touches only plain properties — no Foundry globals — so it stays pure.
 *
 * @param {object} defender
 * @returns {string[]} non-empty candidate keys
 */
function defenderKeys(defender, defenderRef) {
  const token =
    defender?.token ??
    defender?.getActiveTokens?.()?.[0]?.document ??
    defender?.getActiveTokens?.()?.[0] ??
    null;
  // defenderRef (the raw flag the grapple was stored under) goes FIRST: it is
  // exactly the key resolveManeuverOpposedCheck wrote the source with, so it
  // matches even when the resolved TokenActor no longer exposes `.token`
  // (fromUuidSync(uuid).actor often doesn't), which would otherwise leave only
  // the base actor id and miss a token-keyed source.
  return [defenderRef, token?.uuid, token?.id, defender?.id]
    .filter(k => typeof k === 'string' && k.length > 0);
}

/**
 * Build the Set of roll options for `actor` from its current state.
 *
 * Emits:
 *   - self:type:<actorType>                 (character, npc, …)
 *   - self:effect:<slug(name)>   for each ACTIVE effect-type item
 *   - self:item:<slug(name)>     for each active effect (broader alias)
 *
 * Robust against partial/mock actors: anything missing is simply skipped.
 *
 * @param {object} actor
 * @returns {Set<string>}
 */
export function buildRollOptions(actor) {
  const opts = new Set();
  if (!actor) return opts;

  const type = actor.type ?? actor.system?.type;
  if (type) opts.add(`self:type:${type}`);

  for (const item of activeEffectItems(actor)) {
    const slug = slugifyOption(item.name);
    if (!slug) continue;
    opts.add(`self:effect:${slug}`);
    opts.add(`self:item:${slug}`);
  }

  return opts;
}

/**
 * Collect a single actor's effect facts under a subject prefix ("self" /
 * "defender"). Emits <prefix>:effect:<slug> and <prefix>:condition:<slug> for
 * each active effect (condition is an alias used by predicates that read like
 * RAW conditions). Helper for buildGrappleOptions.
 *
 * @param {object} actor
 * @param {string} prefix
 * @returns {string[]}
 */
function effectOptionsFor(actor, prefix) {
  const out = [];
  for (const item of activeEffectItems(actor)) {
    const slug = slugifyOption(item.name);
    if (!slug) continue;
    out.push(`${prefix}:effect:${slug}`);
    out.push(`${prefix}:condition:${slug}`);
  }
  return out;
}

/**
 * Build a COMBINED option set for a two-actor maneuver check (Aplastar).
 *
 * Attacker facts (self:*):
 *   - self:grappling          DERIVED from the live "Apresando" effect item on
 *                             the attacker (NOT from a flag). Self-correcting:
 *                             removing the effect drops the option.
 *   - self:grapple:unarmed    the grapple was performed without weapons. This
 *                             is a one-shot detail captured at Presa time, so
 *                             it stays on the flag; but it only matters while
 *                             self:grappling holds (gated below).
 *   - self:effect:* / self:condition:*   attacker's active effects
 *
 * Defender facts (defender:*):
 *   - defender:effect:* / defender:condition:*   defender's active effects
 *     (so "defender:condition:paralisis-completa" etc. are available)
 *
 * All inputs are read defensively; missing data just yields fewer options.
 *
 * @param {object} attacker
 * @param {object} defender
 * @param {string} [defenderRef] the raw ref the grapple was stored under
 *   (the attacker's `grappling` flag) — used as the most specific source key.
 * @returns {Set<string>}
 */
export function buildGrappleOptions(attacker, defender, defenderRef = '') {
  const opts = new Set();

  if (attacker) {
    const type = attacker.type ?? attacker.system?.type;
    if (type) opts.add(`self:type:${type}`);

    // Derive grappling from the live effect, not the flag.
    const apresando = attacker.items?.find?.(
      i => i.type === 'effect' && i.name === GRAPPLING_EFFECT_NAME
    ) ?? null;
    const isGrappling = !!apresando || hasActiveEffectNamed(attacker, GRAPPLING_EFFECT_NAME);
    if (isGrappling) {
      opts.add('self:grappling');

      // "Was unarmed" is RELATIONAL: it depends on which defender this grapple
      // is against. Read it from the Apresando effect's per-defender sources,
      // matched to the CURRENT defender — so a weaponed grapple on one victim
      // and an unarmed grapple on another never clobber each other. Fall back
      // to the legacy single-target flag when sources/defender are absent.
      //
      // The source key is the defender's stable token ref (what
      // resolveManeuverOpposedCheck writes). Try the token ref first, then the
      // plain actor id, so both new (token-keyed) and legacy (id-keyed) sources
      // resolve. defenderKeys() derives candidate keys without needing any
      // Foundry globals, so this stays unit-testable with mock actors.
      let wasUnarmed = false;
      const keys = defenderKeys(defender, defenderRef);
      if (apresando && keys.length > 0) {
        const sources = apresando.system?.sources;
        wasUnarmed = keys.some(key => grappleWasUnarmedAgainst(sources, key));
      } else {
        wasUnarmed = !!attacker.getFlag?.(SYSTEM_ID, 'grappleWasUnarmed');
      }
      if (wasUnarmed) opts.add('self:grapple:unarmed');
    }

    for (const o of effectOptionsFor(attacker, 'self')) opts.add(o);
  }

  if (defender) {
    for (const o of effectOptionsFor(defender, 'defender')) opts.add(o);
  }

  return opts;
}

/**
 * Populate `actor.rollOptions` with a fresh Set. Idempotent; call at the start
 * of each prepare/flow cycle so stale options never leak across runs.
 *
 * @param {object} actor
 * @returns {Set<string>} the set that was stored
 */
export function resetRollOptions(actor) {
  const opts = buildRollOptions(actor);
  if (actor) actor.rollOptions = opts;
  return opts;
}

/**
 * Read the actor's roll options, building a fresh set if none is present yet.
 * @param {object} actor
 * @returns {Set<string>}
 */
export function getRollOptions(actor) {
  if (!actor) return new Set();
  if (!(actor.rollOptions instanceof Set)) {
    actor.rollOptions = buildRollOptions(actor);
  }
  return actor.rollOptions;
}
