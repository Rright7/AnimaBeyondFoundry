import { EquipmentQualityDefinition } from '../EquipmentQualityDefinition.js';

/**
 * Lanzable
 * RAW: equilibradas o pensadas para ser usadas a distancia. Los personajes
 * con habilidad en ellas pueden emplearlas físicamente o arrojándolas, sin
 * necesidad de la Tabla de armas de lanzamiento.
 *
 * No mechanical hook — it changes which skill tables apply, not damage
 * or penalty math. The check belongs in the rolltable lookup code when
 * it's ported to consult qualities.
 */
export const throwable = new EquipmentQualityDefinition({
  slug: 'throwable',
  nameKey: 'anima.weaponQuality.throwable.name',
  descriptionKey: 'anima.weaponQuality.throwable.description',
  icon: 'icons/weapons/thrown/dagger-thrown-glow.webp',

  appliesTo: ['weapon'],
  aliases: ['lanzable', 'throwable', 'lançable']
});
