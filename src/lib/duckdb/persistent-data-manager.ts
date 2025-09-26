import { AsyncDuckDB } from '@duckdb/duckdb-wasm'

import { instanceManager } from './instance-manager'
import { TABLE_INDEXES, TABLE_SCHEMAS } from './persistent-config'
import { DuckDBInstanceConfig, DuckDBInstanceError } from './types'

/**
 * Manager for persistent data operations with named DuckDB instances
 */
export class PersistentDataManager {
  private static instances: Map<string, PersistentDataManager> = new Map()
  private db: AsyncDuckDB | null = null
  private initialized = false
  private initializationPromise: Promise<void> | null = null
  private instanceName: string
  private config: DuckDBInstanceConfig

  private constructor(instanceName: string, config: DuckDBInstanceConfig) {
    this.instanceName = instanceName
    this.config = config
  }

  static getInstance(
    instanceName: string = 'ar-io-explorer-db',
    customConfig?: Partial<DuckDBInstanceConfig>,
  ): PersistentDataManager {
    if (!PersistentDataManager.instances.has(instanceName)) {
      // Create config for this instance
      const config: DuckDBInstanceConfig = {
        ...customConfig,
        id: instanceName, // Always use instanceName as id
        name: customConfig?.name || `${instanceName} Persistent Database`,
        debug: customConfig?.debug || false,
        config: {
          // Start with in-memory database, we'll handle persistence manually
          // path: `${instanceName}.db`, // Commented out to avoid read-only issues
          // Set memory limit to 512MB (more conservative)
          memory_limit: '512MB',
          // Use automatic access mode - creates database if it doesn't exist
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
          // Enable auto checkpoint for better persistence
          wal_autocheckpoint: 1000,
          ...customConfig?.config,
        },
      }

      PersistentDataManager.instances.set(
        instanceName,
        new PersistentDataManager(instanceName, config),
      )
    }
    return PersistentDataManager.instances.get(instanceName)!
  }

  /**
   * Initialize the persistent database and create tables
   */
  async initialize(): Promise<void> {
    if (this.initialized) return
    if (this.initializationPromise) return this.initializationPromise

    this.initializationPromise = this._initialize()
    return this.initializationPromise
  }

  private async _initialize(): Promise<void> {
    try {
      console.log(
        `🗄️ Initializing persistent DuckDB instance: ${this.instanceName}`,
      )
      console.log(`📋 Database config:`, {
        path: this.config.config?.path,
        access_mode: this.config.config?.access_mode,
        memory_limit: this.config.config?.memory_limit,
      })

      // Try to get the persistent database instance
      const dbInstance = await this.tryInitializeDatabase()
      this.db = dbInstance.db

      console.log(`✅ Database instance created successfully`)

      // Create tables and indexes (this will work with in-memory database)
      await this.createTables()
      await this.createIndexes()

      // Try to load existing data from parquet files in IndexedDB
      await this.loadExistingDataFromParquet()

      this.initialized = true
      console.log(
        `✅ Persistent DuckDB instance '${this.instanceName}' initialized successfully`,
      )
    } catch (error) {
      const errorMessage = error?.toString() || ''
      const errorDetails = (error as Error)?.message || ''

      console.log(
        '🔍 Database initialization error in _initialize:',
        errorMessage,
      )
      console.log('🔍 Error details in _initialize:', errorDetails)

      // Check if it's a corrupted database file error at this level too
      const isCorruptedDatabase =
        errorMessage.includes('not a valid DuckDB database file') ||
        errorMessage.includes('Opening the database failed') ||
        errorDetails.includes('not a valid DuckDB database file') ||
        errorDetails.includes('Opening the database failed') ||
        (error instanceof DuckDBInstanceError &&
          (error.message.includes('not a valid DuckDB database file') ||
            error.message.includes('Opening the database failed')))

      if (isCorruptedDatabase) {
        console.warn(
          '⚠️ Corrupted database detected in _initialize, attempting recovery...',
        )

        // Clear the corrupted database and try again
        await this.clearCorruptedDatabase()

        // Reset state for retry
        this.db = null
        this.initialized = false

        // Try again with a fresh database
        console.log(
          '🔄 Retrying database initialization after cleanup in _initialize...',
        )
        try {
          // Create a fresh in-memory database configuration
          const freshConfig = {
            ...this.config,
            config: {
              ...this.config.config,
              // Remove path to ensure in-memory database
              path: undefined,
              // Ensure we can create a new database
              access_mode: 'automatic',
            },
          }

          console.log(`🆕 Creating fresh in-memory database with config:`, {
            path: freshConfig.config?.path || 'in-memory',
            access_mode: freshConfig.config?.access_mode,
          })

          const dbInstance = await instanceManager.getInstance(freshConfig)
          this.db = dbInstance.db

          console.log(`✅ Fresh in-memory database instance created`)

          // Create tables and indexes
          await this.createTables()
          await this.createIndexes()

          // Try to load existing data from parquet
          await this.loadExistingDataFromParquet()

          this.initialized = true
          console.log(
            '✅ Persistent DuckDB instance initialized successfully after recovery',
          )
          return
        } catch (retryError) {
          console.error(
            '❌ Failed to initialize even after corruption recovery:',
            retryError,
          )
          throw new DuckDBInstanceError(
            'Persistent DB Initialization Failed After Recovery',
            `Failed to initialize persistent database even after corruption recovery: ${retryError}`,
            this.instanceName,
          )
        }
      }

      console.error('❌ Failed to initialize persistent DuckDB:', error)
      throw new DuckDBInstanceError(
        'Persistent DB Initialization Failed',
        `Failed to initialize persistent database: ${error}`,
        this.instanceName,
      )
    }
  }

