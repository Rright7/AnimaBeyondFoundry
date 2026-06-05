/**
 * Canonical Ki and Nemesis abilities (Habilidades del Ki / Némesis).
 *
 * Source data extracted by parsing formulas in the community Excel sheet:
 *   - Tablas!C1971:C2045 — list assembly with predicates
 *   - Ki!P10:P64        — Ki ability cost cells
 *   - Ki!H43:H64        — Nemesis ability cost cells
 *
 * Used by the Excel importer (parseKiSkills) to enrich kiSkill / nemesisSkill
 * inner items with cost, tree position, and future functional effects.
 *
 * Schema per entry:
 *   id                 — English internal identifier (camelCase, stable across locales)
 *   name               — Spanish name as it appears in the Excel output; used for matching
 *   type               — 'ki' | 'nemesis'
 *   martialKnowledge   — CM cost from Core Exxet
 *   tree               — { parent: id|null, depth: 0..4 }
 *   aliases            — { es: [...] } alternative Spanish strings that match this entry
 *   effects            — Passive modifiers applied to the actor while the ability is in the sheet.
 *                        Each effect is { target, operation, value } where:
 *                          target    — 'damage'      (adds to weapon damage final, all weapons)
 *                                    | 'initiative'  (adds to actor initiative final)
 *                                    | 'energyArmor' (virtual armor layer of N TA, energy type)
 *                          operation — 'add'  (accumulates across abilities)
 *                                    | 'set'  (takes max across abilities — used for energyArmor
 *                                              to model the "no se apilan, prevalece la mayor"
 *                                              rule between Ki armor variants)
 *                          value     — integer
 *                        Wired through applyKiSkillsModifiers (derived function) which fills
 *                        system.general.modifiers.kiBonus.{damage,initiative,energyArmor}.value.
 *                        Those buckets are then read by calculateWeaponDamage, mutateInitiative
 *                        and mutateTotalArmor.
 *
 * To regenerate from a fresh community Excel, see scripts/extractKiSkills.py
 * (kept outside the repo until a Node port is decided).
 */

/** @type {Array<{
 *   id: string,
 *   name: string,
 *   type: 'ki' | 'nemesis',
 *   martialKnowledge: number,
 *   tree: { parent: string | null, depth: number },
 *   aliases: { es: string[] },
 *   effects: object[]
 * }>} */
