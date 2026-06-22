export const PHYSICAL_CHARACTERISTIC_KEYS = new Set([
  'strength',
  'agility',
  'dexterity',
  'constitution'
]);

export const SYSTEM_CHARACTERISTIC_CEILING = 20;

/**
 * Tope del valor ('final') de una caracteristica fisica segun Inhumanidad/Zen:
 * 10 sin nada, 13 con Inhumanidad, 20 (techo del sistema) con Zen. Las
 * caracteristicas psiquicas mantienen el techo del sistema.
 * @param {string} key clave de la caracteristica (strength, agility, ...)
 * @param {{ inhuman?: boolean, zen?: boolean }} [flags]
 */
export const characteristicCap = (key, { inhuman = false, zen = false } = {}) => {
  if (!PHYSICAL_CHARACTERISTIC_KEYS.has(key)) return SYSTEM_CHARACTERISTIC_CEILING;
  if (zen) return SYSTEM_CHARACTERISTIC_CEILING;
  if (inhuman) return 13;
  return 10;
};

/**
 * Valor REAL de una caracteristica (base+special, acotado a [0, techo del sistema 20]),
 * SIN el tope de Inhumanidad/Zen. Es el que usan el BONO y las derivadas "implicitas"
 * (p.ej. la Regeneracion por Constitucion): el tope limita el valor MOSTRADO de la
 * caracteristica, no lo que esta aporta de forma inherente.
 * @param {{ base?: { value: number }, special?: { value: number } }} characteristic
 * @returns {number}
 */
export const realCharacteristicValue = characteristic => {
  const base = Number(characteristic?.base?.value) || 0;
  const special = Number(characteristic?.special?.value) || 0;
  return Math.min(Math.max(base + special, 0), SYSTEM_CHARACTERISTIC_CEILING);
};
