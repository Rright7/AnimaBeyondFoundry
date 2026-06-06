/**
 * Wrap a single value into a one-element array for helpers that expect
 * an iterable. Used by the weapon sheet to render one chip per quality
 * via {{equipmentQualitiesLabel (jsonArray slug)}}.
 */
export const jsonArrayHelper = {
  name: 'jsonArray',
  fn: function (...args) {
    // Handlebars passes an options object as the last argument.
    const values = args.slice(0, -1);
    return values;
  }
};
