import ModifyDicePermissionsConfig from '../module/dialogs/ModifyDicePermissionsConfig';
import CustomViasConfig from '../module/dialogs/CustomViasConfig';
import { mergeCustomViasIntoConfig } from '../module/mystic/customVias.js';
export { ABFSettingsKeys } from './settingKeys.js';
import { ABFSettingsKeys } from './settingKeys.js';

export const registerSettings = systemId => {
  game.settings.register(systemId, ABFSettingsKeys.ROUND_DAMAGE_IN_MULTIPLES_OF_5, {
    name: 'anima.ui.systemSettings.roundDamageInMultiplesOf5.title',
    hint: 'anima.ui.systemSettings.roundDamageInMultiplesOf5.hint.title',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  });

  game.settings.register(systemId, ABFSettingsKeys.COLOR_THEME, {
    name: 'anima.ui.systemSettings.colorTheme.title',
    hint: 'anima.ui.systemSettings.colorTheme.hint.title',
    scope: 'client',
    config: true,
    type: String,
    choices: {
      light: 'anima.ui.systemSettings.colorTheme.light',
      dark: 'anima.ui.systemSettings.colorTheme.dark'
    },
    default: 'light',
    onChange: value => {
      document.body.classList.toggle('abf-theme-dark', value === 'dark');
    }
  });

  game.settings.register(systemId, ABFSettingsKeys.USE_BREAKAGE_RULE, {
    name: 'anima.ui.systemSettings.breakageRule.title',
    hint: 'anima.ui.systemSettings.breakageRule.hint.title',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  });

  game.settings.register(
    systemId,
    ABFSettingsKeys.SEND_ROLL_MESSAGES_ON_COMBAT_BY_DEFAULT,
    {
      name: 'anima.ui.systemSettings.sendRollMessagesOnCombatByDefault.title',
      hint: 'anima.ui.systemSettings.sendRollMessagesOnCombatByDefault.hint.title',
      scope: 'world',
      config: true,
      default: true,
      type: Boolean
    }
  );

  game.settings.register(systemId, ABFSettingsKeys.USE_DAMAGE_TABLE, {
    name: 'anima.ui.systemSettings.useCombatTable.title',
    hint: 'anima.ui.systemSettings.useCombatTable.hint.title',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  });

  game.settings.register(systemId, ABFSettingsKeys.AUTOMATE_COMBAT_DISTANCE, {
    name: 'anima.ui.systemSettings.useDistanceAutomation.title',
    hint: 'anima.ui.systemSettings.useDistanceAutomation.hint.title',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  });

  game.settings.register(systemId, ABFSettingsKeys.MACRO_PREFIX_ATTACK, {
    name: 'anima.ui.systemSettings.prefixAttackMacro.title',
    hint: 'anima.ui.systemSettings.prefixAttackMacro.hint.title',
    scope: 'world',
    config: true,
    default: '',
    type: String
  });

  game.settings.register(systemId, ABFSettingsKeys.MACRO_ATTACK_DEFAULT, {
    name: 'anima.ui.systemSettings.defaultAttackMacro.title',
    hint: 'anima.ui.systemSettings.defaultAttackMacro.hint.title',
    scope: 'world',
    config: true,
    default: 'Default Attack Macro',
    type: String
  });

  game.settings.register(systemId, ABFSettingsKeys.MACRO_PROJECTILE_DEFAULT, {
    name: 'anima.ui.systemSettings.defaultProjectileMacro.title',
    hint: 'anima.ui.systemSettings.defaultProjectileMacro.hint.title',
    scope: 'world',
    config: true,
    default: 'Atk Projectil Flecha',
    type: String
  });

  game.settings.register(systemId, ABFSettingsKeys.MACRO_SHIELD_DEFAULT, {
    name: 'anima.ui.systemSettings.defaultShieldMacro.title',
    hint: 'anima.ui.systemSettings.defaultShieldMacro.hint.title',
    scope: 'world',
    config: true,
    default: 'Default Shield Macro',
    type: String
  });

  game.settings.register(systemId, ABFSettingsKeys.MACRO_MISS_ATTACK_VALUE, {
    name: 'anima.ui.systemSettings.missValueAttackMacro.title',
    hint: 'anima.ui.systemSettings.missValueAttackMacro.hint.title',
    scope: 'world',
    config: true,
    default: 80,
    type: Number
  });

  game.settings.register(systemId, ABFSettingsKeys.DEVELOP_MODE, {
    name: 'Develop mode',
    hint: 'Activate certain access to information. Only for developers',
    scope: 'world',
    config: true,
    default: false,
    type: Boolean
  });

  const critRollerChoices = {
    gm: 'anima.ui.systemSettings.critRoller.gm',
    owner: 'anima.ui.systemSettings.critRoller.owner'
  };

  game.settings.register(systemId, ABFSettingsKeys.CRIT_ROLL_LEVEL_BY, {
    name: 'anima.ui.systemSettings.critRollLevelBy.title',
    hint: 'anima.ui.systemSettings.critRollLevelBy.hint',
    scope: 'world',
    config: true,
    type: String,
    choices: critRollerChoices,
    default: 'owner'
  });

  game.settings.register(systemId, ABFSettingsKeys.CRIT_ROLL_PHR_BY, {
    name: 'anima.ui.systemSettings.critRollPhrBy.title',
    hint: 'anima.ui.systemSettings.critRollPhrBy.hint',
    scope: 'world',
    config: true,
    type: String,
    choices: critRollerChoices,
    default: 'owner'
  });

  game.settings.register(systemId, ABFSettingsKeys.CRIT_ROLL_LOCATION_BY, {
    name: 'anima.ui.systemSettings.critRollLocationBy.title',
    hint: 'anima.ui.systemSettings.critRollLocationBy.hint',
    scope: 'world',
    config: true,
    type: String,
    choices: critRollerChoices,
    default: 'owner'
  });

  game.settings.register(systemId, ABFSettingsKeys.NOTIFY_ON_MISSING_EXCEL_MATCH, {
    name: 'anima.ui.systemSettings.notifyOnMissingExcelMatch.title',
    hint: 'anima.ui.systemSettings.notifyOnMissingExcelMatch.hint.title',
    scope: 'world',
    config: true,
    default: true,
    type: Boolean
  });

  // This is for migration purposes, it stores the last migration version runned for the world.
  game.settings.register(systemId, ABFSettingsKeys.APPLIED_MIGRATIONS, {
    name: 'Applied Migration Versions',
    scope: 'world',
    config: false,
    type: Object,
    default: {}
  });

  game.settings.register(systemId, ABFSettingsKeys.WORLD_CREATION_SYSTEM_VERSION, {
    name: 'World Creation System Version',
    scope: 'world',
    config: false,
    type: String,
    default: null
  });

  game.settings.register(systemId, ABFSettingsKeys.CHANGELOG_LAST_VERSION, {
    name: 'Changelog Last Shown Version',
    scope: 'world',
    config: false,
    type: String,
    default: ''
  });

  game.settings.register(systemId, ABFSettingsKeys.MODIFY_DICE_FORMULAS_PERMISSION, {
    name: 'modifyDiceFormulasPermission',
    scope: 'world',
    config: false,
    type: Object,
    default: {
      [CONST.USER_ROLES.PLAYER]: false,
      [CONST.USER_ROLES.TRUSTED]: true,
      [CONST.USER_ROLES.ASSISTANT]: true,
      [CONST.USER_ROLES.GAMEMASTER]: true
    }
  });

  game.settings.registerMenu(systemId, 'modifyDiceFormulasPermissionMenu', {
    name: 'anima.permissions.modifyDiceFormulasPermission.title',
    label: 'anima.permissions.modifyDiceFormulasPermission.title',
    hint: 'anima.permissions.modifyDiceFormulasPermission.hint',
    icon: 'fas fa-dice',
    type: ModifyDicePermissionsConfig,
    restricted: true
  });

  // Vias magicas personalizadas (complementos fanmade). Se editan desde el menu; al cambiar
  // se fusionan en la config y se re-renderizan las hojas abiertas.
  game.settings.register(systemId, ABFSettingsKeys.CUSTOM_VIAS, {
    scope: 'world',
    config: false,
    type: Array,
    default: [],
    onChange: () => {
      mergeCustomViasIntoConfig();
      Object.values(ui.windows ?? {}).forEach(w => w?.render?.(false));
    }
  });

  game.settings.registerMenu(systemId, 'customViasMenu', {
    name: 'Vías personalizadas',
    label: 'Configurar vías',
    hint: 'Añade vías mágicas personalizadas (fanmade) que aparecerán en los conjuros, en las vías del personaje y en el grimorio.',
    icon: 'fas fa-wand-magic-sparkles',
    type: CustomViasConfig,
    restricted: true
  });
};
