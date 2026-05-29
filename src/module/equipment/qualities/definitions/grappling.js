import { EquipmentQualityDefinition } from '../EquipmentQualityDefinition.js';

/**
 * Presa
 * RAW: permiten usar maniobras específicas de Presa para atrapar al
 * oponente. A diferencia de las manos desnudas, al presar con un arma se
 * debe usar la Fuerza natural del arma como característica. Las armas de
 * calidad añaden +1 a la FUE para presar por cada +5 de bono natural.
 *
 * Hooks will be wired when Familia B (sub-maneuvers of Presa) lands.
 * The presa execution code will look up qualities on the equipped weapon
 * to decide:
 *   - which characteristic to use (the weapon's `weaponStrength` instead
 *     of the attacker's STR)
 *   - whether the +1 per +5 quality bonus rule applies
 */
export const grappling = new EquipmentQualityDefinition({
  slug: 'grappling',
  nameKey: 'anima.weaponQuality.grappling.name',
  descriptionKey: 'anima.weaponQuality.grappling.description',
  icon: 'icons/skills/melee/strike-fists-grappling-orange.webp',

  appliesTo: ['weapon'],
  aliases: ['presa', 'grappling', 'prise']
});