  /**
   * Try to initialize the database, with recovery for corrupted files
   */
  private async tryInitializeDatabase(): Promise<any> {
    try {
      // First attempt with the configured path
      return await instanceManager.getInstance(this.config)
    } catch (error) {
      const errorMessage = error?.toString() || ''
      const errorDetails = (error as Error)?.message || ''

      console.log('🔍 Database initialization error:', errorMessage)
      console.log('🔍 Error details:', errorDetails)

      // Check if it's a corrupted database file error
      // Look for corruption indicators in both the error message and nested error details
      const isCorruptedDatabase =
        errorMessage.includes('not a valid DuckDB database file') ||
        errorMessage.includes('Opening the database failed') ||
        errorDetails.includes('not a valid DuckDB database file') ||
        errorDetails.includes('Opening the database failed') ||
        (error instanceof DuckDBInstanceError &&
          (error.message.includes('not a valid DuckDB database file') ||
            error.message.includes('Opening the database failed')))

      if (isCorruptedDatabase) {
        console.warn('⚠️ Corrupted database detected, attempting recovery...')

        // Clear the corrupted database and try again
        await this.clearCorruptedDatabase()

        // Try again with a fresh database
        console.log('🔄 Retrying database initialization after cleanup...')
        return await instanceManager.getInstance(this.config)
      }

      // If it's not a corruption error, re-throw
      throw error
    }
  }

  /**
   * Clear corrupted database from IndexedDB
   */
  private async clearCorruptedDatabase(): Promise<void> {
    try {
      console.log('🧹 Clearing corrupted database from IndexedDB...')

      // First, try to properly close any existing database connection
      if (this.db) {
        try {
          console.log('🔒 Closing existing database connection...')
          // Force a checkpoint to flush any pending writes
          const conn = await this.db.connect()
          try {
            await conn.query('CHECKPOINT;')
            console.log('✅ Database checkpoint completed')
          } catch (checkpointError) {
            console.warn('⚠️ Failed to checkpoint database:', checkpointError)
          } finally {
            await conn.close()
          }

          // Close the database
          await this.db.terminate()
          console.log('✅ Database connection closed')
        } catch (closeError) {
          console.warn('⚠️ Failed to properly close database:', closeError)
        }
        this.db = null
      }

      // Wait a bit for any pending operations to complete
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Clear the main database
      await this.clearIndexedDBDatabase(`${this.instanceName}.db`)

      // Also clear any parquet backups to start fresh
      await this.clearIndexedDBDatabase(`${this.instanceName}-parquet`)

      console.log('✅ Corrupted database cleared successfully')
    } catch (error) {
      console.warn('⚠️ Failed to clear corrupted database:', error)
      // Continue anyway - the database initialization might still work
    }
  }

