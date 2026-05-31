/**
 * @jest-environment node
 *
 * NOTE: this test lives in `handlebars-helpers/` (NOT in `helpers/`) on purpose.
 * `registerHelpers.js` does `import.meta.glob('./helpers/**\/*.js', {eager:true})`,
 * which would statically import any `.test.js` placed under `helpers/` and run
 * its top-level Jest globals (describe/afterEach) at system load — crashing
 * Foundry's init. Keep helper tests OUTSIDE the globbed `helpers/` directory.
 */

import { combatManeuverCatalogHelper } from './helpers/combatManeuverCatalog.js';

const fn = combatManeuverCatalogHelper.fn;

const DEFS = [
  { slug: 'presa', nameKey: 'anima.maneuvers.presa.name', icon: 'icons/p.svg' },
  { slug: 'crush', nameKey: 'anima.maneuvers.crush.name', icon: 'icons/c.svg' }
];
const I18N = {
  'anima.maneuvers.presa.name': 'Presa',
  'anima.maneuvers.crush.name': 'Aplastar'
};

function setRegistry(defs, i18n = {}) {
  globalThis.game = {
    animabf: { maneuvers: { all: () => defs } },
    i18n: { localize: k => (k in i18n ? i18n[k] : k) }
  };
}

afterEach(() => {
  delete globalThis.game;
});

describe('combatManeuverCatalog helper', () => {
  test('lists all canonical maneuvers from the registry', () => {
    setRegistry(DEFS, I18N);
    const out = fn([]);
    expect(out).toHaveLength(2);
    expect(out[0]).toMatchObject({
      slug: 'presa', name: 'Presa', img: 'icons/p.svg', isCanonical: true, _id: null
    });
    expect(out[1]).toMatchObject({ slug: 'crush', name: 'Aplastar', isCanonical: true });
  });

  test('appends a custom maneuver with a non-canonical slug', () => {
    setRegistry(DEFS, I18N);
    const custom = [{ _id: 'x1', name: 'Mi Maniobra', img: 'i.svg', system: { slug: { value: 'mia' } } }];
    const out = fn(custom);
    expect(out).toHaveLength(3);
    expect(out[2]).toMatchObject({ slug: 'mia', name: 'Mi Maniobra', isCanonical: false, _id: 'x1' });
  });

  test('dedupes a custom maneuver whose slug is already canonical', () => {
    setRegistry(DEFS, I18N);
    const custom = [{ _id: 'dup', name: 'Presa vieja', system: { slug: { value: 'presa' } } }];
    const out = fn(custom);
    expect(out).toHaveLength(2);
    expect(out.filter(m => m.slug === 'presa')).toHaveLength(1);
    expect(out.find(m => m.slug === 'presa').isCanonical).toBe(true);
  });

  test('keeps slug-less custom maneuvers', () => {
    setRegistry(DEFS, I18N);
    const out = fn([{ _id: 'blank', name: 'Vacía', system: { slug: { value: '' } } }]);
    expect(out).toHaveLength(3);
    expect(out[2]).toMatchObject({ slug: '', name: 'Vacía', isCanonical: false, _id: 'blank' });
  });

  test('falls back to the slug when the i18n key is missing', () => {
    setRegistry([{ slug: 'derribo', nameKey: 'anima.maneuvers.derribo.name', icon: 'd.svg' }], {});
    expect(fn([])[0].name).toBe('derribo');
  });

  test('no registry: returns only the custom list mapped', () => {
    globalThis.game = {};
    const out = fn([{ _id: 'c', name: 'Custom', system: { slug: { value: 's' } } }]);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ slug: 's', name: 'Custom', isCanonical: false, _id: 'c' });
  });

  test('handles non-array custom input', () => {
    setRegistry(DEFS, I18N);
    expect(fn(undefined)).toHaveLength(2);
  });
});
