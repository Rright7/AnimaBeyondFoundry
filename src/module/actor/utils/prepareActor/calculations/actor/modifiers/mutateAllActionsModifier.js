import { calculateFatigue } from './calculations/calculateFatigue';
import {
  painReductionDivisor,
  applyPainReduction
} from '../../../../../../combat/painReduction.js';

/**
 * @param { import('../../../../../../types/Actor').ABFActorDataSourceData} data
 */
export const mutateAllActionsModifier = data => {
  const allActions = data.general.modifiers.allActions;

  // Robustez para actores creados ANTES de estos campos: Foundry no fusiona los nuevos
  // defaults de template.json en docs ya existentes, asi que sin esto el primer write de
  // painPenalty/physicalLack peta y aborta TODO el calculo del dolor (deja final = 0).
  const pp = (allActions.painPenalty = allActions.painPenalty ?? {});
  pp.base = pp.base ?? { value: 0 };
  pp.fatigue = pp.fatigue ?? { value: 0 };
  pp.final = pp.final ?? { value: 0 };
  allActions.painReduction = allActions.painReduction ?? { value: 0 };
  const pl = (allActions.physicalLack = allActions.physicalLack ?? {});
  pl.base = pl.base ?? { value: 0 };
  pl.final = pl.final ?? { value: 0 };
  allActions.otherFinal = allActions.otherFinal ?? { value: 0 };

  // "Dolor/Cansancio" (painPenalty): penalizador a TODA accion por dolor/cansancio,
  // extraido en su propia casilla para "Resistir el dolor". Su FINAL (no editable) =
  // lo manual (base) + el CANSANCIO automatico (calculateFatigue, que aparece cuando
  // el cansancio es <= 4). En el futuro se sumara aqui el dolor por heridas/criticos.
  // DOLOR (base, manual: heridas/criticos; en el futuro se recuperara a 5/asalto) y
  // CANSANCIO (fatigue, automatico via calculateFatigue) se guardan SEPARADOS aunque
  // el campo visible (final) muestre la suma de ambos.
  allActions.painPenalty.fatigue.value = calculateFatigue(data); // <= 0 (cansancio)
  const painDolor = Math.min(0, Number(allActions.painPenalty?.base?.value) || 0);
  let painFinal = painDolor + allActions.painPenalty.fatigue.value;

  // Habilidades de Ki/Nemesis sobre el penalizador por dolor/cansancio (flags en
  // kiBonus, las pone applyKiSkillsModifiers): el divisor (painReductionDivisor) es la
  // UNICA fuente -> "Esencia de Vacio" lo ELIMINA (Infinity); "Eliminacion de
  // penalizadores" lo divide (mitad; cuarto si se apila). La recuperacion (recoverPainStep)
  // usa el mismo divisor para que el ritmo cuadre con lo que se sufre.
  const kiBonus = data.general?.modifiers?.kiBonus ?? {};
  painFinal = applyPainReduction(painFinal, painReductionDivisor(kiBonus));

  // painPenalty.final = lo SUFRIDO de dolor/cansancio que se MUESTRA en la casilla:
  // (dolor+cansancio tras Ki) recortado por la reduccion activa de R.Dolor
  // (painReduction), capado a 0. base/special NO entran: son "otros" (R.Dolor los sufre
  // pero no los reduce).
  // painReduction se usa como MAGNITUD: da igual el signo (-20 y 20 reducen 20 igual).
  const reduction = Math.abs(Number(allActions.painReduction?.value) || 0);
  allActions.painPenalty.final.value = Math.min(0, painFinal + reduction);

  // "Carencias fisicas" (physicalLack): la mitad DURADERA del penalizador del critico
  // (la otra mitad es dolor). Penaliza toda accion igual que el dolor, pero NO se
  // recupera por asalto (su ritmo depende de la Regeneracion, Tabla 24: downtime) y NO
  // la reducen R.Dolor ni Esencia de Vacio / Eliminacion de penalizadores. "Uno con la
  // Nada" (nemesis) SI la elimina (physicalLackImmune).
  const physLack = Math.min(0, Number(allActions.physicalLack?.base?.value) || 0);
  allActions.physicalLack.final.value =
    Number(kiBonus.physicalLackImmune?.value) > 0 ? 0 : physLack;

  // "Acciones" (otherFinal) muestra solo los penalizadores a la accion "OTROS" (base +
  // special, manual/AE), SIN dolor/cansancio ni carencias (cada uno en su casilla). El
  // TOTAL aplicado a las acciones (final) los suma todos.
  allActions.otherFinal.value =
    (Number(allActions.base.value) || 0) + (Number(allActions.special.value) || 0);
  allActions.final.value =
    allActions.otherFinal.value +
    allActions.painPenalty.final.value +
    allActions.physicalLack.final.value;
};

mutateAllActionsModifier.abfFlow = {
  deps: [
    'system.general.modifiers.allActions.base.value',
    'system.general.modifiers.allActions.special.value',
    'system.general.modifiers.allActions.painPenalty.base.value',
    'system.general.modifiers.allActions.painReduction.value',
    'system.general.modifiers.allActions.physicalLack.base.value',
    'system.automationOptions.calculateFatigueModifier.value',
    'system.characteristics.secondaries.fatigue.value',
    'system.characteristics.secondaries.fatigue.max',
    'system.general.modifiers.kiBonus.painImmune.value',
    'system.general.modifiers.kiBonus.painHalf.value',
    'system.general.modifiers.kiBonus.physicalLackImmune.value'
  ],
  mods: [
    'system.general.modifiers.allActions.painPenalty.fatigue.value',
    'system.general.modifiers.allActions.painPenalty.final.value',
    'system.general.modifiers.allActions.physicalLack.final.value',
    'system.general.modifiers.allActions.otherFinal.value',
    'system.general.modifiers.allActions.final.value'
  ]
};
