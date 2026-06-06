import { registerSettings, ABFSettingsKeys } from './utils/registerSettings';
import { Logger, TEMPLATE_PATHS } from './utils';
import ABFActorSheet from './module/actor/ABFActorSheet';
import ABFFoundryRoll from './module/rolls/ABFFoundryRoll';
import ABFCombat from './module/combat/ABFCombat';
import { ABFActor } from './module/actor/ABFActor';
import { registerHelpers } from './utils/handlebars-helpers/registerHelpers';
import ABFItemSheet from './module/items/ABFItemSheet';
import { ABFConfig } from './module/ABFConfig';
import ABFItem from './module/items/ABFItem';
import ABFActorDirectory from './module/SidebarDirectories/ABFActorDirectory';
import { registerCombatWebsocketRoutes } from './module/combat/websocket/registerCombatWebsocketRoutes';
import { attachCustomMacroBar } from './utils/attachCustomMacroBar';
import { registerKeyBindings } from './utils/registerKeyBindings';
import { applyMigrations } from './module/migration/migrate';
import { registerGlobalTypes } from './utils/registerGlobalTypes';
import ABFCombatant from './module/combat/ABFCombatant';

import { chatActionHandlers } from './utils/chatActionHandlers.js';
import { preloadClickHandlers } from './module/actor/utils/createClickHandlers.js';

import { ABFAttackData } from './module/combat/ABFAttackData.js';
import { getChatContextMenuFactories } from './utils/buildChatContextMenu.js';
import { Templates, HandlebarsPartials } from './module/utils/constants';

import './scss/animabf.scss';

import { System, registerSystemOnGame } from './utils/systemMeta';

import { resolveTokenName } from './utils/tokenName.js';
import { FormulaEvaluator } from './utils/formulaEvaluator.js';

import { registerHandlebarsPartials } from './utils/handlebarsPartials.js';

import { macroCreators, macroExecutors } from './utils/macroCreatorRegistry.js';

/* ------------------------------------ */
/* Initialize system */
/* ------------------------------------ */
Hooks.once('init', async () => {
  Logger.log('Initializing system');
  registerSystemOnGame();
  Logger.log(`Game Id:${System.id}`);

  window.ABFFoundryRoll = ABFFoundryRoll;
  CONFIG.Dice.rolls = [ABFFoundryRoll, ...CONFIG.Dice.rolls];

  // Load Handlebars templates
  await (foundry.applications.handlebars.loadTemplates ?? loadTemplates)(TEMPLATE_PATHS);
  await registerHandlebarsPartials(HandlebarsPartials);

  // Assign custom classes and constants here
  CONFIG.Actor.documentClass = ABFActor;

  CONFIG.config = ABFConfig;

  CONFIG.Combat.documentClass = ABFCombat;
  CONFIG.Combatant.documentClass = ABFCombatant;

  CONFIG.Item.documentClass = ABFItem;
  CONFIG.ui.actors = ABFActorDirectory;

  const ActorsCollection = foundry.documents?.collections?.Actors ?? Actors;
  const ItemsCollection = foundry.documents?.collections?.Items ?? Items;
  const ActorSheetV1 = foundry.appv1?.sheets?.ActorSheet ?? ActorSheet;
  const ItemSheetV1 = foundry.appv1?.sheets?.ItemSheet ?? ItemSheet;

  // Register custom sheets (if any)
  ActorsCollection.unregisterSheet('core', ActorSheetV1);
  ActorsCollection.registerSheet(System.id, ABFActorSheet, { makeDefault: true });

  ItemsCollection.unregisterSheet('core', ItemSheetV1);
  ItemsCollection.registerSheet(System.id, ABFItemSheet, {
    makeDefault: true
  });

  // Register custom system settings
  registerSettings(System.id);

  registerHelpers();

  registerKeyBindings();

  // Warm-up click handlers so they stay cached for later use from sheets
  preloadClickHandlers();
});

/* ------------------------------------ */
/* Setup system */
/* ------------------------------------ */
Hooks.once('setup', () => {
  // Do anything after initialization but before
  // ready
});

