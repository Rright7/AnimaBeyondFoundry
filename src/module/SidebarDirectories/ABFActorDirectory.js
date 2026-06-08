import { read, utils } from 'xlsx';
import { parseExcelToActor } from '../actor/utils/parseExcelToActor.js';

const ActorDirectoryV1 = foundry.applications?.sidebar?.tabs?.ActorDirectory ?? ActorDirectory;
export default class ABFActorDirectory extends ActorDirectoryV1 {
  /**
   * Añadir opciones personalizadas al menú contextual del actor.
   */
  _getEntryContextOptions() {
    const options = super._getEntryContextOptions();

    // Opción personalizada de importación desde Excel
    options.push({
      name: 'Import from Excel',
      icon: '<i class="fas fa-file-import"></i>',
      condition: li => {
        const { entryId } = li.dataset;
        const document = this.collection.get(entryId);
        // Verifica que el usuario tenga al menos permiso de OWNER
        return document?.testUserPermission(game.user, 'OWNER');
      },
      callback: li => {
        const { entryId } = li.dataset;
        const document = this.collection.get(entryId);
        return this.importFromExcelDialog(document);
      }
    });

    return options;
  }

  /**
   * Muestra el diálogo para importar desde Excel
   * @param {Actor} document
   * @returns {Promise<void>}
   */
  async importFromExcelDialog(document) {
    const content = await (foundry.applications?.handlebars?.renderTemplate ?? renderTemplate)(
      'systems/animabf/templates/dialog/import-data-from-excel.html',
      {
        hint1: game.i18n.format('anima.ui.importDataFromExcelHint1', {
          documentType: document.documentName
        }),
        hint2: game.i18n.format('anima.ui.importDataFromExcelHint2', {
          name: document.name
        })
      }
    );

    await foundry.applications.api.DialogV2.wait({
      window: {
        title: game.i18n.format('anima.ui.importDataFromExcelTitle', {
          name: document.name
        })
      },
      position: { width: 400 },
      content,
      buttons: [
        {
          action: 'import',
          icon: 'fas fa-file-import',
          label: 'Import',
          default: true,
          callback: (event, button, dialog) => {
            const root = button?.form ?? dialog?.element;
            const fileInput = root?.querySelector?.('input[type="file"]');
            const file = fileInput?.files?.[0];
            if (!file) {
              ui.notifications.error('You did not upload a data file!');
              return;
            }

            this.readExcelData(file)
              .then(({ rows, workbook }) =>
                parseExcelToActor(rows, document, { workbook })
              )
              .catch(() => {
                ui.notifications.error('Error reading Excel file.');
              });
          }
        },
        {
          action: 'no',
          icon: 'fas fa-times',
          label: 'Cancel'
        }
      ],
      rejectClose: false
    }).catch(() => {});
  }

  /**
   * Lee y convierte los datos del archivo Excel.
   *
   * Devuelve el objeto plano `rows` (extraído de la hoja NamedRangesList) y
   * el `workbook` completo. El workbook permite a parsers especializados
   * acceder a otros bloques del Excel (named ranges 2D, hojas con anclaje
   * por texto) que no caben en el formato plano.
   *
   * @param {File} file
   * @returns {Promise<{ rows: Object, workbook: Object }>}
   */
  readExcelData(file) {
    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onload = function (e) {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = read(data, { type: 'array' });
          const worksheet = workbook.Sheets.NamedRangesList;
          if (worksheet) {
            const rows = utils.sheet_to_json(worksheet).reduce((acc, obj) => {
              acc[obj.Name] = obj.Value;
              return acc;
            }, {});
            resolve({ rows, workbook });
          } else {
            reject();
          }
        } catch (err) {
          reject(err);
        }
      };

      reader.onerror = () => {
        reader.abort();
        reject();
      };

      reader.readAsArrayBuffer(file);
    });
  }
}
