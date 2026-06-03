import { ManeuverDefinition } from '../ManeuverDefinition.js';

/**
 * Daño retrasado (maniobra MAESTRA).
 * Core Exxet: al alcanzar la Maestría, el luchador puede retrasar el daño de un
 * golpe FIL/PEN/CON entre 1 y 5 asaltos; al manifestarse, el daño se aplica y
 * SIEMPRE causa desangramiento. Penalizador -10 al ataque; se declaran los
 * asaltos antes de tirar.
 *
 * Es un ataque NORMAL (el daño se calcula como siempre, sin suprimir ni alterar
 * TA): lo único especial es que su aplicación se DIFIERE. El diferido y el
 * desangrado los gestionan el botón "Programar daño retrasado" de la tarjeta de
 * resultado y el procesado por rondas en ABFCombat.nextRound.
 */
export const danoRetrasado = new ManeuverDefinition({
  slug: 'dano-retrasado',
  nameKey: 'anima.maneuvers.dano-retrasado.name',
  descriptionKey: 'anima.maneuvers.dano-retrasado.description',
  icon: 'icons/svg/clockwork.svg',

  // -10 al ataque; el jugador declara 1-5 asaltos en la tarjeta.
  attackPenalty: -10,
  hasDelayRoundsOption: true,

  // Requiere Maestría en Ataque (gateado en executeCombatManeuver vía rollOptions).
  predicate: ['self:mastery:attack'],

  // Sin control enfrentado: es un ataque normal. Al no tener efectos (resolveEffects
  // devuelve []), applyManeuverEffectsDirectly no publica tarjeta alguna, evitando
  // la tarjeta espuria de "Control enfrentado" del auto-post.
  noOpposedCheck: true,

  // Sin efectos automáticos: ataque normal cuyo daño se difiere. El daño se
  // calcula con las reglas estándar de combate; su aplicación se programa al
  // crearse la tarjeta (hook createChatMessage) y la procesa ABFCombat.nextRound.
  resolveEffects() {
    return [];
  }
});