  /**
   * Clear a specific IndexedDB database
   */
  private async clearIndexedDBDatabase(dbName: string): Promise<void> {
    return new Promise((resolve) => {
      console.log(`🗑️ Attempting to delete IndexedDB database: ${dbName}`)

      const deleteRequest = indexedDB.deleteDatabase(dbName)

      deleteRequest.onerror = (event) => {
        console.warn(`❌ Failed to delete IndexedDB database: ${dbName}`, event)
        resolve() // Don't fail the whole process
      }

      deleteRequest.onsuccess = () => {
        console.log(`✅ Successfully deleted IndexedDB database: ${dbName}`)
        resolve()
      }

      deleteRequest.onblocked = () => {
        console.warn(
          `⚠️ Deletion of ${dbName} was blocked - this may happen if the database is still in use`,
        )
        // Try to force close any open connections
        setTimeout(() => {
          console.log(`🔄 Retrying deletion of ${dbName} after delay...`)
          resolve()
        }, 1000)
      }

      deleteRequest.onupgradeneeded = () => {
        console.log(`🔄 Database ${dbName} is being recreated during deletion`)
      }

      // Timeout after 10 seconds (increased from 5)
      setTimeout(() => {
        console.warn(
          `⏰ Timeout deleting ${dbName} after 10 seconds - continuing anyway`,
        )
        resolve()
      }, 10000)
    })
  }

