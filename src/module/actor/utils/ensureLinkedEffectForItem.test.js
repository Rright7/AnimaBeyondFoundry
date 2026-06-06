import { actorHasEffectItemNamed } from './ensureLinkedEffectForItem.js';

function actorWith(items) {
  return { items };
}

describe('actorHasEffectItemNamed', () => {
  test('true when an effect item with the same name exists', () => {
    const a = actorWith([{ id: 'a1', type: 'effect', name: 'Derribado' }]);
    expect(actorHasEffectItemNamed(a, 'Derribado')).toBe(true);
  });

  test('case-insensitive and trimmed match', () => {
    const a = actorWith([{ id: 'a1', type: 'effect', name: 'Ceguera parcial' }]);
    expect(actorHasEffectItemNamed(a, '  ceguera PARCIAL ')).toBe(true);
  });

  test('false when name differs', () => {
    const a = actorWith([{ id: 'a1', type: 'effect', name: 'Derribado' }]);
    expect(actorHasEffectItemNamed(a, 'Cargando')).toBe(false);
  });

  test('ignores non-effect items with the same name', () => {
    const a = actorWith([{ id: 'a1', type: 'weapon', name: 'Derribado' }]);
    expect(actorHasEffectItemNamed(a, 'Derribado')).toBe(false);
  });

  test('excludes the item being created (exceptId)', () => {
    const a = actorWith([{ id: 'self', type: 'effect', name: 'Derribado' }]);
    expect(actorHasEffectItemNamed(a, 'Derribado', 'self')).toBe(false);
  });

  test('detects a duplicate even when excepting a different id', () => {
    const a = actorWith([
      { id: 'self', type: 'effect', name: 'Derribado' },
      { id: 'other', type: 'effect', name: 'Derribado' }
    ]);
    expect(actorHasEffectItemNamed(a, 'Derribado', 'self')).toBe(true);
  });

  test('safe on missing actor / name', () => {
    expect(actorHasEffectItemNamed(null, 'X')).toBe(false);
    expect(actorHasEffectItemNamed({ items: [] }, '')).toBe(false);
  });
});
