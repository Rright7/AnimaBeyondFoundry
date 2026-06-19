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

/**
 * Agarre efectivo a dos manos. FUENTE ÚNICA de la derivación del agarre (la usan
 * getCurrentEquippedHand y getStrengthRequirement para no divergir):
 * - two_hands  -> siempre a dos manos (no se puede empuñar a una).
 * - one_hand   -> siempre a una mano.
 * - one_or_two_hands -> a dos manos solo si se asigna a 'both' en Armas en mano.
 */
export const isTwoHandedGrip = weapon => {
  const m = weapon?.system?.manageabilityType?.value;
  if (m === 'two_hands') return true;
  if (m === 'one_hand') return false;
  return weapon?.system?.handSlot?.value === 'both';
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

  // Arma asignada a dos manos: ocupa AMBAS manos, cuenta sola.
  const both = candidates.find(w => handOf(w) === 'both');
  if (both) return [both];

  const main = candidates.find(w => handOf(w) === 'main');
  const off = candidates.find(w => handOf(w) === 'off');

  // Salvaguarda (data vieja): un arma a dos manos asignada a una mano ocupa ambas.
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
    return h === 'main' || h === 'off' || h === 'both';
  }) ?? null;

/** ¿El arma lleva la cualidad `slug`? (case-insensitive; lee system.qualities.value). */
export const hasWeaponQuality = (weapon, slug) =>
  (weapon?.system?.qualities?.value ?? [])
    .map(s => String(s).toLowerCase())
    .includes(String(slug).toLowerCase());

/**
 * manageabilityType derivado de la cualidad de manejabilidad del arma (la cualidad
 * MANDA cuando está presente). Devuelve null si el arma no lleva ninguna -> el
 * llamador respeta el campo (selector). Sin migración.
 */
export const manageabilityFromQualities = weapon => {
  if (hasWeaponQuality(weapon, 'oneOrTwoHanded')) return 'one_or_two_hands';
  if (hasWeaponQuality(weapon, 'twoHanded')) return 'two_hands';
  if (hasWeaponQuality(weapon, 'oneHand')) return 'one_hand';
  return null;
};

/** Cualidades de agarre (manejabilidad). EXCLUSIVAS: solo una por arma. */
export const GRIP_QUALITY_SLUGS = ['oneHand', 'twoHanded', 'oneOrTwoHanded'];

const GRIP_BY_MANAGEABILITY = {
  one_hand: 'oneHand',
  two_hands: 'twoHanded',
  one_or_two_hands: 'oneOrTwoHanded'
};

/** manageabilityType -> slug de cualidad de agarre (o null si el valor no mapea). */
export const gripQualityForManageability = value =>
  GRIP_BY_MANAGEABILITY[value] ?? null;

/** slug de cualidad de agarre -> manageabilityType (o null). */
export const manageabilityForGripQuality = slug =>
  Object.keys(GRIP_BY_MANAGEABILITY).find(k => GRIP_BY_MANAGEABILITY[k] === slug) ?? null;

/**
 * Mantiene el invariante de agarre de un arma: EXACTAMENTE una cualidad de agarre y
 * manageabilityType reflejándola. La cualidad MANDA. Devuelve el parche
 * {qualities?, manageabilityType?} a aplicar al update (vacío si no hay que tocar
 * nada). Puro y testeable. `changed*` = undefined cuando ese campo no va en el update.
 */
export const computeWeaponGripSync = ({
  currentManage,
  currentQualities = [],
  changedManage,
  changedQualities
}) => {
  const hasManage = changedManage !== undefined;
  const hasQualities = changedQualities !== undefined;
  if (!hasManage && !hasQualities) return {};

  let qualities = (hasQualities ? changedQualities : currentQualities).slice();

  // Cambió el selector (sin tocar qualities): deriva la cualidad de agarre.
  if (hasManage && !hasQualities) {
    const desired = gripQualityForManageability(changedManage);
    const next = qualities.filter(s => !GRIP_QUALITY_SLUGS.includes(s));
    if (desired) next.push(desired);
    return { qualities: next };
  }

  // Cambiaron las qualities: exclusividad (deja la ÚLTIMA de agarre) + sincroniza selector.
  const out = {};
  const grips = qualities.filter(s => GRIP_QUALITY_SLUGS.includes(s));
  if (grips.length > 1) {
    const keep = grips[grips.length - 1];
    qualities = qualities.filter(s => !GRIP_QUALITY_SLUGS.includes(s) || s === keep);
    out.qualities = qualities;
  }
  const grip = qualities.find(s => GRIP_QUALITY_SLUGS.includes(s));
  if (grip && !hasManage) {
    const manage = manageabilityForGripQuality(grip);
    if (manage && manage !== currentManage) out.manageabilityType = manage;
  }
  return out;
};