export const KI_SKILLS = [
  // === Habilidades del Ki (Core Exxet) ===
  {
    id: 'kiUse',
    name: 'Uso del Ki',
    type: 'ki',
    martialKnowledge: 40,
    tree: { parent: null, depth: 0 },
    aliases: { es: ['Uso del Ki'] },
    effects: []
  },
  {
    id: 'kiControl',
    name: 'Control del Ki',
    type: 'ki',
    martialKnowledge: 30,
    tree: { parent: null, depth: 0 },
    aliases: { es: ['Control del Ki'] },
    effects: []
  },
  {
    id: 'kiDetection',
    name: 'Detección del Ki',
    type: 'ki',
    martialKnowledge: 20,
    tree: { parent: 'kiControl', depth: 1 },
    aliases: { es: ['Detección del Ki'] },
    effects: []
  },
  {
    id: 'erudition',
    name: 'Erudición',
    type: 'ki',
    martialKnowledge: 10,
    tree: { parent: 'kiDetection', depth: 2 },
    aliases: { es: ['Erudición'] },
    effects: []
  },
  {
    id: 'combatAura',
    name: 'Aura de combate',
    type: 'ki',
    martialKnowledge: 40,
    tree: { parent: 'kiControl', depth: 1 },
    aliases: { es: ['Aura de combate'] },
    effects: []
  },
  {
    id: 'physicalDomain',
    name: 'Dominio físico',
    type: 'ki',
    martialKnowledge: 10,
    tree: { parent: 'kiControl', depth: 1 },
    aliases: { es: ['Dominio físico'] },
    effects: [{ target: 'resistancePhysical', operation: 'add', value: 10 }]
  },
  {
    id: 'physicalChange',
    name: 'Cambio físico',
    type: 'ki',
    martialKnowledge: 30,
    tree: { parent: 'physicalDomain', depth: 2 },
    aliases: { es: ['Cambio físico'] },
    effects: []
  },
  {
    id: 'superiorChange',
    name: 'Cambio superior',
    type: 'ki',
    martialKnowledge: 20,
    tree: { parent: 'physicalChange', depth: 3 },
    aliases: { es: ['Cambio superior'] },
    effects: []
  },
  {
    id: 'bodyMultiplication',
    name: 'Mult. de cuerpos',
    type: 'ki',
    martialKnowledge: 30,
    tree: { parent: 'physicalDomain', depth: 2 },
    aliases: { es: ['Mult. de cuerpos'] },
    effects: []
  },
  {
    id: 'majorMultiplication',
    name: 'Mult. mayor',
    type: 'ki',
    martialKnowledge: 30,
    tree: { parent: 'bodyMultiplication', depth: 3 },
    aliases: { es: ['Mult. mayor'] },
    effects: []
  },
  {
    id: 'arcaneMultiplication',
    name: 'Mult. arcana',
    type: 'ki',
    martialKnowledge: 40,
    tree: { parent: 'majorMultiplication', depth: 4 },
    aliases: { es: ['Mult. arcana'] },
    effects: []
  },
  {
    id: 'magnitude',
    name: 'Magnitud',
    type: 'ki',
    martialKnowledge: 30,
    tree: { parent: 'bodyMultiplication', depth: 3 },
    aliases: { es: ['Magnitud'] },
    effects: []
  },
  {
    id: 'arcaneMagnitude',
    name: 'Mag. arcana',
    type: 'ki',
    martialKnowledge: 40,
    tree: { parent: 'magnitude', depth: 4 },
    aliases: { es: ['Mag. arcana'] },
    effects: []
  },
  {
    id: 'ageControl',
    name: 'Control de la edad',
    type: 'ki',
    martialKnowledge: 20,
    tree: { parent: 'physicalDomain', depth: 2 },
    aliases: { es: ['Control de la edad'] },
    effects: []
  },
  {
    id: 'techniqueImitation',
    name: 'Imitación de técnicas',
    type: 'ki',
    martialKnowledge: 50,
    tree: { parent: 'kiControl', depth: 1 },
    aliases: { es: ['Imitación de técnicas'] },
    effects: []
  },
  {
    id: 'forceTechniques',
    name: 'Forzar técnicas',
    type: 'ki',
    martialKnowledge: 20,
    tree: { parent: 'kiControl', depth: 1 },
    aliases: { es: ['Forzar técnicas'] },
    effects: []
  },
  {
    id: 'weightElimination',
    name: 'Eliminación de peso',
    type: 'ki',
    martialKnowledge: 10,
    tree: { parent: null, depth: 0 },
    aliases: { es: ['Eliminación de peso'] },
    effects: []
  },
  {
    id: 'levitation',
    name: 'Levitación',
    type: 'ki',
    martialKnowledge: 20,
    tree: { parent: 'weightElimination', depth: 1 },
    aliases: { es: ['Levitación'] },
    effects: []
  },
  {
    id: 'objectMovement',
    name: 'Movimiento de objetos',
    type: 'ki',
    martialKnowledge: 10,
    tree: { parent: 'levitation', depth: 2 },
    aliases: { es: ['Movimiento de objetos'] },
    effects: []
  },
  {
    id: 'massMovement',
    name: 'Mov. de masas',
    type: 'ki',
    martialKnowledge: 20,
    tree: { parent: 'objectMovement', depth: 3 },
    aliases: { es: ['Mov. de masas'] },
    effects: []
  },
  {
    id: 'flight',
    name: 'Vuelo',
    type: 'ki',
    martialKnowledge: 20,
    tree: { parent: 'levitation', depth: 2 },
    aliases: { es: ['Vuelo'] },
    effects: []
  },
  {
    id: 'presenceExtrusion',
    name: 'Extrusión de presencia',
    type: 'ki',
    martialKnowledge: 10,
    tree: { parent: null, depth: 0 },
    aliases: { es: ['Extrusión de presencia'] },
    effects: []
  },
  {
    id: 'energyArmor',
    name: 'Armadura de energía',
    type: 'ki',
    martialKnowledge: 10,
    tree: { parent: 'presenceExtrusion', depth: 1 },
    aliases: { es: ['Armadura de energía'] },
    effects: [{ target: 'energyArmor', operation: 'set', value: 2 }]
  },
  {
    id: 'majorArmor',
    name: 'Armadura mayor',
    type: 'ki',
    martialKnowledge: 10,
    tree: { parent: 'energyArmor', depth: 2 },
    aliases: { es: ['Armadura mayor'] },
    // No passive contribution: this ability only grants +4 TA when activated
    // (1 Ki / 5 turns), which is out of scope for this PR.
    effects: []
  },
  {
    id: 'arcaneArmor',
    name: 'Arm. arcana',
    type: 'ki',
    martialKnowledge: 10,
    tree: { parent: 'majorArmor', depth: 3 },
    aliases: { es: ['Arm. arcana'] },
    // Passive part only — +4 TA, does not stack with energyArmor / majorArmor.
    // The activable +6 TA (1 Ki / 5 turns) is out of scope for this PR.
    effects: [{ target: 'energyArmor', operation: 'set', value: 4 }]
  },
  {
    id: 'weaponAuraExtension',
    name: 'Extensión del aura al arma',
    type: 'ki',
    martialKnowledge: 10,
    tree: { parent: 'presenceExtrusion', depth: 1 },
    aliases: { es: ['Extensión del aura al arma'] },
    effects: [{ target: 'damage', operation: 'add', value: 10 }]
  },
  {
    id: 'elementalAttack',
    name: 'Ataque elemental',
    type: 'ki',
    martialKnowledge: 10,
    tree: { parent: 'weaponAuraExtension', depth: 2 },
    aliases: { es: ['Ataque elemental'] },
    effects: []
  },
  {
    id: 'increasedDamage',
    name: 'Daño incrementado',
    type: 'ki',
    martialKnowledge: 10,
    tree: { parent: 'weaponAuraExtension', depth: 2 },
    aliases: { es: ['Daño incrementado'] },
    effects: [{ target: 'damage', operation: 'add', value: 10 }]
  },
  {
    id: 'increasedReach',
    name: 'Alcance incrementado',
    type: 'ki',
    martialKnowledge: 10,
    tree: { parent: 'weaponAuraExtension', depth: 2 },
    aliases: { es: ['Alcance incrementado'] },
    effects: []
  },
  {
    id: 'increasedSpeed',
    name: 'Velocidad incrementada',
    type: 'ki',
    martialKnowledge: 10,
    tree: { parent: 'weaponAuraExtension', depth: 2 },
    aliases: { es: ['Velocidad incrementada'] },
    effects: [{ target: 'initiative', operation: 'add', value: 10 }]
  },
  {
    id: 'kiDestruction',
    name: 'Destrucción por Ki',
    type: 'ki',
    martialKnowledge: 20,
    tree: { parent: 'presenceExtrusion', depth: 1 },
    aliases: { es: ['Destrucción por Ki'] },
    effects: []
  },
  {
    id: 'energyAbsorption',
    name: 'Absorción de energía',
    type: 'ki',
    martialKnowledge: 30,
    tree: { parent: 'presenceExtrusion', depth: 1 },
    aliases: { es: ['Absorción de energía'] },
    effects: []
  },
  {
    id: 'physicalShield',
    name: 'Escudo físico',
    type: 'ki',
    martialKnowledge: 10,
    tree: { parent: 'presenceExtrusion', depth: 1 },
    aliases: { es: ['Escudo físico'] },
    effects: []
  },
  {
    id: 'kiTransmission',
    name: 'Transmisión del Ki',
    type: 'ki',
    martialKnowledge: 10,
    tree: { parent: null, depth: 0 },
    aliases: { es: ['Transmisión del Ki'] },
    effects: []
  },
  {
    id: 'kiHealing',
    name: 'Curación por Ki',
    type: 'ki',
    martialKnowledge: 10,
    tree: { parent: 'kiTransmission', depth: 1 },
    aliases: { es: ['Curación por Ki'] },
    effects: []
  },
  {
    id: 'superiorHealing',
    name: 'Curación superior',
    type: 'ki',
    martialKnowledge: 10,
    tree: { parent: 'kiHealing', depth: 2 },
    aliases: { es: ['Curación superior'] },
    effects: []
  },
  {
    id: 'stabilize',
    name: 'Estabilizar',
    type: 'ki',
    martialKnowledge: 10,
    tree: { parent: 'kiHealing', depth: 2 },
    aliases: { es: ['Estabilizar'] },
    effects: []
  },
  {
    id: 'vitalSacrifice',
    name: 'Sacrificio vital',
    type: 'ki',
    martialKnowledge: 10,
    tree: { parent: 'kiTransmission', depth: 1 },
    aliases: { es: ['Sacrificio vital'] },
    effects: []
  },
  {
    id: 'necessaryEnergyUse',
    name: 'Uso de la energía necesaria',
    type: 'ki',
    martialKnowledge: 10,
    tree: { parent: null, depth: 0 },
    aliases: { es: ['Uso de la energía necesaria'] },
    effects: []
  },
  {
    id: 'kiHiding',
    name: 'Ocultación del Ki',
    type: 'ki',
    martialKnowledge: 10,
    tree: { parent: 'necessaryEnergyUse', depth: 1 },
    aliases: { es: ['Ocultación del Ki'] },
    effects: []
  },
  {
    id: 'hidingAura',
    name: 'Aura de ocultación',
    type: 'ki',
    martialKnowledge: 10,
    tree: { parent: 'kiHiding', depth: 2 },
    aliases: { es: ['Aura de ocultación'] },
    effects: []
  },
  {
    id: 'fakeDeath',
    name: 'Falsa muerte',
    type: 'ki',
    martialKnowledge: 10,
    tree: { parent: 'kiHiding', depth: 2 },
    aliases: { es: ['Falsa muerte'] },
    effects: []
  },
  {
    id: 'needElimination',
    name: 'Eliminación de necesidades',
    type: 'ki',
    martialKnowledge: 10,
    tree: { parent: 'necessaryEnergyUse', depth: 1 },
    aliases: { es: ['Eliminación de necesidades'] },
    effects: []
  },
  {
    id: 'fireImmunity',
    name: 'Inmunidad elem. FUE',
    type: 'ki',
    martialKnowledge: 20,
    tree: { parent: 'needElimination', depth: 2 },
    aliases: { es: ['Inmunidad elem. FUE'] },
    effects: []
  },
  {
    id: 'coldImmunity',
    name: 'Inmunidad elem. FRI',
    type: 'ki',
    martialKnowledge: 20,
    tree: { parent: 'needElimination', depth: 2 },
    aliases: { es: ['Inmunidad elem. FRI'] },
    effects: []
  },
  {
    id: 'electricImmunity',
    name: 'Inmunidad elem. ELE',
    type: 'ki',
    martialKnowledge: 20,
    tree: { parent: 'needElimination', depth: 2 },
    aliases: { es: ['Inmunidad elem. ELE'] },
    effects: []
  },
  {
    id: 'penaltyElimination',
    name: 'Eliminación de penalizadores',
    type: 'ki',
    martialKnowledge: 20,
    tree: { parent: 'necessaryEnergyUse', depth: 1 },
    aliases: { es: ['Eliminación de penalizadores'] },
    effects: []
  },
  {
    id: 'recovery',
    name: 'Recuperación',
    type: 'ki',
    martialKnowledge: 20,
    tree: { parent: 'penaltyElimination', depth: 2 },
    aliases: { es: ['Recuperación'] },
    effects: []
  },
  {
    id: 'restoreOthers',
    name: 'Restituir a otros',
    type: 'ki',
    martialKnowledge: 10,
    tree: { parent: 'recovery', depth: 3 },
    aliases: { es: ['Restituir a otros'] },
    effects: []
  },
  {
    id: 'characteristicIncrease',
    name: 'Aumento de características',
    type: 'ki',
    martialKnowledge: 20,
    tree: { parent: 'necessaryEnergyUse', depth: 1 },
    aliases: { es: ['Aumento de características'] },
    effects: []
  },
  {
    id: 'superiorIncrease',
    name: 'Incremento superior',
    type: 'ki',
    martialKnowledge: 20,
    tree: { parent: 'characteristicIncrease', depth: 2 },
    aliases: { es: ['Incremento superior'] },
    effects: []
  },
  {
    id: 'improvisedCombatTechniques',
    name: 'Técnicas de combate improvisadas',
    type: 'ki',
    martialKnowledge: 50,
    tree: { parent: null, depth: 0 },
    aliases: { es: ['Técnicas de combate improvisadas'] },
    effects: []
  },
  {
    id: 'inhumanity',
    name: 'Inhumanidad',
    type: 'ki',
    martialKnowledge: 30,
    tree: { parent: null, depth: 0 },
    aliases: { es: ['Inhumanidad'] },
    effects: []
  },
  {
    id: 'zen',
    name: 'Zen',
    type: 'ki',
    martialKnowledge: 50,
    tree: { parent: 'inhumanity', depth: 1 },
    aliases: { es: ['Zen'] },
    effects: []
  },

  // === Habilidades del Némesis (Core Exxet) ===
  {
    id: 'nemesisUse',
    name: 'Uso del Némesis',
    type: 'nemesis',
    martialKnowledge: 70,
    tree: { parent: null, depth: 0 },
    aliases: { es: ['Uso del Némesis'] },
    effects: []
  },
  {
    id: 'voidArmor',
    name: 'Armadura de vacío',
    type: 'nemesis',
    martialKnowledge: 20,
    tree: { parent: null, depth: 0 },
    aliases: { es: ['Armadura de vacío'] },
    effects: [{ target: 'damageReduction', operation: 'set', value: 10 }]
  },
  {
    id: 'noht',
    name: 'Noht',
    type: 'nemesis',
    martialKnowledge: 30,
    tree: { parent: 'voidArmor', depth: 1 },
    aliases: { es: ['Noht'] },
    effects: [{ target: 'damageReduction', operation: 'set', value: 30 }]
  },
  {
    id: 'kiNullification',
    name: 'Anulación de Ki',
    type: 'nemesis',
    martialKnowledge: 30,
    tree: { parent: null, depth: 0 },
    aliases: { es: ['Anulación de Ki'] },
    effects: []
  },
  {
    id: 'majorKiNullification',
    name: 'Anulación de Ki mayor',
    type: 'nemesis',
    martialKnowledge: 20,
    tree: { parent: 'kiNullification', depth: 1 },
    aliases: { es: ['Anulación de Ki mayor'] },
    effects: []
  },
  {
    id: 'magicNullification',
    name: 'Anulación de Magia',
    type: 'nemesis',
    martialKnowledge: 30,
    tree: { parent: null, depth: 0 },
    aliases: { es: ['Anulación de Magia'] },
    effects: []
  },
  {
    id: 'majorMagicNullification',
    name: 'Anulación de Magia mayor',
    type: 'nemesis',
    martialKnowledge: 20,
    tree: { parent: 'magicNullification', depth: 1 },
    aliases: { es: ['Anulación de Magia mayor'] },
    effects: []
  },
  {
    id: 'matrixNullification',
    name: 'Anulación de Matrices',
    type: 'nemesis',
    martialKnowledge: 30,
    tree: { parent: null, depth: 0 },
    aliases: { es: ['Anulación de Matrices'] },
    effects: []
  },
  {
    id: 'majorMatrixNullification',
    name: 'Anulación de Matrices mayor',
    type: 'nemesis',
    martialKnowledge: 20,
    tree: { parent: 'matrixNullification', depth: 1 },
    aliases: { es: ['Anulación de Matrices mayor'] },
    effects: []
  },
  {
    id: 'bondsNullification',
    name: 'Anulación de Lazos',
    type: 'nemesis',
    martialKnowledge: 30,
    tree: { parent: null, depth: 0 },
    aliases: { es: ['Anulación de Lazos'] },
    effects: []
  },
  {
    id: 'voidExtrusion',
    name: 'Extrusión de Vacío',
    type: 'nemesis',
    martialKnowledge: 30,
    tree: { parent: null, depth: 0 },
    aliases: { es: ['Extrusión de Vacío'] },
    effects: []
  },
  {
    id: 'voidForm',
    name: 'Forma de Vacío',
    type: 'nemesis',
    martialKnowledge: 30,
    tree: { parent: 'voidExtrusion', depth: 1 },
    aliases: { es: ['Forma de Vacío'] },
    effects: []
  },
  {
    id: 'voidBody',
    name: 'Cuerpo de Vacío',
    type: 'nemesis',
    martialKnowledge: 10,
    tree: { parent: null, depth: 0 },
    aliases: { es: ['Cuerpo de Vacío'] },
    effects: [{ target: 'resistanceAll', operation: 'add', value: 20 }]
  },
  {
    id: 'withoutNeeds',
    name: 'Sin necesidades',
    type: 'nemesis',
    martialKnowledge: 10,
    tree: { parent: 'voidBody', depth: 1 },
    aliases: { es: ['Sin necesidades'] },
    effects: []
  },
  {
    id: 'voidMovement',
    name: 'Movimiento de Vacío',
    type: 'nemesis',
    martialKnowledge: 20,
    tree: { parent: 'voidBody', depth: 1 },
    aliases: { es: ['Movimiento de Vacío'] },
    effects: []
  },
  {
    id: 'voidEssence',
    name: 'Esencia de Vacío',
    type: 'nemesis',
    martialKnowledge: 20,
    tree: { parent: 'voidBody', depth: 1 },
    aliases: { es: ['Esencia de Vacío'] },
    effects: []
  },
  {
    id: 'oneWithNothingness',
    name: 'Uno con la nada',
    type: 'nemesis',
    martialKnowledge: 40,
    tree: { parent: 'voidEssence', depth: 2 },
    aliases: { es: ['Uno con la nada'] },
    effects: []
  },
  {
    id: 'voidAura',
    name: 'Aura de Vacío',
    type: 'nemesis',
    martialKnowledge: 30,
    tree: { parent: null, depth: 0 },
    aliases: { es: ['Aura de Vacío'] },
    effects: []
  },
  {
    id: 'undetection',
    name: 'Indetección',
    type: 'nemesis',
    martialKnowledge: 10,
    tree: { parent: null, depth: 0 },
    aliases: { es: ['Indetección'] },
    effects: []
  },
  {
    id: 'inhumanityNemesis',
    name: 'Inhumanidad',
    type: 'nemesis',
    martialKnowledge: 20,
    tree: { parent: null, depth: 0 },
    aliases: { es: ['Inhumanidad'] },
    effects: []
  },
  {
    id: 'zenNemesis',
    name: 'Zen',
    type: 'nemesis',
    martialKnowledge: 40,
    tree: { parent: 'inhumanityNemesis', depth: 1 },
    aliases: { es: ['Zen'] },
    effects: []
  }
];

/** Lookup a canonical Ki/Nemesis entry by exact name or alias.
 *  Returns undefined when no match found.
 *  @param {string} name
 *  @returns {(typeof KI_SKILLS)[number] | undefined}
 */
export function findKiSkillByName(name) {
  if (!name) return undefined;
  const needle = name.trim();
  return KI_SKILLS.find(
    s => s.name === needle || (s.aliases?.es ?? []).includes(needle)
  );
}

/** Lookup a canonical Ki/Nemesis entry by stable internal id.
 *  Returns undefined when no match found.
 *  @param {string} id
 *  @returns {(typeof KI_SKILLS)[number] | undefined}
 */
export function findKiSkillById(id) {
  if (!id) return undefined;
  return KI_SKILLS.find(s => s.id === id);
}
