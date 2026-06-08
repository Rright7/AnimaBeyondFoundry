import {
  applyMartialArtModifiers,
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

    mutateMartialArtKnowledgeMax(data);
    expect(data.domine.martialKnowledge.max.value).toBe(120);
  });

  it('Shotokan Supremo: Ataque +20 (5+5+10 acumulado)', () => {
    const data = makeData([art('shotokan', 'supreme', 'Shotokan')]);
    applyMartialArtModifiers(data);
    expect(data.general.modifiers.martialArtBonus.attack.value).toBe(20);
  });

  it('Velez Arcano: Bono Maestro de defensa en el bucket masterDefense', () => {
    const data = makeData([art('velez', 'arcane', 'Velez')]);
    applyMartialArtModifiers(data);
    const b = data.general.modifiers.martialArtBonus;
    expect(b.block.value).toBe(20);
    expect(b.dodge.value).toBe(20);
    expect(b.masterDefense.value).toBe(15);
  });

  it('Boxeo Supremo: Turno +20 (5+5+10) en el bucket', () => {
    const data = makeData([art('boxeo', 'supreme', 'Boxeo')]);
    applyMartialArtModifiers(data);
    expect(data.general.modifiers.martialArtBonus.turn.value).toBe(20);
  });

  it('arte importada (bonusInBase): el motor NO re-suma su bono ni su CM', () => {
    const data = makeData([
      {
        name: 'Shotokan',
        system: { canonicalId: 'shotokan', grade: { value: 'supreme' }, bonusInBase: true }
      }
    ]);
    applyMartialArtModifiers(data);
    const b = data.general.modifiers.martialArtBonus;
    expect(b.attack.value).toBe(0); // ya esta en la HA importada
    expect(b.cm.value).toBe(0);
    // pero la vista se enriquece igual (se muestra en la ficha)
    expect(data.domine.martialArts[0].system.computed.known).toBe(true);
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

  it('cap COMBINADO (RAW): Categoria + AM comparten el tope +50 via flag categoryBonus', () => {
    const data = makeData([
      art('shotokan', 'supreme'), // attack 20
      art('seraphite', 'base'), // attack 20
      art('dumah', 'base') // attack 20  -> total 60
    ]);
    const actor = { flags: { animabf: { categoryBonus: { attack: 40 } } } };
    applyMartialArtModifiers(data, actor);
    // min(40 + 60, 50) - 40 = 10
    expect(data.general.modifiers.martialArtBonus.attack.value).toBe(10);
  });

  it('cap COMBINADO: una Categoria de +50 absorbe todo el bono de AM (queda 0)', () => {
    const data = makeData([art('shotokan', 'supreme')]); // attack 20
    const actor = { flags: { animabf: { categoryBonus: { attack: 50 } } } };
    applyMartialArtModifiers(data, actor);
    expect(data.general.modifiers.martialArtBonus.attack.value).toBe(0);
  });

  it('sin categoryBonus (ficha no importada): cae al tope simple min(AM,50)', () => {
    const data = makeData([art('shotokan', 'supreme'), art('seraphite', 'base'), art('dumah', 'base')]); // 60
    applyMartialArtModifiers(data); // sin actor
    expect(data.general.modifiers.martialArtBonus.attack.value).toBe(50);
  });

  it('cmTurnInBase (import nuevo): suprime CM y Turno pero mantiene el COMBATE', () => {
    const mk = flag =>
      makeData([
        {
          name: 'Boxeo',
          system: { canonicalId: 'boxeo', grade: { value: 'supreme' }, ...(flag ? { cmTurnInBase: true } : {}) }
        }
      ]);
    const withFlag = mk(true);
    applyMartialArtModifiers(withFlag);
    const without = mk(false);
    applyMartialArtModifiers(without);
    const bw = withFlag.general.modifiers.martialArtBonus;
    const bo = without.general.modifiers.martialArtBonus;
    // CM y Turno NO se re-suman cuando ya vienen en la base del Excel
    expect(bw.turn.value).toBe(0);
    expect(bw.cm.value).toBe(0);
    expect(bo.turn.value).toBe(20); // Boxeo Supremo: turno 20 sin el flag
    // el combate se computa igual con o sin el flag
    expect(bw.attack.value).toBe(bo.attack.value);
    expect(bw.block.value).toBe(bo.block.value);
    expect(bw.dodge.value).toBe(bo.dodge.value);
  });
});
