import { PERSISTENT_EFFECT_MAP, parseOptionNumber, isPersistentEffect } from './effectCatalog';

// Auto-aplicación de efectos persistentes de Técnicas de Ki (F6 entrega 2).
// Una técnica con flags.animabf.active aporta sus bonos mecánico-limpios a la
// ficha mientras está activa. Sólo se mapea el subconjunto de PERSISTENT_EFFECT_MAP
// (características y resistencias); el resto es narrativo.

/**
 * Bonos persistentes de UNA técnica a partir de su `build.effects`.
 * @param {Array<{effectId?:string, tierOptions?:string[]}>} effects
 * @returns {{ characteristics: Record<string,number>,
 *             kiBonusEffects: Array<{target:string, operation:'add', value:number}> }}
 */
export function techniquePersistentBonuses(effects) {
  const characteristics = {};
  const kiBonusEffects = [];

  for (const row of Array.isArray(effects) ? effects : []) {
    const map = PERSISTENT_EFFECT_MAP[row?.effectId];
    if (!map) continue;
    if (!isPersistentEffect(row)) continue; // Tipo Acción: no persiste mientras está activa

    const options = Array.isArray(row.tierOptions) ? row.tierOptions : [];
    const value = options.reduce((sum, opt) => sum + parseOptionNumber(opt), 0);
    if (!value) continue;

    if (map.kind === 'characteristic') {
      characteristics[map.target] = (characteristics[map.target] ?? 0) + value;
    } else {
      kiBonusEffects.push({ target: map.target, operation: 'add', value });
    }
  }

  return { characteristics, kiBonusEffects };
}

/**
 * Agrega los bonos persistentes de TODAS las técnicas activas del actor.
 * `data` es `actor.system`; `data.domine.techniques` contiene los items vivos
 * (con `flags.animabf.active`), poblados por addToFieldPath durante la preparación.
 *
 * Además de los agregados, devuelve `records`: una entrada POR técnica y efecto,
 * con la fuente (nombre de la técnica) para la trazabilidad en el chat.
 *
 * @param {import('../../../types/Actor').ABFActorDataSourceData} data
 * @returns {{ characteristics: Record<string,number>,
 *             kiBonusEffects: Array<{target:string, operation:'add', value:number}>,
 *             records: Array<{scope:'characteristic'|'bucket', target:string, value:number, source:string, slug:string|null}> }}
 */
export function activeTechniqueModifiers(data) {
  const characteristics = {};
  const kiBonusEffects = [];
  const records = [];

  const techniques = data?.domine?.techniques ?? [];
  for (const technique of techniques) {
    if (!technique?.flags?.animabf?.active) continue;
    const source = technique?.name || 'Técnica de Ki';
    const slug = technique?.id ?? technique?._id ?? null;
    const bonuses = techniquePersistentBonuses(technique?.system?.build?.effects);

    for (const [key, value] of Object.entries(bonuses.characteristics)) {
      characteristics[key] = (characteristics[key] ?? 0) + value;
      records.push({ scope: 'characteristic', target: key, value, source, slug });
    }
    for (const eff of bonuses.kiBonusEffects) {
      kiBonusEffects.push(eff);
      records.push({ scope: 'bucket', target: eff.target, value: eff.value, source, slug });
    }
  }

  return { characteristics, kiBonusEffects, records };
}
