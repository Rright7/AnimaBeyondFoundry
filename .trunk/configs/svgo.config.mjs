export default {
  // SVGO 4 preserves viewBox by default; removeOffCanvasPaths is an extra plugin.
  plugins: ['preset-default', 'removeOffCanvasPaths']
};
