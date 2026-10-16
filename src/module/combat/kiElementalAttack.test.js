import {
  KI_ATTACK_ELEMENTS,
  ownedKiAttackElements,
  resolveKiElementalAttack
} from './kiElementalAttack.js';
import { ABFAttackData } from './ABFAttackData.js';
import { ABFCombatResultData } from './ABFCombatResultData.js';
import { computeCombatResult } from './computeCombatResult.js';

const actorWith = (...ids) => ({
  system: { domine: { kiSkills: ids.map(canonicalId => ({ system: { canonicalId } })) } }
});
const weaponWith = (primary = 'cut', secondary = '-') => ({
  system: { critic: { primary: { value: primary }, secondary: { value: secondary } } }
});
const actor = actorWith(...KI_ATTACK_ELEMENTS.map(element => element.canonicalId));

beforeEach(() => {
  game.actors = {
    get: () => ({
      system: {
        characteristics: {
          secondaries: {
            lifePoints: { value: 100 },
            resistances: { physical: { final: { value: 50 } } }
          }
        }
      }
    })
  };
  globalThis.canvas = { tokens: {} };
  game.animabf.weapon = { NoneWeaponCritic: { NONE: '-' } };
  game.animabf.combat = { DamageType: { NONE: '-' } };
});

test('only acquired elements are offered, in canonical order and without duplicates', () => {
  const limited = actorWith(
    'elementalAttackLight',
    'elementalAttackFire',
    'elementalAttackFire'
  );
  expect(ownedKiAttackElements(limited).map(element => element.id)).toEqual([
    'fire',
    'light'
  ]);
  expect(
    resolveKiElementalAttack(limited, weaponWith(), 'darkness', 'energy')
  ).toMatchObject({
    element: '',
    critic: 'cut',
    critics: ['cut'],
    damageBonus: 0
  });
});

test('named legacy abilities resolve their element; generic ones do not guess', () => {
  const legacy = actorWith('elementalAttack', 'elementalAttack');
  legacy.system.domine.kiSkills[0].name = 'Ataque elemental: Oscuridad';
  legacy.system.domine.kiSkills[1].name = 'Ataque elemental';
  expect(ownedKiAttackElements(legacy).map(element => element.id)).toEqual(['darkness']);
});

test.each(KI_ATTACK_ELEMENTS)(
  '$id is independent of the selected critical table',
  element => {
    const physical = resolveKiElementalAttack(
      actor,
      weaponWith('cut', 'thrust'),
      element.id,
      'cut'
    );
    expect(physical).toMatchObject({
      element: element.id,
      critic: 'cut',
      secondaryPenalty: 0
    });
    const secondary = resolveKiElementalAttack(
      actor,
      weaponWith('cut', 'thrust'),
      element.id,
      'thrust'
    );
    expect(secondary).toMatchObject({
      element: element.id,
      critic: 'thrust',
      secondaryPenalty: -10
    });
    if (element.critic) {
      expect(
        resolveKiElementalAttack(actor, weaponWith(), element.id, element.critic)
      ).toMatchObject({
        critic: element.critic,
        secondaryPenalty: -10
      });
    } else {
      expect(physical.critics).toEqual(['cut', 'thrust']);
    }
  }
);

test('switching or disabling an element removes its supplemental critical', () => {
  expect(resolveKiElementalAttack(actor, weaponWith(), 'light', 'heat').critic).toBe(
    'cut'
  );
  expect(resolveKiElementalAttack(actor, weaponWith(), '', 'heat').critic).toBe('cut');
  expect(
    resolveKiElementalAttack(actor, weaponWith('heat'), 'fire', 'heat').secondaryPenalty
  ).toBe(0);
});

test('Earth adds 10 only to an impact primary, without changing the weapon or accumulating', () => {
  const weapon = weaponWith('impact', 'cut');
  const before = JSON.stringify(weapon);
  for (let i = 0; i < 3; i++) {
    expect(resolveKiElementalAttack(actor, weapon, 'earth', 'impact')).toMatchObject({
      damageBonus: 10,
      secondaryPenalty: 0
    });
  }
  expect(
    resolveKiElementalAttack(actor, weaponWith(), 'earth', 'impact').damageBonus
  ).toBe(0);
  expect(resolveKiElementalAttack(actor, weapon, '', 'impact').damageBonus).toBe(0);
  expect(JSON.stringify(weapon)).toBe(before);
});

test('martial arts retain their tables and add the supplemental elemental table', () => {
  const tables = ['impact', 'cut', 'energy'];
  expect(
    resolveKiElementalAttack(actor, weaponWith('impact'), 'fire', 'heat', tables)
  ).toMatchObject({
    critic: 'heat',
    critics: ['impact', 'cut', 'energy', 'heat'],
    secondaryPenalty: -10
  });
  expect(
    resolveKiElementalAttack(actor, weaponWith('impact'), 'earth', 'cut', tables)
      .secondaryPenalty
  ).toBe(0);
});

test.each(KI_ATTACK_ELEMENTS)(
  '$id survives attack and combat result serialization',
  element => {
    const attack = ABFAttackData.builder()
      .kiElement(element.id)
      .armorType('cut')
      .attackAbility(200)
      .damage(50)
      .build();
    const restored = ABFAttackData.fromJSON(JSON.stringify(attack.toJSON()));
    expect(restored.kiElement).toBe(element.id);
    const result = computeCombatResult(restored, {
      defenderId: 'defender',
      defenseAbility: 100,
      armor: 0
    });
    expect(ABFCombatResultData.fromJSON(JSON.stringify(result)).kiElement).toBe(
      element.id
    );
    expect(result.armorType).toBe('cut');
    expect(result.damageFinal).toBe(
      computeCombatResult(
        { ...restored, kiElement: '' },
        { defenderId: 'defender', defenseAbility: 100, armor: 0 }
      ).damageFinal
    );
  }
);

test('old messages default to no element and unknown elements are discarded', () => {
  expect(ABFAttackData.fromJSON({}).kiElement).toBe('');
  expect(ABFAttackData.fromJSON({ kiElement: 'metal' }).kiElement).toBe('');
});
