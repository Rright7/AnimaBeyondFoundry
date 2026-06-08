/**
 * "Modo desarmado": el actor no empuña ningún arma NO-desarmada equipada. Las armas
 * desarmadas ("Desarmado", "Artes Marciales") tienen isUnarmed=true y NO cuentan,
 * asi que equiparlas (o no equipar nada) deja al PJ en modo desarmado.
 *
 * @param {object} actor documento del actor
 * @returns {boolean}
 */
export function isUnarmedMode(actor) {
  const weapons = actor?.system?.combat?.weapons ?? [];
  return (
    weapons.filter(w => !w?.system?.isUnarmed?.value && w?.system?.equipped?.value)
      .length === 0
  );
}

/**
 * Bono de Arte Marcial a la Esquiva, aplicable SOLO en modo desarmado (RAW: el AM
 * no aplica empuñando un arma real). Espeja la Parada del perfil de arma "Artes
 * Marciales" (block + masterDefense). En fichas importadas legacy los buckets valen
 * 0 (artes `bonusInBase` excluidas en applyMartialArtModifiers) -> devuelve 0 y no
 * hay doble conteo (su combat.dodge ya incluye el AM del Excel).
 *
 * @param {object} actor documento del actor
 * @returns {number}
 */
export function martialArtsDodgeBonus(actor) {
  if (!isUnarmedMode(actor)) return 0;
  const m = actor?.system?.general?.modifiers?.martialArtBonus ?? {};
  return (Number(m.dodge?.value) || 0) + (Number(m.masterDefense?.value) || 0);
}
