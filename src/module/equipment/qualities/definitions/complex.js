import { EquipmentQualityDefinition } from '../EquipmentQualityDefinition.js';

/**
 * Compleja
 * RAW: aumenta dos puntos el índice de Pifia (fracaso con 5 en un D100).
 * Si alcanza la maestría con ella, desaparece el penalizador.
 *
 * Hook pending — will be wired when the fumble subsystem grows a hook
 * point. The `mastery` check (skill >= 200 with the weapon's category)
 * is needed for the neutralization clause.
 */
export const complex = new EquipmentQualityDefinition({
  slug: 'complex',
  nameKey: 'anima.weaponQuality.complex.name',
  descriptionKey: 'anima.weaponQuality.complex.description',
  icon: 'icons/skills/melee/weapons-crossed-swords-purple.webp',

  appliesTo: ['weapon'],
  aliases: ['compleja', 'complex', 'complexe'],

  modifyFumbleThreshold(threshold, ctx) {
    // Placeholder: bump by 2 unless the user has reached mastery.
    // Mastery check is out of scope here; the engine that calls this hook
    // is expected to pass ctx.hasMastery for the weapon's category.
    if (ctx?.hasMastery) return threshold;
    return Number(threshold || 0) + 2;
  }
});
