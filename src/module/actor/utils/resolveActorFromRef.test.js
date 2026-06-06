import { resolveActorFromRef, buildActorRef } from './resolveActorForRoll.js';

/**
 * Regression tests for the unlinked-token fix: maneuver code must resolve and
 * persist the ON-MAP token actor, not the base sidebar actor. The hard case is
 * two UNLINKED tokens of the SAME base actor — they share an actor id, so only
 * a token ref (uuid or token id) tells them apart.
 *
 * We stub the Foundry globals these helpers touch (canvas / game / fromUuidSync).
 */

function makeWorld() {
  const baseActor = { id: 'BASE', name: 'Goblin (proto)' };
  // Distinct token actors, SAME base id.
  const tokActorA = { id: 'BASE', name: 'Goblin A' };
  const tokActorB = { id: 'BASE', name: 'Goblin B' };
  const heroActor = { id: 'HERO', name: 'Sigrid' };

  const tokA = { id: 'TOKA', actor: tokActorA, document: { uuid: 'Scene.S.Token.TOKA', id: 'TOKA', actor: tokActorA } };
  const tokB = { id: 'TOKB', actor: tokActorB, document: { uuid: 'Scene.S.Token.TOKB', id: 'TOKB', actor: tokActorB } };
  const tokHero = { id: 'TOKH', actor: heroActor, document: { uuid: 'Scene.S.Token.TOKH', id: 'TOKH', actor: heroActor } };
  tokActorA.token = tokA.document;
  tokActorB.token = tokB.document;
  heroActor.token = tokHero.document;

  const placeables = [tokA, tokB, tokHero];
  global.canvas = {
    tokens: { get: id => placeables.find(p => p.id === id) ?? null, placeables }
  };
  global.game = {
    actors: { get: id => (id === 'BASE' ? baseActor : id === 'HERO' ? heroActor : null) }
  };
  global.fromUuidSync = uuid => placeables.find(p => p.document.uuid === uuid)?.document ?? null;

  return { baseActor, tokActorA, tokActorB, heroActor, tokA, tokB };
}

afterEach(() => {
  delete global.canvas;
  delete global.game;
  delete global.fromUuidSync;
});

describe('resolveActorFromRef — token-aware resolution', () => {
  test('full token uuid resolves to that token actor (not the base)', () => {
    const { tokActorA, tokActorB } = makeWorld();
    expect(resolveActorFromRef('Scene.S.Token.TOKA')).toBe(tokActorA);
    expect(resolveActorFromRef('Scene.S.Token.TOKB')).toBe(tokActorB);
  });

  test('two unlinked tokens of the same base actor resolve to DIFFERENT actors', () => {
    makeWorld();
    expect(resolveActorFromRef('Scene.S.Token.TOKA')).not.toBe(
      resolveActorFromRef('Scene.S.Token.TOKB')
    );
  });

  test('plain token id resolves via the canvas', () => {
    const { tokActorA } = makeWorld();
    expect(resolveActorFromRef('TOKA')).toBe(tokActorA);
  });

  test('plain actor id falls back to game.actors.get', () => {
    const { heroActor } = makeWorld();
    expect(resolveActorFromRef('HERO')).toBe(heroActor);
  });

  test('empty / non-string refs return null', () => {
    makeWorld();
    expect(resolveActorFromRef('')).toBeNull();
    expect(resolveActorFromRef(null)).toBeNull();
    expect(resolveActorFromRef(undefined)).toBeNull();
  });
});

describe('buildActorRef — stable ref preferring the token uuid', () => {
  test('explicit tokenUuid wins', () => {
    const { tokActorA } = makeWorld();
    expect(buildActorRef({ actor: tokActorA, tokenUuid: 'Scene.S.Token.TOKA' })).toBe('Scene.S.Token.TOKA');
  });

  test('derives the token uuid from an unlinked actor', () => {
    const { tokActorB } = makeWorld();
    expect(buildActorRef({ actor: tokActorB })).toBe('Scene.S.Token.TOKB');
  });

  test('falls back to the actor id when there is no token', () => {
    makeWorld();
    expect(buildActorRef({ actor: { id: 'LONE' } })).toBe('LONE');
  });

  test('round-trips: build a ref then resolve it back to the same token actor', () => {
    const { tokActorA, tokActorB } = makeWorld();
    expect(resolveActorFromRef(buildActorRef({ actor: tokActorA }))).toBe(tokActorA);
    expect(resolveActorFromRef(buildActorRef({ actor: tokActorB }))).toBe(tokActorB);
  });
});