/* ------------------------------------ */
/* When ready */
/* ------------------------------------ */
Hooks.once('ready', async () => {
  if (game.user.isGM) {
    const creationVersion = game.settings.get(
      System.id,
      ABFSettingsKeys.WORLD_CREATION_SYSTEM_VERSION
    );
    if (!creationVersion) {
      await game.settings.set(
        System.id,
        ABFSettingsKeys.WORLD_CREATION_SYSTEM_VERSION,
        game.system.version
      );
      console.log(`Registrada versión de creación del mundo: ${game.system.version}`);
    }
  }

  registerCombatWebsocketRoutes();
  // attachCustomMacroBar();
  applyMigrations();
  registerGlobalTypes();

  // --- Expose public API for user macros (ABFAttackData) ---
  game.animabf ??= {};
  game.animabf.api ??= {};
  Object.assign(game.animabf.api, { ABFAttackData });

  // --- Maneuvers API ---
  // Auto-registers Derribo / Desarme / Presa via the index module.
  try {
    const { maneuverRegistry } = await import('./module/combat/maneuvers/index.js');
    const { executeManeuverPostCombat } = await import(
      './module/combat/maneuvers/executeManeuver.js'
    );
    const { registerGrappleRelationalSync } = await import(
      './module/combat/maneuvers/grappleRelationalSync.js'
    );
    game.animabf.maneuvers = {
      get: slug => maneuverRegistry.get(slug),
      all: () => maneuverRegistry.all(),
      executePostCombat: executeManeuverPostCombat
    };
    registerGrappleRelationalSync();
  } catch (e) {
    console.warn('[ABF] maneuvers API not initialized:', e);
  }

  // --- Equipment qualities API ---
  // Auto-registers Precisa / Compleja / Lanzable / Presa / Traba el arma /
  // Arma a dos manos / Arma a una o dos manos via the index module.
  try {
    const { equipmentQualityRegistry } = await import(
      './module/equipment/qualities/index.js'
    );
    const composeMod = await import(
      './module/equipment/qualities/composeWeaponEffects.js'
    );
    game.animabf.equipmentQualities = {
      get: slug => equipmentQualityRegistry.get(slug),
      all: () => equipmentQualityRegistry.all(),
      allForSlot: slot => equipmentQualityRegistry.allForSlot(slot),
      composeAimedPenalty: composeMod.composeAimedPenalty,
      composeManeuverPenalty: composeMod.composeManeuverPenalty
    };
  } catch (e) {
    console.warn('[ABF] equipment qualities API not initialized:', e);
  }

  game.animabf.macros ??= {};

  game.animabf.macros.execute = async ({ id, actorUuid, itemUuid }) => {
    const exec = macroExecutors[id];
    if (typeof exec !== 'function') return;

    const actor = await fromUuid(actorUuid);
    const item = await fromUuid(itemUuid);
    if (!actor || !item) return;

    return exec({ actor, item });
  };

  // GM-side socket to update attack targets flag
  game.socket.on('system.animabf', async p => {
    if (!game.user.isGM) return;
    if (!p) return;

    if (p.op === 'updateAttackTargets') {
      const msg = game.messages.get(p.messageId);
      if (!msg) return;
      const kind = msg.getFlag(System.id, 'kind');
      if (kind !== 'attackData') return;

      const entry = p.entry ?? {};
      const targets = foundry.utils.duplicate(msg.getFlag(System.id, 'targets') ?? []);

      const findIndexByKey = (arr, e) => {
        if (e.tokenUuid) {
          const iTok = arr.findIndex(t => t.tokenUuid === e.tokenUuid);
          if (iTok >= 0) return iTok;
        }
        if (e.actorUuid && !e.tokenUuid) {
          return arr.findIndex(t => t.actorUuid === e.actorUuid && !t.tokenUuid);
        }
        return -1;
      };

      const i = findIndexByKey(targets, entry);
      if (i >= 0) targets[i] = { ...targets[i], ...entry };
      else targets.push(entry);

      await msg.setFlag(System.id, 'targets', targets);
      ui.chat?.updateMessage?.(msg);
      return;
    }

    // Critical hit phase update — proxied through GM because players cannot
    // setFlag/update chat messages they don't own. GM renders the content
    // in his own locale so all clients see consistent text.
    if (p.op === 'critUpdate') {
      const msg = game.messages.get(p.messageId);
      if (!msg) return;

      const animabf = msg.flags?.animabf ?? {};
      const current = animabf.result ?? {};
      const updated = { ...current, ...(p.patch ?? {}) };

      const { Templates } = await import('./module/utils/constants.js');
      const renderFn = foundry.applications?.handlebars?.renderTemplate ?? renderTemplate;
      const content = await renderFn(Templates.Chat.CombatResult, {
        combatResult: updated,
        defenderId: animabf.defender?.actorId ?? '',
        defenderTokenId: animabf.defender?.tokenId ?? ''
      });

      await msg.setFlag(System.id, 'result', updated);
      await msg.update({ content });
      return;
    }

    // Maneuver opposed check — a player triggered their D10 roll but cannot
    // setFlag on a message they don't own. We persist for them, then run the
    // automatic resolution if both sides have rolled.
    if (p.op === 'updateManeuverRoll') {
      const msg = game.messages.get(p.messageId);
      if (!msg) return;
      const animabf = msg.flags?.animabf ?? {};
      if (animabf.kind !== 'maneuverOpposedCheck') return;
      const side = p.side;
      const roll = p.roll;
      if (!roll || !['attacker', 'defender'].includes(side)) return;

      const key = side === 'attacker' ? 'attackerRoll' : 'defenderRoll';
      await msg.setFlag(System.id, key, roll);

      const { resolveManeuverOpposedCheck } =
        await import('./module/combat/maneuvers/resolveManeuverOpposedCheck.js');
      await resolveManeuverOpposedCheck(msg);
    }
  });
});

