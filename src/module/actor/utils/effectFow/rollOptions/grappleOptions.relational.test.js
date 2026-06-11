import { buildGrappleOptions } from './rollOptions.js';
import { upsertGrappleSource } from '../../../../combat/maneuvers/grappleSources.js';

// Attacker whose "Apresando" effect carries per-defender sources. Foundry's
// actor.items is a Collection: exposes .find AND .contents AND is iterable, so the
// mock provides both (.contents is what activeEffectItems spreads with [...]).
function attackerWithSources(sources) {
  const apresando = { type: 'effect', name: 'Apresando', system: { sources } };
  return {
    type: 'character',
    getFlag: () => undefined,
    items: { find: fn => [apresando].find(fn), contents: [apresando] }
  };
}

function defender(id) {
  return {
    id,
    items: { contents: [{ type: 'effect', name: 'Parálisis completa', system: { active: true } }] }
  };
}

describe('buildGrappleOptions — relational wasUnarmed (per defender)', () => {
  test('weaponed grapple on one victim, unarmed on another, do not clobber', () => {
    let src = upsertGrappleSource(null, 'oni', false);   // weaponed vs Oni
    src = upsertGrappleSource(src, 'goblin', true);       // unarmed vs Goblin
    const sig = attackerWithSources(src);

    const vsOni = buildGrappleOptions(sig, defender('oni'));
    const vsGoblin = buildGrappleOptions(sig, defender('goblin'));

    expect(vsOni.has('self:grappling')).toBe(true);
    expect(vsOni.has('self:grapple:unarmed')).toBe(false);
    expect(vsGoblin.has('self:grapple:unarmed')).toBe(true);
  });

  test('re-grappling the same defender updates wasUnarmed', () => {
    let src = upsertGrappleSource(null, 'oni', false);
    src = upsertGrappleSource(src, 'oni', true);
    const opts = buildGrappleOptions(attackerWithSources(src), defender('oni'));
    expect(opts.has('self:grapple:unarmed')).toBe(true);
  });

  test('grappling but evaluating against a defender with no source: no unarmed', () => {
    const src = upsertGrappleSource(null, 'oni', true);
    const opts = buildGrappleOptions(attackerWithSources(src), defender('alguien-mas'));
    expect(opts.has('self:grappling')).toBe(true);
    expect(opts.has('self:grapple:unarmed')).toBe(false);
  });

  test('no Apresando effect: not grappling', () => {
    const noGrab = {
      type: 'character',
      getFlag: () => undefined,
      items: { find: () => undefined, contents: [] }
    };
    expect(buildGrappleOptions(noGrab, defender('oni')).has('self:grappling')).toBe(false);
  });
});
