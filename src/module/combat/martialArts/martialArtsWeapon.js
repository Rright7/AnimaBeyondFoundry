import { martialArtUnarmedDamage } from './martialArtCatalog.js';

const num = v => Number(v) || 0;

/**
 * @param {object} weapon entrada de combat.weapons
 * @returns {boolean} true si es el arma-perfil "Artes Marciales" del compendio.
 */
export function isMartialArtsProfileWeapon(weapon) {
  return !!weapon?.system?.isMartialArtsProfile?.value;
}

/**
 * Inyecta en el arma-perfil "Artes Marciales" los bonos de Arte Marcial:
 *  - Ataque/Parada/Turno: de los buckets `general.modifiers.martialArtBonus` (ya con
 *    el tope +50 COMBINADO aplicado en applyMartialArtModifiers; Maestro exento).
 *  - Daño: el MAYOR Daño Base entre las artes (artBase + mult x mod, p.ej. "20 + FUE"
 *    o "20 + 2xFUE") o el brawl 10+FUE, lo que sea mayor, + el bono de daño de las
 *    Avanzadas. Como el catalogo usa el modificador de caracteristica (no la tabla
 *    de FUE de arma), se inyecta via FORMULA CUSTOM: en esa rama calculateWeaponDamage
 *    NO suma el FUE de tabla encima, evitando el doble conteo.
 * La Esquiva NO es un stat de arma (se aplica en el dialogo de defensa). No-op si
 * el arma no es el perfil.
 *
 * @param {object} weapon entrada de combat.weapons (se muta in situ)
 * @param {import('../../types/Actor').ABFActorDataSourceData} data
 */
export function applyMartialArtsWeaponBonuses(weapon, data) {
  if (!isMartialArtsProfileWeapon(weapon)) return;
  const b = data?.general?.modifiers?.martialArtBonus ?? {};
  const s = weapon.system;

  if (s?.attack?.special) s.attack.special.value = num(b.attack?.value) + num(b.masterAttack?.value);
  if (s?.block?.special) s.block.special.value = num(b.block?.value) + num(b.masterDefense?.value);
  if (s?.initiative?.special) s.initiative.special.value = num(b.turn?.value);

  // Daño desarmado de AM (mayor base de las artes vs brawl 10+FUE) + bono.
  const ma = martialArtUnarmedDamage({ system: data });
  const sMod = data?.characteristics?.primaries?.strength?.mod;
  const strMod = num(sMod?.value ?? sMod);
  const brawl = 10 + strMod;
  const maDamage = (ma.base !== null ? Math.max(ma.base, brawl) : brawl) + ma.bonus;
  if (s?.damage) {
    s.damage.special = { value: 0 };
    s.damage.formula = { value: String(maDamage) };
  }
  s.useCustomFormula = { value: true };
}
