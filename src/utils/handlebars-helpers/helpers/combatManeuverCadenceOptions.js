// Opciones del toggle de Cadencia de Fuego para maniobras de área (Lluvia de
// proyectiles): 'le50' (CF ≤ 50 → radio = Hab/20) y 'gt50' (CF > 50 → Hab/40).
// Vacío para maniobras que no lo declaran.
export const combatManeuverCadenceOptions = {
  name: 'combatManeuverCadenceOptions',
  fn: slug => {
    const def = game.animabf?.maneuvers?.get?.(slug);
    return def?.hasCadenceOption ? ['le50', 'gt50'] : [];
  }
};
