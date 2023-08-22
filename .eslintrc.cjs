module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      tsconfigRootDir: __dirname,
      project: ['./tsconfig.json'],
      extraFileExtensions: ['.cjs']
    },
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended'
    ],
    env: {
      es6: true,
      browser: true
    },
    plugins: [
      '@typescript-eslint'
    ],
    ignorePatterns: [
      'public/build/'
    ],
    overrides: [
    ],
    rules: {
      semi: ['error', 'always'],
      quotes: [2, 'single'],
      'no-var': 2,
      '@typescript-eslint/no-non-null-assertion': 'off'
    },
    settings: {
    }
  };