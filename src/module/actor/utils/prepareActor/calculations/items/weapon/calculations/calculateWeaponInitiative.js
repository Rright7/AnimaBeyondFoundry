import { WeaponSizeProportion } from '../../../../../../../types/combat/WeaponItemConfig';

/**
 * @param {import('../../../../../../../types/Items').WeaponDataSource} weapon
 */
export const calculateWeaponInitiative = (weapon, data) => {
  const num = v => Number(v) || 0;
  let initiative =
    num(weapon.system.initiative.base.value) +
    num(weapon.system.initiative.special.value) +
    num(weapon.system.quality.value);

  // Perfil "Artes Marciales": el bono de Turno del arte se suma aqui, no en
  // initiative.special (que es el bono manual editable del jugador).
  if (weapon.system.isMartialArtsProfile?.value) {
    initiative += num(data?.general?.modifiers?.martialArtBonus?.turn?.value);
  }

  // This depends on the size of the character but right now is not automatized
  if (weapon.system.sizeProportion.value !== WeaponSizeProportion.NORMAL) {
    initiative -= 40;
  }

  return initiative;
};
