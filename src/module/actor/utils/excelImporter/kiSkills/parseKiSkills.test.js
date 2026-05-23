/**
 * Tests for the Ki / Nemesis importer.
 *
 * Two layers of coverage:
 *   1. Pure helpers (splitKiAndNemesis, expandElementalAttack, normalizeForLookup,
 *      stripTrailingValue) — fast, no mocks.
 *   2. importKiSkills against a stub actor — verifies that every name pattern the
 *      old inline importer handled still produces the same kiSkill/nemesisSkill
 *      items, plus the new canonical enrichment. Includes a fixture matching
 *      Sigrid Vahr's actual Excel output to prove zero regressions.
 */
import {
  importKiSkills,
  splitKiAndNemesis,
  expandElementalAttack,
  stripTrailingValue,
  normalizeForLookup
} from './parseKiSkills.js';
import { KI_SKILLS, findKiSkillByName } from './kiSkills.js';

function makeActor() {
  const created = [];
  return {
    created,
    createInnerItem: async item => {
      created.push(item);
    }
  };
}

describe('canonical data', () => {
  test('has 73 entries — 54 Ki + 19 Nemesis', () => {
    expect(KI_SKILLS).toHaveLength(73);
    expect(KI_SKILLS.filter(s => s.type === 'ki')).toHaveLength(54);
    expect(KI_SKILLS.filter(s => s.type === 'nemesis')).toHaveLength(19);
  });

  test('every entry has the required fields', () => {
    for (const s of KI_SKILLS) {
      expect(typeof s.id).toBe('string');
      expect(typeof s.name).toBe('string');
      expect(['ki', 'nemesis']).toContain(s.type);
      expect(typeof s.martialKnowledge).toBe('number');
      expect(s.tree).toBeDefined();
      expect(typeof s.tree.depth).toBe('number');
      expect(s.aliases).toBeDefined();
      expect(Array.isArray(s.aliases.es)).toBe(true);
      expect(Array.isArray(s.effects)).toBe(true);
    }
  });

  test('parent ids actually exist in the table', () => {
    const ids = new Set(KI_SKILLS.map(s => s.id));
    for (const s of KI_SKILLS) {
      if (s.tree.parent !== null) {
        expect(ids).toContain(s.tree.parent);
      }
    }
  });

  test('findKiSkillByName matches by exact name', () => {
    expect(findKiSkillByName('Uso del Ki')?.id).toBe('kiUse');
    expect(findKiSkillByName('Aura de combate')?.id).toBe('combatAura');
    expect(findKiSkillByName('Uso del Némesis')?.id).toBe('nemesisUse');
  });

  test('findKiSkillByName is whitespace-tolerant and returns undefined on miss', () => {
    expect(findKiSkillByName('  Uso del Ki  ')?.id).toBe('kiUse');
    expect(findKiSkillByName('Habilidad inventada')).toBeUndefined();
    expect(findKiSkillByName('')).toBeUndefined();
    expect(findKiSkillByName(null)).toBeUndefined();
  });
});

describe('splitKiAndNemesis', () => {
  test('returns empty parts for non-string input', () => {
    expect(splitKiAndNemesis(undefined)).toEqual({ ki: '', nemesis: '' });
    expect(splitKiAndNemesis(null)).toEqual({ ki: '', nemesis: '' });
    expect(splitKiAndNemesis(42)).toEqual({ ki: '', nemesis: '' });
  });

  test('returns only Ki when no Nemesis marker is present', () => {
    const out = splitKiAndNemesis('Uso del Ki, Control del Ki');
    expect(out.ki).toBe('Uso del Ki, Control del Ki');
    expect(out.nemesis).toBe('');
  });

  test('splits Ki and Nemesis at the "Uso del Némesis" marker', () => {
    const out = splitKiAndNemesis(
      'Uso del Ki, Control del Ki, Uso del Némesis, Armadura de vacío'
    );
    // expandElementalAttack trims the trailing comma left by the slice
    expect(out.ki).toBe('Uso del Ki, Control del Ki');
    expect(out.nemesis).toBe('Uso del Némesis, Armadura de vacío');
  });

  test('strips the "Sellos: …" tail before splitting', () => {
    const out = splitKiAndNemesis(
      'Uso del Ki, Levitación, Sellos: dragón menor, lobo mayor'
    );
    expect(out.ki).toBe('Uso del Ki, Levitación');
    expect(out.nemesis).toBe('');
  });

  test('expands Ataque elemental on the Ki side', () => {
    const out = splitKiAndNemesis('Uso del Ki, Ataque elemental (Fuego, Hielo)');
    expect(out.ki).toBe('Uso del Ki, Ataque elemental: Fuego, Ataque elemental: Hielo');
  });
});

describe('expandElementalAttack', () => {
  test('expands a single elemental list into per-element entries', () => {
    expect(expandElementalAttack('Ataque elemental (Fuego, Hielo, Eléctrico)')).toBe(
      'Ataque elemental: Fuego, Ataque elemental: Hielo, Ataque elemental: Eléctrico'
    );
  });

  test('returns input unchanged when no Ataque elemental occurs', () => {
    expect(expandElementalAttack('Uso del Ki, Control del Ki')).toBe(
      'Uso del Ki, Control del Ki'
    );
  });

  test('handles empty input', () => {
    expect(expandElementalAttack('')).toBe('');
  });

  test('trims trailing commas after expansion', () => {
    expect(expandElementalAttack('Ataque elemental (Fuego),')).toBe(
      'Ataque elemental: Fuego'
    );
  });
});

