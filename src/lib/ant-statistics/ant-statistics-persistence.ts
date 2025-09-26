import { persistentDataManager } from '../duckdb/persistent-data-manager'

export interface ANTStatistics {
  latestVersion: string
  totalAnts: number
  antVersionCounts: Record<string, number>
}

export interface ANTStatisticsRecord {
  timestamp: string
  latestVersion: string
  totalAnts: bigint | number
  antVersionCounts: string // JSON string
}

/**
 * Service for persisting ANT statistics to DuckDB
 */
export class ANTStatisticsPersistence {
  private static instance: ANTStatisticsPersistence

  private constructor() {}

  static getInstance(): ANTStatisticsPersistence {
    if (!ANTStatisticsPersistence.instance) {
      ANTStatisticsPersistence.instance = new ANTStatisticsPersistence()
    }
    return ANTStatisticsPersistence.instance
  }

  /**
   * Save ANT statistics to the database
   */
  async saveStatistics(stats: ANTStatistics): Promise<void> {
    try {
      const timestamp = new Date().toISOString()
      const versionCountsJson = JSON.stringify(stats.antVersionCounts)

      // First, check if we have existing stats for today
      const existingRecord = await this.getLatestStatisticsRecord()
      const today = new Date().toISOString().split('T')[0]
      const existingDate = existingRecord?.timestamp.split('T')[0]

      if (existingDate === today) {
        // Update existing record for today
        await persistentDataManager.query(`
          UPDATE ant_statistics 
          SET 
            latestVersion = '${stats.latestVersion}',
            totalAnts = ${stats.totalAnts},
            antVersionCounts = '${versionCountsJson}',
            timestamp = '${timestamp}'
          WHERE DATE(timestamp) = '${today}'
        `)
        console.log('📊 Updated ANT statistics for today')
      } else {
        // Insert new record
        await persistentDataManager.query(`
          INSERT INTO ant_statistics (timestamp, latestVersion, totalAnts, antVersionCounts)
          VALUES ('${timestamp}', '${stats.latestVersion}', ${stats.totalAnts}, '${versionCountsJson}')
        `)
        console.log('📊 Saved new ANT statistics')
      }

      // Also save to history table for tracking changes over time
      await persistentDataManager.query(`
        INSERT INTO ant_statistics_history (timestamp, latestVersion, totalAnts, antVersionCounts)
        VALUES ('${timestamp}', '${stats.latestVersion}', ${stats.totalAnts}, '${versionCountsJson}')
      `)

      // Export to parquet for backup
      await this.exportToParquet()
    } catch (error) {
      console.error('❌ Failed to save ANT statistics:', error)
      throw error
    }
  }

  /**
   * Get the latest ANT statistics record from the database (with metadata)
   */
  async getLatestStatisticsRecord(): Promise<ANTStatisticsRecord | null> {
    try {
      const result = await persistentDataManager.query(`
        SELECT * FROM ant_statistics 
        ORDER BY timestamp DESC 
        LIMIT 1
      `)

      if (!result || result.numRows === 0) {
        return null
      }

      return result.get(0) as ANTStatisticsRecord
    } catch (error) {
      console.error('❌ Failed to get latest ANT statistics record:', error)
      return null
    }
  }

  /**
   * Get the latest ANT statistics from the database
   */
  async getLatestStatistics(): Promise<ANTStatistics | null> {
    try {
      const result = await persistentDataManager.query(`
        SELECT * FROM ant_statistics 
        ORDER BY timestamp DESC 
        LIMIT 1
      `)

      if (!result || result.numRows === 0) {
        return null
      }

      const row = result.get(0) as ANTStatisticsRecord
      return {
        latestVersion: row.latestVersion,
        totalAnts: Number(row.totalAnts), // Convert BigInt to Number
        antVersionCounts: JSON.parse(row.antVersionCounts),
      }
    } catch (error) {
      console.error('❌ Failed to get latest ANT statistics:', error)
      return null
    }
  }