async function _handleChatMessage(message, html) {
  // Re-render combat result messages in each client's own locale so the
  // displayed language always matches the viewer's Foundry language setting,
  // regardless of who originally posted or updated the message.
  if (message.getFlag(System.id, 'kind') === 'combatResult') {
    try {
      const animabf = message.flags?.animabf ?? {};
      const { Templates } = await import('./module/utils/constants.js');
      const renderFn = foundry.applications?.handlebars?.renderTemplate ?? renderTemplate;
      const content = await renderFn(Templates.Chat.CombatResult, {
        combatResult: animabf.result ?? {},
        defenderId: animabf.defender?.actorId ?? '',
        defenderTokenId: animabf.defender?.tokenId ?? ''
      });
      const target = html.querySelector('.message-content') ?? html;
      if (target) target.innerHTML = content;
    } catch (err) {
      console.error('[ABF] failed to re-render combatResult message:', err);
    }
  }

  if (message.getFlag(System.id, 'kind') === 'maneuverOpposedCheck') {
    try {
      const flags = message.flags?.animabf ?? {};
      const { Templates } = await import('./module/utils/constants.js');
      const renderFn = foundry.applications?.handlebars?.renderTemplate ?? renderTemplate;
      const content = await renderFn(Templates.Chat.ManeuverOpposedCheck, {
        flags,
        messageId: message.id
      });
      const target = html.querySelector('.message-content') ?? html;
      if (target) target.innerHTML = content;
    } catch (err) {
      console.error('[ABF] failed to render maneuverOpposedCheck message:', err);
    }
  }

  html.addEventListener('click', e => {
    const btn = e.target.closest('.contractible-button');
    if (btn) btn.closest('.contractible-group')?.classList.toggle('contracted');
  });

  if (!game.user.isGM) {
    html.querySelectorAll('.only-if-gm, [data-requires-permission="gm"]').forEach(el => el.remove());
  }
  const speakerActorId = message.speaker?.actor;
  const speakerActor = speakerActorId ? game.actors.get(speakerActorId) : null;
  if (
    speakerActor &&
    !speakerActor.testUserPermission(game.user, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER)
  ) {
    html.querySelectorAll('.only-if-owner, [data-requires-permission="owner"]').forEach(el => el.remove());
  }

  html.addEventListener('click', e => {
    const btn = e.target.closest('.chat-action-button');
    if (!btn) return;
    const { action } = btn.dataset;
    const handler = chatActionHandlers[action];
    if (handler) handler(message, html, btn.dataset);
    else console.warn(`No handler found for action: ${action}`);
  });

  if (message.getFlag(System.id, 'kind') !== 'attackData') return;

  const flags = message.flags?.animabf ?? {};
  const targets = Array.isArray(flags.targets) ? [...flags.targets] : [];

  const rowId = `animabf-defense-row-${message.id}`;
  const row = html.querySelector(`#${rowId}`);
  if (!row) return;

  if (!targets.length) {
    row.innerHTML = '';
    if (game.user.isGM) {
      row.innerHTML = `<span class="hint" style="opacity:.7;">${game.i18n.localize('chat.attackData.noTargets')}</span>`;
    }
    return;
  }

  const order = { pending: 0, rolling: 1, done: 2, expired: 3 };
  targets.sort((a, b) => (order[a.state] ?? 99) - (order[b.state] ?? 99));

  const me = game.user;
  const enriched = targets.map(t => {
    const actor = t.actorUuid ? game.actors.get(t.actorUuid) : null;
    const canDefend =
      me.isGM || actor?.testUserPermission?.(me, CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER);
    const state = t.state ?? 'pending';
    const dot =
      state === 'done'
        ? '🟢'
        : state === 'rolling'
        ? '🟠'
        : state === 'expired'
        ? '⚪'
        : '🟡';

    const rollerName =
      state !== 'pending' && t.rolledBy
        ? game.users.get(t.rolledBy)?.name ?? t.rolledBy
        : null;

    const rollerTitle = rollerName
      ? game.i18n.format('chat.attackData.rollingBy', { name: rollerName })
      : '';

    // Token name resolver: UUID -> canvas -> same scene -> any scene
    const tokenName = (() => {
      const id = t.tokenUuid;
      if (!id) return null;
      try {
        if (typeof id === 'string' && id.includes('.')) {
          const doc = fromUuidSync(id);
          return doc?.name ?? doc?.document?.name ?? doc?.object?.name ?? null;
        }
        const onCanvas = canvas?.tokens?.get?.(id);
        if (onCanvas) return onCanvas.name ?? onCanvas.document?.name ?? null;

        const sceneId = message.speaker?.scene;
        if (sceneId) {
          const tok = game.scenes?.get(sceneId)?.tokens?.get?.(id);
          if (tok) return tok.name;
        }

        for (const s of game.scenes) {
          const tok = s.tokens?.get?.(id);
          if (tok) return tok.name;
        }
      } catch {}
      return null;
    })();

    const tokenLabel = resolveTokenName(
      { tokenUuid: t.tokenUuid, actorUuid: t.actorUuid },
      { message }
    );

    const label =
      t.label ?? tokenLabel ?? actor?.name ?? game.i18n.localize('chat.common.target');

    return {
      messageId: message.id,
      actorUuid: t.actorUuid ?? '',
      tokenUuid: t.tokenUuid ?? '',
      state,
      stateDot: dot,
      stateLabel: game.i18n.localize(`chat.attackData.state.${state}`),
      rollerName,
      rollerTitle,
      label,
      showDefendButton: !!(canDefend && state === 'pending')
    };
  });

  const fn = foundry.applications?.handlebars?.renderTemplate ?? renderTemplate;
  const chipsHTML = await fn(Templates.Chat.AttackTargetsChips, { targets: enriched });
  row.innerHTML = chipsHTML;
}

