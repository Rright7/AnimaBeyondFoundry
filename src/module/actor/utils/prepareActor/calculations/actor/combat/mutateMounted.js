/**
 * Aplica los modificadores de combate por estar Montado, según el valor
 * actual de la habilidad de Montar.
 *
 * RAW:
 *   - Si Montar < 0 (o no tiene la habilidad) → -20 a ataque y parar.
 *   - Si Montar > 40 → +20 a ataque (posición superior).
 *   - Esquiva final = min(esquiva, Montar) — la habilidad limita la esquiva
 *     mientras se cabalga.
 *
 * Convive con Ability typed nodes: declara como dependencia los `final.value`
 * de attack/block/dodge y de ride para que el flow ordene este mutator
 * DESPUÉS de que esos cuatro valores estén calculados, y los sobreescribe.
 *
 * El estado "Montado" se detecta consultando un flag persistente:
 *   system.combat.mounted.value === true
 *
 * Ese flag lo escribe `toggleStatusManeuver` cuando el actor activa la
 * maniobra Montar (paralelo al Active Effect "Montado").
 */
export const mutateMounted = data => {
  const isMounted = !!data?.combat?.mounted?.value;
  if (!isMounted) return;

  const rideFinal = Number(
    data?.secondaries?.athletics?.ride?.final?.value ?? 0
  );

  // 1) -20 a ataque y parar si Montar < 0
  if (rideFinal < 0) {
    if (data.combat?.attack?.final) {
      data.combat.attack.final.value = Math.max(
        0,
        Number(data.combat.attack.final.value ?? 0) - 20
      );
    }
    if (data.combat?.block?.final) {
      data.combat.block.final.value = Math.max(
        0,
        Number(data.combat.block.final.value ?? 0) - 20
      );
    }
  }

  // 2) +20 a ataque por posición superior si Montar > 40
  if (rideFinal > 40) {
    if (data.combat?.attack?.final) {
      data.combat.attack.final.value =
        Number(data.combat.attack.final.value ?? 0) + 20;
    }
  }

  // 3) Esquiva limitada al valor de Montar
  if (data.combat?.dodge?.final) {
    const dodgeFinal = Number(data.combat.dodge.final.value ?? 0);
    data.combat.dodge.final.value = Math.max(0, Math.min(dodgeFinal, rideFinal));
  }
};

mutateMounted.abfFlow = {
  // Only declare INPUT dependencies. Declaring attack/block/dodge.final
  // here too would create a self-cycle (depend on what we write).
  //
  // The Ability typed nodes that compute attack/block/dodge.final declare
  // their own write paths; the flow scheduler runs derivedFns AFTER all
  // typed-node outputs have settled, so by the time mutateMounted runs,
  // attack.final.value is already valid for us to read and overwrite.
  deps: [
    'system.secondaries.athletics.ride.final.value',
    'system.combat.mounted.value'
  ],
  mods: [
    'system.combat.attack.final.value',
    'system.combat.block.final.value',
    'system.combat.dodge.final.value'
  ]
};
