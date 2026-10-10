import {
  playEffect,
  endEffect,
  animationsAvailable,
  animationsEnabled
} from './AnimationService.js';
import { effectFor } from './animationMap.js';

const KI_CHARGE_FLAG = 'flags.animabf.chargingKi';
const kiGroundName = tokenId => `abf-ki-charge-ground-${tokenId}`;
const kiStrandsName = tokenId => `abf-ki-charge-strands-${tokenId}`;

/**
 * Setting global on/off de animaciones (default true). Se registra en el hook init.
 */
export function registerAnimationSettings() {
  game.settings.register('animabf', 'enableAnimations', {
    name: 'anima.ui.settings.enableAnimations.name',
    hint: 'anima.ui.settings.enableAnimations.hint',
    scope: 'world',
    config: true,
    type: Boolean,
    default: true
  });
  game.settings.register('animabf', 'animationSpeed', {
    name: 'anima.ui.settings.animationSpeed.name',
    hint: 'anima.ui.settings.animationSpeed.hint',
    scope: 'world',
    config: true,
    type: Number,
    range: { min: 0.25, max: 1, step: 0.05 },
    default: 0.7
  });
}

/**
 * Reproduce/termina el aura de "Cargar Ki" sobre los tokens de un actor.
 * Persistente y attachada al token (sigue al token); broadcast por Sequencer.
 */
function syncKiChargeAura(actor) {
  const charging = !!actor?.flags?.animabf?.chargingKi;
  const tokens = actor?.getActiveTokens?.() ?? [];
  for (const token of tokens) {
    const groundName = kiGroundName(token.id);
    const strandsName = kiStrandsName(token.id);
    endEffect(groundName); // evita duplicados / limpia el anterior
    endEffect(strandsName);
    if (!charging) continue;

    // Capa 1: circulo de energia ascendente bajo el token.
    playEffect({
      file: effectFor('kiChargeGround'),
      source: token,
      opts: {
        attachTo: true,
        persist: true,
        name: groundName,
        belowTokens: true,
        scaleToObject: 1.5,
        opacity: 0.9,
        fadeIn: 300,
        fadeOut: 400
      }
    });
    // Capa 2: energia que converge hacia el cuerpo.
    playEffect({
      file: effectFor('kiChargeStrands'),
      source: token,
      opts: {
        attachTo: true,
        persist: true,
        name: strandsName,
        scaleToObject: 1.8,
        opacity: 0.85,
        fadeIn: 300,
        fadeOut: 400
      }
    });
  }
}

/**
 * Engancha las animaciones a los eventos del sistema. Fase 0/1: aura de "Cargar Ki" al
 * togglear flags.animabf.chargingKi (boton "Cargar Ki" de la ficha). Solo el cliente que
 * provoca el cambio dispara (Sequencer hace broadcast al resto) para no duplicar.
 */
export function registerAnimationHooks() {
  Hooks.on('updateActor', (actor, changes, _opts, userId) => {
    if (game.user?.id !== userId) return;
    if (!foundry.utils.hasProperty(changes, KI_CHARGE_FLAG)) return;
    syncKiChargeAura(actor);
  });

  Hooks.on('updateActor', (actor, changes, _opts, userId) => {
    if (game.user?.id !== userId) return;
    const path = 'flags.animabf.accumulatingZeon';
    if (!(path in changes) && !foundry.utils.hasProperty(changes, path)) return;
    for (const token of actor?.getActiveTokens?.() ?? []) {
      const name = `abf-zeon-charge-${token.id}`;
      endEffect(name);
      if (!actor.flags?.animabf?.accumulatingZeon) continue;
      playEffect({
        file: effectFor('zeonCharge'),
        source: token,
        opts: {
          attachTo: true,
          persist: true,
          name,
          belowTokens: true,
          scaleToObject: 1.5,
          fadeIn: 300,
          fadeOut: 400
        }
      });
    }
  });

  // Item updates cover sheet buttons and macros, after Ki was successfully paid.
  Hooks.on('updateItem', (item, changes, _opts, userId) => {
    if (game.user?.id !== userId || item.type !== 'technique' || !item.actor) return;
    const activated = ['active', 'freshTurn'].some(
      key =>
        (changes[`flags.animabf.${key}`] ??
          foundry.utils.getProperty(changes, `flags.animabf.${key}`)) === true
    );
    if (!activated) return;
    for (const token of item.actor.getActiveTokens?.() ?? []) {
      playEffect({
        file: effectFor('techniqueActivate'),
        source: token,
        opts: { scaleToObject: 1.8, fadeOut: 400 }
      });
    }
  });

  // API publica para macros/pruebas y futuros disparadores desde el sistema.
  game.animabf = game.animabf || {};
  game.animabf.animations = {
    play: playEffect,
    end: endEffect,
    available: animationsAvailable,
    enabled: animationsEnabled,
    effectFor
  };
}
