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

// Acumulación final: base (tabla) + bono manual (ventaja "Aumento de la Acumulación de
// Ki" o regla de la casa), ajustado por el penalizador de todas las acciones; suelo 0.
const makeKiAccumulationMutator = accum => {
  const fn = data => {
    const allActionsPenalty = data.general.modifiers.allActions.final.value;
    const acc = data.domine.kiAccumulation[accum];
    const bonus = Number(acc.bonus?.value) || 0;
    acc.final.value = Math.max(
      acc.base.value + bonus + Math.min(Math.ceil(allActionsPenalty / 20), 0),
      0
    );
    acc.half.value = Math.floor(acc.final.value / 2);
  };

  fn.abfFlow = {
    deps: [
      'system.general.modifiers.allActions.final.value',
      `system.domine.kiAccumulation.${accum}.base.value`,
      `system.domine.kiAccumulation.${accum}.bonus.value`
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

// Reserva de Ki unificada: base = suma de los Puntos de Ki finales de las 6
// características; máx = base + modificador (artefactos/extra, +/-).
export const mutateKiReserve = data => {
  const ka = data.domine.kiAccumulation;
  const base = KI_ACCUMULATIONS.reduce(
    (acc, accum) => acc + (ka[accum].kiPoints.final.value || 0),
    0
  );
  ka.reserve.base = ka.reserve.base ?? { value: 0 };
  ka.reserve.base.value = base;
  ka.reserve.modifier = ka.reserve.modifier ?? { value: 0 };
  const modifier = Number(ka.reserve.modifier.value) || 0;
  const max = Math.max(0, base + modifier);
  ka.reserve.max.value = max;

  // La reserva actual (lo que se gasta al usar/activar técnicas):
  //  - SIN inicializar (null/undefined/no numérico) -> arranca llena (= máx).
  //  - ya fijada -> se respeta y sólo se acota a [0, máx].
  // Importante: un 0 real (reserva agotada) se queda en 0; NO se rellena solo.
  ka.reserve.current = ka.reserve.current ?? { value: null };
  const raw = ka.reserve.current.value;
  const current = Number(raw);
  ka.reserve.current.value =
    raw === null || raw === undefined || raw === '' || !Number.isFinite(current)
      ? max
      : Math.min(Math.max(0, current), max);
};

mutateKiReserve.abfFlow = {
  deps: [
    ...KI_ACCUMULATIONS.map(
      accum => `system.domine.kiAccumulation.${accum}.kiPoints.final.value`
    ),
    'system.domine.kiAccumulation.reserve.modifier.value'
  ],
  mods: [
    'system.domine.kiAccumulation.reserve.base.value',
    'system.domine.kiAccumulation.reserve.max.value',
    'system.domine.kiAccumulation.reserve.current.value'
  ]
};
