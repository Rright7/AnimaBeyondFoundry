import { activeTechniqueModifiers } from '../../../../../../domine/techniques/activeTechniqueModifiers';
import { depositModifier } from '../../../../effectFow/modifiers/synthetics.js';

/**
 * Aplica los aumentos de característica de las Técnicas de Ki activas
 * (Capacidad Incrementada AGI/FUE/DES) sumándolos a `primaries.<c>.special.value`.
 *
 * No toca `final`/`mod`: el typed op del tipo `Characteristic` recalcula
 * `final = clamp(base + special, 0, 20)` y `mod = tabla(final)` a partir de
 * `special.value`, así que el toposort ordena este mutador antes de `final`,
 * y la cascada llega a todo lo derivado de la característica.
 *
 * Además deposita la contribución en el mailbox de synthetics (path `.final.value`,
 * que es el que se tira desde la hoja) para que el chat muestre "Mod: Técnica (+N)".
 *
 * @param {import('../../../../../../types/Actor').ABFActorDataSourceData} data
 * @param {object} [actor] documento del actor (para depositar provenance)
 */
export const mutateActiveTechniqueCharacteristics = (data, actor) => {
  for (const rec of activeTechniqueModifiers(data).records) {
    if (rec.scope !== 'characteristic' || !rec.value) continue;
    const primary = data.characteristics?.primaries?.[rec.target];
    if (!primary) continue;
    primary.special = primary.special ?? { value: 0 };
    primary.special.value = (primary.special.value ?? 0) + rec.value;

    depositModifier(actor, {
      path: `system.characteristics.primaries.${rec.target}.final.value`,
      value: rec.value,
      source: rec.source,
      slug: rec.slug ? `technique:${rec.slug}:${rec.target}` : undefined
    });
  }
};

// Sólo las características que Capacidad Incrementada puede tocar (ver
// PERSISTENT_EFFECT_MAP): agilidad, fuerza, destreza.
mutateActiveTechniqueCharacteristics.abfFlow = {
  deps: ['system.domine.techniques'],
  mods: [
    'system.characteristics.primaries.agility.special.value',
    'system.characteristics.primaries.strength.special.value',
    'system.characteristics.primaries.dexterity.special.value'
  ]
};
