/* eslint-disable no-continue */
import {
  applySingleActiveEffectChange,
  resolveChangeMode
} from '../../applicators/activeEffectApplicator.js';
import { normalizePaths } from '../normalizePaths.js';
import { resolveSelector } from '../../selectors/selectorResolver.js';

function inferDepsFromChangeValue(value) {
  if (typeof value !== 'string') return [];
  const out = [];
  const re = /@([a-zA-Z0-9_.]+)/g;

  let m;
  while ((m = re.exec(value)) !== null) {
    const raw = m[1];
    out.push(raw.startsWith('system.') ? raw : `system.${raw}`);
  }
  return [...new Set(out)];
}

function getFlaggedDeps(effect, index) {
  const depsByIndex = effect.getFlag?.('animabf', 'flowChangeDeps') ?? [];
  const deps = depsByIndex?.[index];
  return Array.isArray(deps) ? deps : [];
}

/**
 * Maps an ActiveEffect mode to a write kind.
 * - override => overwrite
 * - others   => modify
 *
 * Accepts both numeric (Foundry) and string (legacy) modes via resolveChangeMode.
 *
 * @param {string|number|undefined} rawMode
 * @returns {'overwrite'|'modify'}
 */
function writeKindFromAEMode(rawMode) {
  return resolveChangeMode(rawMode) === 'override' ? 'overwrite' : 'modify';
}

/**
 * Build the FlowOp(s) for a single change.
 *
 * The change's `key` may be a logical selector (Phase 2). It resolves to one or
 * more absolute paths:
 *   - 1->1 selector or raw path -> a single op (unchanged behaviour)
 *   - 1->N selector (e.g. "defense", "magicProjectionImbalance") -> ONE op PER
 *     resolved path, so each write is scheduled and ordered independently by
 *     the toposort. Each op applies the change against its concrete path.
 *
 * Backward-compatible: a raw path resolves to itself, so existing effects that
 * store absolute paths produce exactly the same single op as before.
 *
 * @param {any} effect
 * @param {number} index
 * @param {{key:string, mode:number, value:any}} change
 * @returns {object[]} one or more flow ops
 */
export function buildActiveEffectChangeOps_forChange(effect, index, change) {
  const flagged = getFlaggedDeps(effect, index);
  const inferred = flagged.length > 0 ? [] : inferDepsFromChangeValue(change.value);
  const deps = normalizePaths([...flagged, ...inferred]);

  const kind = writeKindFromAEMode(change.mode ?? change.type);
  const paths = resolveSelector(change.key);
  if (paths.length === 0) return [];

  return paths.map((path, pathIdx) => {
    // The applicator writes against change.key, so hand it a change whose key
    // is the concrete resolved path (not the selector).
    const resolvedChange = { ...change, key: path };
    return {
      id: paths.length > 1
        ? `ae:${effect.id}:${index}:${pathIdx}`
        : `ae:${effect.id}:${index}`,
      deps,
      writes: [{ path, kind }],
      _tie: {
        priority: Number(effect.priority ?? 0),
        effectId: String(effect.id),
        index: index * 100 + pathIdx
      },
      apply: actor => applySingleActiveEffectChange(actor, effect, resolvedChange)
    };
  });
}

/**
 * Devuelve una lista plana de ops (1+ por change).
 *
 * @param {any} actor
 */
export function buildActiveEffectChangeOps(actor) {
  const ops = [];

  for (const effect of actor.effects?.contents ?? []) {
    if (!effect.active) continue;

    // Foundry-standard path is `effect.changes` (top-level). Fall back to the
    // legacy `effect.system.changes` shape that some older data may still use.
    const changes = Array.isArray(effect.changes) && effect.changes.length > 0
      ? effect.changes
      : (effect.system?.changes ?? []);

    if (!Array.isArray(changes) || changes.length === 0) continue;

    for (let i = 0; i < changes.length; i++) {
      const change = changes[i];
      if (!change?.key) continue;
      ops.push(...buildActiveEffectChangeOps_forChange(effect, i, change));
    }
  }

  return ops;
}
