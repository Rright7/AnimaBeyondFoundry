import { Templates } from '../module/utils/constants';
import { ABFDefenseData } from '../module/combat/ABFDefenseData';
import { computeCombatResult } from '../module/combat/computeCombatResult';
import { updateAttackTargetsFlag } from './updateAttackTargetsFlag.js';
import { getChatVisibilityOptions } from '../module/utils/chatVisibility.js';

export async function sendAccumulationZeroDefense({
  defenderToken,
  attackerToken,
  attackData,
  messageId,
  storedTokenKey = '',
  // Si viene, se usa tal cual (masas: Defensa Final FIJA). Si no, defensa 0 (seres de
  // acumulacion/resistencia). En ambos casos: sin dialogo, sin tirada, la TA aplica.
  defenseData = null
}) {
  const actor = defenderToken?.actor;
  if (!actor) return;

  const actorUuid = actor.uuid ?? '';
  const tokenUuid =
    storedTokenKey ||
    defenderToken.document?.uuid ||
    defenderToken.uuid ||
    defenderToken.id ||
    '';

  if (messageId) {
    await updateAttackTargetsFlag(messageId, {
      actorUuid,
      tokenUuid,
      state: 'rolling',
      rolledBy: game.user.id,
      updatedAt: Date.now()
    });
  }

  const vis = getChatVisibilityOptions();

  const armorType = attackData?.armorType;
  const taFinal =
    armorType != null ? actor.system?.combat?.totalArmor?.at?.[armorType]?.value ?? 0 : 0;

  const finalDefenseData =
    defenseData ??
    ABFDefenseData.builder()
      .defenseAbility(0)
      .armor(taFinal)
      .inmodifiableArmor(false)
      .defenseType('resistance')
      .defenderId(actor.id)
      .defenderTokenId(defenderToken?.id ?? '')
      .weaponId('')
      .shieldId('')
      .build();

  const combatResult = computeCombatResult(attackData, finalDefenseData);

  const damageFinal = Number(
    combatResult?.damageFinal ??
      combatResult?.damage?.final ??
      combatResult?.finalDamage ??
      combatResult?.damage ??
      0
  );

  const tokenName = defenderToken?.name ?? defenderToken?.document?.name ?? actor.name;
  const speaker = {
    ...ChatMessage.getSpeaker({ token: defenderToken }),
    alias: tokenName
  };

  const content = await (foundry.applications?.handlebars?.renderTemplate ?? renderTemplate)(Templates.Chat.CombatResult, {
    combatResult: { ...combatResult, damageFinal },
    defenderId: actor.id,
    defenderTokenId: defenderToken?.id ?? ''
  });

  await ChatMessage.create({
    content,
    speaker,
    ...vis,
    flags: {
      animabf: {
        kind: 'combatResult',
        result: { ...combatResult, damageFinal },
        // Persist the aimed flag so the critical resolver can skip the
        // location roll when the attack was aimed.
        attackData: {
          attackerId: attackData?.attackerId ?? '',
          aimed: !!attackData?.aimed,
          aimedWhere: attackData?.aimedWhere ?? '',
          maneuverSlug: attackData?.maneuverSlug ?? '',
          maneuverWasUnarmed: !!attackData?.maneuverWasUnarmed,
          attackerWeaponStrength: Number(attackData?.attackerWeaponStrength) || 0,
          delayRounds: Number(attackData?.delayRounds ?? 0) || 0,
          // Para la animación de combate: distancia (proyectil) y subtipo.
          isProjectile: !!attackData?.isProjectile,
          projectileType: attackData?.projectileType ?? '',
          // Contexto magico/psiquico para el impacto elemental.
          isSpell: !!attackData?.isSpell,
          spellVia: attackData?.spellVia ?? '',
          areaRadius: Number(attackData?.areaRadius) || 0,
          psychicDiscipline: attackData?.psychicDiscipline ?? '',
          weaponName: attackData?.weaponName ?? ''
        },
        defenseType: '',
        attacker: {
          actorId: attackData?.attackerId ?? '',
          // Token del atacante (uuid preferido): el control enfrentado resuelve el token
          // (sin vincular incluido) en vez del actor base, que pierde overrides del token.
          tokenId:
            attackerToken?.document?.uuid ?? attackerToken?.uuid ?? attackerToken?.id ?? ''
        },
        defender: { actorId: actor.id, tokenId: defenderToken?.id ?? '' },
        damageControl: { appliedOnce: false, apps: [] }
      }
    }
  });

  if (messageId) {
    await updateAttackTargetsFlag(messageId, {
      actorUuid,
      tokenUuid,
      state: 'done',
      rolledBy: game.user.id,
      defenseResult: finalDefenseData.toJSON?.() ?? finalDefenseData,
      updatedAt: Date.now()
    });
  }
}
