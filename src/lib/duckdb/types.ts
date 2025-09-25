import { AsyncDuckDB } from '@duckdb/duckdb-wasm'
import { Table as Arrow } from 'apache-arrow'

/**
 * Configuration for initializing a DuckDB instance
 */
export interface DuckDBInstanceConfig {
  /** Unique identifier for this database instance */
  id: string
  /** Optional DuckDB configuration */
  config?: any
  /** Enable debug logging for this instance */
  debug?: boolean
  /** Optional name for this instance (for debugging/display) */
  name?: string
}

/**
 * DuckDB instance state
 */
export interface DuckDBInstance {
  /** Unique identifier */
  id: string
  /** The AsyncDuckDB instance */
  db: AsyncDuckDB
  /** Configuration used to create this instance */
  config: DuckDBInstanceConfig
  /** Creation timestamp */
  createdAt: Date
  /** Last accessed timestamp */
  lastAccessedAt: Date
}

/**
 * Bundle manager state for memoizing WASM bundles
 */
export interface DuckDBBundle {
  /** The bundle object from duckdb-wasm */
  bundle: any
  /** When this bundle was loaded */
  loadedAt: Date
  /** Browser info this bundle was selected for */
  browserInfo?: string
}

/**
 * Query execution options
 */
export interface QueryOptions {
  /** Database instance ID to run the query on */
  instanceId?: string
  /** Enable debug logging for this query */
  debug?: boolean
}

/**
 * File import options
 */
export interface ImportFileOptions {
  /** Database instance ID to import into */
  instanceId?: string
  /** Table name to create (defaults to filename) */
  tableName?: string
  /** Enable debug logging */
  debug?: boolean
}

/**
 * File export options
 */
export interface ExportFileOptions {
  /** Database instance ID to export from */
  instanceId?: string
  /** Output filename (defaults to tableName + extension) */
  filename?: string
  /** Compression type for Parquet exports */
  compression?: 'uncompressed' | 'snappy' | 'gzip' | 'zstd'
  /** Delimiter for CSV exports */
  delimiter?: string
}

/**
 * Hook return type for database operations
 */
export interface UseDuckDBResult {
  /** The database instance (undefined if loading or error) */
  db: AsyncDuckDB | undefined
  /** Whether the database is currently loading */
  loading: boolean
  /** Any error that occurred during initialization */
  error: Error | undefined
  /** The instance configuration */
  config?: DuckDBInstanceConfig
}

/**
 * Hook return type for query operations
 */
export interface UseDuckDBQueryResult {
  /** Query result as Arrow table (undefined if loading, error, or no query) */
  arrow: Arrow | undefined
  /** Whether the query is currently executing */
  loading: boolean
  /** Any error that occurred during query execution */
  error: Error | undefined
  /** Re-execute the query */
  refetch: () => void
}

/**
 * Error types for better error handling
 */
export class DuckDBInstanceError extends Error {
  title: string
  instanceId?: string

  constructor(title: string, message: string, instanceId?: string) {
    super(message)
    this.title = title
    this.name = 'DuckDBInstanceError'
    this.instanceId = instanceId
  }
}

export class DuckDBQueryError extends Error {
  title: string
  sql?: string
  instanceId?: string

  constructor(
    title: string,
    message: string,
    sql?: string,
    instanceId?: string,
  ) {
    super(message)
    this.title = title
    this.name = 'DuckDBQueryError'
    this.sql = sql
    this.instanceId = instanceId
  }
}

export class DuckDBFileError extends Error {
  title: string
  filename?: string
  instanceId?: string

  constructor(
    title: string,
    message: string,
    filename?: string,
    instanceId?: string,
  ) {
    super(message)
    this.title = title
    this.name = 'DuckDBFileError'
    this.filename = filename
    this.instanceId = instanceId
  }
}
