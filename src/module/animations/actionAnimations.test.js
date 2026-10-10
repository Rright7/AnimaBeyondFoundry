import { jest } from '@jest/globals';
import {
  playCombatResultAnimation,
  playMultiDefenseAnimation
} from './combatAnimations.js';
import { registerAnimationHooks } from './registerAnimations.js';

let files;
let hooks;
let token;
let actor;
let endEffects;

beforeEach(() => {
  files = [];
  hooks = {};
  token = { id: 'token' };
  actor = { flags: { animabf: {} }, getActiveTokens: () => [token] };
  game.user = { id: 'gm' };
  game.users = { activeGM: game.user };
  game.modules = new Map([
    ['sequencer', { active: true }],
    ['JB2A_DnD5e', { active: true }]
  ]);
  game.settings.get = () => true;
  globalThis.canvas = { tokens: { get: id => (id === token.id ? token : null) } };
  endEffects = jest.fn();
  globalThis.Sequencer = {
    Database: { entryExists: () => true },
    EffectManager: { endEffects }
  };
  globalThis.Sequence = function () {
    const chain = new Proxy(
      {},
      {
        get:
          (_obj, key) =>
          (...args) => {
            if (key === 'file') files.push(args[0]);
            return key === 'play' ? Promise.resolve() : chain;
          }
      }
    );
    return chain;
  };
  globalThis.Hooks = { on: (event, fn) => (hooks[event] ??= []).push(fn) };
  const getProperty = (obj, path) => path.split('.').reduce((o, key) => o?.[key], obj);
  globalThis.foundry = {
    utils: {
      getProperty,
      hasProperty: (obj, path) => getProperty(obj, path) !== undefined
    }
  };
});

const resultFlags = (difference, damageFinal, defenseType = 'dodge') => ({
  defender: { tokenId: token.id, actorId: 'base-actor' },
  defenseType,
  result: { difference, damageFinal },
  attackData: { isSpell: true, spellVia: 'fire' }
});

test('successful defense replaces spell impact, including ties', async () => {
  await playCombatResultAnimation(resultFlags(0, 0));
  expect(files).toEqual(['jb2a.wind_lines.01.01.white']);
});

test('armor absorbing damage and resisting the hit do not animate a dodge', async () => {
  await playCombatResultAnimation(resultFlags(30, 0));
  await playCombatResultAnimation({ ...resultFlags(-10, 0), resistTheHit: true });
  expect(files).toEqual([]);
});

test('damaging spells still play their elemental impact', async () => {
  await playCombatResultAnimation(resultFlags(30, 20));
  expect(files).toEqual(['jb2a.impact.fire.01.orange']);
});

test('automatic defense reacts only to successful entries with a known type', () => {
  playMultiDefenseAnimation({
    entries: [
      { tokenId: token.id, difference: -10, defenseType: 'block' },
      { tokenId: token.id, difference: 0, defenseType: 'supernaturalShield' },
      { tokenId: token.id, difference: 30, defenseType: 'dodge', damageFinal: 0 },
      { tokenId: token.id, difference: -10, defenseType: 'resistance' },
      { tokenId: token.id, defenseType: 'dodge' }
    ]
  });
  expect(files).toEqual(['jb2a.impact.004.blue', 'jb2a.shield.01.complete.01.blue']);
});

test('only the primary GM broadcasts result reactions', async () => {
  game.user = { id: 'other-gm' };
  await playCombatResultAnimation(resultFlags(-10, 0));
  playMultiDefenseAnimation({
    entries: [{ tokenId: token.id, difference: 0, defenseType: 'block' }]
  });
  expect(files).toEqual([]);
});

test('disabled or absent optional modules leave reactions harmless', async () => {
  game.settings.get = () => false;
  await playCombatResultAnimation(resultFlags(-10, 0));
  game.settings.get = () => true;
  game.modules.clear();
  await playCombatResultAnimation(resultFlags(-10, 0));
  expect(files).toEqual([]);
});

test('Zeon starts and ends its named aura only on the initiating client', () => {
  registerAnimationHooks();
  actor.flags.animabf.accumulatingZeon = true;
  const update = changes => hooks.updateActor.forEach(fn => fn(actor, changes, {}, 'gm'));
  update({ 'flags.animabf.accumulatingZeon': true });
  expect(files).toEqual(['jb2a.energy_field.02.below.blue']);
  actor.flags.animabf.accumulatingZeon = false;
  update({ flags: { animabf: { accumulatingZeon: false } } });
  expect(endEffects).toHaveBeenLastCalledWith({ name: 'abf-zeon-charge-token' });
  expect(files).toHaveLength(1);
  hooks.updateActor.forEach(fn =>
    fn(actor, { 'flags.animabf.accumulatingZeon': true }, {}, 'player')
  );
  expect(files).toHaveLength(1);
});

test('technique activation plays once for combined flags and skips deactivation', () => {
  registerAnimationHooks();
  const item = { type: 'technique', actor };
  const update = changes => hooks.updateItem[0](item, changes, {}, 'gm');
  update({ 'flags.animabf.active': true, 'flags.animabf.freshTurn': true });
  expect(files).toHaveLength(1);
  update({ flags: { animabf: { freshTurn: true } } });
  expect(files).toHaveLength(2);
  update({ 'flags.animabf.active': false, 'flags.animabf.freshTurn': false });
  expect(files).toHaveLength(2);
});
