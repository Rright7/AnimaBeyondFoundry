import { ATTRIBUTE_PATHS } from './attributeDerivationMap.js';
import { resolveChangeMode } from './effectFow/applicators/activeEffectApplicator.js';
import { readModifiers } from './effectFow/modifiers/synthetics.js';
import { applyStackingRules } from './effectFow/modifiers/stacking.js';

/**
 * @typedef {object} AEContribution
 * @property {string} name — effect name
 * @property {number|null} value — numeric delta (signed) for add modes; null for non-linear modes
 * @property {string} mode — 'add' | 'multiply' | 'override' | 'upgrade' | 'downgrade'
 */

/**
 * Collapse a contribution list so the same (name, value, mode) never appears
 * twice. The synthetics mailbox can, in some preparation paths, end up with a
 * contribution recorded more than once (e.g. an actor prepared twice, or the
 * same effect present as two separate items). The chat trace must show each
 * source once, so we de-dupe by content here as the single guard.
 *
 * @param {AEContribution[]} contributions
 * @returns {AEContribution[]}
 */
function dedupeContributions(contributions) {
  const seen = new Set();
  const out = [];
  for (const c of contributions) {
    const key = `${c.name}|${c.value}|${c.mode}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}

/**
 * Enumerate the contributions to a given logical attribute (a key of
 * ATTRIBUTE_PATHS), for the chat traceability line.
 *
 * Preferred source: the synthetics mailbox populated during the effect flow.
 * Anima stacking is applied so the line shows the modifiers that actually
 * count (everything sums; grouped modifiers substitute — the Cargar
 * exception). Falls back to scanning Active Effects when the mailbox has
 * nothing for these paths (e.g. a roll before any prepare cycle, or unmigrated
 * data). The result is de-duped by content so a source never appears twice.
 *
 * `options` are the actor's roll options (Phase 3). When provided, modifiers
 * whose predicate does not pass are excluded from the line — so a conditional
 * effect only shows up when its condition holds. When omitted, predicates are
 * ignored (every contribution shows), preserving prior behaviour.
 *
 * @param {Actor} actor
 * @param {keyof typeof ATTRIBUTE_PATHS} attribute
 * @param {Set<string>|string[]} [options] actor roll options for predicate gating
 * @returns {AEContribution[]}
 */
export function getActiveEffectContributions(actor, attribute, options) {
  return getPathContributions(actor, ATTRIBUTE_PATHS[attribute], options);
}

/**
 * Like {@link getActiveEffectContributions} but takes the concrete data path(s)
 * directly instead of a logical attribute. Used for sheet rollables (resistances,
 * characteristics, abilities…) that carry their own `rollPath`, so any deposited
 * provenance on that path is traced without needing an ATTRIBUTE_PATHS entry.
 *
 * @param {Actor} actor
 * @param {string|string[]} paths
 * @param {Set<string>|string[]} [options] actor roll options for predicate gating
 * @returns {AEContribution[]}
 */
export function getPathContributions(actor, paths, options) {
  const pathList = Array.isArray(paths) ? paths : (paths ? [paths] : []);
  if (pathList.length === 0) return [];

  const fromMailbox = readModifiers(actor, pathList);
  if (fromMailbox.length > 0) {
    const { applied } = applyStackingRules(fromMailbox, options);
    const contributions = applied.map(rec => ({
      name: rec.source ?? 'AE',
      value: typeof rec.value === 'number' ? rec.value : null,
      mode: rec.mode ?? 'add'
    }));
    return dedupeContributions(contributions);
  }

  if (!actor?.effects) return [];

  const pathSet = new Set(pathList);
  const out = [];
  // Track seen (effectId|name + value + mode) so an AE that contributes the
  // SAME value to multiple paths (e.g. Flanco -30 to both block and dodge for
  // a generic "Defensa" roll) is not double-reported.
  const seen = new Set();

  for (const effect of actor.effects.contents ?? []) {
    if (!effect.active) continue;

    const changes = Array.isArray(effect.changes) && effect.changes.length > 0
      ? effect.changes
      : (effect.system?.changes ?? []);

    if (!Array.isArray(changes)) continue;

    for (const change of changes) {
      if (!change?.key || !pathSet.has(change.key)) continue;

      // V14: preferir el string `type`; `mode` (numérico) está deprecado (fallback legacy).
      const mode = resolveChangeMode(change.type ?? change.mode);
      let value = null;

      if (mode === 'add') {
        const n = Number(change.value);
        if (!Number.isNaN(n) && n !== 0) value = n;
      }

      const name = effect.name ?? effect.label ?? 'AE';
      const key = `${effect.id ?? name}|${value}|${mode}`;
      if (seen.has(key)) continue;
      seen.add(key);

      out.push({ name, value, mode });
    }
  }

  return dedupeContributions(out);
}

/**
 * Format a list of contributions as a single short string for chat flavor.
 *   "Mod: Ceguera parcial (-30), Sorpresa (-90)"
 *   "Mod: Posición superior (+20)"
 *   "" if nothing relevant.
 *
 * @param {AEContribution[]} contributions
 * @returns {string}
 */
export function formatContributions(contributions) {
  if (!Array.isArray(contributions) || contributions.length === 0) return '';

  const parts = [];
  for (const c of contributions) {
    if (c.value === null) {
      parts.push(`${c.name} (${c.mode})`);
    } else {
      const sign = c.value > 0 ? '+' : '';
      parts.push(`${c.name} (${sign}${c.value})`);
    }
  }
  return `Mod: ${parts.join(', ')}`;
}
