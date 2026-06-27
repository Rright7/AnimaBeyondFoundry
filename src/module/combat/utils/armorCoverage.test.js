import { armorCoversZone, computeAimedArmor } from './armorCoverage';

// Helpers para montar un defensor de mentira con sus armaduras.
const mkArmor = (localization, type, taByType, equipped = true) => ({
  system: {
    equipped: { value: equipped },
    localization: { value: localization },
    type: { value: type },
    ...Object.fromEntries(
      Object.entries(taByType).map(([k, v]) => [k, { final: { value: v } }])
    )
  }
});

const mkActor = (armors, extras = {}) => ({
  system: {
    combat: { armors },
    general: {
      modifiers: {
        kiBonus: { energyArmor: { value: extras.kiEnergy ?? 0 } },
        armorBonus: { flat: { value: extras.flat ?? 0 } }
      }
    }
  }
});

describe('armorCoversZone', () => {
  it('peto solo cubre torso/corazon/abdomen', () => {
    expect(armorCoversZone('breastplate', 'torso')).toBe(true);
    expect(armorCoversZone('breastplate', 'heart')).toBe(true);
    expect(armorCoversZone('breastplate', 'thigh')).toBe(false);
    expect(armorCoversZone('breastplate', 'arm')).toBe(false);
    expect(armorCoversZone('breastplate', 'head')).toBe(false);
  });

  it('camisola anade los brazos pero no las piernas', () => {
    expect(armorCoversZone('nightdress', 'arm')).toBe(true);
    expect(armorCoversZone('nightdress', 'hand')).toBe(true);
    expect(armorCoversZone('nightdress', 'thigh')).toBe(false);
  });

  it('completa cubre todo el cuerpo salvo la cabeza (incluido el cuello)', () => {
    expect(armorCoversZone('complete', 'thigh')).toBe(true);
    expect(armorCoversZone('complete', 'groin')).toBe(true);
    expect(armorCoversZone('complete', 'torso')).toBe(true);
    expect(armorCoversZone('complete', 'neck')).toBe(true);
    expect(armorCoversZone('complete', 'head')).toBe(false);
    expect(armorCoversZone('complete', 'eye')).toBe(false);
  });

  it('yelmo normal cubre la cabeza pero no ojo ni cuello', () => {
    expect(armorCoversZone('head', 'head')).toBe(true);
    expect(armorCoversZone('head', 'eye')).toBe(false);
    expect(armorCoversZone('head', 'neck')).toBe(false);
  });

  it('yelmo cerrado cubre el ojo pero NO el cuello', () => {
    expect(armorCoversZone('headClosed', 'head')).toBe(true);
    expect(armorCoversZone('headClosed', 'eye')).toBe(true);
    expect(armorCoversZone('headClosed', 'neck')).toBe(false);
  });

  it('el cuello solo lo cubre la armadura completa', () => {
    expect(armorCoversZone('complete', 'neck')).toBe(true);
    expect(armorCoversZone('breastplate', 'neck')).toBe(false);
    expect(armorCoversZone('nightdress', 'neck')).toBe(false);
    expect(armorCoversZone('head', 'neck')).toBe(false);
    expect(armorCoversZone('headClosed', 'neck')).toBe(false);
  });

  it('localizacion desconocida es fail-safe: cubre todo', () => {
    expect(armorCoversZone(undefined, 'thigh')).toBe(true);
    expect(armorCoversZone('loquesea', 'eye')).toBe(true);
  });
});

describe('computeAimedArmor', () => {
  it('un peto no protege una pierna apuntada', () => {
    const actor = mkActor([mkArmor('breastplate', 'hard', { cut: 4 })]);
    expect(computeAimedArmor(actor, 'thigh', 'cut')).toEqual({ armor: 0, hardArmor: 0 });
  });

  it('un peto si protege el torso apuntado', () => {
    const actor = mkActor([mkArmor('breastplate', 'hard', { cut: 4 })]);
    expect(computeAimedArmor(actor, 'torso', 'cut')).toEqual({ armor: 4, hardArmor: 4 });
  });

  it('una completa protege la pierna apuntada', () => {
    const actor = mkActor([mkArmor('complete', 'hard', { cut: 5 })]);
    expect(computeAimedArmor(actor, 'thigh', 'cut')).toEqual({ armor: 5, hardArmor: 5 });
  });

  it('el yelmo protege la cabeza pero no el torso', () => {
    const actor = mkActor([mkArmor('head', 'hard', { impact: 3 })]);
    expect(computeAimedArmor(actor, 'head', 'impact')).toEqual({ armor: 3, hardArmor: 3 });
    expect(computeAimedArmor(actor, 'torso', 'impact')).toEqual({ armor: 0, hardArmor: 0 });
  });

  it('el yelmo cerrado protege el ojo apuntado', () => {
    const actor = mkActor([mkArmor('headClosed', 'hard', { thrust: 3 })]);
    expect(computeAimedArmor(actor, 'eye', 'thrust')).toEqual({ armor: 3, hardArmor: 3 });
  });

  it('apila max + mitad del resto solo con las que cubren la zona', () => {
    const actor = mkActor([
      mkArmor('breastplate', 'hard', { cut: 4 }),
      mkArmor('complete', 'soft', { cut: 2 })
    ]);
    // torso: cubren ambas -> max(4,2) + floor(2/2) = 5; dura solo el peto -> 4.
    expect(computeAimedArmor(actor, 'torso', 'cut')).toEqual({ armor: 5, hardArmor: 4 });
    // thigh: solo la completa (blanda) -> 2; dura -> 0.
    expect(computeAimedArmor(actor, 'thigh', 'cut')).toEqual({ armor: 2, hardArmor: 0 });
  });

  it('ignora armaduras no equipadas', () => {
    const actor = mkActor([mkArmor('complete', 'hard', { cut: 5 }, false)]);
    expect(computeAimedArmor(actor, 'thigh', 'cut')).toEqual({ armor: 0, hardArmor: 0 });
  });

  it('la armadura de energia del Ki cubre todo el cuerpo (solo energy)', () => {
    const actor = mkActor([mkArmor('breastplate', 'hard', { energy: 2 })], { kiEnergy: 6 });
    // pierna: el peto no cubre, pero la capa de energia del Ki si -> 6.
    expect(computeAimedArmor(actor, 'thigh', 'energy')).toEqual({ armor: 6, hardArmor: 0 });
  });

  it('null si faltan datos', () => {
    expect(computeAimedArmor(null, 'torso', 'cut')).toBeNull();
    expect(computeAimedArmor(mkActor([]), '', 'cut')).toBeNull();
    expect(computeAimedArmor(mkActor([]), 'torso', '')).toBeNull();
  });
});
