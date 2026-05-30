// /module/actor/utils/effectFow/rollOptions/rollOptions.js
//
// Roll options (Phase 3): a per-actor Set of atomic boolean facts about the
// current context, e.g. "self:type:character", "self:effect:derribado".
// Predicates (see ../predicates/Predicate.js) are tested against this set so a
// modifier can apply conditionally ("only if the target is flanked") with no
// hard-coding.
//
// This is the MINIMAL populator: it derives options from the actor's own
// active effect items and its type. It does NOT yet model target-side options
// (target:*) nor combat geometry (flanco/espalda) — those are added later by
// whoever evaluates a concrete roll. Keeping it small and side-effect-light on
// purpose; populated once at the start of the effect flow.
//
// Convention: option strings are lower-case, colon-separated, prefixed by the
// subject. "self:" = facts about this actor. Slugs are derived from item names
// (effects have no own slug field in animabf — the name is the identity).

/**
 * Slugify a display name into an option-safe token: lower-case, accents
 * stripped, non-alphanumerics collapsed to single hyphens, trimmed.
 *   "Ceguera parcial" -> "ceguera-parcial"
 *   "Flanco + ceguera absoluta" -> "flanco-ceguera-absoluta"
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

  const items = actor.items?.contents ?? actor.items ?? [];
  for (const item of items) {
    if (!item) continue;
    if (item.type !== 'effect') continue;
    // Only count effects considered active. Different shapes seen in the wild:
    // item.system.active boolean, or no flag at all (treated as active).
    const active = item.system?.active;
    if (active === false) continue;
    const slug = slugifyOption(item.name);
    if (!slug) continue;
    opts.add(`self:effect:${slug}`);
    opts.add(`self:item:${slug}`);
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
