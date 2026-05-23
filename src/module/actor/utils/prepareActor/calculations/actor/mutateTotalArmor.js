import { ArmorLocation } from '../../../../../types/combat/ArmorItemConfig';

/**
 * @param {number[]} tas
 */
const calculateTA = tas => {
  if (tas.length === 0) return 0;

  const orderedTas = new Int8Array([...tas]).sort().reverse();

  const maxTa = orderedTas[0];

  const sumOtherTas = orderedTas.slice(1).reduce((prev, curr) => prev + curr, 0);

  return maxTa + Math.floor(sumOtherTas / 2);
};

/**
 * @param {import('../../../../../../../types/Actor').ABFActorDataSourceData} data
 */
export const mutateTotalArmor = data => {
  /** @type {import('../../../../../types/Actor').ABFActorDataSourceData['combat']['totalArmor']} */
  const totalArmor = {
    at: {
      cold: { value: 0 },
      cut: { value: 0 },
      electricity: { value: 0 },
      energy: { value: 0 },
      heat: { value: 0 },
      impact: { value: 0 },
      thrust: { value: 0 }
    }
  };

  /** @type {import('../../../../../types/Items').ArmorDataSource[]} */
  const equippedArmors = data.combat.armors.filter(
    armor =>
      armor.system.equipped.value &&
      armor.system.localization.value !== ArmorLocation.HEAD
  );

  if (equippedArmors.length > 0) {
    totalArmor.at.cold.value = calculateTA(
      equippedArmors.map(armor => armor.system.cold.final.value)
    );
    totalArmor.at.cut.value = calculateTA(
      equippedArmors.map(armor => armor.system.cut.final.value)
    );
    totalArmor.at.electricity.value = calculateTA(
      equippedArmors.map(armor => armor.system.electricity.final.value)
    );
    totalArmor.at.energy.value = calculateTA(
      equippedArmors.map(armor => armor.system.energy.final.value)
    );
    totalArmor.at.heat.value = calculateTA(
      equippedArmors.map(armor => armor.system.heat.final.value)
    );
    totalArmor.at.impact.value = calculateTA(
      equippedArmors.map(armor => armor.system.impact.final.value)
    );
    totalArmor.at.thrust.value = calculateTA(
      equippedArmors.map(armor => armor.system.thrust.final.value)
    );
  }

  // Ki passive armor (Armadura de energía / mayor / arcana) — treated as a
  // virtual extra armor layer of energy type. The bucket already encodes the
  // "no se apilan entre ellas, prevalece la mayor" rule (Math.max in
  // applyKiSkillsModifiers), so here it's just one more TA fed into the
  // same combined formula as physical armors.
  const kiEnergyArmorTA = data.general?.modifiers?.kiBonus?.energyArmor?.value ?? 0;
  if (kiEnergyArmorTA > 0) {
    const energyTAs = equippedArmors.map(armor => armor.system.energy.final.value);
    energyTAs.push(kiEnergyArmorTA);
    totalArmor.at.energy.value = calculateTA(energyTAs);
  }

  data.combat.totalArmor = totalArmor;
};

mutateTotalArmor.abfFlow = {
  deps: ['system.combat.armors', 'system.general.modifiers.kiBonus.energyArmor.value'],
  mods: ['system.combat.totalArmor']
};
