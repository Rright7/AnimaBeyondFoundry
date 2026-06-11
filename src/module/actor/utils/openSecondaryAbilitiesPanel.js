const L = (key, data) =>
  (data ? game.i18n?.format?.(key, data) : game.i18n?.localize?.(key)) ?? key;

/**
 * Panel flotante con TODAS las habilidades secundarias del token (o el controlado / el
 * del personaje del usuario), agrupadas por categoria. Al elegir una, reutiliza el
 * handler de tirada de la ficha (actor.sheet._onRoll) con un elemento sintetico que
 * lleva los mismos data-* que generaria la fila de la hoja -> abre el dialogo de
 * modificador y tira igual, sin abrir la ficha.
 *
 * Expuesto como game.animabf.openSecondaryAbilities() y disparado por el keybinding.
 *
 * @param {Token|TokenDocument} [token]
 */
export async function openSecondaryAbilitiesPanel(token) {
  const tk =
    token?.object ??
    token ??
    canvas?.tokens?.controlled?.[0] ??
    game.user?.character?.getActiveTokens?.()?.[0] ??
    null;
  const actor = tk?.actor;
  if (!actor) {
    ui.notifications?.warn(L('anima.ui.secondaries.panel.noToken'));
    return;
  }
  if (typeof actor.sheet?._onRoll !== 'function') {
    ui.notifications?.warn(L('anima.ui.secondaries.panel.empty'));
    return;
  }
  const tokenName = tk.name ?? actor.name;
  const die = actor.system?.general?.diceSettings?.abilityDie?.value ?? '1d100';

  // Grupos a partir de system.secondaries (categorias de habilidades + las especiales).
  const secondaries = actor.system?.secondaries ?? {};
  const groups = [];
  for (const [cat, val] of Object.entries(secondaries)) {
    if (cat === 'secondarySpecialSkills') {
      const skills = (Array.isArray(val) ? val : [])
        .filter(it => it?._id)
        .map(it => ({
          name: it?.name ?? '?',
          value: Number(it?.system?.level?.value ?? 0),
          rollPath: `system.dynamic.secondarySpecialSkills.${it._id}.system.level.value`
        }));
      if (skills.length) {
        groups.push({ title: L('anima.ui.secondaries.secondarySpecialSkills.title'), skills });
      }
      continue;
    }
    if (!val || typeof val !== 'object') continue;
    const skills = Object.entries(val)
      .filter(([, atr]) => atr && typeof atr === 'object' && atr.final && atr.final.value !== undefined)
      .map(([key, atr]) => ({
        name: L(`anima.ui.secondaries.${key}.title`),
        value: Number(atr.final.value ?? 0),
        rollPath: `system.secondaries.${cat}.${key}.final.value`
      }));
    if (skills.length) groups.push({ title: L(`anima.ui.secondaries.${cat}.title`), skills });
  }
  if (!groups.length) {
    ui.notifications?.warn(L('anima.ui.secondaries.panel.empty'));
    return;
  }

  // Indice plano: cada boton guarda el dataset que espera _onRoll.
  const flat = [];
  const groupsHtml = groups
    .map(g => {
      const buttons = g.skills
        .map(s => {
          const i =
            flat.push({
              roll: die,
              rollPath: s.rollPath,
              extraPath: s.rollPath,
              label: String(s.name).toLowerCase()
            }) - 1;
          return `<button type="button" class="abf-sec" data-i="${i}" data-name="${String(s.name).toLowerCase()}"
            style="display:flex;justify-content:space-between;gap:.5rem;padding:.3rem .5rem;text-align:left;line-height:1.2;">
            <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.name}</span>
            <b style="opacity:.8;flex:0 0 auto;">${s.value}</b>
          </button>`;
        })
        .join('');
      return `<div class="abf-sec-group">
        <div style="font-weight:600;opacity:.7;margin:.4rem .25rem .1rem;border-bottom:1px solid rgba(127,127,127,.25);">${g.title}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:.3rem;">${buttons}</div>
      </div>`;
    })
    .join('');
  const content = `
    <input type="text" class="abf-sec-search" autofocus
      placeholder="${L('anima.ui.secondaries.panel.search')}"
      style="width:100%;box-sizing:border-box;margin-bottom:.45rem;padding:.4rem .55rem;">
    <div class="abf-sec-list" style="max-height:60vh;overflow:auto;padding:.1rem;">${groupsHtml}</div>`;

  const dlg = new foundry.applications.api.DialogV2({
    window: {
      title: `${L('anima.ui.secondaries.panel.title')} - ${tokenName}`,
      icon: 'fas fa-dice-d20'
    },
    content,
    buttons: [{ action: 'close', label: L('anima.ui.secondaries.panel.close') }],
    position: { width: 500 }
  });
  await dlg.render(true);

  const rollByButton = btn => {
    const dataset = flat[Number(btn.dataset.i)];
    if (!dataset) return;
    dlg.close();
    try {
      actor.sheet._onRoll({
        currentTarget: { dataset, closest: () => null },
        preventDefault: () => {}
      });
    } catch (err) {
      console.error('[ABF] openSecondaryAbilitiesPanel:', err);
      ui.notifications?.error('Error al tirar la habilidad (ver consola).');
    }
  };

  dlg.element.querySelectorAll('.abf-sec').forEach(btn =>
    btn.addEventListener('click', () => rollByButton(btn))
  );

  // Buscador: filtra los botones por nombre y oculta los grupos sin coincidencias.
  // Enter tira la PRIMERA coincidencia visible.
  const search = dlg.element.querySelector('.abf-sec-search');
  if (search) {
    const applyFilter = () => {
      const q = (search.value ?? '').trim().toLowerCase();
      dlg.element.querySelectorAll('.abf-sec-group').forEach(group => {
        let any = false;
        group.querySelectorAll('.abf-sec').forEach(btn => {
          const show = !q || (btn.dataset.name ?? '').includes(q);
          btn.style.display = show ? '' : 'none';
          if (show) any = true;
        });
        group.style.display = any ? '' : 'none';
      });
    };
    search.addEventListener('input', applyFilter);
    search.addEventListener('keydown', ev => {
      if (ev.key !== 'Enter') return;
      ev.preventDefault();
      ev.stopPropagation();
      const first = [...dlg.element.querySelectorAll('.abf-sec')].find(
        b => b.style.display !== 'none' && b.offsetParent !== null
      );
      if (first) rollByButton(first);
    });
    setTimeout(() => search.focus(), 50);
  }
}
