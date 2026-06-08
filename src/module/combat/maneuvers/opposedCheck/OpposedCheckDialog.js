import { resolveOpposedCheck, getCharacteristicValue } from './resolveOpposedCheck.js';

/**
 * Dialog to configure and resolve the opposed characteristic check for a
 * combat maneuver. Uses Foundry V13+'s DialogV2 API and falls back to the
 * legacy Dialog when not available, normalizing both jQuery and HTMLElement
 * callback shapes.
 *
 * @param {object} opts
 * @param {import('../ManeuverDefinition.js').ManeuverDefinition} opts.maneuver
 * @param {Actor} opts.attacker
 * @param {Actor} opts.defender
 * @param {number} opts.damagePercent
 * @param {boolean} [opts.defenderIsQuadruped]
 * @returns {Promise<import('./resolveOpposedCheck.js').OpposedCheckResult|null>}
 */
export async function openOpposedCheckDialog({
  maneuver,
  attacker,
  defender,
  damagePercent,
  defenderIsQuadruped = false
}) {
  const STAT_LABELS = {
    strength: 'FUE',
    dexterity: 'DES',
    agility: 'AGI',
    constitution: 'CON'
  };

  const attackerOptions = maneuver.attackerStats
    .map(slug => `<option value="${slug}">${STAT_LABELS[slug] ?? slug} (${getCharacteristicValue(attacker, slug)})</option>`)
    .join('');
  const defenderOptions = maneuver.defenderStats
    .map(slug => `<option value="${slug}">${STAT_LABELS[slug] ?? slug} (${getCharacteristicValue(defender, slug)})</option>`)
    .join('');

  const damageModPreview = maneuver.getOpposedCheckModifierFromDamage(damagePercent);
  const damageModLabel =
    damagePercent < 100
      ? `Atacante: ${damageModPreview} (daño < 100%)`
      : damagePercent >= 200
        ? `Atacante: +${damageModPreview} (daño ≥ 200%)`
        : 'Atacante: 0 (daño normal)';

  const quadrupedLine =
    maneuver.grantsQuadrupedBonus && defenderIsQuadruped
      ? '<p style="opacity:.8;font-size:.9em;">Defensor cuadrúpedo: +3</p>'
      : '';

  const content = `
    <form style="display:flex;flex-direction:column;gap:.5rem;padding:.25rem 0;">
      <p style="margin:0 0 .25rem 0;">
        <strong>${attacker.name}</strong> vs <strong>${defender.name}</strong> · Daño: ${damagePercent}%
      </p>

      <div style="display:flex;align-items:center;gap:.5rem;">
        <label style="flex:1;font-weight:600;">Atacante (${attacker.name})</label>
        <select name="attackerStat" style="flex:1;">${attackerOptions}</select>
        <input type="number" name="attackerExtraMod" value="0" title="Modificador manual" style="width:60px;text-align:center;" />
      </div>

      <div style="display:flex;align-items:center;gap:.5rem;">
        <label style="flex:1;font-weight:600;">Defensor (${defender.name})</label>
        <select name="defenderStat" style="flex:1;">${defenderOptions}</select>
        <input type="number" name="defenderExtraMod" value="0" title="Modificador manual" style="width:60px;text-align:center;" />
      </div>

      <p style="margin:.25rem 0 0 0;opacity:.8;font-size:.9em;">${damageModLabel}</p>
      ${quadrupedLine}
    </form>
  `;

  const title = `Control enfrentado · ${game.i18n.localize(maneuver.nameKey)}`;
  const DialogV2 = foundry.applications?.api?.DialogV2;

  // ── DialogV2 path (Foundry V13+) ──────────────────────────────
  if (DialogV2) {
    try {
      const result = await DialogV2.prompt({
        window: { title },
        content,
        ok: {
          label: 'Tirar control',
          icon: 'fas fa-dice-d20',
          callback: (event, button, dialog) => {
            // V13/V14: button.form is the <form> element
            const form = button?.form ?? dialog?.element?.querySelector?.('form');
            if (!form) return null;
            const get = name => form.elements[name]?.value;
            return {
              attackerStat: get('attackerStat'),
              defenderStat: get('defenderStat'),
              attackerExtraMod: parseInt(get('attackerExtraMod'), 10) || 0,
              defenderExtraMod: parseInt(get('defenderExtraMod'), 10) || 0
            };
          }
        },
        rejectClose: false,
        modal: false
      });

      if (!result) return null;

      return await resolveOpposedCheck({
        maneuver,
        attacker,
        defender,
        attackerStat: result.attackerStat,
        defenderStat: result.defenderStat,
        damagePercent,
        defenderIsQuadruped,
        attackerExtraMod: result.attackerExtraMod,
        defenderExtraMod: result.defenderExtraMod
      });
    } catch (err) {
      console.error('[ABF] DialogV2 OpposedCheck error:', err);
      return null;
    }
  }
}
