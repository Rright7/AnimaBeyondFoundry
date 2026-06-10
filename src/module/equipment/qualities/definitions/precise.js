import { EquipmentQualityDefinition } from '../EquipmentQualityDefinition.js';
import { martialArtDoublesPrecise } from '../../../combat/martialArts/martialArtSpecials.js';

/**
 * Precisa
 * RAW: permite al personaje disminuir a la mitad los penalizadores de los
 * golpes apuntados y los de la maniobra de Engatillar. Sólo se aplica en
 * ataques cuerpo a cuerpo, no con proyectiles lanzados.
 */
export const precise = new EquipmentQualityDefinition({
  slug: 'precise',
  nameKey: 'anima.weaponQuality.precise.name',
  descriptionKey: 'anima.weaponQuality.precise.description',
  icon: 'icons/weapons/swords/sword-katana.webp',

  appliesTo: ['weapon'],
  meleeOnly: true,
  aliases: ['precisa', 'précise'],

  modifyAimedPenalty(penalty, ctx) {
    // All Tabla 45 values are even multiples of 10, so the halved result
    // is always a clean multiple of 5. Truncation toward zero is therefore
    // exact, not lossy.
    let p = Math.trunc(Number(penalty || 0) / 2);
    // Enuth dobla la ventaja de Precisa: aplica la mitad otra vez (penalizador a 1/4).
    if (martialArtDoublesPrecise(ctx?.actor)) p = Math.trunc(p / 2);
    return p;
  },

  modifyManeuverPenalty(penalty, ctx) {
    // RAW only calls out Engatillar by name. Aimed-attack maneuvers
    // (Inutilizar, Inconsciencia) get their discount through the aimed
    // pathway, not through this hook.
    if (ctx?.maneuverSlug === 'engatillar') {
      let p = Math.trunc(Number(penalty || 0) / 2);
      if (martialArtDoublesPrecise(ctx?.actor)) p = Math.trunc(p / 2);
      return p;
    }
    return penalty;
  }
});
