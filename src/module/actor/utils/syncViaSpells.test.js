import { diffViaSpells } from './syncViaSpells.js';

const spell = (name, via, level, id) => ({
  id,
  name,
  system: { via: { value: via }, level: { value: level } }
});

const PACK = [
  spell('Llama', 'fire', 20),
  spell('Muralla de Fuego', 'fire', 60),
  spell('Infierno', 'fire', 80),
  spell('Rayo de Luz', 'light', 40)
];

describe('diffViaSpells', () => {
  it('adds via spells up to the new level when none present', () => {
    const { toRemoveIds, toAdd } = diffViaSpells([], PACK, 'fire', 60);
    expect(toRemoveIds).toEqual([]);
    expect(toAdd.map(s => s.name)).toEqual(['Llama', 'Muralla de Fuego']);
  });

  it('removes current via spells above the new level', () => {
    const current = [
      spell('Llama', 'fire', 20, 'a'),
      spell('Muralla de Fuego', 'fire', 60, 'b'),
      spell('Infierno', 'fire', 80, 'c')
    ];
    const { toRemoveIds, toAdd } = diffViaSpells(current, PACK, 'fire', 60);
    expect(toRemoveIds).toEqual(['c']);
    expect(toAdd).toEqual([]);
  });

  it('only touches the given via', () => {
    const current = [spell('Rayo de Luz', 'light', 40, 'x')];
    const { toRemoveIds, toAdd } = diffViaSpells(current, PACK, 'fire', 10);
    expect(toRemoveIds).toEqual([]);
    expect(toAdd).toEqual([]);
  });

  it('does not duplicate spells already present (by name)', () => {
    const current = [spell('Llama', 'fire', 20, 'a')];
    const { toAdd } = diffViaSpells(current, PACK, 'fire', 60);
    expect(toAdd.map(s => s.name)).toEqual(['Muralla de Fuego']);
  });

  it('is idempotent once synced', () => {
    const current = [
      spell('Llama', 'fire', 20, 'a'),
      spell('Muralla de Fuego', 'fire', 60, 'b')
    ];
    const { toRemoveIds, toAdd } = diffViaSpells(current, PACK, 'fire', 60);
    expect(toRemoveIds).toEqual([]);
    expect(toAdd).toEqual([]);
  });

  it('lowering the level to 0 removes all of that via, keeps others', () => {
    const current = [
      spell('Llama', 'fire', 20, 'a'),
      spell('Rayo de Luz', 'light', 40, 'x')
    ];
    const { toRemoveIds, toAdd } = diffViaSpells(current, PACK, 'fire', 0);
    expect(toRemoveIds).toEqual(['a']);
    expect(toAdd).toEqual([]);
  });
});
