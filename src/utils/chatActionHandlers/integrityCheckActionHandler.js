// Control de entereza (regla opcional de rotura). Botón solo-DJ en la tarjeta de
// resultado de combate: abre el diálogo, tira los D10, resuelve el control y
// aplica/anuncia el resultado. Gateado por el ajuste USE_BREAKAGE_RULE.

import { ABFSettingsKeys } from '../settingKeys.js';
import { openIntegrityCheckDialog } from '../../module/dialogs/combat/IntegrityCheckDialog.js';
import { clashBreaks, bodyEntereza, unarmedParryDamage } from '../../module/combat/breakage.js';
import { breakWeapon, breakArmor } from '../../module/combat/breakageEffect.js';
import { applyDamageToActor } from './applyDamageActionHandler.js';

const num = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const finalOf = (item, path) =>
  num(
    foundry.utils.getProperty(item, `system.${path}.final.value`),
    num(foundry.utils.getProperty(item, `system.${path}.base.value`))
  );

const primary = (actor, slug) =>
  num(
    foundry.utils.getProperty(actor, `system.characteristics.primaries.${slug}.final.value`),
    num(foundry.utils.getProperty(actor, `system.characteristics.primaries.${slug}.value`))
  );

async function rollD10(actor, flavor) {
  const roll = new Roll('1d10');
  await roll.evaluate();
  const speaker = actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker();
  await roll.toMessage({ speaker, flavor });
  return roll.total;
}

function weaponBreakLine(item, res) {
  if (!res) return '';
  if (res.destroyed) {
    return game.i18n.format('chat.combatResult.integrity.weaponDestroyed', { name: item.name });
  }
  return game.i18n.format('chat.combatResult.integrity.weaponDowngraded', {
    name: item.name,
    quality: res.newQuality
  });
}

async function integrityCheck(message, _html, ds) {
  try {
    if (!game.user.isGM) return;
    if (!game.settings.get(game.animabf.id, ABFSettingsKeys.USE_BREAKAGE_RULE)) return;

    const msg = game.messages.get(ds.messageId ?? message.id);
    const animabf = msg?.flags?.animabf ?? {};

    const { resolveActorFromRef } = await import(
      '../../module/actor/utils/resolveActorForRoll.js'
    );
    const attacker = resolveActorFromRef(
      animabf.attacker?.tokenId || animabf.result?.attackerId || animabf.attacker?.actorId
    );
    const defender = resolveActorFromRef(
      animabf.defender?.tokenId || animabf.defender?.actorId
    );
    const L = k => game.i18n.localize(k);
    if (!attacker || !defender) {
      return ui.notifications?.warn(L('chat.combatResult.integrity.noCombatants'));
    }

    const choice = await openIntegrityCheckDialog({ attacker, defender });
    if (!choice) return;

    const attackerWeapon = attacker.items.get(choice.attackerWeaponId);
    if (!attackerWeapon) return;
    const attackerRotura = finalOf(attackerWeapon, 'breaking') + num(choice.attackerMod);
    const flavor = L('chat.combatResult.integrity.title');
    const lines = [];

    if (choice.targetKind === 'weapon') {
      const defWeapon = defender.items.get(choice.targetItemId);
      if (!defWeapon) return;
      const aD10 = await rollD10(attacker, flavor);
      const dD10 = await rollD10(defender, flavor);
      const attBreaksDef = clashBreaks(
        aD10,
        attackerRotura,
        finalOf(defWeapon, 'integrity') + num(choice.defenderMod)
      );
      const defBreaksAtt = clashBreaks(
        dD10,
        finalOf(defWeapon, 'breaking'),
        finalOf(attackerWeapon, 'integrity')
      );
      if (attBreaksDef) lines.push(weaponBreakLine(defWeapon, await breakWeapon(defWeapon)));
      if (defBreaksAtt) lines.push(weaponBreakLine(attackerWeapon, await breakWeapon(attackerWeapon)));
      if (!attBreaksDef && !defBreaksAtt) lines.push(L('chat.combatResult.integrity.nothingBroke'));
    } else if (choice.targetKind === 'armor') {
      const armor = defender.items.get(choice.targetItemId);
      if (!armor) return;
      const aD10 = await rollD10(attacker, flavor);
      if (clashBreaks(aD10, attackerRotura, finalOf(armor, 'integrity') + num(choice.defenderMod))) {
        const res = await breakArmor(armor);
        lines.push(
          game.i18n.format(
            res?.useless
              ? 'chat.combatResult.integrity.armorUseless'
              : 'chat.combatResult.integrity.armorDegraded',
            { name: armor.name }
          )
        );
      } else {
        lines.push(L('chat.combatResult.integrity.nothingBroke'));
      }
    } else {
      // Parada sin armas: entereza corporal = max(CON, DES).
      const entereza =
        bodyEntereza(primary(defender, 'constitution'), primary(defender, 'dexterity')) +
        num(choice.defenderMod);
      const aD10 = await rollD10(attacker, flavor);
      const dmg = unarmedParryDamage({
        d10: aD10,
        rotura: attackerRotura,
        entereza,
        mastery: choice.mastery
      });
      if (choice.mastery) {
        lines.push(L('chat.combatResult.integrity.masteryIgnored'));
      } else if (dmg > 0) {
        await applyDamageToActor(defender, dmg);
        lines.push(game.i18n.format('chat.combatResult.integrity.unarmedDamage', { dmg, name: defender.name }));
      } else {
        lines.push(L('chat.combatResult.integrity.noDamage'));
      }
    }

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: attacker }),
      flavor: `<strong>${flavor}</strong> — ${attacker.name} vs ${defender.name}`,
      content: `<div class="integrity-check-result">${lines
        .filter(Boolean)
        .map(l => `<p style="margin:.1rem 0;">${l}</p>`)
        .join('')}</div>`
    });
  } catch (err) {
    console.error('[ABF] integrityCheck error:', err);
  }
}

export const handlers = {
  'animabf-integrity-check': integrityCheck
};
