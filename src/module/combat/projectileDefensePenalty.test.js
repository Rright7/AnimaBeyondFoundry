import { projectileDefensePenalty } from './projectileDefensePenalty';

const caps = ({ shield = false, mastery = false } = {}) => ({
  isShieldWeapon: shield,
  hasMastery: mastery
});

describe('projectileDefensePenalty (Tabla 49: defensa contra proyectiles)', () => {
  describe('Parada (block) contra disparos', () => {
    it('sin escudo ni maestria -> 80', () => {
      expect(projectileDefensePenalty('block', caps(), 'shot')).toBe(80);
    });
    it('con maestria -> 20', () => {
      expect(projectileDefensePenalty('block', caps({ mastery: true }), 'shot')).toBe(20);
    });
    it('con escudo -> 30', () => {
      expect(projectileDefensePenalty('block', caps({ shield: true }), 'shot')).toBe(30);
    });
    it('con maestria y escudo -> 0', () => {
      expect(
        projectileDefensePenalty('block', caps({ shield: true, mastery: true }), 'shot')
      ).toBe(0);
    });
  });

  describe('Parada (block) contra lanzamientos', () => {
    it('sin escudo ni maestria -> 50', () => {
      expect(projectileDefensePenalty('block', caps(), 'throw')).toBe(50);
    });
    it('con escudo -> 0 (NA)', () => {
      expect(projectileDefensePenalty('block', caps({ shield: true }), 'throw')).toBe(0);
    });
    it('con maestria -> 0 (NA)', () => {
      expect(projectileDefensePenalty('block', caps({ mastery: true }), 'throw')).toBe(0);
    });
  });

  describe('Esquiva (dodge)', () => {
    it('disparos sin maestria -> 30', () => {
      expect(projectileDefensePenalty('dodge', caps(), 'shot')).toBe(30);
    });
    it('disparos con maestria -> 0', () => {
      expect(projectileDefensePenalty('dodge', caps({ mastery: true }), 'shot')).toBe(0);
    });
    it('lanzamientos -> 0 (NA, da igual la maestria)', () => {
      expect(projectileDefensePenalty('dodge', caps(), 'throw')).toBe(0);
      expect(projectileDefensePenalty('dodge', caps({ mastery: true }), 'throw')).toBe(0);
    });
  });

  it('otros tipos de defensa -> 0; tipo desconocido cuenta como disparo', () => {
    expect(projectileDefensePenalty('supernaturalShield', caps(), 'shot')).toBe(0);
    expect(projectileDefensePenalty('block', caps(), 'projectile')).toBe(80);
  });
});
