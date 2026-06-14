import { WeaponSize } from '../../../../../types/combat/WeaponItemConfig';
import {
  getCombatHandWeapons,
  getActiveTurnShield,
  isUnarmedWeapon
} from '../../utils/getCombatHandWeapons.js';

// Predicado inline (mismo criterio que combat/martialArts/martialArtsWeapon.js):
// se evita importar ese modulo para no arrastrar la cadena del catalogo de AM.
const isMartialArtsProfileWeapon = weapon =>
  !!weapon?.system?.isMartialArtsProfile?.value;

/** @param {import('../../../../../types/Actor').ABFActorDataSourceData} data */
export const mutateInitiative = data => {
  /** @type {{weapons: import('../../../../../types/Items').WeaponDataSource[]}} */
  const combat = data.combat;
  const { general } = data;

  const allActionMod = general.modifiers.allActions.final.value;

  // Anima RAW: la categoría "Acción Física" de la Tabla 43 (physicalActions)
  // no afecta a la habilidad de Turno/Iniciativa. Los penalizadores al turno
  // específicos (Derribado -10, Parálisis -20/-30/-100...) vienen ya como
  // modificadores directos sobre `initiative.final.value` desde los AE,
  // no a través de `physicalActions`.
  const penalty =
    Math.ceil(Math.min(allActionMod, 0) / 2) +
    general.modifiers.naturalPenalty.final.value;

  const { initiative } = data.characteristics.secondaries;

  const equippedWeapons = combat.weapons.filter(weapon => weapon.system.equipped.value);

  const kiInitiativeBonus = data.general.modifiers.kiBonus?.initiative?.value ?? 0;
  // Si el perfil "Artes Marciales" esta equipado, el bono de Turno del arte ya llega
  // por el initiative.final de ese arma (martialArtsWeapon lo inyecta en su special),
  // asi que NO se suma tambien aqui: evita el doble conteo del Turno de AM.
  const maProfileEquipped = equippedWeapons.some(isMartialArtsProfileWeapon);
  const martialTurnBonus = maProfileEquipped
    ? 0
    : data.general.modifiers.martialArtBonus?.turn?.value ?? 0;

  initiative.final.value =
    initiative.base.value +
    initiative.special.value +
    penalty +
    kiInitiativeBonus +
    martialTurnBonus;

  // We subtract 20 because people are used to put as base unarmed initiative
  initiative.final.value -= 20;

  // Escudo que penaliza el Turno: la rodela (pequeño) por estar equipada (se lleva sin
  // mano); cualquier otro escudo solo si está asignado a una mano (fuente única = manos).
  const equippedShield = getActiveTurnShield(equippedWeapons);

  //Ajuste por llevar un escudo
  if (equippedShield) {
    if (equippedShield.system.size.value === WeaponSize.SMALL) {
      initiative.final.value -= 15;
    } else if (equippedShield.system.size.value === WeaponSize.MEDIUM) {
      initiative.final.value -= 25;
    } else {
      initiative.final.value -= 40;
    }
  }

  // Armas en mano para el Turno. FUENTE ÚNICA = handSlot (main/off); lo equipado SIN
  // asignar NO cuenta. Excluye escudos y armas de cuerpo entero; un arma a dos manos
  // cuenta sola (ocupa ambas manos). Ver getCombatHandWeapons.
  const combatWeapons = getCombatHandWeapons(equippedWeapons);

  if (combatWeapons.length === 0) {
    // Sin armas en mano -> combate desarmado por defecto: usa el initiative.final del
    // arma de cuerpo entero equipada (perfil "Artes Marciales" preferente, que incluye
    // el Turno del arte por #1; si no, "Desarmado"); sin ninguna, el +20 base.
    const unarmedWeapon =
      equippedWeapons.find(isMartialArtsProfileWeapon) ??
      equippedWeapons.find(isUnarmedWeapon);
    initiative.final.value += unarmedWeapon
      ? unarmedWeapon.system.initiative.final.value
      : 20;
  } else if (combatWeapons.length === 1) {
    initiative.final.value += combatWeapons[0].system.initiative.final.value;
  } else if (combatWeapons.length === 2) {
    //Ajuste por llevar dos armas
    const leftWeapon = combatWeapons[0].system;
    const rightWeapon = combatWeapons[1].system;

    initiative.final.value += Math.min(
      leftWeapon.initiative.final.value,
      rightWeapon.initiative.final.value
    );

    if (leftWeapon.size.value === rightWeapon.size.value) {
      if (
        Math.min(leftWeapon.initiative.base.value, rightWeapon.initiative.base.value) < 0
      ) {
        initiative.final.value -= 20;
      } else {
        initiative.final.value -= 10;
      }
    }
  }
};

mutateInitiative.abfFlow = {
  deps: [
    'system.characteristics.secondaries.initiative.base.value',
    'system.characteristics.secondaries.initiative.special.value',
    'system.general.modifiers.allActions.final.value',
    'system.general.modifiers.naturalPenalty.final.value',
    'system.general.modifiers.kiBonus.initiative.value',
    'system.general.modifiers.martialArtBonus.turn.value',
    'system.combat.weapons' // equipped + isShield + size + handSlot + initiative.*
  ],
  mods: ['system.characteristics.secondaries.initiative.final.value']
};
