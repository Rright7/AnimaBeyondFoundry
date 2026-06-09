import { COMBAT_BONUS_MAP, parseOptionNumber, isPersistentEffect } from './effectCatalog';
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
 * Bono de combate de UNA técnica a partir de sus efectos mapeados, filtrando por
 * el modo de mantenimiento de CADA efecto:
 *  - 'persistent': solo efectos mantenidos/sostenidos (perduran mientras esté activa).
 *  - 'instant': solo efectos Tipo Acción (se aplican únicamente el turno de activación).
 *  - 'all': todos (por defecto; usado por las instantáneas puras).
 * @param {object} technique
 * @param {'all'|'persistent'|'instant'} [mode]
 * @returns {{attack:number, block:number, dodge:number, damage:number}}
 */
export function techniqueCombatBonus(technique, mode = 'all') {
  const out = { attack: 0, block: 0, dodge: 0, damage: 0 };
  const effects = technique?.system?.build?.effects;
  for (const row of Array.isArray(effects) ? effects : []) {
    const stat = COMBAT_BONUS_MAP[row?.effectId];
    if (!stat) continue;
    const persistent = isPersistentEffect(row);
    if (mode === 'persistent' && !persistent) continue;
    if (mode === 'instant' && persistent) continue;
    const options = Array.isArray(row.tierOptions) ? row.tierOptions : [];
    const value = options.reduce((sum, opt) => sum + parseOptionNumber(opt), 0);
    if (value) out[stat] += value;
  }
  return out;
}

/**
 * Suma de bonos de combate PERSISTENTES de las técnicas ACTIVAS del actor (auto).
 * Solo cuentan los efectos mantenidos/sostenidos: la porción Tipo Acción de una
 * técnica mixta NO se aplica aquí (solo el turno de activación, vía el diálogo).
 * @returns {{attack:number, block:number, dodge:number, damage:number}}
 */
export function activeTechniqueCombatBonuses(actor) {
  const out = { attack: 0, block: 0, dodge: 0, damage: 0 };
  for (const technique of getTechniques(actor)) {
    if (!technique?.flags?.animabf?.active) continue;
    const b = techniqueCombatBonus(technique, 'persistent');
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
 * Técnicas con bono de combate de un solo uso relevante a `kind` ('attack' ->
 * attack/damage; 'defense' -> block/dodge), para ofrecerlas como checkbox en el
 * diálogo. Dos casos:
 *  - Instantánea pura (Tipo Acción, no activa): cuesta su Ki activo, se gasta al
 *    usarla (`free:false`).
 *  - Porción Tipo Acción de una técnica mantenida/mixta, SOLO el turno en que se
 *    activa (`flags.animabf.freshTurn`): ya pagada en la activación, así que es
 *    gratis (`free:true`, sin re-gastar Ki) y deja de ofrecerse al pasar el asalto.
 * @param {object} actor
 * @param {'attack'|'defense'} kind
 */
export function usableInstantCombatTechniques(actor, kind) {
  const relevant = kind === 'defense' ? ['block', 'dodge'] : ['attack', 'damage'];
  const concentrated = actorConcentrated(actor);
  const out = [];
  for (const technique of getTechniques(actor)) {
    const flags = technique?.flags?.animabf ?? {};
    const id = technique.id ?? technique._id;

    if (!flags.active) {
      // Instantánea pura: todos sus efectos son Tipo Acción.
      if (!isInstantTechnique(technique)) continue;
      const b = techniqueCombatBonus(technique, 'instant');
      if (!relevant.some(stat => b[stat])) continue;
      // Si ya está "en efecto este asalto" (botón Usar pulsado u otra tirada ya la
      // marcó), su Ki ya se gastó: reaplicarla este asalto es gratis (free).
      const paid = !!flags.freshTurn;
      const cost = technique?.system?.computed?.costByCharacteristic ?? {};
      out.push({
        id,
        name: technique.name,
        attack: b.attack,
        block: b.block,
        dodge: b.dodge,
        damage: b.damage,
        kiCost: paid ? 0 : Number(technique?.system?.computed?.kiActiveTotal) || 0,
        hasEnoughKi: paid ? true : concentratedShortfall(cost, concentrated).length === 0,
        free: paid
      });
    } else if (flags.freshTurn) {
      // Porción Tipo Acción de una técnica mixta, solo el turno de activación.
      const b = techniqueCombatBonus(technique, 'instant');
      if (!relevant.some(stat => b[stat])) continue;
      out.push({
        id,
        name: technique.name,
        attack: b.attack,
        block: b.block,
        dodge: b.dodge,
        damage: b.damage,
        kiCost: 0,
        hasEnoughKi: true,
        free: true
      });
    }
  }
  return out;
}