// renderChatMessageHTML available since v13 (renderChatMessage deprecated in v13, removed in v15)
Hooks.on('renderChatMessageHTML', (message, html) => _handleChatMessage(message, html));

// Auto-apply the 'Inconsciente' AE to the defender when a critical resolved
// through the Inconsciencia maneuver yields unconsciousness. Lives close to
// the maneuver auto-post hook for symmetry.
Hooks.on('updateChatMessage', async (message, _changes) => {
  try {
    if (!game.user.isGM) return;
    const flags = message.flags?.[System.id];
    if (!flags) return;
    if (flags.kind !== 'combatResult') return;
    const result = flags.result ?? {};
    if (result.critPhase !== 'done') return;
    if (!result.critEffects?.unconscious) return;

    // Only when the maneuver context says Inconsciencia.
    const slug = result.maneuverSlug || flags.attackData?.maneuverSlug || '';
    if (slug !== 'inconsciencia') return;

    // Guard against double application: tag the result once and bail next time.
    if (result.unconsciousApplied) return;

    // Token-aware: prefer the stored token id so the effect lands on the
    // on-map (possibly unlinked) token actor, not the base sidebar actor.
    const { resolveActorFromRef } = await import(
      './module/actor/utils/resolveActorForRoll.js'
    );
    const defenderActor =
      resolveActorFromRef(flags.defender?.tokenId) ??
      resolveActorFromRef(flags.defender?.actorId);
    if (!defenderActor) return;

    const pack = game.packs.get(`${System.id}.effects`);
    if (!pack) return;
    const docs = await pack.getDocuments();
    const source = docs.find(d => d.name === 'Inconsciente');
    if (!source) {
      ui.notifications?.warn('Efecto "Inconsciente" no encontrado en el compendio.');
      return;
    }

    const data = source.toObject();
    delete data._id;
    delete data._key;
    delete data.folder;
    await defenderActor.createEmbeddedDocuments('Item', [data]);

    await message.setFlag(System.id, 'result', {
      ...result,
      unconsciousApplied: true
    });
  } catch (err) {
    console.error('[ABF] auto-apply Inconsciente failed:', err);
  }
});

