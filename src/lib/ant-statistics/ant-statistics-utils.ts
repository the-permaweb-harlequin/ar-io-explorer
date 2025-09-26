import { antStatisticsPersistence } from './ant-statistics-persistence'

/**
 * Utility functions for managing ANT statistics
 */
export class ANTStatisticsUtils {
  /**
   * Clear all cached statistics (useful for debugging or reset)
   */
  static async clearCache(): Promise<void> {
    await antStatisticsPersistence.clearAllStatistics()
    console.log('🧹 Cleared all ANT statistics cache')
  }

  /**
   * Clear corrupted database (useful when encountering database errors)
   */
  static async clearCorruptedDatabase(): Promise<void> {
    try {
      console.log('🧹 Clearing corrupted database...')
      
      // Clear IndexedDB databases (using default instance name)
      await this.deleteIndexedDBDatabase('ar-io-explorer-db.db')
      await this.deleteIndexedDBDatabase('ar-io-explorer-db-parquet')
      
      console.log('✅ Corrupted database cleared. Please refresh the page.')
      alert('Database cleared successfully! Please refresh the page to reinitialize.')
    } catch (error) {
      console.error('❌ Failed to clear corrupted database:', error)
      alert('Failed to clear database. Please manually clear browser data for this site.')
    }
  }

  /**
   * Recover from database corruption using the persistent data manager
   */
  static async recoverFromCorruption(): Promise<void> {
    try {
      console.log('🔧 Attempting automatic corruption recovery...')
      
      // Import the persistent data manager
      const { persistentDataManager } = await import('@/lib/duckdb/persistent-data-manager')
      
      // Trigger recovery
      await persistentDataManager.recoverFromCorruption()
      
      console.log('✅ Automatic corruption recovery completed!')
      alert('Database recovery completed successfully!')
    } catch (error) {
      console.error('❌ Automatic recovery failed:', error)
      console.log('🔄 Falling back to manual cleanup...')
      
      // Fall back to manual cleanup
      await this.clearCorruptedDatabase()
    }
  }

  /**
   * Delete an IndexedDB database
   */
  private static async deleteIndexedDBDatabase(dbName: string): Promise<void> {
    return new Promise((resolve) => {
      const deleteRequest = indexedDB.deleteDatabase(dbName)
      
      deleteRequest.onerror = () => {
        console.warn(`Failed to delete IndexedDB database: ${dbName}`)
        resolve()
      }
      
      deleteRequest.onsuccess = () => {
        console.log(`✅ Deleted IndexedDB database: ${dbName}`)
        resolve()
      }
      
      deleteRequest.onblocked = () => {
        console.warn(`Deletion of ${dbName} was blocked`)
        resolve()
      }
      
      // Timeout after 5 seconds
      setTimeout(() => {
        console.warn(`Timeout deleting ${dbName}`)
        resolve()
      }, 5000)
    })
  }

  /**
   * Force refresh statistics (bypass cache)
   */
  static async forceRefresh(): Promise<void> {
    // Clear current cache to force fresh calculation
    await antStatisticsPersistence.clearAllStatistics()
    console.log('🔄 Forced ANT statistics refresh - next load will be fresh')
  }

  /**
   * Get statistics summary for debugging
   */
  static async getDebugInfo(): Promise<{
    summary: any
    latestStats: any
    hasFreshCache: boolean
  }> {
    const [summary, latestStats, hasFreshCache] = await Promise.all([
      antStatisticsPersistence.getStatisticsSummary(),
      antStatisticsPersistence.getLatestStatistics(),
      antStatisticsPersistence.hasFreshStatistics(),
    ])

    return {
      summary,
      latestStats,
      hasFreshCache,
    }
  }

  /**
   * Export statistics to console for debugging
   */
  static async exportToConsole(): Promise<void> {
    const debugInfo = await this.getDebugInfo()
    console.group('📊 ANT Statistics Debug Info')
    console.log('Summary:', debugInfo.summary)
    console.log('Latest Stats:', debugInfo.latestStats)
    console.log('Has Fresh Cache:', debugInfo.hasFreshCache)
    console.groupEnd()
  }

  /**
   * Get statistics history for analysis
   */
  static async getHistory(days = 7): Promise<any[]> {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    return antStatisticsPersistence.getStatisticsHistory(
      startDate.toISOString(),
      undefined,
      days * 24, // Assuming hourly updates
    )
  }
}

// Make utilities available globally for debugging
if (typeof window !== 'undefined') {
  ;(window as any).ANTStatisticsUtils = ANTStatisticsUtils
}
