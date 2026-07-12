import ABFFoundryRoll from '../../../rolls/ABFFoundryRoll.js';
import { ABFAttackData } from '../../../combat/ABFAttackData.js';
import { pointBlankAgainstTarget } from '../../../combat/pointBlank.js';
import { massActorAttackBonus, isMassActor, massAdjustedDamage } from '../../../combat/massCombat.js';
import { ABFSupernaturalShieldData } from '../../../combat/ABFSupernaturalShieldData.js';
import { shieldValueCheck } from '../../../combat/utils/shieldValueCheck.js';
import { Templates } from '../../../utils/constants';
import { openModDialog } from '../../../utils/dialogs/openSimpleInputDialog.js';
import { SpellAttackConfigurationDialog } from '../../../dialogs/SpellAttackConfigurationDialog.js';
import { getSnapshotTargets } from '../getSnapshotTargets.js';
import { resistanceEffectCheck } from '../../../combat/utils/resistanceEffectCheck.js';

function localizeGrade(grade) {
  return game.i18n.localize(`anima.ui.mystic.spell.grade.${grade}.title`);
}

async function openShieldConfigDialog({ spell, grade }) {
  const content = await (foundry.applications?.handlebars?.renderTemplate ?? renderTemplate)(Templates.Dialog.SpellShieldConfigDialog, {
    formulaBonus: 0
  });

  const bonus = await foundry.applications.api.DialogV2.prompt({
    window: { title: `${spell.name} (${localizeGrade(grade)})` },
    content,
    ok: {
      label: 'OK',
      callback: (event, button, dialog) => {
        const form = button?.form ?? dialog?.element?.querySelector?.('form');
        return Number(form?.elements?.formulaBonus?.value ?? 0) || 0;
      }
    },
    rejectClose: false,
    modal: true
  }).catch(() => null);

  if (bonus === null) return { cancelled: true };
  return { bonus, cancelled: false };
}

export async function castSpellGrade(sheet, event) {
  const { spellId, grade } = event.currentTarget.dataset;
  const useDialog = !!event.shiftKey;

  const actor = sheet.actor;
  const spell = actor.items.get(spellId);
  const combatType = spell.system.combatType.value;

  // ---------- DEFENSE ----------
  if (combatType === 'defense') {
    const gradeData = spell.system.grades[grade];
    const shieldPoints = Number(shieldValueCheck(gradeData)) || 0;
    const baseFormula = '@mystic.magicProjection.imbalance.defensive.final.value';

    let abilityFormula = baseFormula;

    if (useDialog) {
      const res = await openShieldConfigDialog({ spell, grade });
      if (res.cancelled) return;
      if (res.bonus !== 0) abilityFormula = `${baseFormula} + ${res.bonus}`;
    }

    // Economia de zeon: gasta (innato/preparado/acumulado) o bloquea si no llega.
    if (!actor.tryCastSpell(spell, grade)) return;

    await actor.newSupernaturalShield(
      ABFSupernaturalShieldData.builder()
        .name(`${spell.name} (${localizeGrade(grade)})`)
        .shieldPoints(shieldPoints)
        .abilityFormula(abilityFormula)
        .flags({ animabf: { supernaturalShield: { type: 'mystic' } } })
        .build()
    );

    return;
  }

  // ---------- ATTACK ----------
  if (useDialog) {
    const token =
      sheet.token?.document ?? sheet.token ?? actor.getActiveTokens()[0]?.document;

    new SpellAttackConfigurationDialog({
      attacker: token,
      spell,
      grade,
      targets: getSnapshotTargets()
    });

    return;
  }

  // Quick attack
  const modRaw = await openModDialog();
  if (modRaw === undefined || modRaw === null) return; // cancelar (X / Escape): no tirar ni gastar zeon
  const mod = Number(modRaw) || 0;

  // Economia de zeon: gasta (innato/preparado/acumulado) o bloquea si no llega.
  if (!actor.tryCastSpell(spell, grade)) return;

  const offensive = actor.system.mystic.magicProjection.imbalance.offensive;
  // El umbral de maestria mira la base (>=200); la tirada usa el FINAL = base +
  // allActions (penalizadores situacionales de "toda accion": Tabla 43 + cansancio),
  // como el ataque de arma y SpellAttackDialog. La Proyeccion NO sufre el -25 por
  // acciones multiples; ese no forma parte de allActions.
  const die = offensive.base.value >= 200 ? '1d100xamastery' : '1d100xa';

  // Masa de enemigos: +Tabla 1 a la Proyeccion Magica y x2 al Dano Base (sobrenatural).
  const massBon = massActorAttackBonus(actor.system);
  const isMass = isMassActor(actor.system);

  const roll = new ABFFoundryRoll(
    `${die} + ${offensive.final.value} + ${mod}${massBon ? ` + ${massBon}` : ''}`,
    actor.system
  );
  await roll.evaluate({ async: true });

  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: `${spell.name} (${localizeGrade(grade)})${massBon ? ` — Masa (+${massBon})` : ''}`
  });

  const rawSpellDamage = Number(spell.system.grades[grade]?.damage?.value ?? 0);
  const baseDamage = isMass ? massAdjustedDamage(rawSpellDamage, { magic: true }) : rawSpellDamage;
  // Solo los hechizos de tipo ATAQUE son proyectil disparado (regla especial de la magia;
  // animicos/defensa/efecto/automatico/deteccion NO -> el defensor no sufre la Tabla 49).
  const isAttackSpell = spell.system?.spellType?.value === 'attack';

  await ABFAttackData.builder()
    .attackAbility(roll.total)
    .damage(baseDamage)
    .resistanceEffect(resistanceEffectCheck(spell.system.grades[grade]))
    .ignoreArmor(false)
    .reducedArmor(0)
    .armorType(spell.system.critic?.value ?? game.animabf.weapon.NoneWeaponCritic.NONE)
    .damageType(game.animabf.combat.DamageType.NONE)
    .presence(0)
    .isProjectile(isAttackSpell)
    .projectileType(isAttackSpell ? 'shot' : '') // solo ATAQUE = proyectil disparado (Tabla 49)
    // Sobrenatural: NO recibe el +30 de a bocajarro (eso es solo arma de disparo), pero a
    // melee/pegado el defensor NO sufre el penalizador (waiver) -> pointBlank si es proyectil.
    .pointBlank(isAttackSpell && pointBlankAgainstTarget(actor.getActiveTokens?.()[0]?.document))
    .automaticCrit(!!(actor.system.general.modifiers.automaticCrit?.value))
    .critBonus(0)
    .critDamageBonus(actor.system.general.modifiers.critDamageBonus?.final?.value ?? 0)
    .attackerId(actor.id)
    .weaponId(spell.id)
    .targets(getSnapshotTargets())
    .build()
    .toChatMessage({ actor, weapon: spell });
}

castSpellGrade.action = 'castSpellGrade';
