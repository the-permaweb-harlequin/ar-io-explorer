import { getPersistentDataManager } from '../persistent-data-manager'

/**
 * Example usage of named persistent DuckDB instances
 */

// Example 1: Default ANT statistics instance (backward compatible)
export const antStatsManager = getPersistentDataManager('ar-io-explorer-db')

// Example 2: ArFS data instance
export const arfsDataManager = getPersistentDataManager('arfs-data', {
  name: 'ArFS Data Storage',
  debug: true,
  config: {
    memory_limit: '256MB', // Smaller limit for ArFS data
    threads: 1,
  }
})

// Example 3: Analytics instance with custom configuration
export const analyticsManager = getPersistentDataManager('analytics-db', {
  name: 'Analytics Database',
  debug: false,
  config: {
    memory_limit: '1GB', // Larger limit for analytics
    threads: 2, // More threads for analytics processing
    default_block_size: 524288, // 512KB blocks for better analytics performance
  }
})

// Example 4: Temporary cache instance
export const tempCacheManager = getPersistentDataManager('temp-cache', {
  name: 'Temporary Cache',
  debug: false,
  config: {
    memory_limit: '128MB', // Small cache
    checkpoint_on_shutdown: false, // Don't persist temp data
  }
})

/**
 * Usage examples:
 */

export async function exampleUsage() {
  // Initialize different instances
  await antStatsManager.initialize()
  await arfsDataManager.initialize()
  await analyticsManager.initialize()

  // Each instance has its own database file and parquet backups:
  // - ar-io-explorer-db.db & ar-io-explorer-db-parquet
  // - arfs-data.db & arfs-data-parquet  
  // - analytics-db.db & analytics-db-parquet
  // - temp-cache.db & temp-cache-parquet

  // Use different instances for different purposes
  await antStatsManager.query('CREATE TABLE ant_stats (...)')
  await arfsDataManager.query('CREATE TABLE arfs_drives (...)')
  await analyticsManager.query('CREATE TABLE page_views (...)')

  // Export specific instance data
  await arfsDataManager.exportTableToParquet('arfs_drives')
  await analyticsManager.exportTableToParquet('page_views')
}

/**
 * Benefits of named instances:
 * 
 * 1. **Separation of Concerns**: Different data types in different databases
 * 2. **Custom Configuration**: Each instance can have optimized settings
 * 3. **Independent Lifecycle**: Initialize/clear instances independently
 * 4. **Better Organization**: Clear naming for different data domains
 * 5. **Scalability**: Add new instances without affecting existing ones
 */
