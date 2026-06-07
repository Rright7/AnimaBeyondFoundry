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
}
