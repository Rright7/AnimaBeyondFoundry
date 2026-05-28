import { ATTRIBUTE_PATHS } from './attributeDerivationMap.js';
import { resolveChangeMode } from './effectFow/applicators/activeEffectApplicator.js';

/**
 * @typedef {object} AEContribution
 * @property {string} name — effect name
 * @property {number|null} value — numeric delta (signed) for add modes; null for non-linear modes
 * @property {string} mode — 'add' | 'multiply' | 'override' | 'upgrade' | 'downgrade'
 */

/**
 * Enumerate the Active Effects on `actor` that contribute to a given logical
 * attribute (one of the keys of ATTRIBUTE_PATHS). Only ADD-mode contributions
 * resolve to a numeric value; other modes are reported with `value=null`.
 *
 * @param {Actor} actor
 * @param {keyof typeof ATTRIBUTE_PATHS} attribute
 * @returns {AEContribution[]}
 */
export function getActiveEffectContributions(actor, attribute) {
  const paths = ATTRIBUTE_PATHS[attribute];
  if (!actor?.effects || !Array.isArray(paths)) return [];

  const pathSet = new Set(paths);
  const out = [];

  for (const effect of actor.effects.contents ?? []) {
    if (!effect.active) continue;

    const changes = Array.isArray(effect.changes) && effect.changes.length > 0
      ? effect.changes
      : (effect.system?.changes ?? []);

    if (!Array.isArray(changes)) continue;

    for (const change of changes) {
      if (!change?.key || !pathSet.has(change.key)) continue;

      const mode = resolveChangeMode(change.mode ?? change.type);
      let value = null;

      if (mode === 'add') {
        const n = Number(change.value);
        if (!Number.isNaN(n) && n !== 0) value = n;
      }

      out.push({ name: effect.name ?? effect.label ?? 'AE', value, mode });
    }
  }

  return out;
}

/**
 * Format a list of contributions as a single short string for chat flavor.
 * Examples:
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