// Auto-post the maneuver opposed-check card when a combatResult or
// multiDefenseResult resulting from a maneuver attack reaches the threshold.
Hooks.on('createChatMessage', async message => {
  try {
    if (!game.user.isGM) return;
    const flags = message.flags?.[System.id];
    if (!flags) return;

    // refs may be a token uuid, a plain token id, or (legacy) an actor id.
    // resolveActorFromRef resolves all three, preferring the token so unlinked
    // tokens map to their own token actor instead of the base sidebar actor.
    const { resolveActorFromRef } =
      await import('./module/actor/utils/resolveActorForRoll.js');

    // Desangramiento automático: al CREARSE la tarjeta de un crítico, iniciar la
    // hemorragia sin esperar a "Resolver crítico" (RAW: recibir un crítico
    // desangra aunque luego se resista). startBleeding se auto-protege
    // (inmunidad/energía/no apila), así que es idempotente con el disparo del
    // flujo de resolución/forzado. Va antes del bloque `post` porque ese hace
    // return temprano cuando el mensaje no proviene de una maniobra.
    // Excepción: Daño retrasado difiere el daño Y su desangrado a cuando se
    // manifiesta (processDueDelayedDamage), así que NO sangra en el impacto.
    if (
      flags.kind === 'combatResult' &&
      flags.result?.isCritical &&
      flags.result?.maneuverSlug !== 'dano-retrasado'
    ) {
      const defRef = flags.defender?.tokenId || flags.defender?.actorId || '';
      const defenderActor = resolveActorFromRef(defRef);
      if (defenderActor) {
        const critType = flags.attackData?.armorType ?? flags.result?.armorType ?? '';
        const { startBleeding } = await import('./module/combat/bleedingEffect.js');
        await startBleeding(defenderActor, { critType });
      }
    }

    // Daño retrasado: programar automáticamente el daño diferido al crearse la
    // tarjeta (sin botón). Mismo punto GM-only que el auto-sangrado; reutiliza
    // makeDelayedDamageEntry y el flag scheduledDamages que procesa
    // ABFCombat.nextRound. Requiere combate activo para fijar la ronda de venc.
    if (
      flags.kind === 'combatResult' &&
      flags.result?.maneuverSlug === 'dano-retrasado' &&
      Number(flags.result?.damageFinal ?? 0) > 0 &&
      Number.isFinite(game.combat?.round)
    ) {
      const defRef = flags.defender?.tokenId || flags.defender?.actorId || '';
      const defenderActor = resolveActorFromRef(defRef);
      if (defenderActor) {
        const { makeDelayedDamageEntry } = await import('./module/combat/delayedDamage.js');
        const entry = makeDelayedDamageEntry({
          currentRound: game.combat.round,
          delayRounds: Number(flags.result?.delayRounds ?? 0) || 0,
          amount: Number(flags.result?.damageFinal ?? 0) || 0,
          attackerId: flags.result?.attackerId ?? flags.attacker?.actorId ?? '',
          bleeding: true
        });
        if (entry) {
          const prev = defenderActor.getFlag(System.id, 'scheduledDamages');
          const list = Array.isArray(prev) ? [...prev, entry] : [entry];
          await defenderActor.setFlag(System.id, 'scheduledDamages', list);
        }
      }
    }

    const post = async (
      slug,
      itemName,
      attackerRef,
      defenderRef,
      damagePercent,
      maneuverWasUnarmed = false
    ) => {
      const def = game.animabf?.maneuvers?.get?.(slug);
      if (!def) return;
      if (damagePercent < (def.damageThresholdPercent ?? 10)) return;
      const attackerActor = resolveActorFromRef(attackerRef);
      const defenderActor = resolveActorFromRef(defenderRef);
      if (!attackerActor || !defenderActor) return;

      // Family A — no opposed check. Apply the maneuver's effects directly.
      if (def.noOpposedCheck) {
        const { applyManeuverEffectsDirectly } =
          await import('./module/combat/maneuvers/applyManeuverEffectsDirectly.js');
        await applyManeuverEffectsDirectly({
          maneuver: def,
          maneuverItemName: itemName || slug,
          attackerActor,
          defenderActor,
          damagePercent
        });
        return;
      }

      // Family default — opposed check between attacker and defender. Pass the
      // token refs through so the resolver (and the relational grapple flags)
      // keep pointing at the on-map token actors.
      const { postManeuverOpposedCheck } =
        await import('./module/combat/maneuvers/postManeuverOpposedCheck.js');
      await postManeuverOpposedCheck({
        maneuverSlug: slug,
        maneuverItemName: itemName || slug,
        attackerActor,
        defenderActor,
        attackerTokenUuid: attackerRef,
        defenderTokenUuid: defenderRef,
        damagePercent,
        maneuverWasUnarmed
      });
    };

    // Standalone combatResult (single-target DefenseConfigurationDialog).
    // flags.attacker/defender carry { actorId, tokenId } — prefer the tokenId.
    if (flags.kind === 'combatResult') {
      const result = flags.result ?? {};
      const slug = result.maneuverSlug;
      if (!slug) return;
      const attackerRef =
        flags.attacker?.tokenId ||
        result.attackerId ||
        flags.attacker?.actorId ||
        '';
      const defenderRef = flags.defender?.tokenId || flags.defender?.actorId || '';
      const wasUnarmed = !!flags.attackData?.maneuverWasUnarmed;
      await post(
        slug,
        result.maneuverItemName,
        attackerRef,
        defenderRef,
        Number(result.damagePercentage ?? 0),
        wasUnarmed
      );
      return;
    }

    // multiDefenseResult (auto-defense). The maneuver flags are copied onto
    // the multiDefenseResult itself by the autoDefend handlers, so we don't
    // depend on the (sometimes-null) sourceAttackMessageId. Entries carry a
    // full tokenUuid per defender; the attacker only has an actor id here.
    if (flags.kind === 'multiDefenseResult') {
      const slug = flags.maneuverSlug;
      if (!slug) return;
      const itemName = flags.maneuverItemName || slug;
      const attackerRef = flags.attackerId || '';
      const wasUnarmed = !!flags.maneuverWasUnarmed;
      const entries = flags.entries ?? [];
      for (const entry of entries) {
        const defenderRef = entry.tokenUuid || entry.actorUuid || entry.actorId || '';
        const dmg = Number(entry.damagePercentage ?? 0);
        await post(slug, itemName, attackerRef, defenderRef, dmg, wasUnarmed);
      }
    }
  } catch (err) {
    console.error('[ABF] auto-post maneuverOpposedCheck failed:', err);
  }
});

