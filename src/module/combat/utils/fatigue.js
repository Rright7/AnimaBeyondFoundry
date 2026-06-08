const norm = s =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

/**
 * Puntos de Cansancio gastables por accion en combate (RAW): 2 normalmente; 5 si el
 * actor tiene la habilidad de Ki "Uso de la energia necesaria" (id necessaryEnergyUse).
 *
 * @param {object} actor documento del actor (system preparado)
 * @returns {number} 2 o 5
 */
export function maxFatiguePerAction(actor) {
  const kiSkills = actor?.system?.domine?.kiSkills ?? [];
  const hasNecessaryEnergy = kiSkills.some(
    k =>
      k?.system?.canonicalId === 'necessaryEnergyUse' ||
      norm(k?.name).includes('energia necesaria')
  );
  return hasNecessaryEnergy ? 5 : 2;
}
