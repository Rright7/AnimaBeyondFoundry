import { renderTemplates } from '../../utils/renderTemplates';
import { Templates } from '../../utils/constants';
import { ABFDialogs } from '../../dialogs/ABFDialogs';
import { calculateCombatResult } from '../../combat/utils/calculateCombatResult';

/** @type {() => Promise<{ [key: string]: unknown }>} */
const openDialog = async () => {
  const [dialogHTML] = await renderTemplates({
    name: Templates.Dialog.DamageCalculator,
    context: {}
  });

  return foundry.applications.api.DialogV2.prompt({
    window: { title: game.i18n.localize('macros.damageCalculator.dialog.title') },
    content: dialogHTML,
    ok: {
      icon: 'fas fa-check',
      label: game.i18n.localize('dialogs.continue'),
      callback: (event, button, dialog) => {
        const form = button?.form ?? dialog?.element?.querySelector?.('form');
        if (!form) return {};
        /** @type {{ [key: string]: number }} */
        const results = new (foundry.applications?.ux?.FormDataExtended ?? FormDataExtended)(form, {}).object;
        return results;
      }
    },
    rejectClose: false,
    modal: true
  }).catch(() => ({}));
};

export const damageCalculatorMacro = async () => {
  const results = await openDialog();

  const attack = results['damage-calculator-attack-input'];
  const defense = results['damage-calculator-defense-input'];
  const at = results['damage-calculator-ta-input'];
  const damage = results['damage-calculator-damage-input'];

  if (
    typeof attack !== 'number' ||
    typeof defense !== 'number' ||
    typeof at !== 'number' ||
    typeof damage !== 'number'
  ) {
    ABFDialogs.prompt('One of the fields is empty or is not a number');
    return;
  }

  const result = calculateCombatResult(attack, defense, at, damage);

  let final = `<div>HA: ${attack}, HD: ${defense}, at: ${at}, Daño Base: ${damage}</div>`;

  if (result.canCounterAttack) {
    final = `${final}<h2>Bono al contraataque: <span style='color:#ff1515'>${result.counterAttackBonus}</span></h2>`;
  } else {
    final = `${final}<h2>Daño final: <span style='color:#ff1515'>${result.damage}</span></h2>`;
  }

  /** @type {User[] | undefined} */
  const user = game.collections?.get('User');

  if (user !== undefined) {
    const isGM = u => u.isGM;
    const hasId = u => u.id !== null;

    const gmIds = user
      .filter(isGM)
      .filter(hasId)
      .map(u => u.id);

    if (gmIds.length > 0) {
      ChatMessage.create({
        content: final,
        whisper: gmIds
      });
    }
  }
};
