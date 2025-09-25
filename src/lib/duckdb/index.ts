// Core types
export * from './types'

// Instance and bundle management
export * from './instance-manager'
export * from './bundle-manager'

// React hooks
export * from './hooks'

// File operations
export * from './files'

// Utilities
export * from './utils/run-query'
export * from './utils/queries'
export * from './utils/perf'
export * from './utils/tempfile'
export * from './utils/infer-types'

// Re-export DuckDB types for convenience
export { AsyncDuckDB, DuckDBConfig } from '@duckdb/duckdb-wasm'
export { Table as Arrow } from 'apache-arrow'

// Main convenience functions
export {
  getDuckDBInstance,
  getExistingDuckDBInstance,
} from './instance-manager'
export { getDuckDBBundle } from './bundle-manager'
