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
 * Buckets: attack | block | dodge | turn | masterAttack | masterDefense | cm.
 * Consumidores: mutateMartialArtCombat (attack/block/dodge), mutateInitiative
 * (turn), mutateMartialArtKnowledgeMax (cm -> CM maximo). El daño base/desarmado
 * se resuelve en el flujo de ataque (no es un bono pasivo).
 *
 * Deposita ademas provenance en synthetics para la linea "Mod:" del chat.
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
    masterAttack: 0,
    masterDefense: 0,
    cm: 0
  };

  for (const art of arts) {
    // Vista de solo-lectura para la ficha (grado + bonos del catalogo).
    if (art?.system) art.system.computed = buildMartialArtView(art);

    const resolved = resolveArt(art);
    if (!resolved) continue;
    const { g } = resolved;

    totals.attack += g.attack || 0;
    totals.block += g.block || 0;
    totals.dodge += g.dodge || 0;
    totals.turn += g.turn || 0;
    totals.masterAttack += g.masterAttack || 0;
    totals.masterDefense += g.masterDefense || 0;
    totals.cm += g.cm || 0;

    const source = art.name || resolved.def.name;
    const id = art?.system?.canonicalId;
    // Bono Maestro (Avanzadas/Arcano) se suma al mismo canal en el MVP.
    depositMartialArt(actor, 'system.combat.attack.final.value', (g.attack || 0) + (g.masterAttack || 0), source, id);
    depositMartialArt(actor, 'system.combat.block.final.value', (g.block || 0) + (g.masterDefense || 0), source, id);
    depositMartialArt(actor, 'system.combat.dodge.final.value', (g.dodge || 0) + (g.masterDefense || 0), source, id);
    depositMartialArt(actor, 'system.characteristics.secondaries.initiative.final.value', g.turn || 0, source, id);
  }

  // Tope +50 de bonos innatos por Categoria (RAW): la SUMA de bonos de AM a
  // HA/Parada/Esquiva no supera +50. El Bono Maestro (avanzadas) y el Turno
  // estan EXENTOS del tope.
  const m = data.general.modifiers;
  m.martialArtBonus = m.martialArtBonus ?? {};
  m.martialArtBonus.attack = { value: Math.min(totals.attack, INNATE_CAP) };
  m.martialArtBonus.block = { value: Math.min(totals.block, INNATE_CAP) };
  m.martialArtBonus.dodge = { value: Math.min(totals.dodge, INNATE_CAP) };
  m.martialArtBonus.turn = { value: totals.turn };
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
    'system.general.modifiers.martialArtBonus.masterAttack.value',
    'system.general.modifiers.martialArtBonus.masterDefense.value',
    'system.general.modifiers.martialArtBonus.cm.value'
  ]
};

/**
 * Suma los bonos de Arte Marcial (incl. Bono Maestro) a las habilidades de
 * combate. Se escribe en `special` (NO en `final`): el typed-node Ability calcula
 * `final = base + special + mods` y su op `final` declara dep en `special.value`,
 * asi que el flujo ORDENA por dependencia (writer->dependiente) y el bono queda
 * dentro del valor que luego clampa Montado. Evita el conflicto de dos overwrite
 * sobre `final` (sin arista -> orden no garantizado).
 * El tope +50 de innatos ya se aplico a los buckets attack/block/dodge en
 * applyMartialArtModifiers; el Bono Maestro va al mismo canal pero EXENTO del tope.
 *
 * @param {import('../../../../../../types/Actor').ABFActorDataSourceData} data
 */
export const mutateMartialArtCombat = data => {
  const b = data.general?.modifiers?.martialArtBonus;
  if (!b) return;
  const combat = data.combat;
  const atk = (b.attack?.value || 0) + (b.masterAttack?.value || 0);
  const blk = (b.block?.value || 0) + (b.masterDefense?.value || 0);
  const dge = (b.dodge?.value || 0) + (b.masterDefense?.value || 0);
  if (atk && combat?.attack?.special) combat.attack.special.value = (combat.attack.special.value ?? 0) + atk;
  if (blk && combat?.block?.special) combat.block.special.value = (combat.block.special.value ?? 0) + blk;
  if (dge && combat?.dodge?.special) combat.dodge.special.value = (combat.dodge.special.value ?? 0) + dge;
};

mutateMartialArtCombat.abfFlow = {
  deps: [
    'system.general.modifiers.martialArtBonus.attack.value',
    'system.general.modifiers.martialArtBonus.block.value',
    'system.general.modifiers.martialArtBonus.dodge.value',
    'system.general.modifiers.martialArtBonus.masterAttack.value',
    'system.general.modifiers.martialArtBonus.masterDefense.value'
  ],
  mods: [
    'system.combat.attack.special.value',
    'system.combat.block.special.value',
    'system.combat.dodge.special.value'
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
