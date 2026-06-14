import { playEffect } from './AnimationService.js';
import { effectFor, impactKeyForArmorType, projectileKeyFor } from './animationMap.js';
import { resolveTokenFromRef } from './resolveTokens.js';

/**
 * Reproduce el efecto de un resultado de combate 1v1 que impacto causando dano.
 * Impacto sobre el defensor segun la tabla de dano; si el ataque es a distancia,
 * un proyectil viaja del atacante al defensor antes del impacto. Degradado
 * silencioso (playEffect es no-op si faltan Sequencer/JB2A o el efecto no existe).
 *
 * @param {object} flags  message.flags.animabf (kind === 'combatResult').
 */
export async function playCombatResultAnimation(flags) {
  // Con varios GMs, solo el primario dispara (Sequencer hace broadcast al resto).
  if (game.users?.activeGM && game.users.activeGM.id !== game.user?.id) return;

  const defenderRef = flags?.defender?.tokenId || flags?.defender?.actorId || '';
  const defenderToken = resolveTokenFromRef(defenderRef);
  if (!defenderToken) return; // sin destino no hay nada que mostrar

  const armorType = flags?.result?.armorType ?? flags?.attackData?.armorType ?? '';
  const impactFile = effectFor(impactKeyForArmorType(armorType));

  // Proyectil solo en ataques a distancia y si tenemos token del atacante.
  if (flags?.attackData?.isProjectile) {
    const attackerRef =
      flags?.attacker?.tokenId || flags?.result?.attackerId || flags?.attacker?.actorId || '';
    const attackerToken = resolveTokenFromRef(attackerRef);
    if (attackerToken) {
      const projFile = effectFor(
        projectileKeyFor(armorType, flags?.attackData?.projectileType)
      );
      await playEffect({
        file: projFile,
        source: attackerToken,
        target: defenderToken,
        opts: { waitUntilFinished: true } // el impacto va DESPUES de que llegue
      });
    }
  }

  await playEffect({
    file: impactFile,
    source: defenderToken,
    opts: { scaleToObject: 1.5, fadeOut: 300 }
  });
}
