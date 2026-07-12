import { autoRollDefenseAgainstAttack } from '../../module/combat/autoRollDefenseAgainstAttack.js';
import { Templates } from '../../module/utils/constants';
import { updateAttackTargetsFlag } from '../../utils/updateAttackTargetsFlag.js';
import { resolveTokenName } from '../tokenName.js';
import { openModDialog } from '../../module/utils/dialogs/openSimpleInputDialog.js';
import { resolveTokenForTarget } from './resolveTokenForTarget.js';
import { isMassActor } from '../../module/combat/massCombat.js';
import { promptMassAreaHits } from '../../module/combat/massDefense.js';

export default async function autoDefendPendingActionHandler(message, _html, ds) {
  try {
    const msg = game.messages.get(ds.messageId ?? message?.id);
    if (!msg) return ui.notifications?.warn('Mensaje de ataque no encontrado.');

    const attackData =
      (typeof ds.attackData === 'string'
        ? safeParseJSON(ds.attackData)
        : ds.attackData) ??
      msg.getFlag(game.animabf.id, 'attackData') ??
      msg.flags?.animabf?.attackData ??
      null;
    if (!attackData) return ui.notifications?.warn('Datos de ataque no disponibles.');

    const targets = msg.getFlag(game.animabf.id, 'targets') ?? [];
    const pendings = targets.filter(t => (t.state ?? 'pending') === 'pending');
    if (!pendings.length) return ui.notifications?.info('No hay objetivos pendientes.');

    const mod = await openModDialog();
    if (mod === undefined || mod === null) return; // cancelar (X / Escape): no defender

    const entries = [];
    for (const t of pendings) {
      const tok = resolveTokenForTarget(t, message);
      const actor = tok?.actor ?? (t.actorUuid ? game.actors.get(t.actorUuid) : null);
      if (!actor) continue;

      if (
        !game.user.isGM &&
        !actor.testUserPermission?.(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
      ) {
        continue;
      }

      // Masa: preguntar enemigos alcanzados (multiplicador de area, Tabla 2) por objetivo.
      if (isMassActor(actor.system)) {
        const hits = await promptMassAreaHits();
        if (hits === null) continue; // cancelado: saltar este objetivo
        attackData.areaEnemiesHit = hits;
      }

      const r = await autoRollDefenseAgainstAttack({
        defenderToken: tok ?? null,
        defenderActor: actor,
        attackData,
        defenseMod: mod
      });

      await updateAttackTargetsFlag(msg.id, {
        actorUuid: r.actor.id,
        // store UUID when possible (v13 friendly)
        tokenUuid:
          r.token?.document?.uuid ??
          tok?.document?.uuid ??
          r.token?.uuid ??
          tok?.uuid ??
          tok?.id ??
          '',
        state: 'done',
        rolledBy: game.user.id,
        defenseResult: r.defenseData.toJSON?.() ?? r.defenseData,
        updatedAt: Date.now()
      });

      entries.push(entryFromAuto(r, tok));
    }

    if (!entries.length)
      return ui.notifications?.info('No se pudo auto-defender a ningún objetivo.');

    const content = await (foundry.applications?.handlebars?.renderTemplate ?? renderTemplate)(Templates.Chat.MultiDefenseResult, {
      attackLabel: game.i18n.localize?.('chat.attackData.title') ?? 'Ataque',
      entries,
      hasRemaining: entries.some(e => !e.applied && e.damageFinal > 0),
      messageId: foundry.utils.randomID()
    });

    const cm = await ChatMessage.create({
      content,
      speaker: message.speaker,
      flags: {
        animabf: {
          kind: 'multiDefenseResult',
          sourceAttackMessageId: msg.id,
          maneuverSlug: attackData?.maneuverSlug ?? '',
          maneuverItemName: attackData?.maneuverItemName ?? '',
          delayRounds: Number(attackData?.delayRounds ?? 0) || 0,
          attackerId: attackData?.attackerId ?? '',
          // Token del atacante (uuid preferido): el control enfrentado de maniobras
          // resuelve el TOKEN (sin vincular incluido) en vez del actor base, que pierde
          // los overrides del token (artes, AE, caracteristicas).
          attackerTokenUuid: resolveAttackerTokenUuid(msg, attackData),
          batch: { createdAt: Date.now() },
          entries: entries.map(e => ({ ...e, applied: false }))
        }
      }
    });

    const content2 = await (foundry.applications?.handlebars?.renderTemplate ?? renderTemplate)(Templates.Chat.MultiDefenseResult, {
      attackLabel: game.i18n.localize?.('chat.attackData.title') ?? 'Ataque',
      entries: cm.getFlag(game.animabf.id, 'entries') ?? entries,
      hasRemaining: (cm.getFlag(game.animabf.id, 'entries') ?? entries).some(
        e => !e.applied && e.damageFinal > 0
      ),
      messageId: cm.id
    });
    await cm.update({ content: content2 });
  } catch (err) {
    console.error('[ABF] autoDefendPendingActionHandler error:', err);
    ui.notifications?.error('No se pudo auto-defender a los objetivos pendientes.');
  }
}
export const action = 'auto-defend-pending';

function safeParseJSON(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

// Resuelve el uuid de token del atacante a partir del mensaje de ataque (su
// speaker es el atacante), con fallback por id de actor. Vacio si no hay token.
function resolveAttackerTokenUuid(msg, attackData) {
  let token = msg?.speaker?.token ? canvas.tokens?.get?.(msg.speaker.token) : null;
  if (!token && attackData?.attackerId) {
    token =
      canvas.tokens?.placeables?.find(t => t.actor?.id === attackData.attackerId) ?? null;
  }
  return token?.document?.uuid ?? token?.uuid ?? token?.id ?? '';
}

function entryFromAuto(r, tok) {
  const tokenUuid =
    r.token?.document?.uuid ??
    tok?.document?.uuid ??
    r.token?.uuid ??
    tok?.uuid ??
    tok?.id ??
    '';
  const actorUuid = r.actor?.id ?? tok?.actor?.id ?? '';
  const label = resolveTokenName(
    { tokenUuid, actorUuid },
    { message: ui?.chat?.lastMessage }
  );

  return {
    actorId: r.actor.id,
    tokenId: r.token?.id ?? tok?.id ?? '',
    label: label ?? r.token?.name ?? tok?.name ?? r.actor.name, // final fallback
    defenseTotal: Number(r.defenseTotal ?? 0),
    damageFinal: Number(
      r.combatResult?.damageFinal ??
        r.combatResult?.damage?.final ??
        r.combatResult?.finalDamage ??
        r.combatResult?.damage ??
        0
    ),
    damagePercentage: Number(r.combatResult?.damagePercentage ?? 0),
    finalArmor: Number(r.combatResult?.finalArmor ?? 0),
    finalBaseDamage: Number(r.combatResult?.finalBaseDamage ?? 0),
    areaMultiplier: Number(r.combatResult?.areaMultiplier ?? 1),
    isCritical: !!r.combatResult?.isCritical,
    lifePercentRemoved: Number(r.combatResult?.lifePercentRemoved ?? 0),
    hasCounter: !!r.combatResult?.hasCounterAttack,
    counterAttackValue: Number(r.combatResult?.counterAttackValue ?? 0),
    applied: false
  };
}
