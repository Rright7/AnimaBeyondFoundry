/**
 * Small popup dialog that asks for an optional modifier before a critical-related roll.
 * Returns the modifier value or null if cancelled.
 *
 * @param {object} opts
 * @param {string} opts.title — dialog title
 * @param {string} opts.label — label for the modifier input
 * @param {string} [opts.rollLabel] — text on the roll button (default: localized "Roll")
 * @param {number} [opts.defaultMod=0] — starting value for the modifier
 * @returns {Promise<number|null>} — modifier value, or null if cancelled
 */
export function openCriticalRollDialog({ title, label, rollLabel, defaultMod = 0 }) {
  return new Promise(resolve => {
    const btnRoll = rollLabel ?? game.i18n.localize('chat.combatResult.critRollButton');
    const btnCancel = game.i18n.localize('macros.combat.dialog.cancelButton.title');

    const content = `
      <form style="display:flex; flex-direction:column; gap:.5rem; padding:.25rem 0;">
        <div style="display:flex; align-items:center; gap:.5rem;">
          <label style="flex:1; font-weight:600;">${label}</label>
          <input type="number" name="modifier" value="${defaultMod}"
                 style="width:80px; text-align:center;" autofocus />
        </div>
      </form>
    `;

    new Dialog({
      title,
      content,
      buttons: {
        roll: {
          icon: '<i class="fas fa-dice-d20"></i>',
          label: btnRoll,
          callback: html => {
            const val = parseInt(html.find('[name=modifier]').val(), 10);
            resolve(Number.isFinite(val) ? val : 0);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: btnCancel,
          callback: () => resolve(null)
        }
      },
      default: 'roll',
      close: () => resolve(null)
    }).render(true);
  });
}
