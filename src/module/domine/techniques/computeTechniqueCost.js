import { getEffect, getDisadvantage, KI_CHARACTERISTICS } from './effectCatalog';

/**
 * Motor de coste del constructor de Técnicas de Ki.
 *
 * Aritmética fundamentada celda a celda en "Ficha Anima v8.7.0.xlsm" -> hojas
 * "Creación de Técnicas" (sheet9) y "Tablas Técnicas" (sheet17). Puro: sin
 * dependencias de Foundry para poder testearse aislado.
 *
 * Decisiones del usuario reflejadas aquí:
 *  - Fiel al Excel oficial: coexistir Sostenimiento Menor + Mayor SUMA ambos
 *    sobrecostes de CM (20·Nv + 30·Nv); Combinable cobra a la vez +10·Nv CM y
 *    +3·Nv Ki.
 *  - El descuento de CM "Reducción CM Legado" (col X de sheet17) depende de la
 *    ventaja Empatía Elemental del personaje, no del efecto -> inactivo por
 *    defecto (cmEffect = cmRaw).
 *  - Las validaciones son AVISOS no bloqueantes (banderas true = aviso).
 */

const num = v => Number(v) || 0;

const sumChars = obj => KI_CHARACTERISTICS.reduce((s, c) => s + num(obj?.[c]), 0);

const cmFloorFor = level => (level >= 3 ? 60 : level >= 2 ? 40 : 20);

const cmCeilingFor = level => (level >= 3 ? 200 : level >= 2 ? 100 : 50);

const APPROX = 1e-9;

/**
 * @param {object} build  Sub-objeto technique.system.build (ver template.json).
 * @returns {object} El objeto `computed` con coste, desglose y validaciones.
 */
