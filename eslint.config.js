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
]
