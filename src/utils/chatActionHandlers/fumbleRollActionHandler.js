// Anti doble-click en el mismo cliente mientras se procesa.
const inFlight = new Set();

/**
 * Boton "Tirar pifia" de los mensajes de tirada que han pifiado en un tipo donde
 * APLICA el grado de pifia (ataque/defensa/habilidad/magia/psiquica; NO turno ni
 * resistencias). Aparece para el owner del actor que pifio (o el GM). Al pulsarlo
 * tira el Nivel de Pifia (1d100 plano) y lo publica en el chat, visible para todos,
 * con el texto de regla del contexto. NO auto-aplica el efecto (lo interpreta el GM).
 * Marca el mensaje como fumble.resolved para que el boton no se reutilice.
 */
export default async function fumbleRollActionHandler(message, html, dataset) {
  const msg = game.messages.get(dataset.messageId ?? message?.id);
  if (!msg) return ui.notifications?.warn(game.i18n.localize('chat.common.msgNotFound'));

  if (inFlight.has(msg.id)) return;
  inFlight.add(msg.id);
  try {
    const animabf = msg.flags?.animabf ?? {};
    const fumble = animabf.fumble ?? {};
    if (!fumble.pending) return;
    if (fumble.resolved)
      return ui.notifications?.warn(game.i18n.localize('chat.fumble.alreadyRolled'));

    // Permiso: GM u owner del actor que pifio (el que hablo en el mensaje).
    const speakerActorId = msg.speaker?.actor;
    const actor = speakerActorId ? game.actors.get(speakerActorId) : null;
    if (!game.user.isGM) {
      const ok = actor?.testUserPermission?.(
        game.user,
        CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
      );
      if (!ok) return ui.notifications?.warn(game.i18n.localize('chat.fumble.noPermission'));
    }

    // Nivel de Pifia: 1d100 plano (sin abierta ni pifia; es una determinacion, no una habilidad).
    const roll = new Roll('1d100');
    await roll.evaluate();
    const level = roll.total;

    await roll.toMessage({
      speaker: msg.speaker,
      flavor: buildFumbleFlavor(fumble.context, level)
    });

    await markFumbleResolved(msg, animabf, level);
  } catch (err) {
    console.error('[ABF] fumbleRollActionHandler error:', err);
    ui.notifications?.error(game.i18n.localize('chat.fumble.failed'));
  } finally {
    inFlight.delete(msg.id);
  }
}

export const action = 'roll-fumble';

/** Texto de regla segun el contexto de la tirada (combate vs general/directa). */
function buildFumbleFlavor(context, level) {
  const i18n = game.i18n;
  const head = `<b>${i18n.localize('chat.fumble.title')}</b> — ${i18n.format(
    'chat.fumble.level',
    { level }
  )}`;
  let rule;
  if (context === 'attack') rule = i18n.localize('chat.fumble.rule.attack');
  else if (context === 'defense') rule = i18n.localize('chat.fumble.rule.defense');
  else rule = i18n.localize('chat.fumble.rule.general');
  const extra = level > 80 ? `<br><i>${i18n.localize('chat.fumble.rule.over80')}</i>` : '';
  return `${head}<br>${rule}${extra}`;
}

/**
 * Marca la pifia como resuelta (oculta el boton al re-renderizar). El author del
 * mensaje y el GM lo hacen directo; el resto lo proxya al GM por socket (mismo
 * patron que el contraataque), porque un jugador no puede setFlag en mensajes ajenos.
 */
async function markFumbleResolved(msg, animabf, level) {
  const fumble = { ...(animabf.fumble ?? {}), resolved: true, level };
  if (game.user.isGM || msg.isAuthor) {
    await msg.setFlag(game.animabf.id, 'fumble', fumble);
  } else {
    game.socket.emit('system.animabf', {
      op: 'fumbleResolve',
      messageId: msg.id,
      userId: game.user.id,
      fumble
    });
  }
}
