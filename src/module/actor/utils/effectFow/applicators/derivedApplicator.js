/**
 * Execute a derived function against the actor system.
 *
 * The actor is passed as a second argument so derived functions that want to
 * record provenance (synthetics mailbox) or otherwise reach the document can do
 * so. Existing functions that only declare `data` simply ignore it.
 *
 * @param {any} actor
 * @param {Function} derivedFn
 */
export async function applyDerived(actor, derivedFn) {
  return derivedFn(actor.system, actor);
}
