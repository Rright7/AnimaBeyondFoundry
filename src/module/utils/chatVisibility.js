/**
 * Lee el modo de mensaje/tirada del cliente con compatibilidad de versiones.
 * Foundry V13+ renombró el setting 'core.rollMode' -> 'core.messageMode'; leer
 * la clave vieja emite deprecación. La opción {rollMode} que se pasa a
 * ChatMessage#toMessage NO está deprecada y se conserva.
 */
export function getMessageMode() {
  if (game.settings?.settings?.has?.('core.messageMode')) {
    return game.settings.get('core', 'messageMode') ?? 'publicroll';
  }
  return game.settings.get('core', 'rollMode') ?? 'publicroll';
}

export function getChatVisibilityOptions() {
  const mode = getMessageMode();
  const vis = { rollMode: mode };
  if (mode === 'gmroll') {
    vis.whisper = ChatMessage.getWhisperRecipients('GM').map(u => u.id);
  } else if (mode === 'blindroll') {
    vis.whisper = ChatMessage.getWhisperRecipients('GM').map(u => u.id);
    vis.blind = true;
  } else if (mode === 'selfroll') {
    vis.whisper = [game.user.id];
  }
  return vis;
}
