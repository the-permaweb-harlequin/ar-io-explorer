import { DuckDBInstanceConfig } from './types'

/**
 * Configuration for the persistent app-wide DuckDB instance
 */
export const PERSISTENT_DB_CONFIG: DuckDBInstanceConfig = {
  id: 'ar-io-explorer-db',
  name: 'AR.IO Explorer Persistent Database',
  debug: false,
  config: {
    // Enable persistent storage in IndexedDB
    path: 'ar-io-explorer.db',
    // Set memory limit to 512MB (more conservative)
    memory_limit: '512MB',
    // Use auto access mode for better compatibility
    access_mode: 'automatic',
    // Configure temp directory
    temp_directory: '/tmp',
    // Disable progress bar to avoid potential issues
    enable_progress_bar: false,
    // Use single thread for better stability in browser
    threads: 1,
    // Enable checkpoint on shutdown for data integrity
    checkpoint_on_shutdown: true,
    // Set smaller page size for better browser performance
    default_block_size: 262144, // 256KB
  },
}

/**
 * Table schemas for persistent data
 */
export const TABLE_SCHEMAS = {
  ANT_STATISTICS: `
    CREATE TABLE IF NOT EXISTS ant_statistics (
      timestamp TIMESTAMP PRIMARY KEY,
      latestVersion VARCHAR,
      totalAnts BIGINT,
      antVersionCounts JSON
    );
  `,
  ANT_STATISTICS_HISTORY: `
    CREATE TABLE IF NOT EXISTS ant_statistics_history (
      timestamp TIMESTAMP,
      latestVersion VARCHAR,
      totalAnts BIGINT,
      antVersionCounts JSON
    );
  `,
} as const

/**
 * Table indexes for persistent data
 */
export const TABLE_INDEXES = {
  ANT_STATISTICS: `
    CREATE INDEX IF NOT EXISTS idx_ant_statistics_timestamp ON ant_statistics (timestamp);
  `,
  ANT_STATISTICS_HISTORY: `
    CREATE INDEX IF NOT EXISTS idx_ant_statistics_history_timestamp ON ant_statistics_history (timestamp);
  `,
} as const
