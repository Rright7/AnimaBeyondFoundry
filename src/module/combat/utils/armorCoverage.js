// Que zonas apuntadas (ids de criticalTables.js) cubre cada localizacion de
// armadura. Las claves son los valores de ArmorLocation (ArmorItemConfig.js); se
// usan como literales para que este modulo sea puro/testeable sin cargar Foundry.
// Definicion acumulativa para que sea facil de mantener:
//   - Peto (breastplate): solo pecho/espalda (torso, corazon, abdomen).
//   - Camisola (nightdress): peto + brazos.
//   - Completa (complete): camisola + piernas/ingle + cuello (todo salvo cabeza).
//   - Yelmo (head): solo la cabeza en general.
//   - Yelmo cerrado (headClosed): cabeza + ojo (el cuello lo cubre la completa).
const TORSO = ['torso', 'heart', 'abdomen'];
const ARMS = ['shoulder', 'arm', 'elbow', 'wrist', 'hand'];
const LEGS = ['groin', 'thigh', 'knee', 'calf', 'foot'];
const HEAD = ['head'];

const COVERAGE = {
  breastplate: TORSO,
  nightdress: [...TORSO, ...ARMS],
  // El cuello lo protege la armadura completa, NO los yelmos.
  complete: [...TORSO, ...ARMS, ...LEGS, 'neck'],
  head: HEAD,
  // Yelmo cerrado: unico que cubre el ojo (el cuello es cosa de la completa).
  headClosed: [...HEAD, 'eye']
};

/**
 * Indica si la armadura con esta localizacion cubre la zona apuntada.
 * Fail-safe: una localizacion desconocida (dato viejo/sin etiquetar) se considera
 * que cubre TODO, conservando el comportamiento previo a esta regla.
 * @param {string} localization
 * @param {string} zone
 * @returns {boolean}
 */
export function armorCoversZone(localization, zone) {
  const zones = COVERAGE[localization];
  if (!zones) return true;
  return zones.includes(zone);
}

// Regla de apilado de Anima (espejo de mutateTotalArmor.calculateTA): la TA total
// es la MAYOR + la mitad (hacia abajo) de la suma del resto.
const calculateTA = tas => {
  if (!tas.length) return 0;
  const ordered = [...tas].sort((a, b) => b - a);
  const max = ordered[0];
  const sumOthers = ordered.slice(1).reduce((prev, curr) => prev + curr, 0);
  return max + Math.floor(sumOthers / 2);
};

/**
 * TA efectiva contra un ataque APUNTADO a `zone`: solo cuentan las armaduras cuya
 * localizacion cubre esa zona. Las capas virtuales que protegen todo el cuerpo
 * (Armadura de energia del Ki en 'energy', Rex Frame plano) se mantienen.
 *
 * @param {object} defenderActor
 * @param {string} zone        id de zona apuntada (head/torso/thigh/...)
 * @param {string} damageType  tipo de TA (cut/thrust/impact/heat/cold/electricity/energy)
 * @returns {{armor:number, hardArmor:number}|null} null si faltan datos.
 */
export function computeAimedArmor(defenderActor, zone, damageType) {
  if (!defenderActor || !zone || !damageType) return null;

  const armors = defenderActor.system?.combat?.armors ?? [];
  const covering = armors.filter(
    a =>
      a?.system?.equipped?.value &&
      armorCoversZone(a?.system?.localization?.value, zone)
  );

  const tas = covering.map(a => Number(a?.system?.[damageType]?.final?.value) || 0);

  // Capas virtuales (no son armaduras fisicas, cubren todo el cuerpo).
  const kiEnergy =
    Number(defenderActor.system?.general?.modifiers?.kiBonus?.energyArmor?.value) || 0;
  const flat =
    Number(defenderActor.system?.general?.modifiers?.armorBonus?.flat?.value) || 0;
  if (damageType === 'energy' && kiEnergy > 0) tas.push(kiEnergy);
  if (flat > 0) tas.push(flat);

  const hardTas = covering
    .filter(a => a?.system?.type?.value === 'hard')
    .map(a => Number(a?.system?.[damageType]?.final?.value) || 0);

  return { armor: calculateTA(tas), hardArmor: calculateTA(hardTas) };
}
