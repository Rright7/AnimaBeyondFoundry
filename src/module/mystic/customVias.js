// Vias magicas PERSONALIZADAS definibles por el DJ (complementos fanmade), sin tocar
// codigo: se guardan en un setting de mundo (editado desde el menu CustomViasConfig) y se
// FUSIONAN en la lista global de vias (ABFConfig.iterables.mystic.vias) para que aparezcan
// solas en los desplegables (via del hechizo, dialogo de vias del personaje) y en el
// grimorio (que ya agrupa por el string `via`). Ver [[mystic-subsystem]].

import { ABFSettingsKeys } from '../../utils/settingKeys.js';

const VIA_LABEL_PREFIX = 'anima.ui.mystic.spell.via.';

// La lista de vias vive en ABFConfig, pero se accede en RUNTIME via CONFIG.config (=
// ABFConfig, asignado en init) para NO importar ABFConfig en cabecera: hacerlo adelantaba
// su carga (y la de SpellItemConfig) y provocaba un import circular / TDZ.
const viasConfig = () => CONFIG?.config?.iterables?.mystic?.vias ?? null;

// Claves de las vias de BASE, capturadas en la primera fusion para poder rehacer la lista
// (y reflejar borrados) sin perder las de base.
let builtinViaKeys = null;

/** Clave estable a partir del nombre. Prefijo `cv-` para no chocar con las vias de base. */
export function slugifyVia(label) {
  const slug = String(label ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug ? `cv-${slug}` : `cv-${foundry.utils.randomID(6).toLowerCase()}`;
}

/** Vias custom guardadas: `[{ key, label }]` (filtradas y saneadas). */
export function getCustomVias() {
  let raw;
  try {
    raw = game.settings?.get?.(game.animabf.id, ABFSettingsKeys.CUSTOM_VIAS);
  } catch {
    raw = null;
  }
  const list = Array.isArray(raw) ? raw : [];
  return list
    .map(v => ({ key: String(v?.key ?? '').trim(), label: String(v?.label ?? '').trim() }))
    .filter(v => v.key && v.label);
}

/** Mapa `{ key: label }` de las vias custom. */
export function getCustomViasMap() {
  const map = {};
  for (const { key, label } of getCustomVias()) map[key] = label;
  return map;
}

/**
 * Fusiona las vias custom en `ABFConfig.iterables.mystic.vias` (= CONFIG.config, que ven las
 * hojas). Rehace desde las de base en cada llamada para reflejar tambien borrados. El valor
 * es la etiqueta cruda: `custom-select-choices` la localiza y `localize` la devuelve tal cual.
 */
export function mergeCustomViasIntoConfig() {
  const vias = viasConfig();
  if (!vias) return;
  if (!builtinViaKeys) builtinViaKeys = new Set(Object.keys(vias));
  for (const k of Object.keys(vias)) if (!builtinViaKeys.has(k)) delete vias[k];
  for (const { key, label } of getCustomVias()) vias[key] = label;
}

/**
 * Registra vias custom nuevas (p. ej. detectadas al importar un Excel fandom) en el setting
 * de mundo, SIN duplicar. Requiere DJ (setting de mundo); si no, no hace nada. El onChange
 * del setting las fusiona en la config.
 * @param {Array<{key:string,label:string}>} viasToAdd
 */
export async function ensureCustomVias(viasToAdd) {
  if (!Array.isArray(viasToAdd) || !viasToAdd.length) return;
  if (!game.user?.isGM) return; // setting de mundo -> solo el DJ puede escribirlo
  const byKey = new Map(getCustomVias().map(v => [v.key, v]));
  let changed = false;
  for (const { key, label } of viasToAdd) {
    if (!key || !label || byKey.has(key)) continue;
    byKey.set(key, { key, label });
    changed = true;
  }
  if (changed) {
    await game.settings.set(game.animabf.id, ABFSettingsKeys.CUSTOM_VIAS, [...byKey.values()]);
  }
}

/** Etiqueta legible de una via: i18n si es de base; etiqueta custom si lo es; la clave si no. */
export function resolveViaLabel(key) {
  const k = String(key ?? '');
  if (!k || k === 'unassigned') return 'Sin vía';
  const i18nKey = `${VIA_LABEL_PREFIX}${k}.title`;
  if (game?.i18n?.has?.(i18nKey)) return game.i18n.localize(i18nKey);
  return getCustomViasMap()[k] ?? k;
}

/** Lista `[{ key, label }]` de TODAS las vias (base + custom) ordenada, para desplegables. */
export function getAllViasList() {
  const vias = viasConfig() ?? {};
  return Object.keys(vias)
    .map(key => ({ key, label: resolveViaLabel(key) }))
    .sort((a, b) => a.label.localeCompare(b.label, 'es'));
}
