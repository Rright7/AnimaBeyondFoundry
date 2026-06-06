import {
  techniqueCombatBonus,
  activeTechniqueCombatBonuses,
  usableInstantCombatTechniques
} from './techniqueCombatBonuses.js';

const effect = (effectId, ...tierOptions) => ({ effectId, tierOptions });

const technique = ({
  id = 't',
  name = 'Téc',
  active = false,
  effects = [],
  flags = {},
  cost = {},
  kiActiveTotal = 0
} = {}) => ({
  id,
  name,
  type: 'technique',
  flags: { animabf: { active } },
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
  test('mapea ataque / esquiva / daño desde las opciones', () => {
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
});

describe('activeTechniqueCombatBonuses', () => {
  test('solo suma técnicas activas', () => {
    const a = actor([
      technique({ id: 'a', active: true, effects: [effect('habilidad-de-ataque', '+40')] }),
      technique({ id: 'b', active: false, effects: [effect('habilidad-de-ataque', '+100')] })
    ]);
    expect(activeTechniqueCombatBonuses(a).attack).toBe(40);
  });
});

describe('usableInstantCombatTechniques', () => {
  test('lista instantáneas (no activas, sin mantener/sostener) relevantes al tipo', () => {
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
          effects: [effect('habilidad-de-ataque', '+90')]
        })
      ],
      { dexterity: 6 }
    );
    const atk = usableInstantCombatTechniques(a, 'attack');
    expect(atk.map(t => t.id)).toEqual(['atk']); // 'def' es defensa, 'maint' es activa
    expect(atk[0]).toMatchObject({ name: 'Golpe', attack: 50, kiCost: 8, hasEnoughKi: true });

    const def = usableInstantCombatTechniques(a, 'defense');
    expect(def.map(t => t.id)).toEqual(['def']);
  });

  test('hasEnoughKi=false si falta Ki concentrado', () => {
    const a = actor(
      [technique({ id: 'x', effects: [effect('habilidad-de-ataque', '+50')], cost: { dexterity: { active: 10 } } })],
      { dexterity: 3 }
    );
    expect(usableInstantCombatTechniques(a, 'attack')[0].hasEnoughKi).toBe(false);
  });

  test('excluye mantenidas/sostenidas (no instantáneas)', () => {
    const a = actor([
      technique({ id: 'm', flags: { anyMaintained: true }, effects: [effect('habilidad-de-ataque', '+50')] })
    ]);
    expect(usableInstantCombatTechniques(a, 'attack')).toEqual([]);
  });
});
