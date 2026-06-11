import { selectSpells } from './selectSpells.js';

const spell = (name, via, level) => ({
  name,
  system: { via: { value: via }, level: { value: level } }
});

const ALL = [
  spell('Llama', 'fire', 20),
  spell('Muralla de Fuego', 'fire', 60),
  spell('Infierno', 'fire', 80),
  spell('Rayo de Luz', 'light', 40),
  spell('Detener el Tiempo', 'time', 90),
  spell('Mensaje', 'freeAccess', null),
  spell('Detección', 'freeAccess', 0)
];

describe('selectSpells', () => {
  it('includes via spells at or below the via level', () => {
    const out = selectSpells(ALL, [{ viaKey: 'fire', level: 60 }], {
      includeFreeAccess: false
    });
    expect(out.map(s => s.name)).toEqual(['Llama', 'Muralla de Fuego']);
  });

  it('excludes vias the character did not pick', () => {
    const out = selectSpells(ALL, [{ viaKey: 'fire', level: 80 }], {
      includeFreeAccess: false
    });
    expect(out.some(s => s.system.via.value === 'light')).toBe(false);
    expect(out.some(s => s.system.via.value === 'time')).toBe(false);
  });

  it('includes all freeAccess spells when includeFreeAccess', () => {
    const out = selectSpells(ALL, [{ viaKey: 'fire', level: 10 }], {
      includeFreeAccess: true
    });
    expect(out.map(s => s.name).sort()).toEqual(['Detección', 'Mensaje']);
  });

  it('omits freeAccess when includeFreeAccess is false', () => {
    const out = selectSpells(ALL, [{ viaKey: 'light', level: 40 }], {
      includeFreeAccess: false
    });
    expect(out.map(s => s.name)).toEqual(['Rayo de Luz']);
  });

  it('treats null level as 0 (included for any picked via)', () => {
    const out = selectSpells(
      [spell('Sin nivel', 'water', null)],
      [{ viaKey: 'water', level: 5 }],
      { includeFreeAccess: false }
    );
    expect(out).toHaveLength(1);
  });

  it('returns [] when no vias are selected', () => {
    expect(selectSpells(ALL, [], { includeFreeAccess: false })).toEqual([]);
  });
});
