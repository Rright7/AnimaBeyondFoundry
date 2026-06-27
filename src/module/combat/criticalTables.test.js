import { lookupLocation, getAimedPenalty, determineCriticalEffects } from './criticalTables.js';

describe('lookupLocation — Tabla 51', () => {
  test.each([
    [1, 'ribs'], [10, 'ribs'],
    [49, 'heart'], [50, 'heart'],
    [51, 'leftUpperArm'], [60, 'leftHand'],
    [61, 'rightUpperArm'], [70, 'rightHand'],
    [71, 'leftThigh'], [80, 'leftFoot'],
    [81, 'rightThigh'], [90, 'rightFoot'],
    [91, 'head'], [100, 'head']
  ])('roll %i → zone %s', (roll, expectedZone) => {
    expect(lookupLocation(roll).zone).toBe(expectedZone);
  });

  test('heart and head are vulnerable', () => {
    expect(lookupLocation(50).isVulnerable).toBe(true);
    expect(lookupLocation(95).isVulnerable).toBe(true);
  });

  test('arm and leg entries are limbs', () => {
    expect(lookupLocation(55).isLimb).toBe(true);
    expect(lookupLocation(75).isLimb).toBe(true);
  });

  test('torso entries are not limbs', () => {
    expect(lookupLocation(5).isLimb).toBeUndefined();
  });
});

describe('getAimedPenalty', () => {
  test('eye is -100', () => expect(getAimedPenalty('eye')).toBe(-100));
  test('neck is -80', () => expect(getAimedPenalty('neck')).toBe(-80));
  test('torso is -10', () => expect(getAimedPenalty('torso')).toBe(-10));
  test('unknown returns 0', () => expect(getAimedPenalty('tail')).toBe(0));
});

describe('determineCriticalEffects', () => {
  test('failureLevel 0 → no effects', () => {
    const e = determineCriticalEffects(0, null);
    expect(e.actionPenalty).toBe(0);
    expect(e.limbDestroyed).toBe(false);
  });

  test('failureLevel 30 → all pain, no location needed', () => {
    const e = determineCriticalEffects(30, null);
    expect(e.actionPenalty).toBe(30);
    expect(e.painPenalty).toBe(30);
    expect(e.physicalPenalty).toBe(0);
  });

  test('failureLevel 80 → half pain, half physical', () => {
    const e = determineCriticalEffects(80, { zone: 'chest', group: 'torso' });
    expect(e.painPenalty).toBe(40);
    expect(e.physicalPenalty).toBe(40);
    expect(e.unconscious).toBe(false);
  });

  test('failureLevel 75 (impar) → ambas mitades hacia abajo: 37 y 37', () => {
    const e = determineCriticalEffects(75, { zone: 'chest', group: 'torso' });
    expect(e.actionPenalty).toBe(75); // total crudo (referencia)
    expect(e.painPenalty).toBe(37); // floor(37.5)
    expect(e.physicalPenalty).toBe(37); // floor(37.5), no 38
  });

  test('failureLevel 70 on head → unconscious', () => {
    const e = determineCriticalEffects(70, { zone: 'head', group: 'head' });
    expect(e.unconscious).toBe(true);
    expect(e.death).toBe(false);
  });

  test('failureLevel 120 on limb → limbDestroyed', () => {
    const loc = { zone: 'leftUpperArm', group: 'leftArm', isLimb: true };
    const e = determineCriticalEffects(120, loc);
    expect(e.limbDestroyed).toBe(true);
    expect(e.destroyedLimb).toBe('leftArm');
    expect(e.death).toBe(false);
  });

  test('failureLevel 130 on heart → death', () => {
    const loc = { zone: 'heart', group: 'torso', isVulnerable: true };
    const e = determineCriticalEffects(130, loc);
    expect(e.death).toBe(true);
  });

  test('failureLevel 130 on head → death', () => {
    const loc = { zone: 'head', group: 'head', isVulnerable: true };
    const e = determineCriticalEffects(130, loc);
    expect(e.death).toBe(true);
    expect(e.unconscious).toBe(true);
  });

  test('failureLevel 160 → deathTimer + unconscious regardless of zone', () => {
    const loc = { zone: 'chest', group: 'torso' };
    const e = determineCriticalEffects(160, loc);
    expect(e.unconscious).toBe(true);
    expect(e.deathTimer).toBe(true);
  });
});
