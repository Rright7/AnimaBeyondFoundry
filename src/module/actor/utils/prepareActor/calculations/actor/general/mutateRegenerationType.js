import { calculateRegenerationTypeFromConstitution } from './calculations/calculateRegenerationTypeFromConstitution';
import { calculateRegenerationFromRegenerationType } from './calculations/calculateRegenerationFromRegenerationType';
import { realCharacteristicValue } from '../../util/characteristicLimits';

export const mutateRegenerationType = data => {
  const { regenerationType } = data.characteristics.secondaries;

  // La Regeneracion es una derivada implicita de la Constitucion: usa su valor REAL,
  // no el topado por Inhumanidad/Zen (igual que el bono). Con CON 11 sin Inhumanidad
  // la Regeneracion sigue siendo la de 11.
  const baseRegen = calculateRegenerationTypeFromConstitution(
    realCharacteristicValue(data.characteristics.primaries.constitution)
  );

  regenerationType.final.value = Math.max(0, regenerationType.mod.value + baseRegen);

  // eslint-disable-next-line prefer-const
  let [resting, normal, recovery] = calculateRegenerationFromRegenerationType(
    regenerationType.final.value
  );

  data.characteristics.secondaries.regeneration.resting = resting;
  if (normal === null) normal = resting;
  data.characteristics.secondaries.regeneration.normal = normal;
  data.characteristics.secondaries.regeneration.recovery = recovery;
};

mutateRegenerationType.abfFlow = {
  deps: [
    // Valor REAL de Constitucion (base+special), no el 'final' topado por Inhumanidad:
    // asi recalcula aunque el final capado no cambie (p.ej. 10 -> 11 con tope 10).
    'system.characteristics.primaries.constitution.base.value',
    'system.characteristics.primaries.constitution.special.value',
    'system.characteristics.secondaries.regenerationType.mod.value'
  ],
  mods: [
    'system.characteristics.secondaries.regenerationType.final.value',
    'system.characteristics.secondaries.regeneration.resting',
    'system.characteristics.secondaries.regeneration.normal',
    'system.characteristics.secondaries.regeneration.recovery'
  ]
};
