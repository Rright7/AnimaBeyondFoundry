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
    const base = Number(penalty || 0);
    // Sambo Supremo: su reduccion a la mitad de los Ataques Apuntados se ACUMULA con
    // Precisa, dejando una CUARTA parte del penalizador, redondeada HACIA ARRIBA (hacia
    // 0) en grupos de 5. base/4 redondeado a 5 = ceil(base/20)*5 (base es negativo).
    if (martialArtDoublesPrecise(ctx?.actor)) {
      // || 0 normaliza el -0 que produce Math.ceil(negativo cercano a 0).
      return Math.ceil(base / 20) * 5 || 0;
    }
    // Precisa: la mitad. Tabla 45 son multiplos de 10, asi que /2 da multiplos de 5
    // exactos (truncar hacia 0 no pierde precision).
    return Math.trunc(base / 2);
  },

  modifyManeuverPenalty(penalty, ctx) {
    // RAW only calls out Engatillar by name. Aimed-attack maneuvers
    // (Inutilizar, Inconsciencia) get their discount through the aimed
    // pathway, not through this hook. (Sambo Supremo solo afecta a los apuntados.)
    if (ctx?.maneuverSlug === 'engatillar') {
      return Math.trunc(Number(penalty || 0) / 2);
    }
    return penalty;
  }
});