describe('normalizeForLookup', () => {
  test('strips elemental-attack element suffix', () => {
    expect(normalizeForLookup('Ataque elemental: Fuego')).toBe('Ataque elemental');
  });

  test('strips trailing numeric value', () => {
    expect(normalizeForLookup('Detección del Ki 50')).toBe('Detección del Ki');
    expect(normalizeForLookup('Ocultación del Ki 30')).toBe('Ocultación del Ki');
  });

  test('does not strip non-numeric suffix words', () => {
    expect(normalizeForLookup('Inmunidad elem. FUE')).toBe('Inmunidad elem. FUE');
  });

  test('preserves canonical names unchanged', () => {
    expect(normalizeForLookup('Uso del Ki')).toBe('Uso del Ki');
  });
});

describe('stripTrailingValue', () => {
  test('removes the last whitespace-separated token', () => {
    expect(stripTrailingValue('Detección del Ki 50')).toBe('Detección del Ki');
    expect(stripTrailingValue('Ocultación del Ki 30')).toBe('Ocultación del Ki');
  });
});

describe('importKiSkills — Sigrid Vahr fixture (zero-regression baseline)', () => {
  test("imports Sigrid's six abilities with correct types and canonical enrichment", async () => {
    const actor = makeActor();
    const sigridString =
      'Uso del Ki, Control del Ki, Levitación, Uso de la energía necesaria, Uso del Némesis, Armadura de vacío';

    const result = await importKiSkills(actor, sigridString);

    expect(actor.created.map(i => ({ name: i.name, type: i.type }))).toEqual([
      { name: 'Uso del Ki', type: 'kiSkill' },
      { name: 'Control del Ki', type: 'kiSkill' },
      { name: 'Levitación', type: 'kiSkill' },
      { name: 'Uso de la energía necesaria', type: 'kiSkill' },
      { name: 'Uso del Némesis', type: 'nemesisSkill' },
      { name: 'Armadura de vacío', type: 'nemesisSkill' }
    ]);

    expect(result).toEqual({ ki: 4, nemesis: 2, notFound: [] });
  });

  test('enriches each item with canonical system data', async () => {
    const actor = makeActor();
    await importKiSkills(actor, 'Uso del Ki, Uso del Némesis');

    expect(actor.created[0].system).toEqual({
      martialKnowledge: { value: 40 },
      canonicalId: 'kiUse',
      tree: { parent: null, depth: 0 }
    });
    expect(actor.created[1].system).toEqual({
      martialKnowledge: { value: 70 },
      canonicalId: 'nemesisUse',
      tree: { parent: null, depth: 0 }
    });
  });
});

describe('importKiSkills — edge cases preserved from old importer', () => {
  test('no input → no items created, no errors', async () => {
    const actor = makeActor();
    const result = await importKiSkills(actor, undefined);
    expect(actor.created).toEqual([]);
    expect(result).toEqual({ ki: 0, nemesis: 0, notFound: [] });
  });

  test('empty string → no items created', async () => {
    const actor = makeActor();
    const result = await importKiSkills(actor, '');
    expect(actor.created).toEqual([]);
    expect(result.ki).toBe(0);
    expect(result.nemesis).toBe(0);
  });

  test('Detección del Ki value-stripping still works', async () => {
    const actor = makeActor();
    await importKiSkills(actor, 'Control del Ki, Detección del Ki 50');

    expect(actor.created[1]).toMatchObject({
      name: 'Detección del Ki',
      type: 'kiSkill'
    });
    expect(actor.created[1].system.canonicalId).toBe('kiDetection');
    expect(actor.created[1].system.martialKnowledge.value).toBe(20);
  });

  test('Ocultación del Ki value-stripping still works', async () => {
    const actor = makeActor();
    await importKiSkills(actor, 'Uso de la energía necesaria, Ocultación del Ki 30');

    expect(actor.created[1]).toMatchObject({
      name: 'Ocultación del Ki',
      type: 'kiSkill'
    });
    expect(actor.created[1].system.canonicalId).toBe('kiHiding');
  });

  test('Ataque elemental (Fuego, Hielo) creates two items with element preserved in name', async () => {
    const actor = makeActor();
    await importKiSkills(actor, 'Ataque elemental (Fuego, Hielo)');

    expect(actor.created).toHaveLength(2);
    expect(actor.created[0].name).toBe('Ataque elemental: Fuego');
    expect(actor.created[1].name).toBe('Ataque elemental: Hielo');
    expect(actor.created[0].system.canonicalId).toBe('elementalAttack');
    expect(actor.created[1].system.canonicalId).toBe('elementalAttack');
  });

  test('Sellos suffix is stripped before processing', async () => {
    const actor = makeActor();
    await importKiSkills(actor, 'Uso del Ki, Sellos: dragón menor');

    expect(actor.created.map(i => i.name)).toEqual(['Uso del Ki']);
  });

  test('unknown ability is still created (empty system) and reported in notFound', async () => {
    const actor = makeActor();
    const result = await importKiSkills(actor, 'Habilidad inventada, Uso del Ki');

    expect(actor.created).toHaveLength(2);
    expect(actor.created[0]).toEqual({
      name: 'Habilidad inventada',
      type: 'kiSkill',
      system: {}
    });
    expect(actor.created[1].system.canonicalId).toBe('kiUse');
    expect(result.notFound).toEqual(['Habilidad inventada']);
  });
});