// ─── Active Effect drag-and-drop entry points ─────────────────────
// Effects only materialized their AE when dropped on an open sheet. The same
// item dropped on a token, an actor in the sidebar, or created via macro/code
// left the actor without the AE. Hook every entry point so all paths produce
// a linked AE consistently.

import {
  ensureLinkedEffectForItem,
  removeLinkedEffectForItem,
  actorHasEffectItemNamed
} from './module/actor/utils/ensureLinkedEffectForItem.js';
import { ABFItems as _ABFItems } from './module/items/ABFItems.js';

// Prevent duplicate status effects: in Anima no compendium effect is meant to
// be present twice on the same actor. If an effect-type Item with the same name
// is already there, cancel the creation (returning false aborts it). This stops
// e.g. two "Derribado" / "Ceguera parcial" Items piling up and double-applying
// their modifiers. Returning false here means the second copy never exists.
Hooks.on('preCreateItem', (item, _data, _options, userId) => {
  if (userId !== game.user.id) return true;
  if (item?.type !== _ABFItems.EFFECT) return true;
  const parent = item.parent;
  if (!parent || parent.documentName !== 'Actor') return true;
  if (actorHasEffectItemNamed(parent, item.name)) {
    ui.notifications?.info(`"${item.name}" ya está activo; no se duplica.`);
    return false; // abort creation
  }
  return true;
});

Hooks.on('createItem', async (item, _options, userId) => {
  if (userId !== game.user.id) return;
  if (item?.type !== _ABFItems.EFFECT) return;
  if (!item.parent || item.parent.documentName !== 'Actor') return;
  try {
    await ensureLinkedEffectForItem(item.parent, item);
  } catch (e) {
    console.warn('[ABF] ensureLinkedEffectForItem failed on createItem:', e);
  }
});

// Counterpart to the createItem hook: when an effect Item is removed from an
// actor, delete the AE we materialised from its `system.effectData`. Foundry
// cascade-deletes only the AEs embedded *inside* the Item, not the separate
// origin-linked AE we created, so without this the modifiers (e.g. Cargando's
// +10/-10/-20) survive after the maneuver is toggled off or the item deleted.
Hooks.on('deleteItem', async (item, _options, userId) => {
  if (userId !== game.user.id) return;
  if (item?.type !== _ABFItems.EFFECT) return;
  if (!item.parent || item.parent.documentName !== 'Actor') return;
  try {
    await removeLinkedEffectForItem(item.parent, item);
  } catch (e) {
    console.warn('[ABF] removeLinkedEffectForItem failed on deleteItem:', e);
  }
});

// When an effect item is dropped on a token in the canvas, Foundry fires
// `dropCanvasData` but does NOT auto-create the item on the token actor
// (it ignores Item drops on tokens by default in some configs). Intercept
// it ourselves so dropping on a token has the same effect as dropping on
// the open sheet: the item is created on the token actor and its AE linked.
Hooks.on('dropCanvasData', async (_canvas, data) => {
  try {
    if (!data || data.type !== 'Item') return true; // let other handlers run

    // Resolve drop target token (under cursor) — Foundry stores it on data
    // for tokens layer, fall back to currently hovered token.
    const x = data.x;
    const y = data.y;
    let token = null;
    if (typeof x === 'number' && typeof y === 'number') {
      // Find token whose document bounds contain the drop point
      token = canvas.tokens?.placeables?.find(t => {
        const w = t.document?.width ?? 1;
        const h = t.document?.height ?? 1;
        const gs = canvas.grid?.size ?? 100;
        const tx = t.document?.x ?? 0;
        const ty = t.document?.y ?? 0;
        return x >= tx && x < tx + w * gs && y >= ty && y < ty + h * gs;
      }) ?? null;
    }
    if (!token?.actor) return true;

    // Resolve the source Item document from drag uuid
    const item = await fromUuid(data.uuid);
    if (!item || item.documentName !== 'Item') return true;
    if (item.type !== _ABFItems.EFFECT) return true;

    // Build a fresh item to embed on the token actor (clone of source)
    const itemData = item.toObject();
    delete itemData._id;
    delete itemData._key;
    delete itemData.folder;

    const [created] = await token.actor.createEmbeddedDocuments('Item', [itemData]);
    if (!created) return true;

    // ensureLinkedEffectForItem will also be called via the `createItem`
    // hook above on most configurations; calling it here too is idempotent
    // (returns the existing AE if it was already created).
    await ensureLinkedEffectForItem(token.actor, created);
    return false; // we handled the drop
  } catch (e) {
    console.warn('[ABF] dropCanvasData effect handler failed:', e);
  }
  return true;
});

