// Penalizador por defenderse de un proyectil (Tabla 49: Defensa contra proyectiles).
// Puro/testeable (sin Foundry). Devuelve un valor POSITIVO (se resta de la defensa).
//
//                       Disparo (shot)        Lanzamiento (throw)
//   Parada                  -80                    -50
//   Parada + maestria       -20                    NA (0)
//   Parada + escudo         -30                    NA (0)
//   Parada + maestria+esc.   0                     NA (0)
//   Esquiva                 -30                    NA (0)
//   Esquiva + maestria       0                     NA (0)
// 'throw' = lanzamiento; cualquier otro tipo cuenta como disparo (caso mas duro).

/**
 * @param {string} defenseType  'block' (parada) | 'dodge' (esquiva) | otros (0)
 * @param {{isShieldWeapon?:boolean, hasMastery?:boolean}} caps  capacidades del defensor
 * @param {string} projectileType  'shot' | 'throw' | ...
 * @returns {number} penalizador positivo (0 si no aplica)
 */
export function projectileDefensePenalty(defenseType, caps = {}, projectileType = '') {
  const shield = !!caps.isShieldWeapon;
  const mastery = !!caps.hasMastery;
  const isThrow = String(projectileType) === 'throw';

  if (defenseType === 'block') {
    if (isThrow) return shield || mastery ? 0 : 50;
    if (shield && mastery) return 0;
    if (shield) return 30;
    if (mastery) return 20;
    return 80;
  }

  if (defenseType === 'dodge') {
    if (isThrow) return 0; // NA
    return mastery ? 0 : 30;
  }

  return 0; // escudo sobrenatural u otros
}
