import {
  techniqueCombatBonus,
  activeTechniqueCombatBonuses,
  usableInstantCombatTechniques
} from './techniqueCombatBonuses.js';

// Efecto Tipo Acción (instantáneo): sin maintMode.
const effect = (effectId, ...tierOptions) => ({ effectId, tierOptions });
// Efecto que perdura: maintMode mantenido/sostenido.
const mEffect = (effectId, maintMode, ...tierOptions) => ({ effectId, maintMode, tierOptions });

const technique = ({
  id = 't',
  name = 'Téc',
  active = false,
  freshTurn = false,
  effects = [],
  flags = {},
  cost = {},
  kiActiveTotal = 0
} = {}) => ({
  id,
  name,
  type: 'technique',
  flags: { animabf: { active, freshTurn } },
  system: {
    build: { effects },
    computed: { flags, costByCharacteristic: cost, kiActiveTotal }
  }
});

const actor = (techs, concentrated = {}) => ({
  items: techs,
  system: {
    domine: {
      kiAccumulation: Object.fromEntries(
        Object.entries(concentrated).map(([k, v]) => [k, { accumulated: { value: v } }])
      )
    }
  }
});

describe('techniqueCombatBonus', () => {
  test('mapea ataque / esquiva / daño desde las opciones (modo all por defecto)', () => {
    const t = technique({
      effects: [
        effect('habilidad-de-ataque', '+50'),
        effect('habilidad-de-esquiva', '+40'),
        effect('aumento-de-dano', '+30')
      ]
    });
    expect(techniqueCombatBonus(t)).toEqual({ attack: 50, block: 0, dodge: 40, damage: 30 });
  });

  test('contraataque cuenta como ataque; ignora efectos no mapeados', () => {
    const t = technique({
      effects: [effect('habilidad-de-contraataque', '+25'), effect('ataque-con-area', '5m')]
    });
    expect(techniqueCombatBonus(t)).toEqual({ attack: 25, block: 0, dodge: 0, damage: 0 });
  });

  test('separa porción persistente e instantánea de una técnica mixta', () => {
    const t = technique({
      effects: [
        mEffect('habilidad-de-ataque', 'maintained', '+50'), // perdura
        effect('aumento-de-dano', '+30') // Tipo Acción
      ]
    });
    expect(techniqueCombatBonus(t, 'persistent')).toEqual({ attack: 50, block: 0, dodge: 0, damage: 0 });
    expect(techniqueCombatBonus(t, 'instant')).toEqual({ attack: 0, block: 0, dodge: 0, damage: 30 });
    expect(techniqueCombatBonus(t, 'all')).toEqual({ attack: 50, block: 0, dodge: 0, damage: 30 });
  });
});

describe('activeTechniqueCombatBonuses', () => {
  test('solo suma la porción PERSISTENTE de las técnicas activas', () => {
    const a = actor([
      technique({ id: 'a', active: true, effects: [mEffect('habilidad-de-ataque', 'maintained', '+40')] }),
      // activa pero su efecto de ataque es Tipo Acción -> no persiste (0)
      technique({ id: 'mix', active: true, effects: [effect('habilidad-de-ataque', '+100')] }),
      technique({ id: 'b', active: false, effects: [mEffect('habilidad-de-ataque', 'maintained', '+100')] })
    ]);
    expect(activeTechniqueCombatBonuses(a).attack).toBe(40);
  });
});

describe('usableInstantCombatTechniques', () => {
  test('lista instantáneas puras (no activas) relevantes al tipo', () => {
    const a = actor(
      [
        technique({
          id: 'atk',
          name: 'Golpe',
          effects: [effect('habilidad-de-ataque', '+50')],
          cost: { dexterity: { active: 5 } },
          kiActiveTotal: 8
        }),
        technique({
          id: 'def',
          name: 'Quite',
          effects: [effect('habilidad-de-parada', '+40')]
        }),
        technique({
          id: 'maint',
          active: true,
          flags: { anyMaintained: true },
          effects: [mEffect('habilidad-de-ataque', 'maintained', '+90')]
        })
      ],
      { dexterity: 6 }
    );
    const atk = usableInstantCombatTechniques(a, 'attack');
    expect(atk.map(t => t.id)).toEqual(['atk']); // 'def' es defensa, 'maint' es activa sin porción de Acción
    expect(atk[0]).toMatchObject({ name: 'Golpe', attack: 50, kiCost: 8, hasEnoughKi: true, free: false });

    const def = usableInstantCombatTechniques(a, 'defense');
    expect(def.map(t => t.id)).toEqual(['def']);
  });

  test('ofrece la porción Tipo Acción de una mixta SOLO el turno de activación (gratis)', () => {
    const mix = (freshTurn) =>
      technique({
        id: 'mix',
        name: 'Puño Cometa',
        active: true,
        freshTurn,
        flags: { anyMaintained: true },
        effects: [
          mEffect('habilidad-de-ataque', 'maintained', '+30'), // persiste (va por auto)
          effect('aumento-de-dano', '+40') // Tipo Acción (solo el turno fresco)
        ]
      });

    // Turno de activación (fresh): se ofrece la porción de Acción, gratis y sin re-gastar Ki.
    const fresh = usableInstantCombatTechniques(actor([mix(true)]), 'attack');
    expect(fresh).toHaveLength(1);
    expect(fresh[0]).toMatchObject({ id: 'mix', attack: 0, damage: 40, kiCost: 0, hasEnoughKi: true, free: true });

    // Asaltos posteriores (no fresh): ya no se ofrece.
    expect(usableInstantCombatTechniques(actor([mix(false)]), 'attack')).toEqual([]);
  });

  test('instantánea pura ya usada este asalto (freshTurn) se ofrece gratis y sin re-coste', () => {
    const a = actor(
      [
        technique({
          id: 'atk',
          name: 'Golpe',
          freshTurn: true,
          effects: [effect('habilidad-de-ataque', '+50')],
          cost: { dexterity: { active: 5 } },
          kiActiveTotal: 8
        })
      ],
      { dexterity: 0 } // sin Ki concentrado, pero ya pagada -> hasEnoughKi true
    );
    const atk = usableInstantCombatTechniques(a, 'attack');
    expect(atk[0]).toMatchObject({ id: 'atk', attack: 50, kiCost: 0, hasEnoughKi: true, free: true });
  });

  test('hasEnoughKi=false si falta Ki concentrado', () => {
    const a = actor(
      [technique({ id: 'x', effects: [effect('habilidad-de-ataque', '+50')], cost: { dexterity: { active: 10 } } })],
      { dexterity: 3 }
    );
    expect(usableInstantCombatTechniques(a, 'attack')[0].hasEnoughKi).toBe(false);
  });

  test('excluye mantenidas/sostenidas no activas (hay que activarlas primero)', () => {
    const a = actor([
      technique({
        id: 'm',
        flags: { anyMaintained: true },
        effects: [mEffect('habilidad-de-ataque', 'maintained', '+50')]
      })
    ]);
    expect(usableInstantCombatTechniques(a, 'attack')).toEqual([]);
  });
});
