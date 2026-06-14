// Helpers de "armas en mano" para el Turno y el panel de Combate. Puros y sin
// imports pesados (a proposito), para poder testearlos y compartirlos entre
// mutateInitiative y el sheet sin arrastrar la cadena de WeaponItemConfig.

/** Arma de cuerpo entero (Desarmado / perfil "Artes Marciales"): NO se asigna a mano. */
export const isUnarmedWeapon = weapon => !!weapon?.system?.isUnarmed?.value;

export const isShieldWeapon = weapon => !!weapon?.system?.isShield?.value;

/**
 * Rodela = escudo pequeño: se lleva en el antebrazo, sin ocupar una mano. Por eso
 * NO entra en el panel de manos y su penalizador de Turno cuenta por estar EQUIPADA.
 */
export const isRodela = weapon =>
  isShieldWeapon(weapon) && weapon?.system?.size?.value === 'small';

/** Agarre efectivo a dos manos (two_hands puro, o one_or_two_hands elegido a dos manos). */
export const isTwoHandedGrip = weapon => {
  const m = weapon?.system?.manageabilityType?.value;
  if (m === 'two_hands') return true;
  if (m === 'one_or_two_hands') return weapon?.system?.oneOrTwoHanded?.value === 'two-handed';
  return false;
};

const handOf = weapon => weapon?.system?.handSlot?.value;

/**
 * Armas (no escudo, no cuerpo entero) asignadas a mano hábil/torpe, para el ajuste
 * del Turno con armas. FUENTE ÚNICA: handSlot; las equipadas SIN asignar no cuentan.
 * Un arma a dos manos ocupa AMBAS manos -> cuenta sola (ignora la otra mano).
 * @param {object[]} equippedWeapons
 * @returns {object[]} 0, 1 o 2 armas
 */
export const getCombatHandWeapons = equippedWeapons => {
  const candidates = (equippedWeapons ?? []).filter(
    w => !isShieldWeapon(w) && !isUnarmedWeapon(w)
  );
  const main = candidates.find(w => handOf(w) === 'main');
  const off = candidates.find(w => handOf(w) === 'off');

  if (main && isTwoHandedGrip(main)) return [main];
  if (off && isTwoHandedGrip(off)) return [off];

  return [main, off].filter(Boolean);
};

/**
 * Escudo que penaliza el Turno: la rodela (pequeño) penaliza por estar EQUIPADA (se
 * lleva sin mano); cualquier otro escudo solo si está asignado a una mano.
 * @param {object[]} equippedWeapons
 * @returns {object|null}
 */
export const getActiveTurnShield = equippedWeapons =>
  (equippedWeapons ?? []).find(w => {
    if (!isShieldWeapon(w)) return false;
    if (isRodela(w)) return true;
    const h = handOf(w);
    return h === 'main' || h === 'off';
  }) ?? null;
