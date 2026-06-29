// A bocajarro (Anima): el objetivo esta a menos de 1 m del atacante (en la practica,
// adyacente). Tambien cuenta si el atacante esta trabado en melee con un arma de disparo
// (pendiente de 2a fase). Efectos:
//  - Se anula el penalizador de defensa contra proyectiles (Tabla 49) para lanzado Y
//    disparado: el defensor se defiende como de un golpe normal.
//  - El DISPARADO ademas da +30 al ataque (a 1 m apenas se puede fallar).

/**
 * Bono al ataque por disparar a bocajarro. Solo el disparado (shot) recibe +30; el
 * lanzamiento no recibe nada. Puro/testeable.
 * @param {string} projectileType  'shot' | 'throw' | ...
 * @param {boolean} pointBlank
 * @returns {number} 30 si disparo a bocajarro, 0 en caso contrario
 */
export function pointBlankAttackBonus(projectileType, pointBlank) {
  return pointBlank && String(projectileType) === 'shot' ? 30 : 0;
}

/**
 * Si dos tokens estan a bocajarro (adyacentes). Mide con la metrica de la escena
 * (canvas.grid), asi que es independiente de cuantos metros mida la casilla: lo que cuenta
 * es que esten pegados (<= ~1 casilla centro-a-centro, incluyendo diagonal). Defensivo:
 * devuelve false si falta canvas o alguno de los tokens (gridless/sin token -> casilla
 * manual del dialogo).
 * @param {TokenDocument|Token} attackerToken
 * @param {TokenDocument|Token} targetToken
 * @returns {boolean}
 */
export function arePointBlank(attackerToken, targetToken) {
  try {
    if (!canvas?.grid) return false;
    const aDoc = attackerToken?.document ?? attackerToken;
    const tDoc = targetToken?.document ?? targetToken;
    if (!aDoc || !tDoc) return false;

    const center = doc => {
      if (doc.object?.center) return doc.object.center;
      const sx = canvas.grid.sizeX ?? canvas.grid.size ?? 100;
      const sy = canvas.grid.sizeY ?? canvas.grid.size ?? 100;
      return {
        x: (doc.x ?? 0) + ((doc.width ?? 1) * sx) / 2,
        y: (doc.y ?? 0) + ((doc.height ?? 1) * sy) / 2
      };
    };

    const measured = canvas.grid.measurePath([center(aDoc), center(tDoc)]).distance;
    const perCell = canvas.grid.distance || 1;
    // 1.5 casillas cubre adyacencia ortogonal (1) y diagonal (~1.4-1.5) en cualquier
    // regla de diagonal; excluye 2 casillas (2.0). Tokens grandes pueden quedarse cortos
    // (centro-a-centro) -> la casilla manual lo cubre.
    return measured / perCell <= 1.5;
  } catch (err) {
    console.warn('animabf | arePointBlank error', err);
    return false;
  }
}
