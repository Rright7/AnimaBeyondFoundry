import { getWeaponKnowledgePenalty } from '../util/getWeaponKnowledgePenalty';
import { calculateStrengthRequiredPenalty } from '../util/calculateStrengthRequiredPenalty';

/**
 * @param {import('../../../../../../../types/Items').WeaponDataSource} weapon
 * @param {import('../../../../../../../types/Actor').ABFActorDataSourceData} data
 * @returns {number}
 */
export const calculateWeaponAttack = (weapon, data) => {
  // Perfil "Artes Marciales": el bono de Ataque del arte (incl. Maestro) se suma aqui,
  // no en weapon.system.attack.special (que es el bono manual editable del jugador).
  const b = data.general?.modifiers?.martialArtBonus ?? {};
  const maAttack = weapon.system.isMartialArtsProfile?.value
    ? (b.attack?.value ?? 0) + (b.masterAttack?.value ?? 0)
    : 0;

  return (
    data.combat.attack.final.value +
    weapon.system.attack.special.value +
    weapon.system.quality.value +
    getWeaponKnowledgePenalty(weapon) +
    calculateStrengthRequiredPenalty(weapon, data) +
    maAttack
  );
};
