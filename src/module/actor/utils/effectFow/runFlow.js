import { buildAllFlowOps } from './ops/buildOps';
import { orderFlowOps } from './toposort';
import { resetSynthetics } from './modifiers/synthetics.js';

/**
 * Build -> order -> apply the flow operations.
 *
 * @param {any} actor
 * @param {{ derivedFns?: Function[], debug?: boolean }} options
 * @returns {Promise<any[]>} ordered ops (useful for debugging/tests)
 */
export async function runEffectFlow(actor, options = {}) {
  // Start each preparation with a clean modifiers mailbox so deposits from a
  // previous run never leak into this one. Populated as AE ops apply below.
  resetSynthetics(actor);

  const ops = buildAllFlowOps(actor, options);
  const ordered = orderFlowOps(ops);

  for (const op of ordered) {
    // Debug-friendly hook
    if (options.debug) {
      // eslint-disable-next-line no-console
      console.log('[effectFlow] apply', op.id, { deps: op.deps, mods: op.mods });
    }

    await op.apply(actor);
  }

  return ordered;
}
