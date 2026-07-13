import { playEffect } from './AnimationService.js';
import { magicElementFor, magicEffectFor, magicTintFor } from './magicAnimationMap.js';
import { weaponMeleeEffect } from './weaponAnimationMap.js';
import { resolveTokenFromRef } from './resolveTokens.js';

/**
 * Reproduce el efecto de un resultado de combate 1v1 que impacto causando dano.
 *
 * - Conjuros/poderes (flags.attackData.isSpell || psychicDiscipline): efecto ELEMENTAL
 *   segun la via / tipo de dano / disciplina (fuego, hielo, rayo, arcano...). Proyectil del
 *   lanzador al defensor si es a distancia, y luego impacto puntual o EXPLOSION de area
 *   (si areaRadius > 0) sobre el defensor.
 * - Ataques fisicos: proyectil (si a distancia) + impacto por tabla de dano (armorType).
 *
 * Degradado silencioso (playEffect es no-op si faltan Sequencer/JB2A o el efecto no existe).
 * @param {object} flags  message.flags.animabf (kind === 'combatResult').
 */
export async function playCombatResultAnimation(flags) {
  // Con varios GMs, solo el primario dispara (Sequencer hace broadcast al resto).
  if (game.users?.activeGM && game.users.activeGM.id !== game.user?.id) return;

  const defenderRef = flags?.defender?.tokenId || flags?.defender?.actorId || '';
  const defenderToken = resolveTokenFromRef(defenderRef);
  if (!defenderToken) return; // sin destino no hay nada que mostrar

  const ad = flags?.attackData ?? {};
  const armorType = flags?.result?.armorType ?? ad.armorType ?? '';
  const attackerRef =
    flags?.attacker?.tokenId || flags?.result?.attackerId || flags?.attacker?.actorId || '';
  const attackerToken = resolveTokenFromRef(attackerRef);

  // --- Magia / Psiquica: efecto elemental (via/dano/disciplina), explosion si es de area ---
  if (ad.isSpell || ad.psychicDiscipline) {
    const element = magicElementFor({
      via: ad.spellVia,
      damageType: armorType,
      psychicDiscipline: ad.psychicDiscipline
    });
    const isArea = Number(ad.areaRadius) > 0;
    // Tinte por concepto para las vias abstractas (solo cuando el elemento es 'arcane').
    const tint = magicTintFor(ad.spellVia, element);

    if (ad.isProjectile && attackerToken) {
      await playEffect({
        file: magicEffectFor(element, 'proj'),
        source: attackerToken,
        target: defenderToken,
        opts: { waitUntilFinished: true, tint } // el impacto va DESPUES de que llegue
      });
    }
    await playEffect({
      file: magicEffectFor(element, isArea ? 'explosion' : 'impact'),
      source: defenderToken,
      opts: { scaleToObject: isArea ? 2 : 1.5, fadeOut: 400, tint }
    });
    return;
  }

  // --- Fisico: TODA la animacion de ataque de arma se reproduce AL ATACAR
  //     (playWeaponAttackAnimation, en el flujo de ataque). Aqui no se hace nada, para
  //     unificar todo el efecto en el momento del ataque (no duplicar en la defensa).
}

/**
 * Reproduce el ATAQUE de arma AL ATACAR (no al defender): SIEMPRE el swing MELEE del arma (id
 * del tipo jugado sobre cada objetivo, rotado hacia el atacante). Se ignora a proposito el flag
 * isProjectile (poco fiable): todo ataque de arma se anima como cuerpo a cuerpo. El tipo se
 * resuelve del ARMA directamente (nombre + critico) para acertarlo siempre. Sin objetivo, swing
 * sobre el atacante. Fire-and-forget (decorativo, no bloquea el flujo de ataque).
 */
export function playWeaponAttackAnimation(attackerToken, targetTokens, weapon) {
  if (!attackerToken || !weapon) return;
  const file = weaponMeleeEffect(weapon.name, weapon.system?.critic?.primary?.value);
  const targets = (Array.isArray(targetTokens) ? targetTokens : []).filter(Boolean);
  // Sin objetivo: el arma sobre el atacante (pegada al actor), grande.
  if (!targets.length) {
    playEffect({ file, source: attackerToken, opts: { attachTo: true, scaleToObject: 3, fadeOut: 400 } });
    return;
  }
  // Con objetivo: el arma se ESTIRA del atacante al enemigo (stretchTo). Se ancla en el atacante
  // (pegada al actor) y su punta/filo llega JUSTO hasta el objetivo, ajustandose al alcance real
  // sin desbordar a las casillas contiguas (el problema de escalar a lo bruto con scaleToObject).
  for (const target of targets) {
    playEffect({ file, source: attackerToken, target, opts: { fadeOut: 400 } });
  }
}

/**
 * Circulo de lanzamiento (o escudo, si combatType === 'defense') del elemento sobre el
 * lanzador. Se llama al lanzar un conjuro/poder para el "build-up" visual. Degradado
 * silencioso. No await: es decorativo, no debe bloquear el flujo de lanzamiento.
 */
export function playSpellCastAnimation(
  casterToken,
  { via, damageType, psychicDiscipline, combatType } = {}
) {
  if (!casterToken) return;
  const element = magicElementFor({ via, damageType, psychicDiscipline });
  const isDefense = combatType === 'defense';
  const tint = magicTintFor(via, element);
  playEffect({
    file: magicEffectFor(element, isDefense ? 'shield' : 'cast'),
    source: casterToken,
    opts: isDefense
      ? { scaleToObject: 1.8, fadeIn: 200, fadeOut: 500, tint }
      : { belowTokens: true, scaleToObject: 1.6, fadeIn: 200, fadeOut: 500, tint }
  });
}
