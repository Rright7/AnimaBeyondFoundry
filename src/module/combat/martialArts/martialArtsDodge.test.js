import { isUnarmedMode, martialArtsDodgeBonus } from './martialArtsDodge.js';
import { DodgeStrategy } from '../DefenseStrategies.js';

const swordEquipped = { system: { isUnarmed: { value: false }, equipped: { value: true } } };
const swordUnequipped = { system: { isUnarmed: { value: false }, equipped: { value: false } } };
const unarmedEquipped = { system: { isUnarmed: { value: true }, equipped: { value: true } } };

const mkActor = ({
  dodgeBase = 100,
  dodgeFinal = 100,
  weapons = [],
  maDodge = 0,
  masterDefense = 0
} = {}) => ({
  system: {
    combat: {
      dodge: { base: { value: dodgeBase }, final: { value: dodgeFinal } },
      weapons
    },
    general: {
      modifiers: {
        martialArtBonus: {
          dodge: { value: maDodge },
          masterDefense: { value: masterDefense }
        }
      }
    }
  }
});

describe('isUnarmedMode', () => {
  it('sin armas -> desarmado', () => {
    expect(isUnarmedMode(mkActor())).toBe(true);
  });
  it('solo armas desarmadas equipadas -> desarmado (isUnarmed no cuenta)', () => {
    expect(isUnarmedMode(mkActor({ weapons: [unarmedEquipped, unarmedEquipped] }))).toBe(true);
  });
  it('arma real NO equipada -> desarmado', () => {
    expect(isUnarmedMode(mkActor({ weapons: [swordUnequipped, unarmedEquipped] }))).toBe(true);
  });
  it('arma real equipada -> NO desarmado', () => {
    expect(isUnarmedMode(mkActor({ weapons: [swordEquipped, unarmedEquipped] }))).toBe(false);
  });
});

describe('martialArtsDodgeBonus', () => {
  it('desarmado + bonos: dodge + masterDefense', () => {
    expect(martialArtsDodgeBonus(mkActor({ maDodge: 20, masterDefense: 15 }))).toBe(35);
  });
  it('empuñando arma real: 0 (RAW, no aplica)', () => {
    expect(
      martialArtsDodgeBonus(mkActor({ weapons: [swordEquipped], maDodge: 20, masterDefense: 15 }))
    ).toBe(0);
  });
  it('sin AM (importada con buckets 0): 0, sin doble conteo', () => {
    expect(martialArtsDodgeBonus(mkActor({ maDodge: 0, masterDefense: 0 }))).toBe(0);
  });
});

describe('DodgeStrategy.compute con Artes Marciales', () => {
  it('desarmado: suma el bono a base y final', () => {
    const c = DodgeStrategy.compute(mkActor({ dodgeBase: 90, dodgeFinal: 110, maDodge: 20, masterDefense: 5 }));
    expect(c.naturalBase).toBe(115); // 90 + 25
    expect(c.finalBase).toBe(135); // 110 + 25
  });
  it('armado: sin bono', () => {
    const c = DodgeStrategy.compute(
      mkActor({ dodgeBase: 90, dodgeFinal: 110, weapons: [swordEquipped], maDodge: 20, masterDefense: 5 })
    );
    expect(c.naturalBase).toBe(90);
    expect(c.finalBase).toBe(110);
  });
  it('maestria: base + bono AM >= 200 activa el dado de maestria', () => {
    const c = DodgeStrategy.compute(mkActor({ dodgeBase: 190, dodgeFinal: 190, maDodge: 20 }));
    expect(c.naturalBase).toBe(210);
    expect(c.hasMastery).toBe(true);
  });
});
