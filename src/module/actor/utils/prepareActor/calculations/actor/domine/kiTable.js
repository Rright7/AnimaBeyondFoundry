// Tabla canónica característica -> Ki / Acumulación (Ficha Anima v8.7.0 · PDs / Tabla_Acum).
// Puntos de Ki: fórmula  ki = car + máx(0, car - 10).
// Acumulación:  tramos    1-9 -> 1 | 10-12 -> 2 | 13-15 -> 3 | 16+ -> 4 (la ficha satura en 4).

export function kiPointsFromCharacteristic(characteristic) {
  const c = Number(characteristic) || 0;
  return c <= 0 ? 0 : c + Math.max(0, c - 10);
}

export function kiAccumulationFromCharacteristic(characteristic) {
  const c = Number(characteristic) || 0;
  if (c <= 0) return 0;
  if (c <= 9) return 1;
  if (c <= 12) return 2;
  if (c <= 15) return 3;
  return 4;
}
