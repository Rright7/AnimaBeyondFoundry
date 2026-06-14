import { getWeaponKnowledgePenalty } from '../util/getWeaponKnowledgePenalty';
import { calculateStrengthRequiredPenalty } from '../util/calculateStrengthRequiredPenalty';
import { calculateShieldBlockBonus } from '../../../actor/combat/calculations/calculateShieldBlockBonus';

/**
 * @param {import('../../../../../../../types/Items').WeaponDataSource} weapon
 * @param {import('../../../../../../../types/Actor').ABFActorDataSourceData} data
 */
export const calculateWeaponBlock = (weapon, data) => {
  // Perfil "Artes Marciales": el bono de Parada del arte (incl. Maestro) se suma aqui,
  // no en weapon.system.block.special (que es el bono manual editable del jugador).
  const b = data.general?.modifiers?.martialArtBonus ?? {};
  const maBlock = weapon.system.isMartialArtsProfile?.value
    ? (b.block?.value ?? 0) + (b.masterDefense?.value ?? 0)
    : 0;

  return (
    data.combat.block.final.value +
    weapon.system.block.special.value +
    weapon.system.quality.value +
    (weapon.system.isShield.value && weapon.system.equipped.value
      ? calculateShieldBlockBonus(weapon)
      : 0) +
    getWeaponKnowledgePenalty(weapon) +
    calculateStrengthRequiredPenalty(weapon, data) +
    maBlock
  );
};
