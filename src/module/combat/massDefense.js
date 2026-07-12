import { ABFDefenseData } from './ABFDefenseData.js';
import {
  pickBestDefenseCandidate,
  projectilePenaltyFor,
  isProjectileAttack
} from './DefenseStrategies.js';
import { openSimpleInputDialog } from '../utils/dialogs/openSimpleInputDialog.js';

/**
 * Pregunta a cuantos enemigos de la masa alcanza el ataque (para el multiplicador de AREA,
 * Tabla 2). Devuelve un entero >=1, o null si se cancela el dialogo. Por defecto 1 =
 * impacto normal (x1): para un golpe corriente basta con aceptar.
 * @returns {Promise<number|null>}
 */
export async function promptMassAreaHits() {
  const raw = await openSimpleInputDialog({
    title: 'Enemigos alcanzados',
    content: 'Enemigos alcanzados (1 = impacto normal):',
    placeholder: '1'
  });
  if (raw === undefined || raw === null) return null;
  return Math.max(1, Math.floor(Number(raw) || 1));
}

/**
 * Defensa FIJA de una "Masa de enemigos" (defenseType='mass'). RAW: la masa defiende con
 * su Defensa Final media (la mejor de parada/esquiva/escudo, "con lo que se elija") SIN
 * tirada y SIN penalizador por defensas multiples. La TA sigue restando; Tabla 49
 * (proyectil) se aplica si procede (salvo a bocajarro). Devuelve el ABFDefenseData listo
 * + metadatos para el resultado de combate y el chat.
 * @returns {{ defenseData: ABFDefenseData, type: string, defenseAbility: number, weaponId: string, shieldId: string, projectilePenalty: number }}
 */
export function buildMassDefenseData(actor, attackData, defenderToken = null) {
  const candidate = pickBestDefenseCandidate(actor, { attackData });
  const finalBase = Math.max(0, Number(candidate?.finalBase) || 0);

  const projectilePenalty =
    isProjectileAttack(attackData) && !attackData?.pointBlank
      ? projectilePenaltyFor(
          candidate,
          attackData?.projectileType ?? attackData?.projectile?.type
        )
      : 0;

  const defenseAbility = Math.max(0, finalBase - projectilePenalty);

  const armorType = attackData?.armorType;
  const taFinal =
    armorType != null ? actor.system?.combat?.totalArmor?.at?.[armorType]?.value ?? 0 : 0;

  // 'supernaturalShield' -> 'shield' (vocabulario del resolver central de combate).
  const type =
    candidate?.type === 'supernaturalShield' ? 'shield' : candidate?.type ?? 'dodge';

  const defenseData = ABFDefenseData.builder()
    .defenseAbility(defenseAbility)
    .armor(taFinal)
    .inmodifiableArmor(false)
    .defenseType(type)
    .defenderId(actor.id)
    .defenderTokenId(defenderToken?.id ?? '')
    .weaponId(candidate?.weaponId ?? '')
    .shieldId(candidate?.shieldId ?? '')
    .stackDefense(false)
    .applyMultipleDefensePenalty(false)
    .projectilePenalty(projectilePenalty)
    .build();

  return {
    defenseData,
    type,
    defenseAbility,
    weaponId: candidate?.weaponId ?? '',
    shieldId: candidate?.shieldId ?? '',
    projectilePenalty
  };
}
