import { rollOpenD10, getCharacteristicValue } from './opposedCheck/resolveOpposedCheck.js';

const STAT_LABELS = {
  strength: 'FUE',
  dexterity: 'DES',
  agility: 'AGI',
  constitution: 'CON'
};

/**
 * Open the dialog for one side (attacker / defender) of a maneuver opposed
 * check. The user picks the characteristic to use and may add an extra
 * modifier. The dialog shows the automatic bonuses (damage / quadruped) before
 * the player commits.
 *
 * On confirm, returns the full roll breakdown ready to be persisted in the
 * chat message flags.
 *
 * @param {object} input
 * @param {'attacker'|'defender'} input.role
 * @param {Actor} input.actor
 * @param {import('./ManeuverDefinition.js').ManeuverDefinition} input.maneuver
 * @param {number} input.damagePercent
 * @param {boolean} [input.defenderIsQuadruped=false]
 * @returns {Promise<object|null>}
 */
export async function openOpposedCheckRollDialog({
  role,
  actor,
  maneuver,
  damagePercent,
  defenderIsQuadruped = false
}) {
  const stats = role === 'attacker' ? maneuver.attackerStats : maneuver.defenderStats;
  if (!Array.isArray(stats) || stats.length === 0) {
    ui.notifications?.error('La maniobra no define características para este rol.');
    return null;
  }

  // Pre-compute automatic mods we'll add behind the scenes.
  const damageMod = role === 'attacker'
    ? maneuver.getOpposedCheckModifierFromDamage(damagePercent)
    : 0;
  const quadrupedBonus =
    role === 'defender' && maneuver.grantsQuadrupedBonus && defenderIsQuadruped ? 3 : 0;

  // Build select options with current values.
  const options = stats.map(slug => {
    const label = STAT_LABELS[slug] ?? slug.toUpperCase();
    const value = getCharacteristicValue(actor, slug);
    return `<option value="${slug}">${label} (${value})</option>`;
  }).join('');

  const automaticBonusLines = [];
  if (damageMod !== 0) {
    automaticBonusLines.push(
      `Daño ${damagePercent}%: ${damageMod > 0 ? '+' : ''}${damageMod}`
    );
  }
  if (quadrupedBonus !== 0) {
    automaticBonusLines.push(`Defensor cuadrúpedo: +${quadrupedBonus}`);
  }

  const automaticBlock = automaticBonusLines.length
    ? `<div style="background:rgba(0,0,0,.06);padding:6px 8px;border-radius:4px;font-size:.85em;margin-top:.4rem;">
         <div style="font-weight:600;margin-bottom:2px;">Modificadores automáticos:</div>
         ${automaticBonusLines.map(l => `<div>· ${l}</div>`).join('')}
       </div>`
    : '';

  const titleRole = role === 'attacker' ? 'Atacante' : 'Defensor';
  const title = `Control enfrentado · ${game.i18n.localize(maneuver.nameKey)} (${titleRole})`;

  const content = `
    <form style="display:flex;flex-direction:column;gap:.5rem;padding:.25rem 0;">
      <div style="display:flex;flex-direction:column;gap:.25rem;">
        <label style="font-size:.85em;opacity:.7;">Característica</label>
        <select name="stat" style="width:100%;">${options}</select>
      </div>
      <div style="display:flex;flex-direction:column;gap:.25rem;">
        <label style="font-size:.85em;opacity:.7;">Modificador extra</label>
        <input type="number" name="extraMod" value="0" style="width:100%;text-align:center;" />
      </div>
      ${automaticBlock}
    </form>
  `;

  const DialogV2 = foundry.applications?.api?.DialogV2;

  const readForm = formEl => {
    const stat = formEl.elements['stat']?.value;
    const extraMod = parseInt(formEl.elements['extraMod']?.value, 10) || 0;
    return { stat, extraMod };
  };

  let chosen;
  if (DialogV2) {
    try {
      chosen = await DialogV2.prompt({
        window: { title },
        content,
        ok: {
          label: 'Tirar D10',
          icon: 'fas fa-dice-d10',
          callback: (event, button, dialog) => {
            const form = button?.form ?? dialog?.element?.querySelector?.('form');
            return form ? readForm(form) : null;
          }
        },
        rejectClose: false,
        modal: true
      });
    } catch (err) {
      console.error('[ABF] OpposedCheckRollDialog V2 error:', err);
      return null;
    }
  } else {
    // Legacy Dialog fallback
    chosen = await new Promise(resolve => {
      let settled = false;
      const finalize = v => { if (!settled) { settled = true; resolve(v); } };
      new Dialog({
        title,
        content,
        buttons: {
          roll: {
            icon: '<i class="fas fa-dice-d10"></i>',
            label: 'Tirar D10',
            callback: html => {
              const root = html instanceof HTMLElement ? html : html[0];
              const form = root.querySelector('form');
              finalize(form ? readForm(form) : null);
            }
          },
          cancel: { icon: '<i class="fas fa-times"></i>', label: 'Cancelar', callback: () => finalize(null) }
        },
        default: 'roll',
        close: () => finalize(null)
      }).render(true);
    });
  }

  if (!chosen?.stat) return null;

  const statValue = getCharacteristicValue(actor, chosen.stat);
  const die = await rollOpenD10();

  const total = die + statValue + (role === 'attacker' ? damageMod : 0) + quadrupedBonus + chosen.extraMod;
  const statLabel = STAT_LABELS[chosen.stat] ?? chosen.stat.toUpperCase();

  // Pre-format the breakdown string for the chat template (avoids needing
  // math helpers in HBS).
  const parts = [`D10: <strong>${die}</strong>`, `+ ${statLabel} ${statValue}`];
  if (role === 'attacker' && damageMod !== 0) {
    parts.push(`${damageMod > 0 ? '+' : '−'}${Math.abs(damageMod)} (daño)`);
  }
  if (quadrupedBonus > 0) parts.push(`+${quadrupedBonus} (cuadrúpedo)`);
  if (chosen.extraMod !== 0) {
    parts.push(`${chosen.extraMod > 0 ? '+' : '−'}${Math.abs(chosen.extraMod)} (extra)`);
  }
  const breakdown = parts.join(' ');

  return {
    die,
    stat: chosen.stat,
    statLabel,
    statValue,
    damageMod: role === 'attacker' ? damageMod : 0,
    quadrupedBonus,
    extraMod: chosen.extraMod,
    total,
    breakdown,
    outcomeClass: '' // filled by resolveManeuverOpposedCheck when both sides done
  };
}
