/**
 * @jest-environment node
 */

import {
  getActiveEffectContributions,
  formatContributions
} from './activeEffectsBreakdown.js';
import { inferAttributeFromFlavor } from './attributeDerivationMap.js';

const makeActor = effects => ({ effects: { contents: effects } });
const makeEffect = (name, changes, { active = true } = {}) => ({
  name, active, changes, system: { changes }
});

describe('AE breakdown', () => {
  test('inferAttributeFromFlavor maps localized flavors to attributes', () => {
    expect(inferAttributeFromFlavor('Tirada de ataque')).toBe('attack');
    expect(inferAttributeFromFlavor('Esquiva')).toBe('dodge');
    expect(inferAttributeFromFlavor('Iniciativa')).toBe('initiative');
    expect(inferAttributeFromFlavor('Proyección Mágica defensiva')).toBe('magicProjectionDefensive');
    expect(inferAttributeFromFlavor('Vigor')).toBe(null);
  });

  test('contributions list only AE on the rolled attribute', () => {
    const ae1 = makeEffect('Flanco', [
      { key: 'system.combat.attack.final.value', type: 'add', value: '-10' }
    ]);
    const ae2 = makeEffect('Posición superior', [
      { key: 'system.combat.dodge.final.value', type: 'add', value: '20' }
    ]);
    const actor = makeActor([ae1, ae2]);
    const c = getActiveEffectContributions(actor, 'attack');
    expect(c).toEqual([{ name: 'Flanco', value: -10, mode: 'add' }]);
  });

  test('inactive AE are ignored', () => {
    const ae = makeEffect('Off', [
      { key: 'system.combat.attack.final.value', type: 'add', value: '20' }
    ], { active: false });
    expect(getActiveEffectContributions(makeActor([ae]), 'attack')).toEqual([]);
  });

  test('formatContributions builds a readable line', () => {
    expect(formatContributions([
      { name: 'Flanco', value: -10, mode: 'add' },
      { name: 'Ceguera parcial', value: -30, mode: 'add' }
    ])).toBe('Mod: Flanco (-10), Ceguera parcial (-30)');
    expect(formatContributions([])).toBe('');
  });
});
