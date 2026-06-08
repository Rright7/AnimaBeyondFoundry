import {
  applyMartialArtModifiers,
  mutateMartialArtCombat,
  mutateMartialArtKnowledgeMax
} from './applyMartialArtModifiers.js';

function makeData(arts) {
  return {
    domine: { martialArts: arts, martialKnowledge: { max: { value: 100 } } },
    general: { modifiers: {} },
    combat: {
      attack: { special: { value: 0 }, final: { value: 50 } },
      block: { special: { value: 0 }, final: { value: 50 } },
      dodge: { special: { value: 0 }, final: { value: 50 } }
    }
  };
}

const art = (canonicalId, grade, name = canonicalId) => ({
  name,
  system: { canonicalId, grade: { value: grade } }
});

describe('applyMartialArtModifiers', () => {
  it('Aikido Supremo: Parada/Esquiva +20 (acumulado), sin Ataque, CM +20 al maximo', () => {
    const data = makeData([art('aikido', 'supreme', 'Aikido')]);
    applyMartialArtModifiers(data);
    const b = data.general.modifiers.martialArtBonus;
    expect(b.block.value).toBe(20);
    expect(b.dodge.value).toBe(20);
    expect(b.attack.value).toBe(0);
    expect(b.cm.value).toBe(20);

    // Se suma a special (el typed-node Ability hara final = base + special + mods).
    mutateMartialArtCombat(data);
    expect(data.combat.block.special.value).toBe(20);
    expect(data.combat.dodge.special.value).toBe(20);
    expect(data.combat.attack.special.value).toBe(0);

    mutateMartialArtKnowledgeMax(data);
    expect(data.domine.martialKnowledge.max.value).toBe(120);
  });

  it('Shotokan Supremo: Ataque +20 (5+5+10 acumulado)', () => {
    const data = makeData([art('shotokan', 'supreme', 'Shotokan')]);
    applyMartialArtModifiers(data);
    expect(data.general.modifiers.martialArtBonus.attack.value).toBe(20);
    mutateMartialArtCombat(data);
    expect(data.combat.attack.special.value).toBe(20);
  });

  it('Velez Arcano: Bono Maestro de defensa se suma a Parada y Esquiva', () => {
    const data = makeData([art('velez', 'arcane', 'Velez')]);
    applyMartialArtModifiers(data);
    const b = data.general.modifiers.martialArtBonus;
    expect(b.block.value).toBe(20);
    expect(b.dodge.value).toBe(20);
    expect(b.masterDefense.value).toBe(15);
    mutateMartialArtCombat(data);
    expect(data.combat.block.special.value).toBe(35); // 20 + 15 (Maestro Def)
    expect(data.combat.dodge.special.value).toBe(35);
  });

  it('Boxeo Supremo: Turno +20 (5+5+10) en el bucket', () => {
    const data = makeData([art('boxeo', 'supreme', 'Boxeo')]);
    applyMartialArtModifiers(data);
    expect(data.general.modifiers.martialArtBonus.turn.value).toBe(20);
  });

  it('arte o grado desconocido se ignora', () => {
    const data = makeData([art('noexiste', 'base'), art('aikido', 'gradomalo')]);
    applyMartialArtModifiers(data);
    expect(data.general.modifiers.martialArtBonus.attack.value).toBe(0);
    expect(data.general.modifiers.martialArtBonus.cm.value).toBe(0);
  });

  it('tope +50: la suma de bonos de AM a HA se capa a 50; el Bono Maestro queda exento', () => {
    const data = makeData([
      art('shotokan', 'supreme'), // attack 20
      art('seraphite', 'base'), // attack 20
      art('dumah', 'base'), // attack 20
      art('exelion', 'arcane') // attack 10, masterAttack 25
    ]);
    applyMartialArtModifiers(data);
    const b = data.general.modifiers.martialArtBonus;
    expect(b.attack.value).toBe(50); // 20+20+20+10 = 70 -> capado a 50
    expect(b.masterAttack.value).toBe(25); // exento del tope
    mutateMartialArtCombat(data);
    expect(data.combat.attack.special.value).toBe(75); // 50 (capado) + 25 (maestro exento)
  });

  it('tope +50 en Parada y Esquiva por separado', () => {
    const data = makeData([
      art('velez', 'base'), // block 20, dodge 20
      art('selene', 'base'), // block 20, dodge 20
      art('enuth', 'base') // block 20, dodge 20
    ]);
    applyMartialArtModifiers(data);
    const b = data.general.modifiers.martialArtBonus;
    expect(b.block.value).toBe(50); // 60 -> 50
    expect(b.dodge.value).toBe(50);
  });

  it('varias artes acumulan sus bonos numericos', () => {
    const data = makeData([art('shotokan', 'supreme'), art('aikido', 'supreme')]);
    applyMartialArtModifiers(data);
    const b = data.general.modifiers.martialArtBonus;
    expect(b.attack.value).toBe(20); // Shotokan
    expect(b.block.value).toBe(20); // Aikido
    expect(b.cm.value).toBe(40); // 20 + 20
  });
});
