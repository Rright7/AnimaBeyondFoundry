import { lookupLocation, determineCriticalEffects } from '../../module/combat/criticalTables.js';
import { Templates } from '../../module/utils/constants.js';
import { openCriticalRollDialog } from '../../module/dialogs/combat/CriticalRollDialog.js';
import { ABFSettingsKeys } from '../registerSettings.js';

/**
 * Multi-phase critical hit resolution via chat buttons.
 *
 * Phases stored in flags.animabf.result.critPhase:
 *   (none)          → GM clicks "Resolve Critical"  → phase 'rollCritLevel'
 *   'rollCritLevel' → attacker (or GM) rolls d100    → phase 'rollPhR'
 *   'rollPhR'       → defender (or GM) rolls PhR     → phase 'rollLocation' or 'done'
 *   'rollLocation'  → attacker (or GM) rolls d100    → phase 'done'
 *   'done'          → fully resolved, effects shown
 *
 * Each phase: update flags + re-render message with next button.
 */

// ─── Action routing ───────────────────────────────────────────────

export const handlers = {
  'animabf-resolve-critical': startCriticalResolution,
  'animabf-force-critical': forceCritical,
  'animabf-crit-roll-level': rollCritLevel,
  'animabf-crit-roll-phr': rollPhR,
  'animabf-crit-roll-location': rollLocation
};

// ─── Helpers ──────────────────────────────────────────────────────

function getMsg(message, ds) {
  return game.messages.get(ds.messageId ?? message.id);
}

function getDefenderActor(animabf) {
  const tokenId = animabf.defender?.tokenId ?? '';
  const actorId = animabf.defender?.actorId ?? '';
  const token = tokenId ? canvas.tokens?.get(tokenId) : null;
  return token?.actor ?? (actorId ? game.actors.get(actorId) : null);
}

function getAttackerActor(animabf) {
  const actorId =
    animabf.attacker?.actorId ??
    animabf.attackData?.attackerId ??
    '';
  return actorId ? game.actors.get(actorId) : null;
}

function hasPlayerOwner(actor) {
  if (!actor) return false;
  return game.users
    .filter(u => !u.isGM)
    .some(u => actor.testUserPermission(u, 'OWNER'));
}

function isCurrentUserOwner(actor) {
  if (game.user.isGM) return true;
  return actor?.testUserPermission?.(game.user, 'OWNER') ?? false;
}

/**
 * Check if the current user can perform a critical roll phase based on the
 * world setting (gm | owner) and the actor's player ownership.
 * - GM always passes.
 * - If setting is 'gm' → only GM passes.
 * - If setting is 'owner' → owner of the actor passes (and GM still passes).
 *
 * @param {string} settingKey — ABFSettingsKeys.CRIT_ROLL_*
 * @param {Actor|null} actor — the actor whose owner is allowed to roll
 * @returns {boolean}
 */
function canCurrentUserRoll(settingKey, actor) {
  if (game.user.isGM) return true;
  let setting = 'gm';
  try {
    setting = game.settings.get(game.animabf.id, settingKey) ?? 'gm';
  } catch (e) {
    setting = 'gm';
  }
  if (setting === 'gm') return false;
  return actor?.testUserPermission?.(game.user, 'OWNER') ?? false;
}

/**
 * Roll a plain d100, send to chat so Dice So Nice triggers.
 * @param {object} [opts]
 * @param {string} [opts.flavor] — chat flavor text
 * @param {Actor|null} [opts.actor] — for speaker
 * @returns {Promise<number>}
 */
async function rollPlainD100({ flavor, actor } = {}) {
  const roll = new Roll('1d100');
  await roll.evaluate();
  const speaker = actor
    ? ChatMessage.getSpeaker({ actor })
    : ChatMessage.getSpeaker();
  await roll.toMessage({ speaker, flavor: flavor ?? '' });
  return roll.total;
}

/**
 * Patch the result flag and re-render the message content. If the current user
 * is not the GM, this is proxied through a socket so the GM applies the changes.
 *
 * @param {ChatMessage} msg
 * @param {object} patch — keys to merge into flags.animabf.result
 * @returns {Promise<object>} the updated result (best-effort locally)
 */
async function patchAndRender(msg, patch) {
  const animabf = msg.flags?.animabf ?? {};
  const current = animabf.result ?? {};
  const updated = { ...current, ...patch };

  if (game.user.isGM) {
    // Render in GM's locale and update
    const renderFn = foundry.applications?.handlebars?.renderTemplate ?? renderTemplate;
    const content = await renderFn(Templates.Chat.CombatResult, {
      combatResult: updated,
      defenderId: animabf.defender?.actorId ?? '',
      defenderTokenId: animabf.defender?.tokenId ?? ''
    });
    await msg.setFlag(game.animabf.id, 'result', updated);
    await msg.update({ content });
  } else {
    // Players cannot setFlag/update messages → ask the GM.
    // The GM will render in HIS locale, so all clients see consistent text.
    game.socket.emit('system.animabf', {
      op: 'critUpdate',
      messageId: msg.id,
      patch
    });
  }

  return updated;
}

