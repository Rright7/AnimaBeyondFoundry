import {
  getActiveEffectContributions,
  getPathContributions,
  formatContributions
} from './activeEffectsBreakdown.js';

const ATT = 'system.combat.attack.final.value';

function actorWithMailbox(records) {
  return { synthetics: { modifiers: { [ATT]: records } } };
}

describe('getActiveEffectContributions — de-dupe', () => {
  test('collapses duplicate deposits of the same source (chat double-listing bug)', () => {
    const actor = actorWithMailbox([
      { path: ATT, value: -30, source: 'Derribado', slug: null, mode: 'add' },
      { path: ATT, value: -30, source: 'Ceguera parcial', slug: null, mode: 'add' },
      { path: ATT, value: -30, source: 'Ceguera parcial', slug: null, mode: 'add' },
      { path: ATT, value: -30, source: 'Derribado', slug: null, mode: 'add' }
    ]);
    const contribs = getActiveEffectContributions(actor, 'attack');
    expect(contribs).toHaveLength(2);
    expect(contribs.map(c => c.name).sort()).toEqual(['Ceguera parcial', 'Derribado']);
  });

  test('keeps distinct sources with same value', () => {
    const actor = actorWithMailbox([
      { path: ATT, value: -30, source: 'Derribado', slug: null, mode: 'add' },
      { path: ATT, value: -30, source: 'Ceguera parcial', slug: null, mode: 'add' }
    ]);
    expect(getActiveEffectContributions(actor, 'attack')).toHaveLength(2);
  });

  test('formats the deduped line correctly', () => {
    const actor = actorWithMailbox([
      { path: ATT, value: -30, source: 'Derribado', slug: null, mode: 'add' },
      { path: ATT, value: -30, source: 'Derribado', slug: null, mode: 'add' }
    ]);
    const line = formatContributions(getActiveEffectContributions(actor, 'attack'));
    expect(line).toBe('Mod: Derribado (-30)');
  });

  test('unknown attribute returns empty', () => {
    expect(getActiveEffectContributions({}, 'nope')).toEqual([]);
  });
});

describe('getPathContributions — sheet rollables (resistances / characteristics)', () => {
  const RES = 'system.characteristics.secondaries.resistances.physical.final.value';

  test('reads contributions for an explicit path (Ki technique on RF)', () => {
    const actor = {
      synthetics: {
        modifiers: {
          [RES]: [
            { path: RES, value: 50, source: 'Coraza de Ki', slug: 'technique:tA:resistancePhysical', mode: 'add' }
          ]
        }
      }
    };
    const contribs = getPathContributions(actor, RES);
    expect(contribs).toEqual([{ name: 'Coraza de Ki', value: 50, mode: 'add' }]);
    expect(formatContributions(contribs)).toBe('Mod: Coraza de Ki (+50)');
  });

  test('accepts a single path string or an array', () => {
    const actor = { synthetics: { modifiers: { [RES]: [{ path: RES, value: 20, source: 'X', mode: 'add' }] } } };
    expect(getPathContributions(actor, [RES])).toHaveLength(1);
    expect(getPathContributions(actor, RES)).toHaveLength(1);
  });

  test('empty / missing paths return empty', () => {
    expect(getPathContributions({}, [])).toEqual([]);
    expect(getPathContributions({}, null)).toEqual([]);
  });
});
