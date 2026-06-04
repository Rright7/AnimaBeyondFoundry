import { ManeuverDefinition } from '../ManeuverDefinition.js';

/**
 * Inmovilizar a distancia (maniobra MAESTRA).
 * Core Exxet: con proyectiles, paraliza a un adversario clavando su ropa a una
 * pared (sin daño) o atravesando sus extremidades. Usa el control enfrentado de
 * PRESA, pero con un valor de Característica FIJO de 8 para el atacante (en vez
 * de FUE/DES), ajustable ±3 a discreción del DJ vía el "Modificador extra" del
 * diálogo del control. Penalizador a elegir: -80 (sin daño) o -50 (daño
 * indiferente). Acción de ataque completa. El objetivo debe estar junto a una
 * pared (arbitraje del DJ, informativo).
 *
 * El motor del control enfrentado (OpposedCheckRollDialog / resolveManeuver-
 * OpposedCheck) y los efectos "Parálisis *" del compendio se reutilizan. Al no
 * ser slug 'presa', no se ponen flags relacionales de agarre (es a distancia).
 */
export const inmovilizarDistancia = new ManeuverDefinition({
  slug: 'inmovilizar-distancia',
  nameKey: 'anima.maneuvers.inmovilizar-distancia.name',
  descriptionKey: 'anima.maneuvers.inmovilizar-distancia.description',
  icon: 'icons/svg/net.svg',

  // Requiere Maestría en Ataque (gateado en executeCombatManeuver vía rollOptions).
  predicate: ['self:mastery:attack'],

  // El penalizador real lo aporta la opción elegida en la tarjeta; base 0.
  attackPenalty: 0,
  penaltyOptions: [
    {
      value: -80,
      causesDamage: false,
      labelKey: 'anima.ui.combat.combatManeuvers.immobilizeNoDamage'
    },
    {
      value: -50,
      causesDamage: true,
      labelKey: 'anima.ui.combat.combatManeuvers.immobilizeDamage'
    }
  ],

  // Control enfrentado estilo Presa, pero con característica FIJA 8 para el
  // atacante; el defensor resiste con FUE/AGI. Sin modificador por daño.
  fixedAttackerValue: 8,
  attackerStats: [],
  defenderStats: ['strength', 'agility'],
  attackerPenaltyUnder100: 0,
  attackerBonusOver200: 0,
  damageThresholdPercent: 10,

  // Daño según la variante (causesDamage de la opción elegida): -80 no aplica
  // daño (finalDamage 0), -50 sí (daño normal, sin halving). Sin forzar TA 0.
  damageAllowed: true,
  damageHalvedIfApplied: false,

  // Proyectiles: el jugador elige el arma a distancia.
  weaponRestrictions: [],

  // Solo al defensor (a distancia, el atacante no queda "Apresando"). Escala por
  // diferencia como Presa.
  resolveEffects(result) {
    if (!result.opposedSuccess) return [];
    const diff = result.opposedDifference;
    let effect;
    if (diff > 10) effect = 'Parálisis completa';
    else if (diff >= 3) effect = 'Parálisis parcial';
    else effect = 'Parálisis menor';
    return [{ target: 'defender', effectSlug: effect, reason: `inmovilizar-diff-${diff}` }];
  }
});
