import { renderTemplates } from '../renderTemplates';
import { Templates } from '../constants';

// El diálogo de escudo sobrenatural usa pestañas (mystic/psychic). DialogV2 no
// las auto-cablea como el viejo Dialog ({tabs}), así que las activamos a mano:
// click en la nav alterna `.active` (+ display) en nav y contenido.
const activateTab = (root, tab) => {
  root.querySelectorAll('.sheet-tabs .item').forEach(a =>
    a.classList.toggle('active', a.dataset.tab === tab)
  );
  root.querySelectorAll('.sheet-body .tab').forEach(t => {
    const on = t.dataset.tab === tab;
    t.classList.toggle('active', on);
    t.style.display = on ? '' : 'none';
  });
};

const wireTabs = root => {
  const navs = [...(root?.querySelectorAll?.('.sheet-tabs .item') ?? [])];
  if (!navs.length) return;
  navs.forEach(a =>
    a.addEventListener('click', ev => {
      ev.preventDefault();
      activateTab(root, a.dataset.tab);
    })
  );
  activateTab(root, navs[0].dataset.tab);
};

export const openComplexInputDialog = async (actor, dialogType) => {
  const { i18n } = game;
  const castOverride = actor.getFlag(game.animabf.id, 'spellCastingOverride') || false;
  const [dialogHTML] = await renderTemplates({
    name:
      dialogType === 'newSupernaturalShield'
        ? Templates.Dialog[dialogType].main
        : Templates.Dialog[dialogType],
    context: {
      data: {
        actor,
        mystic: {
          spellUsed: undefined,
          spellGrade: 'base',
          castInnate: false,
          castPrepared: false,
          castOverride
        }
      }
    }
  });

  return foundry.applications.api.DialogV2.prompt({
    window: { title: i18n.localize('dialogs.title') },
    content: dialogHTML,
    ok: {
      icon: 'fas fa-check',
      label: i18n.localize('dialogs.continue'),
      callback: (event, button, dialog) => {
        const form = button?.form ?? dialog?.element?.querySelector?.('form');
        if (!form) return {};
        const results = new (foundry.applications?.ux?.FormDataExtended ?? FormDataExtended)(
          form,
          {}
        ).object;
        if (form.querySelector?.('.mystic.active')) results.tab = 'mystic';
        else if (form.querySelector?.('.psychic.active')) results.tab = 'psychic';
        return results;
      }
    },
    render: (...renderArgs) => {
      const root = renderArgs
        .map(a => (a?.querySelectorAll ? a : a?.element))
        .find(Boolean);
      if (root) wireTabs(root);
    },
    rejectClose: false,
    modal: true
  }).catch(() => ({}));
};
