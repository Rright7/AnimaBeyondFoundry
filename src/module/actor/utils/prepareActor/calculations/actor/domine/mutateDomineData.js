import {
  kiPointsFromCharacteristic,
  kiAccumulationFromCharacteristic
} from './kiTable.js';

const KI_ACCUMULATIONS = [
  'strength',
  'agility',
  'dexterity',
  'constitution',
  'willPower',
  'power'
];

// Puntos de Ki por característica: byTable (tabla canónica) + byPd (comprados con PD).
const makeKiPointsMutator = accum => {
  const fn = data => {
    const charFinal = data.characteristics.primaries[accum].final.value;
    const kp = data.domine.kiAccumulation[accum].kiPoints;
    kp.byTable.value = kiPointsFromCharacteristic(charFinal);
    kp.final.value = kp.byTable.value + (kp.byPd.value || 0);
  };

  fn.abfFlow = {
    deps: [
      `system.characteristics.primaries.${accum}.final.value`,
      `system.domine.kiAccumulation.${accum}.kiPoints.byPd.value`
    ],
    mods: [
      `system.domine.kiAccumulation.${accum}.kiPoints.byTable.value`,
      `system.domine.kiAccumulation.${accum}.kiPoints.final.value`
    ]
  };

  Object.defineProperty(fn, 'name', { value: `mutateKiPoints_${accum}` });
  return fn;
};

export const mutateKiPointsStrength = makeKiPointsMutator('strength');
export const mutateKiPointsAgility = makeKiPointsMutator('agility');
export const mutateKiPointsDexterity = makeKiPointsMutator('dexterity');
export const mutateKiPointsConstitution = makeKiPointsMutator('constitution');
export const mutateKiPointsWillPower = makeKiPointsMutator('willPower');
export const mutateKiPointsPower = makeKiPointsMutator('power');

// Acumulación base por característica (tabla canónica).
const makeKiAccumulationBaseMutator = accum => {
  const fn = data => {
    const charFinal = data.characteristics.primaries[accum].final.value;
    data.domine.kiAccumulation[accum].base.value =
      kiAccumulationFromCharacteristic(charFinal);
  };

  fn.abfFlow = {
    deps: [`system.characteristics.primaries.${accum}.final.value`],
    mods: [`system.domine.kiAccumulation.${accum}.base.value`]
  };

  Object.defineProperty(fn, 'name', {
    value: `mutateKiAccumulationBase_${accum}`
  });
  return fn;
};

export const mutateKiAccumulationBaseStrength = makeKiAccumulationBaseMutator('strength');
export const mutateKiAccumulationBaseAgility = makeKiAccumulationBaseMutator('agility');
export const mutateKiAccumulationBaseDexterity = makeKiAccumulationBaseMutator('dexterity');
export const mutateKiAccumulationBaseConstitution = makeKiAccumulationBaseMutator('constitution');
export const mutateKiAccumulationBaseWillPower = makeKiAccumulationBaseMutator('willPower');
export const mutateKiAccumulationBasePower = makeKiAccumulationBaseMutator('power');

// Acumulación final: base ajustado por penalizador de todas las acciones + su mitad.
const makeKiAccumulationMutator = accum => {
  const fn = data => {
    const allActionsPenalty = data.general.modifiers.allActions.final.value;
    const acc = data.domine.kiAccumulation[accum];
    acc.final.value = Math.max(
      acc.base.value + Math.min(Math.ceil(allActionsPenalty / 20), 0),
      0
    );
    acc.half.value = Math.floor(acc.final.value / 2);
  };

  fn.abfFlow = {
    deps: [
      'system.general.modifiers.allActions.final.value',
      `system.domine.kiAccumulation.${accum}.base.value`
    ],
    mods: [
      `system.domine.kiAccumulation.${accum}.final.value`,
      `system.domine.kiAccumulation.${accum}.half.value`
    ]
  };

  Object.defineProperty(fn, 'name', { value: `mutateKiAccumulation_${accum}` });

  return fn;
};

export const mutateKiAccumulationStrength = makeKiAccumulationMutator('strength');
export const mutateKiAccumulationAgility = makeKiAccumulationMutator('agility');
export const mutateKiAccumulationDexterity = makeKiAccumulationMutator('dexterity');
export const mutateKiAccumulationConstitution = makeKiAccumulationMutator('constitution');
export const mutateKiAccumulationWillPower = makeKiAccumulationMutator('willPower');
export const mutateKiAccumulationPower = makeKiAccumulationMutator('power');

// Reserva de Ki unificada: suma de los Puntos de Ki finales de las 6 características.
export const mutateKiReserve = data => {
  const ka = data.domine.kiAccumulation;
  ka.reserve.max.value = KI_ACCUMULATIONS.reduce(
    (acc, accum) => acc + (ka[accum].kiPoints.final.value || 0),
    0
  );
};

mutateKiReserve.abfFlow = {
  deps: KI_ACCUMULATIONS.map(
    accum => `system.domine.kiAccumulation.${accum}.kiPoints.final.value`
  ),
  mods: ['system.domine.kiAccumulation.reserve.max.value']
};
