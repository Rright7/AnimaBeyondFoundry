// Diálogo del control de entereza (regla opcional de rotura). El DJ elige el
// arma del atacante y el objetivo del defensor (arma / armadura / cuerpo). Las
// tiradas D10 y la aplicación de efectos las hace el handler; aquí solo se
// recoge la selección.
//
// Devuelve { attackerWeaponId, targetKind: 'weapon'|'armor'|'body', targetItemId,
// mastery } o null si se cancela.

const num = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const itemsOf = (actor, type) =>
  [...(actor?.items?.contents ?? actor?.items ?? [])].filter(i => i?.type === type);

/** Lee `system.<path>.final.value` con fallback a `.base.value`. */
const finalOf = (item, path) =>
  num(
    foundry.utils.getProperty(item, `system.${path}.final.value`),
    num(foundry.utils.getProperty(item, `system.${path}.base.value`))
  );

const primary = (actor, slug) =>
  num(
    foundry.utils.getProperty(actor, `system.characteristics.primaries.${slug}.final.value`),
    num(foundry.utils.getProperty(actor, `system.characteristics.primaries.${slug}.value`))
  );

export function openIntegrityCheckDialog({ attacker, defender }) {
  return new Promise(resolve => {
    const L = k => game.i18n.localize(k);

    const attackerWeapons = itemsOf(attacker, 'weapon');
    if (!attackerWeapons.length) {
      ui.notifications?.warn(L('chat.combatResult.integrity.noAttackerWeapon'));
      resolve(null);
      return;
    }

    const defWeapons = itemsOf(defender, 'weapon');
    const defArmors = itemsOf(defender, 'armor');

    const lblBreak = L('chat.combatResult.integrity.breaking');
    const lblInteg = L('chat.combatResult.integrity.integrity');

    const attackerOpts = attackerWeapons
      .map(w => `<option value="${w.id}">${w.name} — ${lblBreak} ${finalOf(w, 'breaking')}</option>`)
      .join('');

    const optGroup = (label, opts) => (opts ? `<optgroup label="${label}">${opts}</optgroup>` : '');
    const defWeaponOpts = defWeapons
      .map(w => `<option value="weapon:${w.id}">${w.name} — ${lblInteg} ${finalOf(w, 'integrity')}</option>`)
      .join('');
    const defArmorOpts = defArmors
      .map(a => `<option value="armor:${a.id}">${a.name} — ${lblInteg} ${finalOf(a, 'integrity')}</option>`)
      .join('');

    const body = Math.max(primary(defender, 'constitution'), primary(defender, 'dexterity'));
    const bodyOpt = `<option value="body:">${L('chat.combatResult.integrity.unarmedParry')} — ${lblInteg} ${body}</option>`;

    const blockBase = num(foundry.utils.getProperty(defender, 'system.combat.block.base.value'));
    const masteryChecked = blockBase >= 200 ? 'checked' : '';

    const content = `
      <form style="display:flex;flex-direction:column;gap:.5rem;padding:.25rem 0;">
        <div style="display:flex;flex-direction:column;gap:.2rem;">
          <label style="font-weight:600;">${L('chat.combatResult.integrity.attackerWeapon')}</label>
          <div style="display:flex;gap:.4rem;align-items:center;">
            <select name="attackerWeapon" style="flex:1;min-width:0;">${attackerOpts}</select>
            <span style="opacity:.8;font-size:.85em;white-space:nowrap;">${L('chat.combatResult.integrity.roturaMod')}</span>
            <input type="number" name="attackerMod" value="0" style="width:60px;text-align:center;" />
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:.2rem;">
          <label style="font-weight:600;">${L('chat.combatResult.integrity.target')}</label>
          <div style="display:flex;gap:.4rem;align-items:center;">
            <select name="target" style="flex:1;min-width:0;">
              ${optGroup(L('chat.combatResult.integrity.weapons'), defWeaponOpts)}
              ${optGroup(L('chat.combatResult.integrity.armors'), defArmorOpts)}
              ${bodyOpt}
            </select>
            <span style="opacity:.8;font-size:.85em;white-space:nowrap;">${L('chat.combatResult.integrity.enterezaMod')}</span>
            <input type="number" name="defenderMod" value="0" style="width:60px;text-align:center;" />
          </div>
        </div>
        <label style="display:flex;align-items:center;gap:.4rem;">
          <input type="checkbox" name="mastery" ${masteryChecked} />
          ${L('chat.combatResult.integrity.unarmedMastery')}
        </label>
      </form>
    `;

    foundry.applications.api.DialogV2.wait({
      window: { title: L('chat.combatResult.integrity.title') },
      content,
      buttons: [
        {
          action: 'roll',
          icon: 'fas fa-dice-d20',
          label: L('chat.combatResult.integrity.rollButton'),
          default: true,
          callback: (event, button, dialog) => {
            const form = button?.form ?? dialog?.element?.querySelector?.('form');
            if (!form) return resolve(null);
            const attackerWeaponId = String(form.elements['attackerWeapon']?.value ?? '');
            const target = String(form.elements['target']?.value ?? 'body:');
            const mastery = !!form.elements['mastery']?.checked;
            const attackerMod = num(form.elements['attackerMod']?.value);
            const defenderMod = num(form.elements['defenderMod']?.value);
            const sep = target.indexOf(':');
            const targetKind = sep >= 0 ? target.slice(0, sep) : target;
            const targetItemId = sep >= 0 ? target.slice(sep + 1) : '';
            return resolve({ attackerWeaponId, targetKind, targetItemId, mastery, attackerMod, defenderMod });
          }
        },
        {
          action: 'cancel',
          icon: 'fas fa-times',
          label: L('chat.combatResult.integrity.cancel'),
          callback: () => resolve(null)
        }
      ],
      rejectClose: false
    }).catch(() => resolve(null));
  });
}
