import { EquipmentQualityDefinition } from '../EquipmentQualityDefinition.js';

/**
 * Presa
 * RAW: permiten usar maniobras específicas de Presa para atrapar al
 * oponente. A diferencia de las manos desnudas, al presar con un arma se
 * debe usar la Fuerza natural del arma como característica. Las armas de
 * calidad añaden +1 a la FUE para presar por cada +5 de bono natural.
 *
 * La regla de "usar la Fuerza del arma" ya está cableada: el valor fijo de presa vive
 * en el PARÁMETRO de esta cualidad (`system.qualityParams.value.grappling.grappleStrength`,
 * ya poblado en el compendio: boleadora 10, red 10, látigo 8...). El diálogo del control
 * enfrentado (OpposedCheckRollDialog) lo ofrece como característica elegible del atacante,
 * preseleccionada, sumándole el +1 por cada +5 de calidad del arma. La cualidad además es
 * el gate de elegibilidad de la maniobra (alias `allowsPresa` en weaponRestrictions).
 */
export const grappling = new EquipmentQualityDefinition({
  slug: 'grappling',
  nameKey: 'anima.weaponQuality.grappling.name',
  descriptionKey: 'anima.weaponQuality.grappling.description',
  icon: 'icons/skills/melee/strike-fists-grappling-orange.webp',

  appliesTo: ['weapon'],
  aliases: ['presa', 'grappling', 'prise']
});
