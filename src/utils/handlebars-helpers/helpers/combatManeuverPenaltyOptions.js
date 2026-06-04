// Devuelve las opciones de penalizador a elegir de una maniobra (Inmovilizar a
// distancia: -80 sin daño / -50 con daño) para pintar el <select> de la tarjeta.
// Vacío si la maniobra no declara penaltyOptions.
export const combatManeuverPenaltyOptions = {
  name: 'combatManeuverPenaltyOptions',
  fn: slug => {
    const def = game.animabf?.maneuvers?.get?.(slug);
    return Array.isArray(def?.penaltyOptions) ? def.penaltyOptions : [];
  }
};
