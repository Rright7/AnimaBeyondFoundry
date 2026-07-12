import { DefenseConfigurationDialog } from '../../module/dialogs/DefenseConfigurationDialog';
import { sendAccumulationZeroDefense } from '../sendAccumulationZeroDefense.js';
import { buildMassDefenseData, promptMassAreaHits } from '../../module/combat/massDefense.js';

export default async function defendActionHandler(message, _html, dataset) {
  try {
    // 1) Resolve message & attack data
    const msg = game.messages.get(dataset.messageId ?? message?.id);
    if (!msg)
      return ui.notifications?.warn(game.i18n.localize('chat.common.msgNotFound'));

    const attackData =
      (typeof dataset.attackData === 'string'
        ? safeParseJSON(dataset.attackData)
        : dataset.attackData) ||
      msg.getFlag(game.animabf.id, 'attackData') ||
      msg.flags?.animabf?.attackData ||
      null;

    if (!attackData)
      return ui.notifications?.warn(game.i18n.localize('chat.defend.noAttackData'));

    const weaponId = dataset.weaponId ?? attackData?.weaponId;

    // 2) If user has more than one token selected, abort with warning
    const controlled = canvas.tokens?.controlled ?? [];
    if (controlled.length > 1) {
      return ui.notifications?.warn(
        game.i18n.localize('chat.defend.multiSelectedNotSupported')
      );
    }

    // 3) Resolve defender token (single selection -> ownable target -> user's char active token)
    let defenderToken =
      controlled[0] ??
      autoPickOwnableTargetToken(msg) ??
      game.user?.character?.getActiveTokens?.()?.[0] ??
      null;

    if (!defenderToken) {
      return ui.notifications?.warn(game.i18n.localize('chat.defend.pickAToken'));
    }

    // Permission check: GM or owner of defender actor
    if (!game.user.isGM) {
      const ok = defenderToken.actor?.testUserPermission?.(
        game.user,
        CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
      );
      if (!ok)
        return ui.notifications?.warn(game.i18n.localize('chat.defend.noPermission'));
    }

    // Optional: resolve attacker token for context
    let attackerToken = message?.speaker?.token
      ? canvas.tokens.get(message.speaker.token)
      : null;
    if (!attackerToken && attackData.attackerId) {
      attackerToken =
        canvas.tokens.placeables.find(t => t.actor?.id === attackData.attackerId) ?? null;
    }

    const defenseMode =
      defenderToken.actor?.system?.general?.settings?.defenseType?.value;
    // 'resistance' (seres de acumulacion) y 'mass' (masas de enemigos) se saltan el dialogo
    // de defensa: sin tirada, sin contador de defensas multiples, la TA sigue aplicando.
    // La resistencia defiende con 0; la masa con su Defensa Final FIJA (buildMassDefenseData).
    if (defenseMode === 'resistance' || defenseMode === 'mass') {
      let massDefenseData;
      if (defenseMode === 'mass') {
        // Multiplicador de area (Tabla 2): preguntar a cuantos enemigos alcanza el ataque.
        const hits = await promptMassAreaHits();
        if (hits === null) return; // cancelado
        attackData.areaEnemiesHit = hits;
        massDefenseData = buildMassDefenseData(
          defenderToken.actor,
          attackData,
          defenderToken
        ).defenseData;
      }
      await sendAccumulationZeroDefense({
        defenderToken,
        attackerToken,
        attackData,
        messageId: msg.id,
        defenseData: massDefenseData
      });
      return;
    }

    // 4) Open dialog (dialog will claim target state only if it was 'pending')
    new DefenseConfigurationDialog(
      {
        defender: defenderToken,
        attacker: attackerToken ?? undefined,
        weaponId,
        attackData,
        messageId: msg.id
      },
      { allowed: true }
    ).render(true);
  } catch (err) {
    console.error('[ABF] defendActionHandler error:', err);
    ui.notifications?.error(game.i18n.localize('chat.defend.openFailed'));
  }
}

export const action = 'defend';

/** Safe JSON.parse with fallback */
function safeParseJSON(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/**
 * If the attack has exactly ONE target that the current user can operate (GM or owner),
 * return its token from the canvas. Otherwise return null.
 */
function autoPickOwnableTargetToken(msg) {
  try {
    const targets = msg.getFlag(game.animabf.id, 'targets');
    if (!Array.isArray(targets) || targets.length !== 1) return null;

    const t = targets[0];
    // Find token on canvas by tokenUuid; fallback by actorUuid
    let tok = t.tokenUuid ? canvas.tokens.get(t.tokenUuid) : null;
    if (!tok && t.actorUuid) {
      tok = canvas.tokens.placeables.find(tt => tt.actor?.id === t.actorUuid) ?? null;
    }
    if (!tok) return null;

    // Permission check (same as later)
    if (game.user.isGM) return tok;
    const isOwner = tok.actor?.testUserPermission?.(
      game.user,
      CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
    );
    return isOwner ? tok : null;
  } catch {
    return null;
  }
}
