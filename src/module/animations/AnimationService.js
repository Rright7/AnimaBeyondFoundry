/**
 * Capa de animaciones de AnimaBeyondFoundry — fachada unica sobre Sequencer + JB2A.
 *
 * TODA la dependencia de modulos de terceros (Sequencer, JB2A) vive aqui. El resto del
 * sistema solo invoca acciones semanticas (ver animationMap.js) y nunca conoce rutas de
 * JB2A. Dependencias OPCIONALES: si faltan Sequencer/JB2A o el efecto no existe, todo es
 * un no-op silencioso (el juego funciona igual). Broadcast por defecto: Sequencer replica
 * el efecto en todos los clientes via socketlib.
 *
 * Decisiones (workflow w1hx19609): Sequencer directo (no Automated Animations);
 * dependencias gestionadas SOLO en runtime (no se tocan en system.json); free como
 * baseline, patreon enriquece (mismo namespace "jb2a").
 */

const SEQUENCER_ID = 'sequencer';
const JB2A_MODULE_IDS = ['JB2A_DnD5e', 'jb2a_patreon'];

/** ¿Estan presentes y activos Sequencer + alguna libreria JB2A, y cargada su API? */
export function animationsAvailable() {
  const seqOn = !!game.modules.get(SEQUENCER_ID)?.active;
  const jb2aOn = JB2A_MODULE_IDS.some(id => game.modules.get(id)?.active);
  return seqOn && jb2aOn && typeof globalThis.Sequence === 'function';
}

/** Setting global de animaciones (default true). */
export function animationsEnabled() {
  try {
    return game.settings.get('animabf', 'enableAnimations') !== false;
  } catch (e) {
    return true;
  }
}

/** ¿Existe ese efecto en la Sequencer DB? (red de seguridad ante IDs que cambian de version). */
export function effectExists(file) {
  try {
    return !!globalThis.Sequencer?.Database?.entryExists?.(file);
  } catch (e) {
    return false;
  }
}

/** Primer ID que existe de entre uno o varios candidatos; null si ninguno. */
function resolveFile(file) {
  const list = Array.isArray(file) ? file : [file];
  return list.find(f => f && effectExists(f)) ?? null;
}

/**
 * Reproduce un efecto JB2A via Sequencer. No-op silencioso si: animaciones desactivadas,
 * faltan modulos, o ningun candidato existe. Devuelve la Promesa de play() o null.
 *
 * @param {object} p
 * @param {string|string[]} p.file  ID(s) de Sequencer DB (si es array, usa el primero que exista)
 * @param {Token|TokenDocument|{x,y}} [p.source]  origen del efecto
 * @param {Token|TokenDocument|{x,y}} [p.target]  destino -> el efecto se estira/rota hacia el (ataques)
 * @param {object} [p.opts]  attachTo, persist, name, belowTokens, fadeIn, fadeOut, opacity, tint, scaleToObject, missed, waitUntilFinished
 */
export async function playEffect({ file, source, target, opts = {} } = {}) {
  if (!animationsEnabled() || !animationsAvailable()) return null;
  const f = resolveFile(file);
  if (!f) return null;
  try {
    const seq = new Sequence({ inModuleName: 'animabf', softFail: true });
    const fx = seq.effect().file(f);
    if (source) {
      if (opts.attachTo) fx.attachTo(source);
      else fx.atLocation(source);
    }
    if (target) fx.stretchTo(target, opts.stretchOpts ?? {});
    if (opts.rotateTowards) fx.rotateTowards(opts.rotateTowards); // swing melee orientado al objetivo
    if (opts.missed) fx.missed();
    if (opts.persist) fx.persist();
    if (opts.name) fx.name(opts.name);
    if (opts.belowTokens) fx.belowTokens();
    if (opts.scaleToObject != null) fx.scaleToObject(opts.scaleToObject);
    if (opts.opacity != null) fx.opacity(opts.opacity);
    if (opts.tint) fx.tint(opts.tint);
    if (opts.fadeIn != null) fx.fadeIn(opts.fadeIn);
    if (opts.fadeOut != null) fx.fadeOut(opts.fadeOut);
    if (opts.waitUntilFinished) fx.waitUntilFinished();
    return await seq.play();
  } catch (err) {
    console.warn('[ABF animations] playEffect error:', err, file);
    return null;
  }
}

/** Termina un efecto persistente por nombre (en todos los clientes). */
export function endEffect(name) {
  if (!name || !animationsAvailable()) return;
  try {
    globalThis.Sequencer?.EffectManager?.endEffects?.({ name });
  } catch (e) {
    /* no-op */
  }
}
