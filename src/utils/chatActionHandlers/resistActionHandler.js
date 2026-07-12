// Control de Resistencia (RM/RF/RP/RE/RV) de un conjuro. El objetivo pulsa
// "Resistir" en la tarjeta de ataque: tira 1d100 + su Resistencia del tipo y
// compara con la dificultad del conjuro. RAW (Core Exxet): SIN tirada abierta;
// un 100 natural en el dado siempre es éxito; nivel de fracaso = dif - total.

import { openModDialog } from '../../module/utils/dialogs/openSimpleInputDialog.js';
import {
  isMassActor,
  massComponentCount,
  massResistanceOutcome,
  massResistanceDifficultyBonus
} from '../../module/combat/massCombat.js';

const RES_PATH = type =>
  `system.characteristics.secondaries.resistances.${type}.final.value`;

// Efecto sobre una masa segun el tramo del control de Resistencia (margen = total - dif).
// Solo aplica a efectos de AREA; los de 1 solo objetivo no afectan a la masa.
const MASS_RES_DESC = {
  passClean: 'La masa NO se ve afectada.',
  passPartial:
    'Penalizadores a la MITAD (redondeo abajo); los efectos no numéricos (muerte, parálisis…) afectan a ~1/3 de los componentes alcanzados.',
  failPartial:
    'Penalizadores a la MITAD (redondeo arriba); los efectos no numéricos afectan a ~2/3 de los componentes alcanzados.',
  failFull: 'Efecto PLENO: afecta a todos los componentes alcanzados.'
};

export default async function resistActionHandler(message, _html, dataset) {
  try {
    const msg = game.messages.get(dataset.messageId ?? message?.id);
    if (!msg) return ui.notifications?.warn(game.i18n.localize('chat.common.msgNotFound'));

    const attackData =
      (typeof dataset.attackData === 'string'
        ? safeParseJSON(dataset.attackData)
        : dataset.attackData) ||
      msg.getFlag(game.animabf.id, 'attackData') ||
      msg.flags?.animabf?.attackData ||
      null;

    const res = attackData?.resistanceEffect;
    if (!res || !res.check || !res.type) {
      return ui.notifications?.warn(game.i18n.localize('chat.resist.noResistance'));
    }

    // Resolver el token objetivo igual que el botón Defender.
    const controlled = canvas.tokens?.controlled ?? [];
    if (controlled.length > 1) {
      return ui.notifications?.warn(
        game.i18n.localize('chat.defend.multiSelectedNotSupported')
      );
    }
    const token =
      controlled[0] ??
      autoPickOwnableTargetToken(msg) ??
      game.user?.character?.getActiveTokens?.()?.[0] ??
      null;
    if (!token) return ui.notifications?.warn(game.i18n.localize('chat.defend.pickAToken'));

    const actor = token.actor;
    if (!game.user.isGM) {
      const ok = actor?.testUserPermission?.(
        game.user,
        CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
      );
      if (!ok) return ui.notifications?.warn(game.i18n.localize('chat.defend.noPermission'));
    }

    const resistance = Number(foundry.utils.getProperty(actor, RES_PATH(res.type))) || 0;
    const difficulty = Number(res.value) || 0;

    // Si el ATACANTE es una masa que obliga a resistir, sube la dificultad del rival
    // (+20 si <=10 componentes, +50 si mas).
    const attackerActor = attackData?.attackerId
      ? game.actors?.get?.(attackData.attackerId)
      : null;
    const massDifficultyBonus = isMassActor(attackerActor?.system)
      ? massResistanceDifficultyBonus(massComponentCount(attackerActor.system))
      : 0;
    const difficultyFinal = difficulty + massDifficultyBonus;

    // Ventana de modificador manual antes de tirar (cerrar = cancelar).
    const modStr = await openModDialog({
      title: game.i18n.localize('chat.attackData.resistButton')
    });
    if (modStr === undefined) return;
    const mod = Number(modStr) || 0;

    // 1d100 PLANO (sin tirada abierta). 100 natural = éxito automático.
    const roll = new Roll(mod ? '1d100 + @mod' : '1d100', { mod });
    await roll.evaluate();
    const die = roll.dice[0].total;
    const total = die + resistance + mod;
    const success = die === 100 || total >= difficultyFinal;
    const failBy = success ? 0 : difficultyFinal - total;

    const typeLabel = game.i18n.localize(`chat.attackData.resistanceType.${res.type}`);
    const speaker = ChatMessage.getSpeaker({ token, actor });

    await roll.toMessage({
      speaker,
      flavor:
        game.i18n.format('chat.resist.flavor', { type: typeLabel, difficulty: difficultyFinal }) +
        (massDifficultyBonus ? ` (+${massDifficultyBonus} masa)` : '')
    });

    // Masa como DEFENSORA: en vez de exito/fallo binario, 4 tramos por margen (±40).
    if (isMassActor(actor.system)) {
      const margin = total - difficultyFinal;
      const outcome = massResistanceOutcome(margin);
      await ChatMessage.create({
        speaker,
        content:
          `<div class="resist-result"><p><strong>Resistencia de la masa</strong> (${typeLabel}): ` +
          `${total} vs ${difficultyFinal} — margen ${margin >= 0 ? '+' : ''}${margin}</p>` +
          `<p>${MASS_RES_DESC[outcome.tier]}</p>` +
          `<p style="opacity:.7;font-size:.9em;">(solo para efectos de área; los de 1 objetivo no afectan a la masa)</p></div>`
      });
    } else {
      await ChatMessage.create({
        speaker,
        content: `<div class="resist-result"><p>${game.i18n.format(
          success ? 'chat.resist.resultSuccess' : 'chat.resist.resultFail',
          { type: typeLabel, total, difficulty: difficultyFinal, failBy }
        )}</p></div>`
      });
    }
  } catch (err) {
    console.error('[ABF] resistActionHandler error:', err);
    ui.notifications?.error(game.i18n.localize('chat.resist.openFailed'));
  }
}

export const action = 'resist';

function safeParseJSON(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/** Si el ataque tiene UN solo objetivo operable por el usuario (GM o dueño), su token. */
function autoPickOwnableTargetToken(msg) {
  try {
    const targets = msg.getFlag(game.animabf.id, 'targets');
    if (!Array.isArray(targets) || targets.length !== 1) return null;
    const t = targets[0];
    let tok = t.tokenUuid ? canvas.tokens.get(t.tokenUuid) : null;
    if (!tok && t.actorUuid) {
      tok = canvas.tokens.placeables.find(tt => tt.actor?.id === t.actorUuid) ?? null;
    }
    if (!tok) return null;
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
