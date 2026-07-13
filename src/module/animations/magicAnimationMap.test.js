import {
  magicElementFor,
  magicEffectFor,
  magicTintFor,
  MAGIC_ANIMATION_MAP
} from './magicAnimationMap.js';

const VIAS = [
  'air', 'blood', 'chaos', 'creation', 'darkness', 'death', 'destruction', 'dreams',
  'earth', 'emptiness', 'essence', 'fire', 'freeAccess', 'illusion', 'knowledge', 'light',
  'literae', 'musical', 'necromancy', 'nobility', 'peace', 'sin', 'threshold', 'time',
  'war', 'water'
];
const DISCIPLINES = [
  'matrixPowers', 'telepathy', 'telekenisis', 'pyrokinesis', 'cryokinesis', 'energy',
  'telemetry', 'sentient', 'physicalIncrease'
];

describe('magicAnimationMap — resolver de elemento', () => {
  test('el dano ESPECIFICO (heat/cold/electricity) manda sobre la via; energy NO', () => {
    expect(magicElementFor({ via: 'fire', damageType: 'cold' })).toBe('ice');
    expect(magicElementFor({ via: 'water', damageType: 'heat' })).toBe('fire');
    expect(magicElementFor({ via: 'earth', damageType: 'electricity' })).toBe('lightning');
    // energy (dano generico, ~80% de los conjuros) NO manda: cae a la via tematica.
    expect(magicElementFor({ via: 'light', damageType: 'energy' })).toBe('light');
    expect(magicElementFor({ via: 'necromancy', damageType: 'energy' })).toBe('necrotic');
    expect(magicElementFor({ via: 'water', damageType: 'energy' })).toBe('water');
    // via abstracta con energy -> arcane (por la via, no por el dano).
    expect(magicElementFor({ via: 'destruction', damageType: 'energy' })).toBe('arcane');
  });

  test('la via decide cuando el dano no es elemental (cut/thrust/impact)', () => {
    expect(magicElementFor({ via: 'fire', damageType: 'cut' })).toBe('fire');
    expect(magicElementFor({ via: 'darkness' })).toBe('dark');
    expect(magicElementFor({ via: 'necromancy' })).toBe('necrotic');
    expect(magicElementFor({ via: 'death' })).toBe('necrotic');
    expect(magicElementFor({ via: 'air' })).toBe('wind');
    expect(magicElementFor({ via: 'musical' })).toBe('sound');
  });

  test('la disciplina psiquica manda sobre via y dano', () => {
    expect(magicElementFor({ psychicDiscipline: 'pyrokinesis', via: 'water' })).toBe('fire');
    expect(magicElementFor({ psychicDiscipline: 'cryokinesis' })).toBe('ice');
    expect(magicElementFor({ psychicDiscipline: 'telekenisis' })).toBe('force');
    expect(magicElementFor({ psychicDiscipline: 'telepathy' })).toBe('mind');
  });

  test('via/disciplina desconocida o vacia -> arcane', () => {
    expect(magicElementFor({ via: 'viaInventada' })).toBe('arcane');
    expect(magicElementFor({})).toBe('arcane');
  });
});

describe('magicAnimationMap — seleccion de efecto', () => {
  test('devuelve un array de candidatos', () => {
    expect(Array.isArray(magicEffectFor('fire', 'explosion'))).toBe(true);
    expect(magicEffectFor('fire', 'explosion').length).toBeGreaterThan(0);
  });

  test('cae al generico del rol cuando el elemento no lo define', () => {
    // el elemento "physical" (psiquico) solo tiene cast+aura -> proj/impact caen a generico.
    expect(magicEffectFor('physical', 'proj')).toEqual(MAGIC_ANIMATION_MAP.projGeneric);
    expect(magicEffectFor('physical', 'impact')).toEqual(MAGIC_ANIMATION_MAP.impactGeneric);
  });

  test('elemento nulo -> null', () => {
    expect(magicEffectFor(null, 'cast')).toBeNull();
  });
});

describe('magicAnimationMap — tinte de vias abstractas', () => {
  test('las vias abstractas tinen el arcano con colores distintos entre si', () => {
    expect(magicTintFor('destruction', 'arcane')).toBeTruthy();
    expect(magicTintFor('chaos', 'arcane')).toBeTruthy();
    expect(magicTintFor('destruction', 'arcane')).not.toBe(magicTintFor('creation', 'arcane'));
  });

  test('no tine si la via tiene elemento propio o el elemento no es arcane', () => {
    expect(magicTintFor('fire', 'fire')).toBeUndefined();
    expect(magicTintFor('necromancy', 'necrotic')).toBeUndefined();
    // via abstracta pero con dano especifico (elemento fuego) -> conserva su color, sin tinte.
    expect(magicTintFor('destruction', 'fire')).toBeUndefined();
  });

  test('freeAccess (arcano neutro) no se tine', () => {
    expect(magicTintFor('freeAccess', 'arcane')).toBeUndefined();
  });
});

describe('magicAnimationMap — cobertura total', () => {
  test('las 26 vias resuelven a un elemento con cast y con impacto o explosion', () => {
    for (const via of VIAS) {
      const el = magicElementFor({ via });
      expect(el).toBeTruthy();
      expect(magicEffectFor(el, 'cast')).toBeTruthy();
      expect(magicEffectFor(el, 'impact') || magicEffectFor(el, 'explosion')).toBeTruthy();
    }
  });

  test('las 9 disciplinas psiquicas resuelven a un elemento con cast', () => {
    for (const d of DISCIPLINES) {
      const el = magicElementFor({ psychicDiscipline: d });
      expect(el).toBeTruthy();
      expect(magicEffectFor(el, 'cast')).toBeTruthy();
    }
  });

  test('todo array del mapa tiene al menos un candidato', () => {
    for (const [key, arr] of Object.entries(MAGIC_ANIMATION_MAP)) {
      expect(Array.isArray(arr)).toBe(true);
      expect(arr.length).toBeGreaterThan(0);
      arr.forEach(id => expect(typeof id).toBe('string'));
    }
  });
});