// ─── Active Effect traceability on roll messages ──────────────────
// Appends a short "Mod: AE-name (+/-N)" line to the flavor of any chat
// message that carries a Roll, so the contribution of active effects to the
// rolled attribute is visible in chat. Inferred from the flavor text (es/en/fr).

import {
  inferAttributeFromFlavor,
  ATTRIBUTE_PATHS
} from './module/actor/utils/attributeDerivationMap.js';
import {
  getPathContributions,
  formatContributions
} from './module/actor/utils/activeEffectsBreakdown.js';
import { resolveActorForRoll } from './module/actor/utils/resolveActorForRoll.js';
import { getRollOptions } from './module/actor/utils/effectFow/rollOptions/rollOptions.js';

Hooks.on('preCreateChatMessage', (message, _data, _options, _userId) => {
  try {
    const rolls = message.rolls;
    if (!Array.isArray(rolls) || rolls.length === 0) return;

    const flavor = message.flavor ?? message.flags?.core?.flavor ?? '';

    // If the message carries an explicit rollAttribute flag (set by the
    // defense dialogs / auto-defense path), use it. Otherwise fall back to
    // inferring from the flavor text. The flag avoids ambiguity when the
    // flavor is generic (e.g. "Defensa" instead of "Parada" / "Esquiva").
    const explicitAttr = message.flags?.animabf?.rollAttribute;
    let attribute;
    if (explicitAttr === 'block' || explicitAttr === 'dodge') {
      attribute = explicitAttr;
    } else if (explicitAttr === 'shield') {
      // Supernatural shields use the projection skill; trace under both
      // magic and psychic defensive projections — the hook user only sees
      // contributions matching the actual shield type via path filtering.
      attribute = 'magicProjectionDefensive';
    } else {
      attribute = inferAttributeFromFlavor(flavor);
    }

    // Resolve the data path(s) whose contributions to trace. A known logical
    // attribute (combat / projection / initiative) maps via ATTRIBUTE_PATHS;
    // otherwise, sheet rollables (resistances, characteristics, abilities…)
    // carry the exact `rollPath` they rolled — trace that path directly, with
    // no attribute inference and no collision risk.
    let paths = attribute ? ATTRIBUTE_PATHS[attribute] : null;
    if (!Array.isArray(paths) || paths.length === 0) {
      const rollPath = message.flags?.animabf?.rollPath;
      paths = typeof rollPath === 'string' && rollPath ? [rollPath] : null;
    }
    if (!Array.isArray(paths) || paths.length === 0) return;

    // Resolve actor — prefer the token actor when possible (unlinked AE).
    const speaker = message.speaker ?? {};
    const actor = resolveActorForRoll({
      tokenId: speaker.token,
      actorId: speaker.actor
    });
    if (!actor) return;

    // Pass the actor's roll options so predicate-gated contributions only
    // appear when their condition holds (Phase 3 wiring). getRollOptions builds
    // the set if the actor wasn't prepared through the flow yet.
    const rollOptions = getRollOptions(actor);
    const contributions = getPathContributions(actor, paths, rollOptions);
    if (contributions.length === 0) return;

    const line = formatContributions(contributions);
    if (!line) return;

    const newFlavor = flavor
      ? `${flavor}<br><span class="animabf-ae-trace" style="opacity:.75;font-size:.85em;">${line}</span>`
      : line;

    message.updateSource({ flavor: newFlavor });
  } catch (err) {
    console.warn('[ABF] AE trace failed:', err);
  }
});

Hooks.on('getChatMessageContextOptions', (_app, menu) => {
  const menuItemFactories = getChatContextMenuFactories();

  for (const makeItem of menuItemFactories) {
    const item = makeItem();
    if (Array.isArray(item)) menu.push(...item);
    else menu.push(item);
  }
});

