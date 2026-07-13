import { resolveViaLabel } from '../../../module/mystic/customVias.js';

// {{viaLabel clave}} -> etiqueta legible de la via (i18n de base, etiqueta custom, o la clave).
export const viaLabel = {
  name: 'viaLabel',
  fn: key => resolveViaLabel(key)
};
