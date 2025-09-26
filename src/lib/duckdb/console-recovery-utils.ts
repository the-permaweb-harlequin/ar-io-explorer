/**
 * Console utilities for database corruption recovery
 * These are exposed to the browser console for easy debugging
 */
import { ANTStatisticsUtils } from '@/lib/ant-statistics'

import {
  getPersistentDataManager,
  persistentDataManager,
} from './persistent-data-manager'

/**
 * Console utilities for database recovery
 */
export const DatabaseRecoveryUtils = {
  /**
   * Recover the default ANT statistics database
   */
  async recoverDefault() {
    console.log('🔧 Recovering default database...')
    try {
      await persistentDataManager.recoverFromCorruption()
      console.log('✅ Default database recovery completed!')
    } catch (error) {
      console.error('❌ Default database recovery failed:', error)
    }
  },

  /**
   * Recover a specific named database instance
   */
  async recoverInstance(instanceName: string) {
    console.log(`🔧 Recovering database instance: ${instanceName}`)
    try {
      const manager = getPersistentDataManager(instanceName)
      await manager.recoverFromCorruption()
      console.log(`✅ Database instance '${instanceName}' recovery completed!`)
    } catch (error) {
      console.error(
        `❌ Database instance '${instanceName}' recovery failed:`,
        error,
      )
    }
  },

  /**
   * Clear all IndexedDB databases (nuclear option)
   */
  async clearAllDatabases() {
    console.log('💥 NUCLEAR OPTION: Clearing all databases...')
    const confirmation = confirm(
      'This will delete ALL persistent data including ANT statistics, ArFS data, etc. Are you sure?',
    )

    if (!confirmation) {
      console.log('❌ Operation cancelled by user')
      return
    }

    try {
      // List of known database names to clear
      const databaseNames = [
        'ar-io-explorer-db.db',
        'ar-io-explorer-db-parquet',
        'ar-io-explorer.db', // Legacy
        'ar-io-explorer-parquet', // Legacy
        'arfs-data.db',
        'arfs-data-parquet',
        'analytics-db.db',
        'analytics-db-parquet',
        'temp-cache.db',
        'temp-cache-parquet',
      ]

      for (const dbName of databaseNames) {
        try {
          await this.deleteIndexedDBDatabase(dbName)
        } catch (error) {
          console.warn(`⚠️ Failed to delete ${dbName}:`, error)
        }
      }

      console.log('💥 All databases cleared! Please refresh the page.')
      alert('All databases cleared! Please refresh the page to reinitialize.')
    } catch (error) {
      console.error('❌ Failed to clear all databases:', error)
    }
  },

  /**
   * List all IndexedDB databases
   */
  async listDatabases() {
    try {
      if ('databases' in indexedDB) {
        const databases = await indexedDB.databases()
        console.log('📋 IndexedDB Databases:')
        databases.forEach((db, index) => {
          console.log(`${index + 1}. ${db.name} (version: ${db.version})`)
        })
        return databases
      } else {
        console.warn('⚠️ indexedDB.databases() not supported in this browser')
        return []
      }
    } catch (error) {
      console.error('❌ Failed to list databases:', error)
      return []
    }
  },

  /**
   * Get database status for all known instances
   */
  async getDatabaseStatus() {
    console.log('📊 Database Status Report:')

    const instances = [
      'ar-io-explorer-db',
      'arfs-data',
      'analytics-db',
      'temp-cache',
    ]

    for (const instanceName of instances) {
      try {
        const manager = getPersistentDataManager(instanceName)
        const isInitialized = manager.isInitialized()
        console.log(
          `${instanceName}: ${isInitialized ? '✅ Initialized' : '❌ Not Initialized'}`,
        )
      } catch (error) {
        console.log(`${instanceName}: ❌ Error - ${error}`)
      }
    }
  },

  /**
   * Test database initialization for a specific instance
   */
  async testInitialization(instanceName: string = 'ar-io-explorer-db') {
    console.log(`🧪 Testing initialization for: ${instanceName}`)
    try {
      const manager = getPersistentDataManager(instanceName)
      await manager.initialize()
      console.log(`✅ ${instanceName} initialized successfully`)
      return true
    } catch (error) {
      console.error(`❌ ${instanceName} initialization failed:`, error)
      return false
    }
  },

  /**
   * Helper to delete a specific IndexedDB database
   */
  async deleteIndexedDBDatabase(dbName: string): Promise<void> {
    return new Promise((resolve) => {
      console.log(`🗑️ Deleting IndexedDB database: ${dbName}`)

      const deleteRequest = indexedDB.deleteDatabase(dbName)

      deleteRequest.onerror = () => {
        console.warn(`❌ Failed to delete ${dbName}`)
        resolve()
      }

      deleteRequest.onsuccess = () => {
        console.log(`✅ Successfully deleted ${dbName}`)
        resolve()
      }

      deleteRequest.onblocked = () => {
        console.warn(`⚠️ Deletion of ${dbName} was blocked`)
        setTimeout(resolve, 1000)
      }

      setTimeout(() => {
        console.warn(`⏰ Timeout deleting ${dbName}`)
        resolve()
      }, 5000)
    })
  },

  /**
   * Quick recovery commands
   */
  quick: {
    recover: () => DatabaseRecoveryUtils.recoverDefault(),
    clear: () => ANTStatisticsUtils.clearCorruptedDatabase(),
    status: () => DatabaseRecoveryUtils.getDatabaseStatus(),
    list: () => DatabaseRecoveryUtils.listDatabases(),
  },
}

// Expose to window for console access
if (typeof window !== 'undefined') {
  ;(window as any).DatabaseRecoveryUtils = DatabaseRecoveryUtils
  ;(window as any).dbRecovery = DatabaseRecoveryUtils.quick // Shorthand

  // Also expose ANTStatisticsUtils if not already there
  if (!(window as any).ANTStatisticsUtils) {
    ;(window as any).ANTStatisticsUtils = ANTStatisticsUtils
  }

  console.log(`
🛠️  Database Recovery Utils Available:

Quick Commands:
- dbRecovery.recover()     // Recover default database
- dbRecovery.clear()       // Clear corrupted database
- dbRecovery.status()      // Check database status
- dbRecovery.list()        // List all databases

Full Commands:
- DatabaseRecoveryUtils.recoverDefault()
- DatabaseRecoveryUtils.recoverInstance('instance-name')
- DatabaseRecoveryUtils.clearAllDatabases()
- DatabaseRecoveryUtils.testInitialization('instance-name')

ANT Statistics:
- ANTStatisticsUtils.recoverFromCorruption()
- ANTStatisticsUtils.clearCorruptedDatabase()
  `)
}
