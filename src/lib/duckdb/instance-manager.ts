import * as duckdb from '@duckdb/duckdb-wasm'
import { AsyncDuckDB } from '@duckdb/duckdb-wasm'

import { bundleManager } from './bundle-manager'
import {
  DuckDBInstance,
  DuckDBInstanceConfig,
  DuckDBInstanceError,
} from './types'

/**
 * Multi-instance DuckDB manager
 * Manages multiple independent DuckDB instances while sharing the WASM bundle
 */
class DuckDBInstanceManager {
  private static instance: DuckDBInstanceManager
  private instances: Map<string, DuckDBInstance> = new Map()
  private initializingInstances: Map<string, Promise<DuckDBInstance>> =
    new Map()

  private constructor() {}

  static getInstance(): DuckDBInstanceManager {
    if (!DuckDBInstanceManager.instance) {
      DuckDBInstanceManager.instance = new DuckDBInstanceManager()
    }
    return DuckDBInstanceManager.instance
  }

  /**
   * Create or get an existing DuckDB instance
   */
  async getInstance(config: DuckDBInstanceConfig): Promise<DuckDBInstance> {
    const { id } = config

    // Return existing instance if available
    const existingInstance = this.instances.get(id)
    if (existingInstance) {
      // Update last accessed time
      existingInstance.lastAccessedAt = new Date()
      return existingInstance
    }

    // Return existing initialization promise if already initializing
    const initializingPromise = this.initializingInstances.get(id)
    if (initializingPromise) {
      return initializingPromise
    }

    // Start initializing new instance
    const promise = this.initializeInstance(config)
    this.initializingInstances.set(id, promise)

    try {
      const instance = await promise
      this.instances.set(id, instance)
      return instance
    } finally {
      this.initializingInstances.delete(id)
    }
  }

  /**
   * Private method to initialize a new DuckDB instance
   */
  private async initializeInstance(
    config: DuckDBInstanceConfig,
  ): Promise<DuckDBInstance> {
    const start = performance.now()

    try {
      // Get the shared WASM bundle
      const bundleInfo = await bundleManager.getBundle()
      const bundle = bundleInfo.bundle

      // Create worker with the bundle
      const worker_url = URL.createObjectURL(
        new Blob([`importScripts("${bundle.mainWorker!}");`], {
          type: 'text/javascript',
        }),
      )

      // Instantiate the async version of DuckDB-wasm
      const worker = new Worker(worker_url)
      const logger = config.debug
        ? new duckdb.ConsoleLogger()
        : new duckdb.VoidLogger()

      const db = new AsyncDuckDB(logger, worker)
      await db.instantiate(bundle.mainModule, bundle.pthreadWorker)
      URL.revokeObjectURL(worker_url)

      // Apply configuration if provided
      if (config.config) {
        if (config.config.path) {
          const res = await fetch(config.config.path)
          const buffer = await res.arrayBuffer()
          const fileNameMatch = config.config.path.match(/[^/]*$/)
          if (fileNameMatch) {
            config.config.path = fileNameMatch[0]
          }
          await db.registerFileBuffer(
            config.config.path,
            new Uint8Array(buffer),
          )
        }
        await db.open(config.config)
      }

      const instance: DuckDBInstance = {
        id: config.id,
        db,
        config,
        createdAt: new Date(),
        lastAccessedAt: new Date(),
      }

      const elapsed = performance.now() - start
      if (config.debug) {
        console.debug(
          `DuckDB instance '${config.id}' initialized in ${elapsed.toFixed(2)}ms`,
          {
            name: config.name,
            hasConfig: !!config.config,
            configPath: config.config?.path,
          },
        )
      }

      return instance
    } catch (error) {
      console.error(
        `Failed to initialize DuckDB instance '${config.id}':`,
        error,
      )
      throw new DuckDBInstanceError(
        'Instance initialization failed',
        `Failed to initialize DuckDB instance '${config.id}': ${error}`,
        config.id,
      )
    }
  }

  /**
   * Get an existing instance by ID (without creating)
   */
  getExistingInstance(id: string): DuckDBInstance | undefined {
    const instance = this.instances.get(id)
    if (instance) {
      instance.lastAccessedAt = new Date()
    }
    return instance
  }

  /**
   * Close and remove an instance
   */
  async closeInstance(id: string): Promise<void> {
    const instance = this.instances.get(id)
    if (instance) {
      try {
        await instance.db.terminate()
        this.instances.delete(id)
        console.debug(`DuckDB instance '${id}' closed and removed`)
      } catch (error) {
        console.error(`Error closing DuckDB instance '${id}':`, error)
        throw new DuckDBInstanceError(
          'Instance close failed',
          `Failed to close DuckDB instance '${id}': ${error}`,
          id,
        )
      }
    }
  }

  /**
   * List all active instances
   */
  listInstances(): DuckDBInstance[] {
    return Array.from(this.instances.values())
  }

  /**
   * Get instance count
   */
  getInstanceCount(): number {
    return this.instances.size
  }

  /**
   * Close all instances (useful for cleanup)
   */
  async closeAllInstances(): Promise<void> {
    const closePromises = Array.from(this.instances.keys()).map((id) =>
      this.closeInstance(id),
    )
    await Promise.all(closePromises)
  }

  /**
   * Clean up old instances based on last access time
   */
  async cleanupOldInstances(maxAgeMs: number = 30 * 60 * 1000): Promise<void> {
    const now = new Date()
    const instancesToClose: string[] = []

    for (const [id, instance] of this.instances) {
      const ageMs = now.getTime() - instance.lastAccessedAt.getTime()
      if (ageMs > maxAgeMs) {
        instancesToClose.push(id)
      }
    }

    if (instancesToClose.length > 0) {
      console.debug(
        `Cleaning up ${instancesToClose.length} old DuckDB instances`,
        instancesToClose,
      )
      const closePromises = instancesToClose.map((id) => this.closeInstance(id))
      await Promise.all(closePromises)
    }
  }

  /**
   * Get instance statistics for debugging
   */
  getStats(): {
    totalInstances: number
    instances: Array<{
      id: string
      name?: string
      createdAt: Date
      lastAccessedAt: Date
      ageMs: number
    }>
  } {
    const now = new Date()
    const instances = Array.from(this.instances.values()).map((instance) => ({
      id: instance.id,
      name: instance.config.name,
      createdAt: instance.createdAt,
      lastAccessedAt: instance.lastAccessedAt,
      ageMs: now.getTime() - instance.lastAccessedAt.getTime(),
    }))

    return {
      totalInstances: this.instances.size,
      instances,
    }
  }
}

// Export singleton instance
export const instanceManager = DuckDBInstanceManager.getInstance()

/**
 * Helper function to get or create a DuckDB instance
 */
export const getDuckDBInstance = async (
  config: DuckDBInstanceConfig,
): Promise<DuckDBInstance> => {
  return instanceManager.getInstance(config)
}

/**
 * Helper function to get an existing instance
 */
export const getExistingDuckDBInstance = (
  id: string,
): DuckDBInstance | undefined => {
  return instanceManager.getExistingInstance(id)
}
