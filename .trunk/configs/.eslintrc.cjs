module.exports = {
  root: true,
  extends: ['../../.eslintrc'],
  parserOptions: {
    project: './.trunk/tsconfig.json',
    // Trunk checks copies of targets inside a temporary workspace.
    tsconfigRootDir: process.cwd()
  },
  env: { es2021: true },
  overrides: [
    {
      files: ['src/**/*.{js,mjs,ts}'],
      env: { browser: true, jquery: true },
      globals: {
        Actor: 'readonly',
        Actors: 'readonly',
        Application: 'readonly',
        ChatMessage: 'readonly',
        Combat: 'readonly',
        Combatant: 'readonly',
        CONFIG: 'readonly',
        CONST: 'readonly',
        Dialog: 'readonly',
        FilePicker: 'readonly',
        FormApplication: 'readonly',
        Handlebars: 'readonly',
        Hooks: 'readonly',
        Item: 'readonly',
        Items: 'readonly',
        Macro: 'readonly',
        Roll: 'readonly',
        TextEditor: 'readonly',
        Token: 'readonly',
        canvas: 'readonly',
        foundry: 'readonly',
        fromUuid: 'readonly',
        fromUuidSync: 'readonly',
        game: 'readonly',
        loadTemplates: 'readonly',
        renderTemplate: 'readonly',
        ui: 'readonly'
      }
    },
    {
      files: ['**/*.test.js', 'jest*.{js,cjs}'],
      env: { jest: true, node: true }
    },
    {
      files: ['scripts/**/*.{js,mjs,cjs}', '*.{js,mjs,cjs}', '.trunk/**/*.cjs'],
      excludedFiles: ['src/**', 'integration/**'],
      env: { node: true },
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        'import/no-extraneous-dependencies': 'off',
        'no-console': 'off'
      }
    },
    {
      files: ['integration/**/*.ts'],
      extends: ['plugin:cypress/recommended']
    }
  ]
};