// ─── Phase 0: GM starts resolution ───────────────────────────────

async function startCriticalResolution(message, _html, ds) {
  try {
    if (!game.user.isGM) return;
    const msg = getMsg(message, ds);
    if (!msg) return;

    const animabf = msg.flags?.animabf ?? {};
    const result = animabf.result;
    if (!result?.isCritical || result.critResolved) return;

    const defenderActor = getDefenderActor(animabf);
    if (!defenderActor) return ui.notifications?.warn('Defensor no encontrado.');

    // Check immunity early
    const isMass = !!defenderActor.system?.characteristics?.isMass;
    const critImmune = !!defenderActor.system?.characteristics?.critImmune;

    if (isMass || critImmune) {
      const reason = isMass ? 'mass' : 'critImmune';
      const effects = determineCriticalEffects(0, null);
      await patchAndRender(msg, {
        critResolved: true,
        critImmune: true,
        critImmuneReason: reason,
        critPhase: 'done',
        critEffects: effects
      });
      return;
    }

    // Move to phase: roll crit level
    await patchAndRender(msg, { critPhase: 'rollCritLevel' });
  } catch (err) {
    console.error('[ABF] startCriticalResolution error:', err);
  }
}

// ─── GM forces a critical that did not auto-trigger ──────────────

/**
 * GM-only: mark a non-critical hit as critical and start the normal critical
 * resolution flow. Reuses startCriticalResolution (immunity check + phase
 * 'rollCritLevel'); the only extra step is setting isCritical=true first, since
 * startCriticalResolution bails when isCritical is false. Triggered by the
 * "Forzar crítico" button shown on the chat card when the hit landed but did
 * not reach the critical threshold.
 */
async function forceCritical(message, _html, ds) {
  try {
    if (!game.user.isGM) return;
    const msg = getMsg(message, ds);
    if (!msg) return;

    const result = msg.flags?.animabf?.result;
    if (!result || result.isCritical || result.critResolved) return;

    await patchAndRender(msg, { isCritical: true });
    await startCriticalResolution(message, _html, ds);
  } catch (err) {
    console.error('[ABF] forceCritical error:', err);
  }
}

// ─── Phase 1: Roll critical level d100 ───────────────────────────

async function rollCritLevel(message, _html, ds) {
  try {
    const msg = getMsg(message, ds);
    if (!msg) return;

    const animabf = msg.flags?.animabf ?? {};
    const result = animabf.result;
    if (result?.critPhase !== 'rollCritLevel') return;

    // Permission: per setting CRIT_ROLL_LEVEL_BY
    const attackerActor = getAttackerActor(animabf);
    if (!canCurrentUserRoll(ABFSettingsKeys.CRIT_ROLL_LEVEL_BY, attackerActor)) return;

    const baseCriticalValue = result.baseCriticalValue ?? 0;

    const critMod = await openCriticalRollDialog({
      title: game.i18n.localize('chat.combatResult.rollCritLevel'),
      label: game.i18n.localize('chat.combatResult.critModifier'),
      rollLabel: game.i18n.localize('chat.combatResult.critRollButton')
    });
    if (critMod === null) return; // cancelled

    const critLevelRoll = await rollPlainD100({
      flavor: game.i18n.localize('chat.combatResult.rollCritLevel'),
      actor: attackerActor
    });
    let critLevelRaw = critLevelRoll + baseCriticalValue + critMod;

    // Damage accumulation: halve before cap
    const defenderActor = getDefenderActor(animabf);
    const isDamageAccumulator = !!defenderActor?.system?.characteristics?.damageAccumulator;
    if (isDamageAccumulator) {
      critLevelRaw = Math.floor(critLevelRaw / 2);
    }

    // Cap at 200
    let critLevel = critLevelRaw;
    if (critLevel > 200) {
      critLevel = 200 + Math.floor((critLevelRaw - 200) / 2);
    }

    await patchAndRender(msg, {
      critLevelRoll,
      critLevelRaw,
      critLevel,
      critMod: critMod,
      critPhase: 'rollPhR'
    });
  } catch (err) {
    console.error('[ABF] rollCritLevel error:', err);
  }
}

// ─── Phase 2: Defender rolls PhR ─────────────────────────────────

