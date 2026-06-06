/**
 * Combat skills (attack/block/dodge) are now fully computed by the `Ability`
 * typed node registered in `actor/constants.js`. The typed node folds in:
 *   - base
 *   - special
 *   - characteristic mod (DEX/AGI)
 *   - allActions.final (RAW penalizes attack/block/dodge)
 *
 * physicalActions does NOT chain into combat skills per Anima RAW, so
 * `applyPhysicalActionMod` is set to `false` in the __type marker for these
 * three nodes.
 *
 * This mutator is intentionally a no-op to avoid double-counting modifiers
 * that the Ability node already applies. Kept as a registered noop so the
 * abfFlow registry stays valid in case it's referenced elsewhere.
 */
export const mutateCombatData = _data => {
  // no-op: see file header comment
};

mutateCombatData.abfFlow = {
  deps: [],
  mods: []
};
