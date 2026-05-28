/**
 * @jest-environment node
 */

import { resolveActorForRoll } from './resolveActorForRoll.js';

function setupGlobals({ canvasTokens = [], baseActors = [] } = {}) {
  globalThis.canvas = {
    tokens: {
      get(id) { return canvasTokens.find(t => t.id === id) ?? null; },
      placeables: canvasTokens
    }
  };
  globalThis.game = {
    actors: { get(id) { return baseActors.find(a => a.id === id) ?? null; } }
  };
}

describe('resolveActorForRoll', () => {
  test('prefers token actor over base actor when tokenId matches', () => {
    const tokenActor = { id: 'A', source: 'token' };
    const baseActor = { id: 'A', source: 'base' };
    setupGlobals({
      canvasTokens: [{ id: 'tok1', actor: tokenActor }],
      baseActors: [baseActor]
    });
    expect(resolveActorForRoll({ tokenId: 'tok1', actorId: 'A' })).toBe(tokenActor);
  });

  test('falls back to base actor when no token found', () => {
    const baseActor = { id: 'C', source: 'base' };
    setupGlobals({ canvasTokens: [], baseActors: [baseActor] });
    expect(resolveActorForRoll({ actorId: 'C' })).toBe(baseActor);
  });
});
