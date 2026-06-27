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
const ARMOR_DAMAGE_TYPES = [
  'cold',
  'cut',
  'electricity',
  'energy',
  'heat',
  'impact',
  'thrust'
];

/**
 * @param {import('../../../../../../../types/Actor').ABFActorDataSourceData} data
 */
export const mutateTotalArmor = data => {
  const totalArmor = { at: {}, hardAt: {} };
  for (const type of ARMOR_DAMAGE_TYPES) {
    totalArmor.at[type] = { value: 0 };
    totalArmor.hardAt[type] = { value: 0 };
  }

  /** @type {import('../../../../../types/Items').ArmorDataSource[]} */
  const equippedArmors = data.combat.armors.filter(
    armor =>
      armor.system.equipped.value &&
      armor.system.localization.value !== ArmorLocation.HEAD &&
      armor.system.localization.value !== ArmorLocation.HEAD_CLOSED
  );
  // Armadura DURA = type 'hard'. Cualquier otra (cuero, tela, natural, magica/
  // sobrenatural, o sin tipo) es BLANDA (definicion de mesa). hardAt es el suelo
  // para la reduccion de TA blanda de Hakyoukuken.
  const hardArmors = equippedArmors.filter(a => a?.system?.type?.value === 'hard');

  // Capas virtuales (NO son armaduras duras): Armadura de energia del Ki (solo en
  // 'energy') y Rex Frame (TA fija contra TODO). Entran en la misma formula max+mitad
  // que las fisicas (las armaduras no se apilan linealmente).
  const kiEnergyArmorTA = data.general?.modifiers?.kiBonus?.energyArmor?.value ?? 0;
  const flatArmorTA = data.general?.modifiers?.armorBonus?.flat?.value ?? 0;

  for (const type of ARMOR_DAMAGE_TYPES) {
    const tas = equippedArmors.map(armor => armor.system[type].final.value);
    if (type === 'energy' && kiEnergyArmorTA > 0) tas.push(kiEnergyArmorTA);
    if (flatArmorTA > 0) tas.push(flatArmorTA);
    totalArmor.at[type].value = calculateTA(tas);

    // hardAt: TA SOLO de armaduras duras (las capas virtuales magicas/Ki NO entran).
    totalArmor.hardAt[type].value = calculateTA(
      hardArmors.map(armor => armor.system[type].final.value)
    );
  }

  data.combat.totalArmor = totalArmor;
};

mutateTotalArmor.abfFlow = {
  deps: [
    'system.combat.armors',
    'system.general.modifiers.kiBonus.energyArmor.value',
    'system.general.modifiers.armorBonus.flat.value'
  ],
  mods: ['system.combat.totalArmor']
};
