import { ManeuverDefinition } from '../ManeuverDefinition.js';
import { DAMAGE_MULTIPLIER, SELECT_TARGETS_PENALTY } from '../../lluviaProyectiles.js';

/**
 * Lluvia de proyectiles (maniobra MAESTRA).
 * Core Exxet: con Maestría en Ataque, un ataque en ÁREA a distancia. Radio = 1 m
 * por cada 20 de Habilidad de Ataque si la Cadencia de Fuego es ≤50, o por cada
 * 40 si es >50. DOBLA el Daño Base del arma. Sin penalizador, salvo -50 si se
 * eligen blancos dentro del área. Es acción de ataque completa y requiere poder
 * lanzar ≥5 proyectiles/asalto (informativo: cadence es texto libre).
 *
 * El multi-objetivo (getSnapshotTargets → multiDefensa), la plantilla de área y
 * el doblado de daño los gestionan executeCombatManeuver (rama isAreaAttack) +
 * areaTemplate.js + AttackConfigurationDialog.
 */
export const lluviaDeProyectiles = new ManeuverDefinition({
  slug: 'lluvia-de-proyectiles',
  nameKey: 'anima.maneuvers.lluvia-de-proyectiles.name',
  descriptionKey: 'anima.maneuvers.lluvia-de-proyectiles.description',
  icon: 'icons/svg/target.svg',

  // Sin penalizador base; requiere Maestría en Ataque (gateado en executeCombatManeuver).
  attackPenalty: 0,
  predicate: ['self:mastery:attack'],

  // Ataque en área: plantilla + auto-target; dobla el Daño Base; toggle CF.
  isAreaAttack: true,
  damageMultiplier: DAMAGE_MULTIPLIER,
  hasCadenceOption: true,

  // -50 opcional al elegir blancos dentro del área.
  optionalPenalty: SELECT_TARGETS_PENALTY,
  hasOptionalPenaltyOption: true,
  optionalPenaltyLabelKey: 'anima.ui.combat.combatManeuvers.chooseTargets',

  // Ataque normal a distancia: sin control enfrentado y sin efectos => el
  // auto-post no publica tarjeta espuria (mismo patrón que Daño retrasado).
  noOpposedCheck: true,
  resolveEffects() {
    return [];
  }
});