  /**
   * Create all required tables
   */
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    const conn = await this.db.connect()
    try {
      console.log('📋 Creating database tables...')

      // Use a transaction for atomicity
      await conn.query('BEGIN TRANSACTION;')

      try {
        for (const [tableName, schema] of Object.entries(TABLE_SCHEMAS)) {
          console.log(`📋 Creating table: ${tableName}`)
          await conn.query(schema)
        }

        // Commit the transaction
        await conn.query('COMMIT;')
        console.log('✅ All tables created successfully')
      } catch (tableError) {
        // Rollback on error
        try {
          await conn.query('ROLLBACK;')
        } catch (rollbackError) {
          console.warn('⚠️ Failed to rollback transaction:', rollbackError)
        }
        throw tableError
      }
    } finally {
      await conn.close()
    }
  }

  /**
   * Create all required indexes
   */
  private async createIndexes(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized')

    const conn = await this.db.connect()
    try {
      for (const [tableName, indexSql] of Object.entries(TABLE_INDEXES)) {
        console.log(`🔍 Creating indexes for table: ${tableName}`)
        await conn.query(indexSql)
      }
    } finally {
      await conn.close()
    }
  }

  /**
   * Get the database instance (ensure it's initialized first)
   */
  async getDatabase(): Promise<AsyncDuckDB> {
    await this.initialize()
    if (!this.db) {
      throw new DuckDBInstanceError(
        'Database Not Available',
        'Persistent database is not available after initialization',
        this.instanceName,
      )
    }
    return this.db
  }

  /**
   * Execute a query on the persistent database
   */
  async query(sql: string): Promise<any> {
    const db = await this.getDatabase()
    const conn = await db.connect()
    try {
      return await conn.query(sql)
    } finally {
      await conn.close()
    }
  }

  /**
   * Export a table to parquet and store in IndexedDB
   */
  async exportTableToParquet(tableName: string): Promise<void> {
    const db = await this.getDatabase()
    const conn = await db.connect()

    try {
      const tempFile = `${tableName}_export.parquet`

      // Export table to parquet
      await conn.query(`
        COPY ${tableName} TO '${tempFile}' 
        (FORMAT PARQUET, COMPRESSION 'zstd')
      `)

      // Get the parquet file buffer
      const buffer = await db.copyFileToBuffer(tempFile)

      // Store in IndexedDB
      await this.storeParquetInIndexedDB(tableName, buffer)

      // Clean up temp file
      await db.dropFile(tempFile)

      console.log(`📦 Exported ${tableName} to parquet and stored in IndexedDB`)
    } finally {
      await conn.close()
    }
  }

  /**
   * Store parquet buffer in IndexedDB
   */
  private async storeParquetInIndexedDB(
    tableName: string,
    buffer: Uint8Array,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      // First, try to delete the database to force a fresh creation
      const deleteRequest = indexedDB.deleteDatabase(
        `${this.instanceName}-parquet`,
      )

      deleteRequest.onsuccess = () => {
        console.log(
          `🗑️ Deleted existing IndexedDB '${this.instanceName}-parquet' to force recreation`,
        )
        this.createParquetDatabase(tableName, buffer, resolve, reject)
      }

      deleteRequest.onerror = () => {
        console.log(
          `ℹ️ No existing IndexedDB '${this.instanceName}-parquet' to delete, proceeding with creation`,
        )
        this.createParquetDatabase(tableName, buffer, resolve, reject)
      }

      deleteRequest.onblocked = () => {
        console.log(
          `⚠️ IndexedDB deletion blocked, proceeding with creation anyway`,
        )
        this.createParquetDatabase(tableName, buffer, resolve, reject)
      }
    })
  }

  private createParquetDatabase(
    tableName: string,
    buffer: Uint8Array,
    resolve: () => void,
    reject: (error: any) => void,
  ): void {
    const request = indexedDB.open(`${this.instanceName}-parquet`, 1)

    request.onerror = () => {
      console.error(
        `❌ Failed to open IndexedDB '${this.instanceName}-parquet':`,
        request.error,
      )
      reject(request.error)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      console.log(
        `🔧 Upgrading IndexedDB '${this.instanceName}-parquet' from version ${event.oldVersion} to ${event.newVersion}`,
      )
      console.log(`Existing object stores:`, Array.from(db.objectStoreNames))

      if (!db.objectStoreNames.contains('parquet_files')) {
        console.log(`Creating 'parquet_files' object store...`)
        db.createObjectStore('parquet_files') // No keyPath - use direct keys
        console.log(`✅ Created 'parquet_files' object store`)
      } else {
        console.log(`'parquet_files' object store already exists`)
      }
    }

    request.onsuccess = () => {
      const db = request.result

      // Check if the object store exists before creating transaction
      if (!db.objectStoreNames.contains('parquet_files')) {
        console.error(
          `❌ Object store 'parquet_files' not found in database '${this.instanceName}-parquet'`,
        )
        console.log(`Available object stores:`, Array.from(db.objectStoreNames))
        reject(new Error(`Object store 'parquet_files' not found`))
        return
      }

      try {
        const transaction = db.transaction(['parquet_files'], 'readwrite')
        const store = transaction.objectStore('parquet_files')

        const data = {
          buffer: buffer,
          timestamp: new Date().toISOString(),
          size: buffer.length,
        }

        const putRequest = store.put(data, tableName) // Use tableName as direct key
        putRequest.onsuccess = () => {
          console.log(`✅ Stored parquet data for '${tableName}' in IndexedDB`)
          resolve()
        }
        putRequest.onerror = () => {
          console.error(
            `❌ Failed to store parquet data for '${tableName}':`,
            putRequest.error,
          )
          reject(putRequest.error)
        }
      } catch (error) {
        console.error(`❌ Transaction error for '${tableName}':`, error)
        reject(error)
      }
    }
  }

  /**
   * Load parquet from IndexedDB and import to DuckDB
   */
  async loadParquetFromIndexedDB(tableName: string): Promise<boolean> {
    try {
      const data = await this.getParquetFromIndexedDB(tableName)
      if (!data) return false

      const db = await this.getDatabase()
      const tempFile = `${tableName}_import.parquet`

      // Register the parquet file in DuckDB
      await db.registerFileBuffer(tempFile, data.buffer)

      // Import the data
      const conn = await db.connect()
      try {
        await conn.query(`
          CREATE OR REPLACE TABLE ${tableName} AS 
          SELECT * FROM read_parquet('${tempFile}')
        `)
      } finally {
        await conn.close()
      }

      // Clean up
      await db.dropFile(tempFile)

      console.log(`📥 Loaded ${tableName} from IndexedDB parquet`)
      return true
    } catch (error) {
      console.warn(`⚠️ Failed to load ${tableName} from IndexedDB:`, error)
      return false
    }
  }

  /**
   * Get parquet data from IndexedDB
   */
  private async getParquetFromIndexedDB(
    tableName: string,
  ): Promise<any | null> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(`${this.instanceName}-parquet`, 1)

      request.onerror = () => reject(request.error)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        console.log(
          `🔧 Creating IndexedDB object store for '${this.instanceName}-parquet'`,
        )
        if (!db.objectStoreNames.contains('parquet_files')) {
          db.createObjectStore('parquet_files')
          console.log(`✅ Created 'parquet_files' object store`)
        }
      }

      request.onsuccess = () => {
        const db = request.result

        // Check if the object store exists
        if (!db.objectStoreNames.contains('parquet_files')) {
          console.log(
            `ℹ️ No 'parquet_files' object store found for '${tableName}'`,
          )
          resolve(null)
          return
        }

        try {
          const transaction = db.transaction(['parquet_files'], 'readonly')
          const store = transaction.objectStore('parquet_files')

          const getRequest = store.get(tableName)
          getRequest.onsuccess = () => {
            const result = getRequest.result
            console.log(
              `🔍 IndexedDB lookup for '${tableName}':`,
              result ? 'found' : 'not found',
            )
            resolve(result || null)
          }
          getRequest.onerror = () => {
            console.error(
              `❌ IndexedDB get error for '${tableName}':`,
              getRequest.error,
            )
            reject(getRequest.error)
          }
        } catch (error) {
          console.error(`❌ Transaction error for '${tableName}':`, error)
          reject(error)
        }
      }
    })
  }

  /**
   * Clear all data for a fresh start
   */
  async clearAllData(): Promise<void> {
    const db = await this.getDatabase()
    const conn = await db.connect()

    try {
      // Drop all tables
      for (const tableName of Object.keys(TABLE_SCHEMAS)) {
        await conn.query(`DROP TABLE IF EXISTS ${tableName}`)
      }

      // Recreate tables and indexes
      await this.createTables()
      await this.createIndexes()

      console.log('🧹 Cleared all persistent data')
    } finally {
      await conn.close()
    }
  }

  /**
   * Check if the database is initialized.
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * Load existing data from parquet files stored in IndexedDB
   */
  private async loadExistingDataFromParquet(): Promise<void> {
    if (!this.db) return

    try {
      console.log(
        `📥 Loading existing data for '${this.instanceName}' from parquet files...`,
      )

      // Try to load each table from parquet
      for (const tableName of Object.keys(TABLE_SCHEMAS)) {
        try {
          const loaded = await this.loadParquetFromIndexedDB(tableName)
          if (loaded) {
            console.log(`✅ Loaded table '${tableName}' from parquet`)
          } else {
            console.log(`ℹ️ No existing data found for table '${tableName}'`)
          }
        } catch (error) {
          console.warn(
            `⚠️ Failed to load table '${tableName}' from parquet:`,
            error,
          )
          // Continue with other tables
        }
      }
    } catch (error) {
      console.warn(`⚠️ Failed to load existing data from parquet:`, error)
      // Don't throw - we can continue with empty tables
    }
  }

  /**
   * Manually trigger corruption recovery (useful for debugging)
   */
  async recoverFromCorruption(): Promise<void> {
    console.log('🔧 Manually triggering corruption recovery...')

    try {
      // Reset initialization state
      this.initialized = false
      this.initializationPromise = null
      this.db = null

      // Clear corrupted database first
      console.log('🧹 Clearing corrupted database files...')
      await this.clearCorruptedDatabase()

      // Wait a bit for IndexedDB operations to complete
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Reinitialize with fresh state
      console.log('🔄 Reinitializing database after cleanup...')
      await this.initialize()

      console.log('✅ Manual corruption recovery completed successfully')
    } catch (error) {
      console.error('❌ Manual corruption recovery failed:', error)

      // Try one more time with more aggressive cleanup
      console.log('🔄 Attempting more aggressive cleanup...')
      try {
        // Clear all possible database names
        await this.clearIndexedDBDatabase(`${this.instanceName}.db`)
        await this.clearIndexedDBDatabase(`${this.instanceName}-parquet`)
        await this.clearIndexedDBDatabase('ar-io-explorer.db') // Legacy name
        await this.clearIndexedDBDatabase('ar-io-explorer-parquet') // Legacy name

        // Wait longer for cleanup
        await new Promise((resolve) => setTimeout(resolve, 2000))

        // Reset state completely
        this.initialized = false
        this.initializationPromise = null
        this.db = null

        // Try to initialize again
        await this.initialize()

        console.log('✅ Aggressive corruption recovery completed successfully')
      } catch (finalError) {
        console.error('❌ Even aggressive recovery failed:', finalError)
        throw new DuckDBInstanceError(
          'Corruption Recovery Failed',
          `Failed to recover from database corruption: ${finalError}`,
          this.instanceName,
        )
      }
    }
  }
}

// Export default instance for backward compatibility
export const persistentDataManager =
  PersistentDataManager.getInstance('ar-io-explorer-db')

// Export factory function for named instances
export const getPersistentDataManager = (
  instanceName: string,
  customConfig?: Partial<DuckDBInstanceConfig>,
) => PersistentDataManager.getInstance(instanceName, customConfig)