  /**
   * Get ANT statistics history for a date range
   */
  async getStatisticsHistory(
    startDate?: string,
    endDate?: string,
    limit = 100,
  ): Promise<ANTStatistics[]> {
    try {
      let whereClause = ''
      if (startDate && endDate) {
        whereClause = `WHERE timestamp BETWEEN '${startDate}' AND '${endDate}'`
      } else if (startDate) {
        whereClause = `WHERE timestamp >= '${startDate}'`
      } else if (endDate) {
        whereClause = `WHERE timestamp <= '${endDate}'`
      }

      const result = await persistentDataManager.query(`
        SELECT * FROM ant_statistics_history 
        ${whereClause}
        ORDER BY timestamp DESC 
        LIMIT ${limit}
      `)

      if (!result || result.numRows === 0) {
        return []
      }

      const history: ANTStatistics[] = []
      for (let i = 0; i < result.numRows; i++) {
        const row = result.get(i) as ANTStatisticsRecord
        history.push({
          latestVersion: row.latestVersion,
          totalAnts: Number(row.totalAnts), // Convert BigInt to Number
          antVersionCounts: JSON.parse(row.antVersionCounts),
        })
      }

      return history
    } catch (error) {
      console.error('❌ Failed to get ANT statistics history:', error)
      return []
    }
  }

  /**
   * Get statistics summary for dashboard
   */
  async getStatisticsSummary(): Promise<{
    totalRecords: number
    latestUpdate: string | null
    oldestRecord: string | null
    averageAnts: number
  }> {
    try {
      const result = await persistentDataManager.query(`
        SELECT 
          COUNT(*) as total_records,
          MAX(timestamp) as latest_update,
          MIN(timestamp) as oldest_record,
          AVG(total_ants) as average_ants
        FROM ant_statistics_history
      `)

      if (!result || result.numRows === 0) {
        return {
          totalRecords: 0,
          latestUpdate: null,
          oldestRecord: null,
          averageAnts: 0,
        }
      }

      const row = result.get(0)
      return {
        totalRecords: row.total_records || 0,
        latestUpdate: row.latest_update || null,
        oldestRecord: row.oldest_record || null,
        averageAnts: Math.round(row.average_ants || 0),
      }
    } catch (error) {
      console.error('❌ Failed to get statistics summary:', error)
      return {
        totalRecords: 0,
        latestUpdate: null,
        oldestRecord: null,
        averageAnts: 0,
      }
    }
  }

  /**
   * Export statistics tables to parquet files in IndexedDB
   */
  async exportToParquet(): Promise<void> {
    try {
      await persistentDataManager.exportTableToParquet('ant_statistics')
      await persistentDataManager.exportTableToParquet('ant_statistics_history')
    } catch (error) {
      console.warn('⚠️ Failed to export ANT statistics to parquet:', error)
    }
  }

  /**
   * Load statistics from parquet files in IndexedDB
   */
  async loadFromParquet(): Promise<boolean> {
    try {
      const loaded1 = await persistentDataManager.loadParquetFromIndexedDB('ant_statistics')
      const loaded2 = await persistentDataManager.loadParquetFromIndexedDB('ant_statistics_history')
      return loaded1 || loaded2
    } catch (error) {
      console.warn('⚠️ Failed to load ANT statistics from parquet:', error)
      return false
    }
  }

  /**
   * Check if we have cached statistics (less than 1 hour old)
   */
  async hasFreshStatistics(): Promise<boolean> {
    try {
      const latest = await this.getLatestStatistics()
      if (!latest) return false

      const result = await persistentDataManager.query(`
        SELECT timestamp FROM ant_statistics 
        WHERE timestamp > datetime('now', '-1 hour')
        ORDER BY timestamp DESC 
        LIMIT 1
      `)

      return result && result.numRows > 0
    } catch (error) {
      console.error('❌ Failed to check fresh statistics:', error)
      return false
    }
  }

  /**
   * Clear all statistics data
   */
  async clearAllStatistics(): Promise<void> {
    try {
      await persistentDataManager.query('DELETE FROM ant_statistics')
      await persistentDataManager.query('DELETE FROM ant_statistics_history')
      console.log('🧹 Cleared all ANT statistics')
    } catch (error) {
      console.error('❌ Failed to clear ANT statistics:', error)
      throw error
    }
  }
}

// Export singleton instance
export const antStatisticsPersistence = ANTStatisticsPersistence.getInstance()