export function computeTechniqueCost(build) {
  const level = num(build?.level) || 1;
  const combinable = !!build?.combinable;
  const kiReductionLine = num(build?.kiReductionLine); // Y21
  const cmReductionLine = num(build?.cmReductionLine); // AC21 (normalmente <= 0)
  const redistribution = build?.redistribution ?? {}; // fila 23 (V23:AG23)

  // --- Por efecto (filas 16-20) ---------------------------------------------
  const effects = (build?.effects ?? []).map((row, idx) => {
    const def = getEffect(row?.effectId);
    const role = row?.role || (idx === 0 ? 'primary' : 'secondary');
    const tierOptions = row?.tierOptions ?? [];
    const maintMode = row?.maintMode || 'none';
    const kiBy = row?.kiByCharacteristic ?? {};
    const maintKiBy = row?.maintKiByCharacteristic ?? {};
    const tiers = def ? def.tiers.filter(t => tierOptions.includes(t.option)) : [];

    // Ki base: col E (Primario) o col F (Secundario), sumando opciones elegidas.
    const kiBaseSum = tiers.reduce(
      (s, t) => s + num(role === 'primary' ? t.kiPrimary : t.kiSecondary),
      0
    );
    // Sostenimiento: col I (Menor) / col J (Mayor) por opción.
    const kiSustainSum = tiers.reduce((s, t) => {
      if (maintMode === 'sustainMinor') return s + num(t.sMe);
      if (maintMode === 'sustainMajor') return s + num(t.sMa);
      return s;
    }, 0);
    // Ki de mantenimiento embebido: col H, sólo si "Mantenido".
    const maintTierSum = tiers.reduce((s, t) => s + num(t.maint), 0);
    const kiMaintEmbedded = maintMode === 'maintained' ? maintTierSum : 0;
    // Sobrecoste por usar características OPCIONALES (la primaria no añade nada).
    const optional = def?.optionalCharacteristics ?? {};
    const charSurcharge = KI_CHARACTERISTICS.reduce((s, c) => {
      if (num(kiBy[c]) > 0 && optional[c] != null) return s + num(optional[c]);
      return s;
    }, 0);
    // Sobrecoste cuadrático por estados añadidos: k·(k-1).
    const addedStates = tierOptions.filter(
      o => typeof o === 'string' && o.startsWith('Estado añadido:')
    ).length;
    const addedStateSurcharge = addedStates * (addedStates - 1);

    const kiEffect =
      kiBaseSum + kiSustainSum + kiMaintEmbedded + charSurcharge + addedStateSurcharge;
    const cmEffect = tiers.reduce((s, t) => s + num(t.cm), 0); // col G; descuento legado off
    const tierLevels = tiers.map(t => num(t.level)).filter(n => n > 0);
    const levelRequired = tierLevels.length ? Math.max(1, ...tierLevels) : 0;

    return {
      effectId: row?.effectId,
      role,
      maintMode,
      kiEffect,
      cmEffect,
      kiMaintEmbedded,
      levelRequired,
      kiBy,
      maintKiBy
    };
  });

  // --- Por desventaja (filas 21-23) -----------------------------------------
  const disadvantages = (build?.disadvantages ?? []).map(row => {
    const def = getDisadvantage(row?.disadvantageId);
    const opt = def?.options?.find(o => o.option === row?.option);
    return {
      disadvantageId: row?.disadvantageId,
      option: row?.option,
      cmReduction: num(opt?.cmReduction), // col Q, negativo
      level: num(opt?.level)
    };
  });

  // --- Agregados ------------------------------------------------------------
  const cmEffectsSum = effects.reduce((s, e) => s + e.cmEffect, 0);
  const kiEffectsSum = effects.reduce((s, e) => s + e.kiEffect, 0);
  const cmDisadvSum = disadvantages.reduce((s, d) => s + d.cmReduction, 0); // negativo

  const anyMaintained = effects.some(e => e.maintMode === 'maintained');
  const anySostMenor = effects.some(e => e.maintMode === 'sustainMinor');
  const anySostMayor = effects.some(e => e.maintMode === 'sustainMajor');

  // Fiel al Excel: si coexisten Menor y Mayor se SUMAN ambos sobrecostes.
  const sostSurcharge = (anySostMenor ? 20 * level : 0) + (anySostMayor ? 30 * level : 0);

  // CM "positivo" (sin desventajas) — base de U12 y del tope del 50% (AM43).
  const cmPositive =
    cmEffectsSum -
    10 * kiReductionLine +
    cmReductionLine +
    (combinable ? 10 * level : 0) +
    (anyMaintained ? 10 * level : 0) +
    sostSurcharge;
  const cmInner = cmPositive + cmDisadvSum; // SUM(N16:N23)
  const cmFloor = cmFloorFor(level);
  const cmCeiling = cmCeilingFor(level);
  const cmTotal = Math.max(cmFloor, cmInner); // sin recorte superior (ver cmExcesivo)

  // Ki total (AL29).
  const activeCharCount = KI_CHARACTERISTICS.filter(
    c => effects.reduce((s, e) => s + num(e.kiBy[c]), 0) > 0
  ).length;
  const anyNegativeRedist =
    KI_CHARACTERISTICS.some(c => num(redistribution[c]) < 0) || kiReductionLine < 0;
  const cannotReduceKi = activeCharCount < 3 && anyNegativeRedist;

  const kiActiveTotal =
    Math.max(0, kiEffectsSum + Math.abs(cmReductionLine) * 2 / 5) +
    (cannotReduceKi ? 0 : kiReductionLine) +
    (combinable ? 3 * level : 0);
  const kiMaintTotal = anyMaintained
    ? effects.reduce((s, e) => s + e.kiMaintEmbedded, 0)
    : 0;

  // Coste por característica (AK28..AP28): activo (+ redistribución) y mantenimiento.
  const costByCharacteristic = {};
  for (const c of KI_CHARACTERISTICS) {
    costByCharacteristic[c] = {
      active: effects.reduce((s, e) => s + num(e.kiBy[c]), 0) + num(redistribution[c]),
      maint: effects.reduce((s, e) => s + num(e.maintKiBy[c]), 0)
    };
  }

  const levelRequired = Math.max(
    0,
    ...effects.map(e => e.levelRequired),
    ...disadvantages.map(d => d.level)
  );

  // --- Validaciones (AM33..AM43); true = aviso ------------------------------
  const redistSum = KI_CHARACTERISTICS.reduce((s, c) => s + num(redistribution[c]), 0);
  const kiInvertido =
    effects.reduce((s, e) => s + sumChars(e.kiBy), 0) + redistSum;
  const kiMantInvertido = effects.reduce((s, e) => s + sumChars(e.maintKiBy), 0);

  const validations = {
    cmExcesivo: cmTotal > cmCeiling,
    nivelMinimo: levelRequired > level,
    mantenidoYSostenido: anyMaintained && (anySostMenor || anySostMayor),
    errorEnSostenidos: effects.some(
      e =>
        (e.maintMode === 'sustainMinor' || e.maintMode === 'sustainMajor') &&
        (level === 1 || e.levelRequired === 3)
    ),
    unSoloPrimario: effects.filter(e => e.role === 'primary').length !== 1,
    desventajasLimite: Math.abs(cmDisadvSum) > cmPositive / 2,
    noPuedeReducirKi: cannotReduceKi,
    maxReduccionKi: KI_CHARACTERISTICS.some(
      c =>
        -num(redistribution[c]) >
        Math.trunc(effects.reduce((s, e) => s + num(e.kiBy[c]), 0) / 2)
    ),
    modificacionDeCostes:
      Math.abs(
        redistSum -
          (kiReductionLine + Math.abs(cmReductionLine) * 2 / 5 + (combinable ? 3 * level : 0))
      ) > APPROX,
    costeTotal:
      Math.abs(kiActiveTotal - kiInvertido + (kiMaintTotal - kiMantInvertido)) > APPROX
  };
  const isValid = !Object.values(validations).some(Boolean);

  return {
    level,
    cmTotal,
    cmFloor,
    cmCeiling,
    cmInner,
    cmEffectsSum,
    cmDisadvSum,
    kiActiveTotal,
    kiMaintTotal,
    kiEffectsSum,
    costByCharacteristic,
    levelRequired,
    perEffect: effects.map(e => ({
      effectId: e.effectId,
      role: e.role,
      maintMode: e.maintMode,
      kiEffect: e.kiEffect,
      cmEffect: e.cmEffect,
      kiMaint: e.kiMaintEmbedded,
      levelRequired: e.levelRequired
    })),
    perDisadvantage: disadvantages,
    flags: { combinable, anyMaintained, anySostMenor, anySostMayor },
    validations,
    isValid
  };
}

export { cmFloorFor, cmCeilingFor };
