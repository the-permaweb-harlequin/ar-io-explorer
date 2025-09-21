//  @ts-check
import { tanstackConfig } from '@tanstack/eslint-config'

export default [
  ...tanstackConfig,
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
      // Config files
      'commitlint.config.js',
      // Test coverage
      'coverage/**',
    ],
  },
  {
    rules: {
      // Prevent inline styles - use Tailwind classes instead
      'no-restricted-syntax': [
        'error',
        {
          selector: 'JSXAttribute[name.name="style"]',
          message: 'Inline styles are not allowed. Use Tailwind CSS classes instead.',
        },
      ],
    },
  },
]
