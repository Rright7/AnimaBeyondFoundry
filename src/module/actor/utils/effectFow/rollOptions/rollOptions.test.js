import {
  slugifyOption,
  buildRollOptions,
  resetRollOptions,
  getRollOptions
} from './rollOptions.js';

function mockActor() {
  return {
    type: 'character',
    items: {
      contents: [
        { type: 'effect', name: 'Derribado', system: { active: true } },
        { type: 'effect', name: 'Ceguera parcial', system: { active: true } },
        { type: 'effect', name: 'Inactivo', system: { active: false } },
        { type: 'weapon', name: 'Hacha', system: {} }
      ]
    }
  };
}

describe('slugifyOption', () => {
  test('strips accents and lowercases', () => {
    expect(slugifyOption('Ceguera parcial')).toBe('ceguera-parcial');
  });
  test('collapses symbols to hyphens', () => {
    expect(slugifyOption('Flanco + ceguera absoluta')).toBe('flanco-ceguera-absoluta');
  });
  test('empty / null safe', () => {
    expect(slugifyOption('')).toBe('');
    expect(slugifyOption(null)).toBe('');
  });
});

describe('buildRollOptions', () => {
  test('emits self:type from actor type', () => {
    expect(buildRollOptions(mockActor()).has('self:type:character')).toBe(true);
  });

  test('emits self:effect / self:item for each active effect', () => {
    const o = buildRollOptions(mockActor());
    expect(o.has('self:effect:derribado')).toBe(true);
    expect(o.has('self:effect:ceguera-parcial')).toBe(true);
    expect(o.has('self:item:derribado')).toBe(true);
  });

  test('skips inactive effects', () => {
    expect(buildRollOptions(mockActor()).has('self:effect:inactivo')).toBe(false);
  });

  test('skips non-effect items', () => {
    expect(buildRollOptions(mockActor()).has('self:effect:hacha')).toBe(false);
  });

  test('safe on null actor', () => {
    expect(buildRollOptions(null).size).toBe(0);
  });

  test('actor with no items yields just self:type', () => {
    expect(buildRollOptions({ type: 'character' }).size).toBe(1);
  });
});

describe('resetRollOptions / getRollOptions', () => {
  test('resetRollOptions stores a fresh Set on the actor', () => {
    const a = mockActor();
    const set = resetRollOptions(a);
    expect(a.rollOptions).toBe(set);
    expect(a.rollOptions.has('self:effect:derribado')).toBe(true);
  });

  test('getRollOptions builds when absent', () => {
    const a = { type: 'npc', items: [] };
    expect(getRollOptions(a).has('self:type:npc')).toBe(true);
  });

  test('getRollOptions returns the existing set unchanged', () => {
    const a = mockActor();
    const set = resetRollOptions(a);
    expect(getRollOptions(a)).toBe(set);
  });
});
