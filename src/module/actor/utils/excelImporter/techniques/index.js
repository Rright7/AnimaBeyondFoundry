/**
 * Orquestador del import de Tecnicas de Ki desde el Excel.
 *
 * Lee la hoja "Creacion de Tecnicas" del workbook completo, reconstruye el
 * system.build de cada tecnica y crea los items embebidos. REEMPLAZA todas las
 * tecnicas existentes del actor (decision de diseno: re-importar deja el actor
 * sincronizado con la ficha Excel). Si el Excel no tiene la hoja, avisa y no
 * hace nada.
 */
import { readTechniquesFromWorkbook } from './parseTechniques.js';
import { ABFItems } from '../../../../items/ABFItems.js';
import { INITIAL_TECHNIQUE_DATA } from '../../../../types/domine/TechniqueItemConfig.js';
import { ABFSettingsKeys } from '../../../../../utils/settingKeys.js';

/**
 * @param {Actor} actor
 * @param {object} workbook  Workbook xlsx ya leido.
 */
export async function importTechniques(actor, workbook) {
  if (!workbook) return;

  const techniques = readTechniquesFromWorkbook(workbook);
  if (techniques === null) {
    ui.notifications?.warn(
      game.i18n.localize('anima.ui.excelImporter.techniques.notifNotExcel')
    );
    return;
  }
  if (!techniques.length) return;

  // Reemplazar: borrar las tecnicas embebidas previas para no duplicar al
  // re-importar (las tecnicas son items NO internos).
  const existing = actor.items
    .filter(i => i.type === ABFItems.TECHNIQUE)
    .map(i => i.id);
  if (existing.length) {
    await actor.deleteEmbeddedDocuments('Item', existing);
  }

  const items = [];
  const notFound = new Set();
  for (const tech of techniques) {
    tech.notFound.forEach(n => notFound.add(n));

    const system = foundry.utils.deepClone(INITIAL_TECHNIQUE_DATA);
    system.description.value = tech.description ?? '';
    system.level.value = tech.level;
    system.build.level = tech.level;
    system.build.combinable = tech.combinable;
    system.build.kiReductionLine = tech.kiReductionLine;
    system.build.cmReductionLine = tech.cmReductionLine;
    system.build.effects = tech.effects;
    system.build.disadvantages = tech.disadvantages;

    items.push({ name: tech.name, type: ABFItems.TECHNIQUE, system });
  }

  if (items.length) {
    await actor.createEmbeddedDocuments('Item', items);
  }

  ui.notifications?.info(
    game.i18n.format('anima.ui.excelImporter.techniques.notifSummary', {
      count: items.length
    })
  );

  const shouldNotifyMissing = game.settings.get(
    game.system.id,
    ABFSettingsKeys.NOTIFY_ON_MISSING_EXCEL_MATCH
  );
  if (shouldNotifyMissing) {
    for (const name of notFound) {
      ui.notifications?.warn(
        game.i18n.format('anima.ui.excelImporter.techniques.notifNotFound', { name })
      );
    }
  }
}
