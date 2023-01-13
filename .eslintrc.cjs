/**
 * @type {import('@types/eslint').Linter.Config}
 */
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'simple-import-sort', 'import', 'unused-imports', 'tailwindcss'],
  extends: ['eslint:recommended', 'plugin:tailwindcss/recommended', 'plugin:prettier/recommended'],
  env: {
    node: true,
  },
  rules: {
    // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
    'prettier/prettier': 'warn',
    'no-unused-vars': 'off',
    'unused-imports/no-unused-imports': 'warn',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
    // tailwind eslint plugin
    'tailwindcss/no-custom-classname': 'off',
    // import sorts
    'import/first': 'warn',
    'import/newline-after-import': 'warn',
    'import/no-duplicates': 'warn',
    'simple-import-sort/exports': 'warn',
    'simple-import-sort/imports': [
      'warn',
      {
        groups: [
          // Side effect imports first
          ['^\\u0000'],
          // Node.js builtins
          [`^(${require('module').builtinModules.join('|')})(/|$)`],
          // React first, then any other packages
          ['^react$', '^@?\\w'],
          // Absolute imports (doesn"t start with .)
          ['^(\\.|@)prisma', '^[^.]', '^src/'],
          // Relative imports
          [
            // ../whatever/
            '^\\.\\./(?=.*/)',
            // ../
            '^\\.\\./',
            // ./whatever/
            '^\\./(?=.*/)',
            // Anything that starts with a dot
            '^\\.',
          ],
          // Asset imports
          ['^.+\\.(html|scss|sass|css|json|gql|graphql|md|jpg|png)$'],
        ],
      },
    ],
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      extends: [
        'plugin:@typescript-eslint/recommended',
        // 'plugin:@typescript-eslint/recommended-requiring-type-checking',
      ],
      rules: {
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-empty-interface': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
      },
    },
  ],
}
