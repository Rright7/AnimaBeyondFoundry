import { executeCombatManeuver } from '../../actor/utils/buttonCallbacks/executeCombatManeuver.js';
import { maneuverRegistry } from './index.js';

const L = (key, data) =>
  (data ? game.i18n?.format?.(key, data) : game.i18n?.localize?.(key)) ?? key;

/**
 * Panel flotante con TODAS las maniobras disponibles del token dado (o el controlado /
 * el del personaje del usuario). Al elegir una, reutiliza executeCombatManeuver con el
 * token resuelto -> el mismo flujo que el boton "Ejecutar" de la ficha, pero sin abrirla.
 * Expuesto como game.animabf.openManeuvers() y disparado por el keybinding.
 *
 * @param {Token|TokenDocument} [token] opcional; si falta, usa el token controlado.
 */
export async function openManeuversPanel(token) {
  const tk =
    token?.object ??
    token ??
    canvas?.tokens?.controlled?.[0] ??
    game.user?.character?.getActiveTokens?.()?.[0] ??
    null;
  const actor = tk?.actor;
  if (!actor) {
    ui.notifications?.warn(L('anima.ui.combat.combatManeuvers.panel.noToken'));
    return;
  }
  const tokenDoc = tk.document ?? tk;
  const tokenName = tk.name ?? actor.name;

  // Misma lista que la pestania de maniobras: canonicas del registry + custom del actor
  // (dedupe por slug), para no abrir la ficha.
  const defs = maneuverRegistry?.all?.() ?? [];
  const canonical = defs
    .filter(d => d?.slug)
    .map(d => ({
      slug: d.slug,
      name: (d.nameKey && L(d.nameKey)) || d.slug,
      img: d.icon || 'icons/svg/sword.svg',
      master: Array.isArray(d.predicate) && d.predicate.includes('self:mastery:attack'),
      _id: null
    }));
  const canonSlugs = new Set(canonical.map(m => m.slug));
  const custom = (actor.system?.combat?.combatManeuvers ?? [])
    .filter(it => {
      const s = it?.system?.slug?.value ?? '';
      return !(s && canonSlugs.has(s));
    })
    .map(it => ({
      slug: it?.system?.slug?.value ?? '',
      name: it?.name ?? '?',
      img: it?.img ?? 'icons/svg/sword.svg',
      master: false,
      _id: it?._id ?? null
    }));
  const list = [...canonical, ...custom].sort((a, b) => a.name.localeCompare(b.name));
  if (!list.length) {
    ui.notifications?.warn(L('anima.ui.combat.combatManeuvers.panel.empty'));
    return;
  }

  const masterTag = L('anima.ui.combat.combatManeuvers.panel.master');
  const cards = list
    .map(
      (m, i) => `
    <button type="button" class="abf-mnv" data-i="${i}"
      style="display:flex;align-items:center;gap:.5rem;padding:.35rem .5rem;text-align:left;line-height:1.2;${m.master ? 'border-color:#b8860b;' : ''}">
      <img src="${m.img}" width="26" height="26" style="border:0;border-radius:4px;flex:0 0 auto;">
      <span style="flex:1;">${m.name}${m.master ? ` <small style="opacity:.6;">${masterTag}</small>` : ''}</span>
    </button>`
    )
    .join('');
  const content = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.35rem;max-height:60vh;overflow:auto;padding:.25rem;">${cards}</div>
    <p style="opacity:.65;font-size:.8em;margin:.4rem .25rem 0;">${L('anima.ui.combat.combatManeuvers.panel.hint', { name: tokenName })}</p>`;

  const sheet = { actor, token: tokenDoc };
  const dlg = new foundry.applications.api.DialogV2({
    window: {
      title: `${L('anima.ui.combat.combatManeuvers.panel.title')} - ${tokenName}`,
      icon: 'fas fa-hand-fist'
    },
    content,
    buttons: [{ action: 'close', label: L('anima.ui.combat.combatManeuvers.panel.close') }],
    position: { width: 460 }
  });
  await dlg.render(true);

  dlg.element.querySelectorAll('.abf-mnv').forEach(btn =>
    btn.addEventListener('click', () => {
      const m = list[Number(btn.dataset.i)];
      const e = {
        currentTarget: {
          dataset: m._id ? { maneuverId: m._id } : { maneuverSlug: m.slug },
          closest: () => null
        }
      };
      dlg.close();
      try {
        executeCombatManeuver(sheet, e);
      } catch (err) {
        console.error('[ABF] openManeuversPanel:', err);
        ui.notifications?.error('Error al lanzar la maniobra (ver consola).');
      }
    })
  );
}
