import { WeaponShotType } from '../../../../../../types/combat/WeaponItemConfig';
import { calculateWeaponAttack } from './calculations/calculateWeaponAttack';
import { calculateWeaponBlock } from './calculations/calculateWeaponBlock';
import { calculateWeaponDamage } from './calculations/calculateWeaponDamage';
import { calculateWeaponReload } from './calculations/calculateWeaponReload';
import { calculateWeaponIntegrity } from './calculations/calculateWeaponIntegrity';
import { calculateWeaponBreaking } from './calculations/calculateWeaponBreaking';
import { calculateWeaponPresence } from './calculations/calculateWeaponPresence';
import { calculateWeaponRange } from './calculations/calculateWeaponRange';
import { calculateWeaponInitiative } from './calculations/calculateWeaponInitiative';
import { calculateWeaponArmorReduction } from './calculations/calculateWeaponArmorReduction';
import { calculateArmorReductionFromQuality } from './util/calculateArmorReductionFromQuality';
import { applyMartialArtsWeaponBonuses } from '../../../../../../combat/martialArts/martialArtsWeapon.js';
import { manageabilityFromQualities } from '../../../utils/getCombatHandWeapons';

/**
 *
 * @param {import('../../../../../../types/Actor').ABFActorDataSourceData} data
 */
export const mutateWeaponsData = data => {
  /** @type {{weapons: import('../../../../../../types/Items').WeaponDataSource[]}} */
  const combat = data.combat;

  combat.weapons = combat.weapons.map(weapon => {
    // La cualidad de manejabilidad (oneHand/twoHanded/oneOrTwoHanded) MANDA sobre el
    // campo: si el arma la lleva, deriva su manageabilityType (sin migración). De aquí
    // salen el agarre, el ×2 de Fuerza, la FUE requerida y "Armas en mano".
    const fromQuality = manageabilityFromQualities(weapon);
    if (fromQuality && weapon.system.manageabilityType) {
      weapon.system.manageabilityType.value = fromQuality;
    }

    // Arma-perfil "Artes Marciales": inyecta los bonos de AM en sus `special`
    // antes de calcular los finales (no-op en el resto de armas).
    applyMartialArtsWeaponBonuses(weapon, data);

    weapon.system.attack = {
      base: weapon.system.attack.base,
      special: weapon.system.attack.special,
      final: { value: calculateWeaponAttack(weapon, data) }
    };

    weapon.system.block = {
      base: weapon.system.block.base,
      special: weapon.system.block.special,
      final: { value: calculateWeaponBlock(weapon, data) }
    };

    weapon.system.initiative = {
      base: weapon.system.initiative.base,
      special: weapon.system.initiative.special,
      final: { value: calculateWeaponInitiative(weapon, data) }
    };

    weapon.system.damage = {
      base: weapon.system.damage.base,
      special: weapon.system.damage.special,
      final: { value: calculateWeaponDamage(weapon, data) },
      formula: weapon.system.damage.formula ?? { value: '' },
      applyQualityInFormula: weapon.system.damage.applyQualityInFormula
    };

    weapon.system.reducedArmor.base.value = calculateArmorReductionFromQuality(weapon);

    weapon.system.reducedArmor = {
      base: weapon.system.reducedArmor.base,
      special: weapon.system.reducedArmor.special,
      final: { value: calculateWeaponArmorReduction(weapon) }
    };

    weapon.system.integrity = {
      base: weapon.system.integrity.base,
      final: { value: calculateWeaponIntegrity(weapon) }
    };

    weapon.system.breaking = {
      base: weapon.system.breaking.base,
      final: { value: calculateWeaponBreaking(weapon, data) }
    };

    weapon.system.presence = {
      base: weapon.system.presence.base,
      final: { value: calculateWeaponPresence(weapon) }
    };

    if (weapon.system.isRanged.value) {
      weapon.system.range = {
        base: weapon.system.range.base,
        final: { value: calculateWeaponRange(weapon, data) }
      };

      if (weapon.system.shotType.value === WeaponShotType.SHOT) {
        weapon.system.reload = {
          base: weapon.system.reload.base,
          final: { value: calculateWeaponReload(weapon, data) }
        };

        if (weapon.system.ammo) {
          weapon.system.critic.primary.value = weapon.system.ammo.system.critic.value;
        }
      }
    }

    return weapon;
  });
};

mutateWeaponsData.abfFlow = {
  deps: [
    // Whole weapon array is read extensively
    'system.combat.weapons',

    // The weapon's attack/block are derived FROM the actor's combat
    // attack/block final values (see calculateWeaponAttack / calculateWeaponBlock).
    // Declaring these forces the flow to compute weapons AFTER any Active
    // Effect has modified the actor's attack/block, so on-actor modifiers
    // (Derribado, Ceguera, Cargando, ...) reach the weapon's roll value too.
    'system.combat.attack.final.value',
    'system.combat.block.final.value',

    // These helpers use actor data (common patterns in your system)
    'system.general.modifiers.allActions.final.value',
    'system.general.modifiers.physicalActions.final.value',
    'system.general.modifiers.naturalPenalty.final.value',
    'system.general.modifiers.extraDamage.final.value',
    'system.general.modifiers.kiBonus.damage.value',

    // Bonos de Arte Marcial: el arma-perfil "Artes Marciales" los inyecta en sus
    // `special` (applyMartialArtsWeaponBonuses) antes de calcular los finales,
    // asi que weapons debe computarse DESPUES de applyMartialArtModifiers.
    'system.general.modifiers.martialArtBonus.attack.value',
    'system.general.modifiers.martialArtBonus.block.value',
    'system.general.modifiers.martialArtBonus.damage.value',
    'system.general.modifiers.martialArtBonus.turn.value',
    'system.general.modifiers.martialArtBonus.masterAttack.value',
    'system.general.modifiers.martialArtBonus.masterDefense.value',

    // Common primary stats typically used in weapon calcs
    'system.characteristics.primaries.strength.final.value',
    'system.characteristics.primaries.dexterity.final.value',
    'system.characteristics.primaries.agility.final.value',

    // Initiative interactions
    'system.characteristics.secondaries.initiative.final.value'
  ],
  mods: [
    // All these are written inside each weapon.system.*
    'system.combat.weapons.attack.final.value',
    'system.combat.weapons.block.final.value',
    'system.combat.weapons.initiative.final.value',
    'system.combat.weapons.damage.final.value',
    'system.combat.weapons.reducedArmor.base.value',
    'system.combat.weapons.reducedArmor.final.value',
    'system.combat.weapons.integrity.final.value',
    'system.combat.weapons.breaking.final.value',
    'system.combat.weapons.presence.final.value',
    'system.combat.weapons.range.final.value',
    'system.combat.weapons.reload.final.value',
    'system.combat.weapons.critic.primary.value'
  ]
};