Hooks.on('chatMessage', (chatLog, message, chatData) => {
  if (!message || !message.includes('@formula{')) return;
  if (chatData._animabfFormulaDone) return;

  const speaker = chatData.speaker || {};
  let actor = null;

  if (speaker.actor) {
    actor = game.actors.get(speaker.actor) ?? actor;
  }

  if (!actor && speaker.token) {
    try {
      const tokenDoc = fromUuidSync(speaker.token);
      actor = tokenDoc?.actor ?? actor;
    } catch (e) {
      console.error('Formula @ speaker.token resolve error', e);
    }
  }

  if (!actor && canvas?.tokens?.controlled?.length) {
    actor = canvas.tokens.controlled[0]?.actor ?? actor;
  }

  const replaced = message.replace(/@formula\{([^}]+)\}/g, (match, inner) => {
    const value = FormulaEvaluator.evaluate(inner, actor);
    return value ?? match;
  });

  if (replaced === message) return;

  chatData._animabfFormulaDone = true;
  chatLog.processMessage(replaced, chatData);
  return false;
});

Hooks.on('renderActiveEffectConfig', (app, html) => {
  const transfer = html.find('input[name="transfer"]');
  if (!transfer.length) return;

  transfer.prop('checked', false);
  transfer.prop('disabled', true);

  transfer.closest('.form-group').hide();
});

Hooks.on('renderTokenHUD', async (hud, html) => {
  const root = hud.element ?? html?.[0];
  if (!root) return;

  const token = hud.object;
  const actor = token?.actor;
  if (!actor) return;

  const flagSystem = game.animabf.id;
  const flagKey = 'defensesCounter';

  const defensesCounter = (await actor.getFlag(flagSystem, flagKey)) ?? {
    accumulated: 0,
    keepAccumulating: true
  };
  const currentValue = Number(defensesCounter.accumulated) || 0;

  const middleCol = root.querySelector('.col.middle');
  if (!middleCol) return;

  let control = middleCol.querySelector('.attribute.abf-flag-value');
  if (!control) {
    control = document.createElement('div');
    control.classList.add('attribute', 'abf-flag-value');
    control.dataset.tooltip = 'Defensas adicionales';
    control.innerHTML = `
      <label style="margin-right: 4px;">DEF</label>
      <input type="number" name="abfFlagValue" min="0" step="1" value="0">
    `;
    middleCol.prepend(control);
  }

  const input = control.querySelector("input[name='abfFlagValue']");
  if (!input) return;

  input.value = currentValue;

  input.onchange = async ev => {
    ev.stopPropagation();
    const newValue = Number(ev.target.value) || 0;

    await actor.setFlag(flagSystem, flagKey, {
      ...defensesCounter,
      accumulated: newValue
    });
  };
});

Hooks.on('hotbarDrop', async (_bar, data, slot) => {
  if (data?.type !== 'Item' || !data.uuid) return;

  const item = await fromUuid(data.uuid);
  if (!item) return;

  const actor = item.parent;
  if (!actor) return; // No actor -> no macro

  const creatorId = item.system?.hotbarMacroCreatorId;
  if (!creatorId) return; // No reference -> do nothing (let Foundry default)

  const creator = macroCreators[creatorId];
  if (typeof creator !== 'function') return; // Unknown id -> do nothing

  // Let the creator build+assign the macro. If it returns true => we handled it.
  const handled = await creator({ actor, item, slot });
  if (handled) return false; // Prevent default behavior
});

// // Auto-number unlinked tokens as "{name} (n)" when dropped
// Hooks.on('createToken', async doc => {
//   // Ignore linked tokens
//   if (doc.actorLink) return;

//   // Helper to escape regex
//   const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

//   const baseName = doc.name ?? doc.actor?.name ?? 'Token';
//   const rx = new RegExp(`^${esc(baseName)}(?: \\((\\d+)\\))?$`);

//   // Find siblings with same baseName
//   const siblings = doc.parent.tokens.filter(
//     t => t.id !== doc.id && rx.test(t.name ?? '')
//   );
//   let max = 0;
//   for (const t of siblings) {
//     const m = (t.name ?? '').match(rx);
//     if (m) max = Math.max(max, m[1] ? Number(m[1]) : 1);
//   }

//   const next = max ? max + 1 : 1;
//   await doc.update({ name: `${baseName} (${next})` });
// });

// Add any additional hooks if necessary

// This function allow us to use xRoot in templates to extract the root object in Handlebars template
// So, instead to do ../../../ etc... to obtain rootFolder, use xRoot instead
// https://handlebarsjs.com/guide/expressions.html#path-expressions

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
// eslint-disable-next-line func-names
Handlebars.JavaScriptCompiler.prototype.nameLookup = function (parent, name) {
  if (name.indexOf('xRoot') === 0) {
    return 'data.root';
  }

  if (/^[0-9]+$/.test(name)) {
    return `${parent}[${name}]`;
  }

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (Handlebars.JavaScriptCompiler.isValidJavaScriptVariableName(name)) {
    return `${parent}.${name}`;
  }

  return `${parent}['${name}']`;
};
