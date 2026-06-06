import { buildAllFlowOps } from './ops/buildOps';
import { orderFlowOps } from './toposort';
import { resetSynthetics } from './modifiers/synthetics.js';
import { resetRollOptions } from './rollOptions/rollOptions.js';

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

  // Rebuild the actor's roll options for this cycle (self:type, self:effect:*…)
  // so predicate-gated modifiers are evaluated against fresh context. Cheap and
  // side-effect-light; stored on actor.rollOptions.
  resetRollOptions(actor);

  const ops = buildAllFlowOps(actor, options);
  const ordered = orderFlowOps(ops);

  for (const op of ordered) {
    // Debug-friendly hook
    if (options.debug) {
      // eslint-disable-next-line no-console
      console.log('[effectFlow] apply', op.id, { deps: op.deps, mods: op.mods });
    }

    // Un op que falle se aísla y se loguea: nunca debe abortar TODA la
    // preparación (lo que rompía el re-render entero de la ficha).
    try {
      await op.apply(actor);
    } catch (err) {
      console.error(`animabf | derived op "${op?.id}" failed`, err);
    }
  }

  return ordered;
}