async function rollPhR(message, _html, ds) {
  try {
    const msg = getMsg(message, ds);
    if (!msg) return;

    const animabf = msg.flags?.animabf ?? {};
    const result = animabf.result;
    if (result?.critPhase !== 'rollPhR') return;

    // Permission: per setting CRIT_ROLL_PHR_BY
    const defenderActor = getDefenderActor(animabf);
    if (!canCurrentUserRoll(ABFSettingsKeys.CRIT_ROLL_PHR_BY, defenderActor)) return;

    const phBase = defenderActor?.system?.characteristics?.secondaries?.resistances
      ?.physical?.final?.value ?? 0;

    const phMod = await openCriticalRollDialog({
      title: game.i18n.localize('chat.combatResult.rollPhR'),
      label: game.i18n.localize('chat.combatResult.phModifier'),
      rollLabel: game.i18n.localize('chat.combatResult.critRollButton')
    });
    if (phMod === null) return; // cancelled

    const resistanceDie = defenderActor?.system?.general?.diceSettings?.resistanceDie?.value
      ?? '1d100';

    const rollObj = new Roll(resistanceDie);
    await rollObj.evaluate();
    const speaker = defenderActor
      ? ChatMessage.getSpeaker({ actor: defenderActor })
      : ChatMessage.getSpeaker();
    await rollObj.toMessage({
      speaker,
      flavor: game.i18n.localize('chat.combatResult.rollPhR')
    });
    const phRoll = rollObj.total;
    const phTotal = phRoll + phBase + phMod;
    const phPassed = phTotal >= (result.critLevel ?? 0);
    const failureLevel = phPassed ? 0 : (result.critLevel ?? 0) - phTotal;

    // Determine next phase
    const needsLocation = !phPassed && failureLevel > 50;
    const aimed = !!(animabf.attackData?.aimed);
    const aimedWhere = animabf.attackData?.aimedWhere ?? null;

    let nextPhase;
    let location = null;
    let locationRoll = 0;

    if (phPassed) {
      nextPhase = 'done';
    } else if (needsLocation && aimed && aimedWhere) {
      // Aimed: location is predetermined, skip roll
      location = mapAimedToLocation(aimedWhere);
      nextPhase = 'done';
    } else if (needsLocation) {
      nextPhase = 'rollLocation';
    } else {
      nextPhase = 'done';
    }

    const effects = nextPhase === 'done'
      ? determineCriticalEffects(failureLevel, location)
      : null;

    const patch = {
      phRoll,
      phBase,
      phMod: phMod,
      phTotal,
      phPassed,
      failureLevel,
      critPhase: nextPhase,
      ...(location ? { critLocation: location, critLocationRoll: locationRoll } : {}),
      ...(nextPhase === 'done' ? { critResolved: true, critEffects: effects } : {})
    };

    await patchAndRender(msg, patch);
  } catch (err) {
    console.error('[ABF] rollPhR error:', err);
  }
}

// ─── Phase 3: Roll location d100 ─────────────────────────────────

async function rollLocation(message, _html, ds) {
  try {
    const msg = getMsg(message, ds);
    if (!msg) return;

    const animabf = msg.flags?.animabf ?? {};
    const result = animabf.result;
    if (result?.critPhase !== 'rollLocation') return;

    // Permission: per setting CRIT_ROLL_LOCATION_BY
    const attackerActor = getAttackerActor(animabf);
    if (!canCurrentUserRoll(ABFSettingsKeys.CRIT_ROLL_LOCATION_BY, attackerActor)) return;

    const locationRoll = await rollPlainD100({
      flavor: game.i18n.localize('chat.combatResult.rollLocation'),
      actor: attackerActor
    });
    const location = lookupLocation(locationRoll);
    const failureLevel = result.failureLevel ?? 0;
    const effects = determineCriticalEffects(failureLevel, location);

    await patchAndRender(msg, {
      critLocation: location,
      critLocationRoll: locationRoll,
      critEffects: effects,
      critResolved: true,
      critPhase: 'done'
    });
  } catch (err) {
    console.error('[ABF] rollLocation error:', err);
  }
}

// ─── Aimed → Location mapping ─────────────────────────────────────

function mapAimedToLocation(aimedWhere) {
  const mapping = {
    head: { zone: 'head', group: 'head', isVulnerable: true },
    eye: { zone: 'head', group: 'head', isVulnerable: true },
    neck: { zone: 'head', group: 'head', isVulnerable: true },
    heart: { zone: 'heart', group: 'torso', isVulnerable: true },
    torso: { zone: 'chest', group: 'torso' },
    abdomen: { zone: 'stomach', group: 'torso' },
    shoulder: { zone: 'shoulder', group: 'torso' },
    arm: { zone: 'leftUpperArm', group: 'leftArm', isLimb: true },
    elbow: { zone: 'leftLowerArm', group: 'leftArm', isLimb: true },
    wrist: { zone: 'leftHand', group: 'leftArm', isLimb: true },
    hand: { zone: 'leftHand', group: 'leftArm', isLimb: true },
    groin: { zone: 'stomach', group: 'torso' },
    thigh: { zone: 'leftThigh', group: 'leftLeg', isLimb: true },
    knee: { zone: 'leftCalf', group: 'leftLeg', isLimb: true },
    calf: { zone: 'leftCalf', group: 'leftLeg', isLimb: true },
    foot: { zone: 'leftFoot', group: 'leftLeg', isLimb: true }
  };
  return mapping[aimedWhere] ?? { zone: aimedWhere, group: 'torso' };
}
