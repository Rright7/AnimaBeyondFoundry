import { COMBAT_BONUS_MAP, parseOptionNumber } from './effectCatalog';
import { KI_CHAR_KEYS, concentratedShortfall } from './kiAccumulation';

// Bonos de combate de Técnicas de Ki (F6.3): se inyectan en los diálogos de
// ataque/defensa. Las técnicas ACTIVAS (mantenidas/sostenidas) aportan su bono
// automáticamente; las INSTANTÁNEAS (Tipo Acción) se ofrecen para usarlas en una
// tirada concreta gastando Ki concentrado.

/**
 * Lista de items técnica de un actor (soporta Collection de Foundry, array de
 * items, o el fallback data.domine.techniques).
 */
function getTechniques(actor) {
  const items = actor?.items;
  if (items && typeof items.filter === 'function') {
    return items.filter(i => i?.type === 'technique');
  }
  return actor?.system?.domine?.techniques ?? [];
}

/**
 * Bono de combate de UNA técnica a partir de sus efectos mapeados.
 * @param {object} technique
 * @returns {{attack:number, block:number, dodge:number, damage:number}}
 */
export function techniqueCombatBonus(technique) {
  const out = { attack: 0, block: 0, dodge: 0, damage: 0 };
  const effects = technique?.system?.build?.effects;
  for (const row of Array.isArray(effects) ? effects : []) {
    const stat = COMBAT_BONUS_MAP[row?.effectId];
    if (!stat) continue;
    const options = Array.isArray(row.tierOptions) ? row.tierOptions : [];
    const value = options.reduce((sum, opt) => sum + parseOptionNumber(opt), 0);
    if (value) out[stat] += value;
  }
  return out;
}

/**
 * Suma de bonos de combate de las técnicas ACTIVAS del actor (auto).
 * @returns {{attack:number, block:number, dodge:number, damage:number}}
 */
export function activeTechniqueCombatBonuses(actor) {
  const out = { attack: 0, block: 0, dodge: 0, damage: 0 };
  for (const technique of getTechniques(actor)) {
    if (!technique?.flags?.animabf?.active) continue;
    const b = techniqueCombatBonus(technique);
    out.attack += b.attack;
    out.block += b.block;
    out.dodge += b.dodge;
    out.damage += b.damage;
  }
  return out;
}

/** Ki concentrado por característica del actor. */
function actorConcentrated(actor) {
  const ka = actor?.system?.domine?.kiAccumulation ?? {};
  const acc = {};
  for (const c of KI_CHAR_KEYS) acc[c] = Number(ka[c]?.accumulated?.value) || 0;
  return acc;
}

/** Una técnica es instantánea si no es mantenida ni sostenida. */
function isInstantTechnique(technique) {
  const f = technique?.system?.computed?.flags ?? {};
  return !f.anyMaintained && !f.anySostMenor && !f.anySostMayor;
}

/**
 * Técnicas instantáneas (Tipo Acción, no activas) con bono de combate relevante a
 * `kind` ('attack' -> attack/damage; 'defense' -> block/dodge), para ofrecerlas en
 * el diálogo. Incluye coste de Ki y si hay Ki concentrado suficiente.
 * @param {object} actor
 * @param {'attack'|'defense'} kind
 */
export function usableInstantCombatTechniques(actor, kind) {
  const relevant = kind === 'defense' ? ['block', 'dodge'] : ['attack', 'damage'];
  const concentrated = actorConcentrated(actor);
  const out = [];
  for (const technique of getTechniques(actor)) {
    if (technique?.flags?.animabf?.active) continue; // las activas ya van auto
    if (!isInstantTechnique(technique)) continue;
    const b = techniqueCombatBonus(technique);
    if (!relevant.some(stat => b[stat])) continue;
    const cost = technique?.system?.computed?.costByCharacteristic ?? {};
    out.push({
      id: technique.id ?? technique._id,
      name: technique.name,
      attack: b.attack,
      block: b.block,
      dodge: b.dodge,
      damage: b.damage,
      kiCost: Number(technique?.system?.computed?.kiActiveTotal) || 0,
      hasEnoughKi: concentratedShortfall(cost, concentrated).length === 0
    });
  }
  return out;
}
