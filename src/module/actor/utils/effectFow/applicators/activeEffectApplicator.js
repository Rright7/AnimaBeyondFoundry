// /module/actor/utils/effectFow/applicators/activeEffectApplicator.js

import { depositModifier } from '../modifiers/synthetics.js';

/**
 * Resolve an AE change.mode/type to a canonical string mode.
 * Accepts:
 *   - Foundry numeric modes: 1=multiply, 2=add, 3=downgrade, 4=upgrade, 5=override
 *   - Legacy string modes: 'add', 'multiply', 'override', 'upgrade', 'downgrade'
 * Returns one of: 'add' | 'multiply' | 'override' | 'upgrade' | 'downgrade'.
 * Defaults to 'add' when unrecognized.
 *
 * @param {string|number|undefined|null} raw
 * @returns {'add'|'multiply'|'override'|'upgrade'|'downgrade'}
 */
export function resolveChangeMode(raw) {
  if (typeof raw === 'string') {
    const s = raw.toLowerCase();
    if (s === 'add' || s === 'multiply' || s === 'override' || s === 'upgrade' || s === 'downgrade') {
      return s;
    }
  }
  if (typeof raw === 'number' || (typeof raw === 'string' && /^\d+$/.test(raw))) {
    const n = Number(raw);
    if (n === 1) return 'multiply';
    if (n === 2) return 'add';
    if (n === 3) return 'downgrade';
    if (n === 4) return 'upgrade';
    if (n === 5) return 'override';
  }
  return 'add';
}

export function applySingleActiveEffectChange(actor, effect, change) {
  const key = change.key;
  const mode = resolveChangeMode(change.mode ?? change.type);

  const rawValue =
    typeof actor._applyDynamicEffectValue === 'function'
      ? actor._applyDynamicEffectValue(change.value)
      : change.value;

  const beforeSystem = foundry.utils.getProperty(actor, key);

  const numericCurrent = Number(beforeSystem);
  const numericValue = Number(rawValue);
  const haveNumbers = !Number.isNaN(numericCurrent) && !Number.isNaN(numericValue);

  let nextValue = rawValue;

  switch (mode) {
    case 'add':
      nextValue = haveNumbers
        ? numericCurrent + numericValue
        : `${beforeSystem ?? ''}${rawValue ?? ''}`;
      break;

    case 'multiply':
      nextValue = haveNumbers ? numericCurrent * numericValue : beforeSystem;
      break;

    case 'upgrade':
      nextValue = haveNumbers
        ? Math.max(numericCurrent, numericValue)
        : rawValue;
      break;

    case 'downgrade':
      nextValue = haveNumbers
        ? Math.min(numericCurrent, numericValue)
        : rawValue;
      break;

    case 'override':
      // Coerce numeric strings to numbers so AE-override of a numeric path
      // stores a number, not a string. Non-numeric values pass through.
      nextValue = !Number.isNaN(numericValue) && typeof rawValue === 'string'
        ? numericValue
        : rawValue;
      break;

    default:
      nextValue = rawValue;
      break;
  }

  foundry.utils.setProperty(actor, key, nextValue);

  // Non-invasive attribution: record this contribution in the synthetics
  // mailbox so the chat breakdown can be built from a single reliable source.
  // Only add-mode numeric deltas are meaningful as a signed contribution; the
  // write above is unchanged regardless.
  //
  // Phase 3: the resolved change may carry a `predicate` (attached by the op
  // builder from the effect's flags). It travels with the record as metadata so
  // a consumer can gate this contribution at read time against the roll options.
  // The write above is intentionally NOT gated — the mailbox stays advisory.
  if (mode === 'add' && haveNumbers) {
    depositModifier(actor, {
      path: key,
      value: numericValue,
      source: effect?.name ?? effect?.label ?? 'AE',
      slug: effect?.slug ?? effect?.id ?? null,
      mode,
      predicate: Array.isArray(change.predicate) ? change.predicate : null
    });
  }
}
