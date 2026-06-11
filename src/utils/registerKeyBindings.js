import { ABFMacros } from '../module/macros/ABFMacros';

export function registerKeyBindings() {
  game.keybindings.register(game.animabf.id, 'damageCalculator', {
    name: game.i18n.localize('keyBindings.damageCalculator.name'),
    hint: game.i18n.localize('keyBindings.damageCalculator.hint'),
    editable: [
      {
        key: 'Digit1',
        modifiers: ['Control']
      }
    ],
    onDown: () => {
      ABFMacros.damageCalculator();
      return true;
    },
    restricted: false,
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
  });

  game.keybindings.register(game.animabf.id, 'openManeuvers', {
    name: game.i18n.localize('keyBindings.openManeuvers.name'),
    hint: game.i18n.localize('keyBindings.openManeuvers.hint'),
    editable: [
      {
        key: 'KeyM',
        modifiers: ['Control']
      }
    ],
    onDown: () => {
      game.animabf?.openManeuvers?.();
      return true;
    },
    restricted: false,
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
  });

  game.keybindings.register(game.animabf.id, 'openSecondaryAbilities', {
    name: game.i18n.localize('keyBindings.openSecondaryAbilities.name'),
    hint: game.i18n.localize('keyBindings.openSecondaryAbilities.hint'),
    editable: [
      {
        key: 'Digit2',
        modifiers: ['Control']
      }
    ],
    onDown: () => {
      game.animabf?.openSecondaryAbilities?.();
      return true;
    },
    restricted: false,
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL
  });
}
