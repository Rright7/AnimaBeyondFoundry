import {
  readGrappleSources,
  upsertGrappleSource,
  removeGrappleSource,
  findGrappleSource,
  grappleWasUnarmedAgainst
} from './grappleSources.js';

describe('grappleSources — read', () => {
  test('returns [] for missing / garbage input', () => {
    expect(readGrappleSources(null)).toEqual([]);
    expect(readGrappleSources(undefined)).toEqual([]);
    expect(readGrappleSources('x')).toEqual([]);
  });

  test('filters out entries without a valid targetId', () => {
    expect(
      readGrappleSources([
        { targetId: 'a', wasUnarmed: true },
        {},
        { targetId: '' },
        { x: 1 }
      ])
    ).toEqual([{ targetId: 'a', wasUnarmed: true }]);
  });
});

describe('grappleSources — upsert (key = targetId)', () => {
  test('adds a new entry', () => {
    expect(upsertGrappleSource(null, 'oni', true)).toEqual([{ targetId: 'oni', wasUnarmed: true }]);
  });

  test('same target UPDATES (no duplicate) — fixes the re-grapple leak', () => {
    let s = upsertGrappleSource(null, 'oni', false);
    s = upsertGrappleSource(s, 'oni', true);
    expect(s).toEqual([{ targetId: 'oni', wasUnarmed: true }]);
  });

  test('different target ADDS — two victims coexist', () => {
    let s = upsertGrappleSource(null, 'oni', false);
    s = upsertGrappleSource(s, 'goblin', true);
    expect(s).toHaveLength(2);
    expect(grappleWasUnarmedAgainst(s, 'oni')).toBe(false);
    expect(grappleWasUnarmedAgainst(s, 'goblin')).toBe(true);
  });

  test('does not mutate the input array', () => {
    const orig = [{ targetId: 'oni', wasUnarmed: false }];
    upsertGrappleSource(orig, 'goblin', true);
    expect(orig).toHaveLength(1);
  });
});

describe('grappleSources — regression scenarios', () => {
  test('one attacker: weaponed grapple on A then unarmed on B stay independent', () => {
    let s = upsertGrappleSource(null, 'oni', false);
    s = upsertGrappleSource(s, 'goblin', true);
    expect(grappleWasUnarmedAgainst(s, 'oni')).toBe(false);
    expect(grappleWasUnarmedAgainst(s, 'goblin')).toBe(true);
  });

  test('same attacker re-grapples same defender: latest value wins, no carry-over', () => {
    let s = upsertGrappleSource(null, 'oni', false);
    s = upsertGrappleSource(s, 'oni', true);
    expect(grappleWasUnarmedAgainst(s, 'oni')).toBe(true);
  });
});

describe('grappleSources — remove / find', () => {
  test('remove drops only the matching target', () => {
    let s = upsertGrappleSource(null, 'oni', false);
    s = upsertGrappleSource(s, 'goblin', true);
    expect(removeGrappleSource(s, 'oni').map(x => x.targetId)).toEqual(['goblin']);
  });

  test('find returns the entry or null', () => {
    const s = upsertGrappleSource(null, 'goblin', true);
    expect(findGrappleSource(s, 'goblin')).toEqual({ targetId: 'goblin', wasUnarmed: true });
    expect(findGrappleSource(s, 'nadie')).toBeNull();
  });

  test('grappleWasUnarmedAgainst is false without an entry', () => {
    expect(grappleWasUnarmedAgainst([], 'x')).toBe(false);
  });
});
