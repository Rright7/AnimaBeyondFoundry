import { FormulaEvaluator } from '../../utils/formulaEvaluator.js';
import { martialArtsDodgeBonus } from './martialArts/martialArtsDodge.js';
import { defensesCounterCheck, freeDefensesFor } from './utils/defensesCounterCheck.js';
import {
  projectileDefensePenalty,
  isProjectileAttack
} from './projectileDefensePenalty.js';

// Re-export para que autoRoll y el dialogo de defensa lo sigan importando desde aqui.
export { isProjectileAttack };

const toSafeNumber = v => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const RULES = {
  block: {
    stackDefense: true,
    applyMultipleDefensePenalty: true,
    flavorSuffix: c => (c.weaponName ? ` (${c.weaponName})` : '')
  },
  dodge: {
    stackDefense: true,
    applyMultipleDefensePenalty: true,
    flavorSuffix: () => ''
  },
  supernaturalShield: {
    stackDefense: false,
    applyMultipleDefensePenalty: false,
    flavorSuffix: c => (c.shieldName ? ` (${c.shieldName})` : '')
  }
};

function withRules(candidate) {
  const r = RULES[candidate.type];
  return {
    ...candidate,
    stackDefense: r.stackDefense,
    applyMultipleDefensePenalty: r.applyMultipleDefensePenalty,
    flavorSuffix: r.flavorSuffix(candidate)
  };
}

/**
 * Penalizador por proyectil (Tabla 49) para un candidato de defensa segun el tipo del
 * ataque ('throw' lanzamiento; cualquier otro = disparo). Depende del tipo, por eso se
 * calcula al aplicar y no se precomputa en el candidato.
 * @returns {number} positivo (se resta de la defensa)
 */
export function projectilePenaltyFor(candidate, projectileType) {
  return projectileDefensePenalty(candidate?.type, candidate ?? {}, projectileType);
}

// isProjectileAttack vive en projectileDefensePenalty.js (puro/testeable) y se re-exporta
// arriba: un ataque es proyectil SOLO si se declaro (isProjectile), nunca por el shotType
// del arma (una jabalina a melee no es lanzamiento).

function multipleDefensePenaltyFromAccumulated(accumulated, opts) {
  // Positivo (se RESTA en las formulas de defensa). Reusa la funcion canonica
  // (negativa) para no duplicar la tabla; opts permite el margen de defensas exentas.
  return -defensesCounterCheck(accumulated, opts);
}

function getAccumulated(defensesCounter) {
  const keep = defensesCounter?.keepAccumulating ?? true;
  const acc = defensesCounter?.accumulated ?? 0;
  return keep ? acc : 0;
}

export const BlockStrategy = {
  type: 'block',
  compute(actor) {
    const weapons = actor.system?.combat?.weapons ?? [];
    const bestWeapon = weapons.reduce((best, w) => {
      const cand = Number(w?.system?.block?.final?.value ?? -Infinity);
      const cur = Number(best?.system?.block?.final?.value ?? -Infinity);
      return cand > cur ? w : best;
    }, undefined);

    const naturalBase = toSafeNumber(actor.system?.combat?.block?.base?.value ?? 0);
    const finalBase = toSafeNumber(
      (bestWeapon
        ? bestWeapon.system?.block?.final?.value
        : actor.system?.combat?.block?.final?.value) ?? 0
    );

    return withRules({
      type: 'block',
      naturalBase,
      finalBase,
      hasMastery: naturalBase >= 200,
      weaponId: bestWeapon?._id ?? '',
      weaponName: bestWeapon?.name ?? '',
      isShieldWeapon: !!bestWeapon?.system?.isShield?.value,
      shieldId: '',
      shieldName: ''
    });
  }
};

export const DodgeStrategy = {
  type: 'dodge',
  compute(actor) {
    // Bono de Arte Marcial a la esquiva (solo en modo desarmado; el helper aplica
    // el gate). La auto-defensa de parada ya coge el AM via el perfil sintetico.
    const ma = martialArtsDodgeBonus(actor);
    const naturalBase = toSafeNumber(actor.system?.combat?.dodge?.base?.value ?? 0) + ma;
    const finalBase = toSafeNumber(actor.system?.combat?.dodge?.final?.value ?? 0) + ma;

    return withRules({
      type: 'dodge',
      naturalBase,
      finalBase,
      hasMastery: naturalBase >= 200,
      weaponId: '',
      weaponName: '',
      isShieldWeapon: false,
      shieldId: '',
      shieldName: ''
    });
  }
};

export const SupernaturalShieldStrategy = {
  type: 'supernaturalShield',
  compute(actor) {
    const shields = actor.items?.filter(i => i.type === 'supernaturalShield') ?? [];

    let bestValue = 0;
    let bestName = '';
    let bestId = '';

    for (const s of shields) {
      const formula = String(s?.system?.abilityFormula ?? '').trim();
      if (!formula) continue;

      const v = toSafeNumber(FormulaEvaluator.evaluate(formula, actor));
      if (v > bestValue) {
        bestValue = v;
        bestName = s.name ?? '';
        bestId = s.id ?? '';
      }
    }

    return withRules({
      type: 'supernaturalShield',
      naturalBase: bestValue,
      finalBase: bestValue,
      hasMastery: bestValue >= 200,
      weaponId: '',
      weaponName: '',
      isShieldWeapon: false,
      shieldId: bestId,
      shieldName: bestName
    });
  }
};

function computeEffectiveScore(candidate, attackData, defensesCounter, freeDef) {
  const accumulated = getAccumulated(defensesCounter);

  const multiPenalty = candidate.applyMultipleDefensePenalty
    ? multipleDefensePenaltyFromAccumulated(accumulated, freeDef)
    : 0;

  // A bocajarro anula el penalizador de proyectil (Tabla 49), lanzado y disparado.
  const projPenalty = isProjectileAttack(attackData) && !attackData?.pointBlank
    ? projectilePenaltyFor(
        candidate,
        attackData?.projectileType ?? attackData?.projectile?.type
      )
    : 0;

  return {
    effectiveScore: (Number(candidate.finalBase) || 0) - projPenalty - multiPenalty,
    appliedPenalties: {
      projectilePenalty: projPenalty,
      multipleDefensePenalty: multiPenalty
    }
  };
}

/**
 * Pick the best defense candidate considering applied penalties (projectile + multiple defenses).
 * Tie-break: block > dodge > supernaturalShield.
 */
export function pickBestDefenseCandidate(
  actor,
  { attackData = null, defensesCounter = null } = {}
) {
  const candidates = [
    BlockStrategy.compute(actor),
    DodgeStrategy.compute(actor),
    SupernaturalShieldStrategy.compute(actor)
  ];

  // Margen de defensas exentas (Artes Marciales + extra manual). Mismo para todos
  // los candidatos del actor; los escudos lo ignoran (applyMultipleDefensePenalty=false).
  const freeDef = freeDefensesFor(actor);

  const priority = { block: 0, dodge: 1, supernaturalShield: 2 };

  let best = null;

  for (const c of candidates) {
    const { effectiveScore, appliedPenalties } = computeEffectiveScore(
      c,
      attackData,
      defensesCounter,
      freeDef
    );
    const enriched = { ...c, effectiveScore, appliedPenalties };

    if (!best) {
      best = enriched;
      continue;
    }

    if (enriched.effectiveScore > best.effectiveScore) {
      best = enriched;
      continue;
    }

    if (enriched.effectiveScore < best.effectiveScore) continue;

    // Tie-break on priority
    if (priority[enriched.type] < priority[best.type]) best = enriched;
  }

  return best;
}
