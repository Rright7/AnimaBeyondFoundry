import {
  MARTIAL_ARTS,
  buildMartialArtView
} from '../../../../../../combat/martialArts/martialArtCatalog.js';
import { depositModifier } from '../../../../effectFow/modifiers/synthetics.js';

// Tope RAW de bonos innatos por Categoria a HA/Parada/Esquiva (Dominus Exxet).
const INNATE_CAP = 50;

/**
 * Resuelve la entrada de catalogo (arte + grado) de un item de Arte Marcial.
 * @param {object} art inner item type 'martialArt'
 * @returns {{def:object, grade:string, g:object}|null}
 */
function resolveArt(art) {
  const id = art?.system?.canonicalId;
  const grade = art?.system?.grade?.value ?? art?.system?.grade;
  const def = id ? MARTIAL_ARTS[id] : null;
  const g = def?.grades?.[grade];
  return def && g ? { def, grade, g } : null;
}

/**
 * Recorre las Artes Marciales del actor y acumula sus bonos NUMERICOS en buckets
 * de solo-lectura en `system.general.modifiers.martialArtBonus`. Los valores del
 * catalogo ya son ACUMULADOS por grado (Aikido Supremo = Base+Avz+Sup); aqui solo
 * se suman entre artes distintas (RAW: los bonos innatos por Categoria se apilan).
 *
 * Buckets: attack | block | dodge | turn | damage | masterAttack | masterDefense | cm.
 * Consumidores: el arma-perfil del compendio "Artes Marciales" (attack/block/damage/
 * turn inyectados en sus `special` por applyMartialArtsWeaponBonuses dentro de
 * mutateWeaponsData), el dialogo de defensa (dodge, en modo desarmado),
 * mutateMartialArtKnowledgeMax (cm -> CM maximo). El Turno tambien deposita
 * provenance.
 *
 * Deposita ademas provenance del Turno en synthetics para la linea "Mod:" del chat.
 *
 * @param {import('../../../../../../types/Actor').ABFActorDataSourceData} data
 * @param {object} [actor] documento del actor (provenance; ignora falsy)
 */
export const applyMartialArtModifiers = (data, actor) => {
  const arts = data.domine?.martialArts ?? [];

  const totals = {
    attack: 0,
    block: 0,
    dodge: 0,
    turn: 0,
    damage: 0,
    masterAttack: 0,
    masterDefense: 0,
    cm: 0
  };

  for (const art of arts) {
    // Vista de solo-lectura para la ficha (grado + bonos del catalogo).
    if (art?.system) art.system.computed = buildMartialArtView(art);

    // Compatibilidad: fichas del importador VIEJO traen `bonusInBase` (combate, CM
    // y Turno YA horneados en la base del Excel) -> no re-sumar nada para evitar
    // doble conteo (se re-importan para pasar al modelo limpio).
    if (art?.system?.bonusInBase) continue;

    const resolved = resolveArt(art);
    if (!resolved) continue;
    const { g } = resolved;

    // El COMBATE (HA/Parada/Esquiva + Maestro) lo computa SIEMPRE el motor: en
    // fichas nuevas la base es limpia y en el importador nuevo la base de combate
    // es HA_final (sin AM). El tope +50 combinado se aplica abajo.
    totals.attack += g.attack || 0;
    totals.block += g.block || 0;
    totals.dodge += g.dodge || 0;
    totals.damage += g.damageBonus || 0;
    totals.masterAttack += g.masterAttack || 0;
    totals.masterDefense += g.masterDefense || 0;

    // CM y Turno: en imports nuevos (`cmTurnInBase`) YA vienen del Excel en la base
    // (martialKnowledge.max = CM_final, initiative.base = Turno_Nat_final) -> no
    // re-sumar. En fichas nuevas (sin flag) los otorga el motor.
    if (!art?.system?.cmTurnInBase) {
      totals.turn += g.turn || 0;
      totals.cm += g.cm || 0;
      const source = art.name || resolved.def.name;
      const id = art?.system?.canonicalId;
      depositMartialArt(actor, 'system.characteristics.secondaries.initiative.final.value', g.turn || 0, source, id);
    }
  }

  // Tope +50 COMBINADO (RAW, Dominus Exxet): los bonos de AM a HA/Parada/Esquiva
  // son innatos por Categoria y COMPARTEN el unico tope +50 con el bono de combate
  // por Categoria/nivel (categoryBonus, importado de PDs!X25-27). Por eso se capa
  // (categoria + AM) a 50 y se descuenta la categoria, que ya vive en la base. En
  // fichas sin categoryBonus (no importadas) -> min(AM,50). Bono Maestro y Turno
  // EXENTOS del tope. (Excepciones por-arte tipo Kung Fu avanzado: pendiente.)
  const cat = actor?.flags?.animabf?.categoryBonus ?? {};
  const combinedCap = (total, catVal) => {
    const c = Number(catVal) || 0;
    return Math.max(0, Math.min(c + total, INNATE_CAP) - c);
  };
  const m = data.general.modifiers;
  m.martialArtBonus = m.martialArtBonus ?? {};
  m.martialArtBonus.attack = { value: combinedCap(totals.attack, cat.attack) };
  m.martialArtBonus.block = { value: combinedCap(totals.block, cat.block) };
  m.martialArtBonus.dodge = { value: combinedCap(totals.dodge, cat.dodge) };
  m.martialArtBonus.turn = { value: totals.turn };
  // Dano: bono de daño desarmado de las artes. NO entra en el tope +50 (ese tope
  // es solo HA/Parada/Esquiva). Lo consume el perfil de arma "Artes Marciales".
  m.martialArtBonus.damage = { value: totals.damage };
  m.martialArtBonus.masterAttack = { value: totals.masterAttack };
  m.martialArtBonus.masterDefense = { value: totals.masterDefense };
  m.martialArtBonus.cm = { value: totals.cm };
};

function depositMartialArt(actor, path, value, source, id) {
  if (!actor || !value) return;
  depositModifier(actor, {
    path,
    value,
    source,
    slug: id ? `martialArt:${id}:${path}` : undefined
  });
}

applyMartialArtModifiers.abfFlow = {
  deps: ['system.domine.martialArts'],
  mods: [
    'system.general.modifiers.martialArtBonus.attack.value',
    'system.general.modifiers.martialArtBonus.block.value',
    'system.general.modifiers.martialArtBonus.dodge.value',
    'system.general.modifiers.martialArtBonus.turn.value',
    'system.general.modifiers.martialArtBonus.damage.value',
    'system.general.modifiers.martialArtBonus.masterAttack.value',
    'system.general.modifiers.martialArtBonus.masterDefense.value',
    'system.general.modifiers.martialArtBonus.cm.value'
  ]
};

/**
 * Las Artes Marciales OTORGAN CM (Conocimiento Marcial): se suma al maximo del
 * personaje (no se consume). Corre antes de mutateMartialKnowledgeUsed (que
 * declara dep en max.value), asi el "disponible" cuadra.
 *
 * @param {import('../../../../../../types/Actor').ABFActorDataSourceData} data
 */
export const mutateMartialArtKnowledgeMax = data => {
  const cm = data.general?.modifiers?.martialArtBonus?.cm?.value ?? 0;
  if (!cm) return;
  const mk = data.domine?.martialKnowledge;
  if (mk?.max) mk.max.value = (mk.max.value ?? 0) + cm;
};

mutateMartialArtKnowledgeMax.abfFlow = {
  deps: ['system.general.modifiers.martialArtBonus.cm.value'],
  mods: ['system.domine.martialKnowledge.max.value']
};
