import { renderTemplates } from '../renderTemplates';
import { Templates } from '../constants';

export const openSimpleInputDialog = async ({
  title = '',
  content,
  placeholder = ''
}) => {
  const [dialogHTML] = await renderTemplates({
    name: Templates.Dialog.ModDialog,
    context: { content, placeholder }
  });

  // DialogV2 (Foundry V13+). El callback de 'ok' lee el input y su valor es lo
  // que resuelve prompt(); al cerrar/cancelar (rejectClose:false) -> undefined.
  return foundry.applications.api.DialogV2.prompt({
    window: { title: title || game.i18n.localize('dialogs.title') },
    content: dialogHTML,
    ok: {
      icon: 'fas fa-check',
      label: game.i18n.localize('dialogs.continue'),
      callback: (event, button, dialog) => {
        const root = button?.form ?? dialog?.element;
        const el = root?.querySelector?.('[name="dialog-input"], #dialog-input');
        return el?.value ?? '';
      }
    },
    rejectClose: false,
    modal: true
  }).catch(() => undefined);
};

// Abre el diálogo de modificador. Devuelve el modificador introducido (string) o
// undefined si se cierra.
export const openModDialog = async ({ title = '' } = {}) => {
  return openSimpleInputDialog({
    title,
    content: game.i18n.localize('dialogs.mod.content'),
    placeholder: '0'
  });
};
