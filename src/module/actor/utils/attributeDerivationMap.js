/**
 * Maps a logical "roll attribute" (the thing you're rolling) to the list of
 * actor data paths whose AE changes are considered as contributing to that
 * roll. The map only lists paths whose AE additions reach the final value of
 * the rolled attribute (directly or via known derivation chains).
 *
 * For attack/block/dodge we list ONLY their own `.final.value`, because
 * Anima RAW says `physicalActions` does not chain to attack/block/dodge.
 *
 * For initiative we include the modifier chain (`physicalActions`,
 * `allActions`) because mutateInitiative.js does fold them in.
 *
 * For magic and psychic projection (offensive/defensive) we list each
 * imbalance slot. Their `.final.value` is what consumers read.
 */
export const ATTRIBUTE_PATHS = {
  attack: ['system.combat.attack.final.value'],
  block: ['system.combat.block.final.value'],
  dodge: ['system.combat.dodge.final.value'],
  initiative: [
    'system.characteristics.secondaries.initiative.final.value',
    'system.general.modifiers.allActions.final.value'
  ],
  physicalActions: ['system.general.modifiers.physicalActions.final.value'],
  magicProjectionOffensive: [
    'system.mystic.magicProjection.imbalance.offensive.final.value'
  ],
  magicProjectionDefensive: [
    'system.mystic.magicProjection.imbalance.defensive.final.value'
  ],
  psychicProjectionOffensive: [
    'system.psychic.psychicProjection.imbalance.offensive.final.value'
  ],
  psychicProjectionDefensive: [
    'system.psychic.psychicProjection.imbalance.defensive.final.value'
  ]
};

/**
 * Best-effort detect which logical attribute a chat message corresponds to,
 * based on its `flavor` text in any supported language (es / en / fr).
 *
 * @param {string} flavor
 * @returns {keyof ATTRIBUTE_PATHS | null}
 */
export function inferAttributeFromFlavor(flavor) {
  if (typeof flavor !== 'string' || !flavor.trim()) return null;
  const f = flavor.toLowerCase();

  // Order matters: prefer more specific matches first.
  if (/(proyecci[oó]n m[áa]gica|magic projection|projection magique)/.test(f)) {
    if (/(defensiva|defensive|défensive)/.test(f)) return 'magicProjectionDefensive';
    return 'magicProjectionOffensive';
  }
  if (/(proyecci[oó]n ps[íi]quica|psychic projection|projection psychique)/.test(f)) {
    if (/(defensiva|defensive|défensive)/.test(f)) return 'psychicProjectionDefensive';
    return 'psychicProjectionOffensive';
  }
  if (/(iniciativa|initiative|turno|turn)/.test(f)) return 'initiative';
  if (/(parada|block|parade)/.test(f)) return 'block';
  if (/(esquiva|dodge|esquive)/.test(f)) return 'dodge';
  if (/(ataque|attack|attaque)/.test(f)) return 'attack';

  return null;
}
