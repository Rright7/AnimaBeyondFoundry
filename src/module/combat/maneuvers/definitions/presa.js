import { ManeuverDefinition } from '../ManeuverDefinition.js';

/**
 * Presa (Grapple)
 * Core Exxet p.92.
 *
 * Penalizador -40, vs TA 0. Solo con ataque desarmado o arma que permita Presa.
 * Si daño ≥ 10% → control enfrentado FUE/DES vs FUE/AGI.
 * Daño opcional (base/2 con TA). Si gana:
 *   - diferencia < 3 → defensor en Parálisis menor
 *   - diferencia >= 3 → defensor en Parálisis parcial
 *   - diferencia > 10 → defensor en Parálisis completa
 * En cualquier caso, el atacante también queda en Parálisis menor mientras
 * mantenga la presa (mecánica narrativa, no se aplica el AE automáticamente
 * porque el jugador puede soltar voluntariamente).
 */
export const presa = new ManeuverDefinition({
  slug: 'presa',
  nameKey: 'anima.maneuvers.presa.name',
  descriptionKey: 'anima.maneuvers.presa.description',
  icon: 'icons/svg/paralysis.svg',

  attackPenalty: -40,

  forceTAZero: true,
  damageAllowed: true,
  damageHalvedIfApplied: true,

  damageThresholdPercent: 10,

  attackerStats: ['strength', 'dexterity'],
  defenderStats: ['strength', 'agility'],

  attackerPenaltyUnder100: -3,
  attackerBonusOver200: 3,

  grantsQuadrupedBonus: false,

  weaponRestrictions: ['unarmed', 'allowsPresa'],

  resolveEffects(result) {
    if (!result.opposedSuccess) return [];

    const diff = result.opposedDifference;
    let defenderEffect;
    if (diff > 10) defenderEffect = 'Parálisis completa';
    else if (diff >= 3) defenderEffect = 'Parálisis parcial';
    else defenderEffect = 'Parálisis menor';

    return [
      { target: 'defender', effectSlug: defenderEffect, reason: `presa-diff-${diff}` },
      // Attacker is also restricted while holding the grapple. We apply a
      // dedicated 'Apresando' effect so the GM (or the player) can release
      // by removing it.
      { target: 'attacker', effectSlug: 'Apresando', reason: 'holding-presa' }
    ];
  }
});
