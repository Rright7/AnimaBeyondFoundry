import { Characteristic } from '../../../../types/concreteTypes/Characteristic.js';
import { Resistance } from '../../../../types/concreteTypes/Resistence.js';
import { TypeRegistry } from '../../../../types/TypeRegistry.js';
import { buildTypedNodes } from '../../../../types/runtimeTypedNodes.js';
import { inflateSystemFromTypeMarkers } from '../../../../types/inflateSystemFromTypeMarkers.js';
import { buildTypedOps } from '../../../effectFow/ops/builders/buildTypedOps.js';
import { buildDerivedOps } from '../../../effectFow/ops/builders/buildDerivedOps.js';
import { orderFlowOps } from '../../../effectFow/toposort.js';
import { mutatePresence } from './mutatePresence.js';
import {
  mutatePhysicalResistanceBase,
  mutatePhysicalResistanceFinal,
  mutateDiseaseResistanceBase,
  mutateDiseaseResistanceFinal,
  mutatePoisonResistanceBase,
  mutatePoisonResistanceFinal,
  mutateMagicResistanceBase,
  mutateMagicResistanceFinal,
  mutatePsychicResistanceBase,
  mutatePsychicResistanceFinal
} from './mutateResistances.js';

const RESISTANCE_ATTRIBUTES = {
  physical: 'constitution',
  disease: 'constitution',
  poison: 'constitution',
  magic: 'power',
  psychic: 'willPower'
};
const DERIVED_FNS = [
  mutatePresence,
  mutatePhysicalResistanceBase,
  mutatePhysicalResistanceFinal,
  mutateDiseaseResistanceBase,
  mutateDiseaseResistanceFinal,
  mutatePoisonResistanceBase,
  mutatePoisonResistanceFinal,
  mutateMagicResistanceBase,
  mutateMagicResistanceFinal,
  mutatePsychicResistanceBase,
  mutatePsychicResistanceFinal
];
const clone = value => JSON.parse(JSON.stringify(value));

function mergeObject(base, data) {
  const result = clone(base);
  for (const [key, value] of Object.entries(data)) {
    result[key] =
      value && typeof value === 'object' && !Array.isArray(value)
        ? mergeObject(result[key] ?? {}, value)
        : value;
  }
  return result;
}

beforeAll(() => {
  globalThis.foundry = {
    utils: {
      mergeObject,
      getProperty: (object, path) =>
        path.split('.').reduce((node, key) => node?.[key], object),
      setProperty: (object, path, value) => {
        const keys = path.split('.');
        const last = keys.pop();
        const parent = keys.reduce((node, key) => (node[key] ??= {}), object);
        parent[last] = value;
      }
    }
  };
  TypeRegistry.register(Characteristic);
  TypeRegistry.register(Resistance);
});

function makeActor(legacy, special = 7, kiBonus = 10) {
  const resistances = {};
  for (const [key, characteristicKey] of Object.entries(RESISTANCE_ATTRIBUTES)) {
    // The old template persisted these markers; the current template uses plain nodes.
    resistances[key] = {
      ...(legacy
        ? { __type: JSON.stringify({ type: 'Resistance', characteristicKey }) }
        : {}),
      base: { value: 999 },
      special: { value: special },
      final: { value: 999 }
    };
  }
  const primaries = {};
  for (const [key, value] of Object.entries({
    constitution: 8,
    power: 10,
    willPower: 12
  })) {
    primaries[key] = {
      base: { value },
      special: { value: 0 },
      final: { value: 999 },
      mod: { value: 999 }
    };
  }
  return {
    _source: {
      system: {
        general: {
          level: { value: 1 },
          presence: {
            base: { value: 999 },
            special: { value: 0 },
            final: { value: 999 }
          },
          modifiers: {
            kiBonus: {
              resistances: Object.fromEntries(
                Object.keys(RESISTANCE_ATTRIBUTES).map(key => [key, { value: kiBonus }])
              )
            }
          }
        },
        characteristics: { primaries, secondaries: { resistances } }
      }
    }
  };
}

async function prepareResistances(actor) {
  actor.system = inflateSystemFromTypeMarkers(clone(actor._source.system));
  const typedPaths = new Map(
    ['constitution', 'power', 'willPower'].map(key => [
      `system.characteristics.primaries.${key}`,
      'Characteristic'
    ])
  );
  buildTypedNodes(actor, typedPaths);
  const ops = [...buildTypedOps(actor), ...buildDerivedOps(DERIVED_FNS)];
  const ordered = orderFlowOps(ops);
  expect(ordered).toHaveLength(ops.length);
  for (const op of ordered) await op.apply(actor);
  return actor.system.characteristics.secondaries.resistances;
}

describe('resistance preparation across actor versions', () => {
  test.each([true, false])(
    'presence + characteristic modifier + special + Ki (legacy markers: %s)',
    async legacy => {
      const actor = makeActor(legacy);
      const source = clone(actor._source);
      const resistances = await prepareResistances(actor);
      // Level 1: presence 30. CON 8: +10, POD 10: +15, VOL 12: +20.
      const bases = { physical: 40, disease: 40, poison: 40, magic: 45, psychic: 50 };
      for (const [key, base] of Object.entries(bases)) {
        expect(resistances[key].base.value).toBe(base);
        expect(resistances[key].special.value).toBe(7);
        expect(resistances[key].final.value).toBe(base + 7 + 10);
      }
      expect(await prepareResistances(actor)).toEqual(resistances);
      expect(actor._source).toEqual(source);
    }
  );

  test('legacy actors retain negative modifiers and the minimum final of zero', async () => {
    const actor = makeActor(true, -100, 0);
    const resistances = await prepareResistances(actor);
    for (const resistance of Object.values(resistances)) {
      expect(resistance.special.value).toBe(-100);
      expect(resistance.final.value).toBe(0);
    }
  });
});
