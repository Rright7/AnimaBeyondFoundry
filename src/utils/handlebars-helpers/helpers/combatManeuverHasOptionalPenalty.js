// ¿La maniobra declara una penalización OPCIONAL activable con checkbox en la
// tarjeta? (Lluvia de proyectiles: -50 al elegir blancos dentro del área.)
export const combatManeuverHasOptionalPenalty = {
  name: 'combatManeuverHasOptionalPenalty',
  fn: slug => {
    const def = game.animabf?.maneuvers?.get?.(slug);
    return !!def?.hasOptionalPenaltyOption;
  }
};
