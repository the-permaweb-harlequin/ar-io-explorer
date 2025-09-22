//  @ts-check
import { tanstackConfig } from '@tanstack/eslint-config'
import prettierConfig from 'eslint-config-prettier'
import prettierPlugin from 'eslint-plugin-prettier'

export default [
  ...tanstackConfig,
  prettierConfig,
  {
    ignores: [
      // macOS resource forks
      '**/._*',
      '.DS_Store',
      // Build outputs
      'dist/**',
      'build/**',
      // Dependencies
      'node_modules/**',
      // Packages (monorepo)
      'packages/**',
      // Generated files
      'src/generated/**',
      // Config files
      'commitlint.config.js',
      'eslint.config.js',
      // Test coverage
      'coverage/**',
    ],
  },
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      // Prevent inline styles - use Tailwind classes instead
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="style"]',
          message:
            'Inline styles are not allowed. Use Tailwind CSS classes instead.',
        },
      ],
      // Prevent unused imports and variables
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      // Prettier integration
      'prettier/prettier': 'error',
      // Allow regular imports for types (disable import type enforcement)
      '@typescript-eslint/consistent-type-imports': 'off',
      'import/consistent-type-specifier-style': 'off',
      // Disable import order (handled by Prettier sort imports plugin)
      'import/order': 'off',
    },
  },
]
