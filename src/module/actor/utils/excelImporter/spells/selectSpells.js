/**
 * Selecciona, de una lista de hechizos del compendio, los que corresponden a
 * las vías del personaje: por cada vía con nivel L se incluyen los hechizos de
 * esa vía con `level <= L` (nivel nulo se trata como agnóstico → se incluye).
 * Los de Libre Acceso (freeAccess) se incluyen siempre (opción includeFreeAccess).
 *
 * Función pura: recibe objetos con `system.via.value` y `system.level.value`
 * (sirven tanto documentos del compendio como objetos planos en tests).
 *
 * @param {Array} allSpells
 * @param {Array<{viaKey:string, level:number}>} viaLevels
 * @param {{includeFreeAccess?: boolean}} [options]
 * @returns {Array} subconjunto de allSpells
 */
const FREE_ACCESS = 'freeAccess';

export function selectSpells(allSpells, viaLevels, options = {}) {
  const { includeFreeAccess = true } = options;
  const list = Array.isArray(allSpells) ? allSpells : [];

  const levelByVia = new Map(
    (viaLevels ?? []).map(v => [v.viaKey, Number(v.level) || 0])
  );

  return list.filter(spell => {
    const via = spell?.system?.via?.value;
    if (!via) return false;

    if (via === FREE_ACCESS) return includeFreeAccess;

    if (!levelByVia.has(via)) return false;

    const max = levelByVia.get(via);
    const rawLevel = spell?.system?.level?.value;
    const level = rawLevel == null ? 0 : Number(rawLevel);
    return Number.isFinite(level) && level <= max;
  });
}
