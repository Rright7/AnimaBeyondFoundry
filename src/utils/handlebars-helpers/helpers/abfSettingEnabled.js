// Helper de plantilla: ¿está activado un ajuste booleano del sistema?
// Uso: {{#if (abfSettingEnabled "USE_BREAKAGE_RULE")}} ... {{/if}}
// Acepta la clave de ABFSettingsKeys (por nombre) o el id literal del setting.
import { ABFSettingsKeys } from '../../settingKeys.js';

export const abfSettingEnabled = {
  name: 'abfSettingEnabled',
  fn: key => {
    try {
      const realKey = ABFSettingsKeys[key] ?? key;
      return !!game.settings.get(game.animabf.id, realKey);
    } catch (e) {
      return false;
    }
  }
};
