import * as duckdb from '@duckdb/duckdb-wasm'

import { DuckDBBundle } from './types'

/**
 * Singleton bundle manager that memoizes WASM bundle loading
 * Uses React Query for caching and deduplication
 */
class DuckDBBundleManager {
  private static instance: DuckDBBundleManager
  private bundle: DuckDBBundle | null = null
  private loadingPromise: Promise<DuckDBBundle> | null = null

  private constructor() {}

  static getInstance(): DuckDBBundleManager {
    if (!DuckDBBundleManager.instance) {
      DuckDBBundleManager.instance = new DuckDBBundleManager()
    }
    return DuckDBBundleManager.instance
  }

  /**
   * Get the DuckDB WASM bundle, loading it if necessary
   * This is memoized and will only load once per browser session
   */
  async getBundle(): Promise<DuckDBBundle> {
    // Return cached bundle if available
    if (this.bundle) {
      return this.bundle
    }

    // Return existing loading promise if already loading
    if (this.loadingPromise) {
      return this.loadingPromise
    }

    // Start loading the bundle
    this.loadingPromise = this.loadBundle()

    try {
      this.bundle = await this.loadingPromise
      return this.bundle
    } finally {
      this.loadingPromise = null
    }
  }

  /**
   * Private method to actually load the bundle
   */
  private async loadBundle(): Promise<DuckDBBundle> {
    const start = performance.now()

    try {
      // Select a bundle based on browser checks
      const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles()
      const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES)

      const browserInfo = this.getBrowserInfo()

      const duckdbBundle: DuckDBBundle = {
        bundle,
        loadedAt: new Date(),
        browserInfo,
      }

      const elapsed = performance.now() - start
      console.debug(`DuckDB WASM bundle loaded in ${elapsed.toFixed(2)}ms`, {
        browserInfo,
        bundleInfo: {
          mainModule: !!bundle.mainModule,
          mainWorker: !!bundle.mainWorker,
          pthreadWorker: !!bundle.pthreadWorker,
        },
      })

      return duckdbBundle
    } catch (error) {
      console.error('Failed to load DuckDB WASM bundle:', error)
      throw new Error(`Failed to load DuckDB WASM bundle: ${error}`)
    }
  }

  /**
   * Get browser information for debugging
   */
  private getBrowserInfo(): string {
    const ua = navigator.userAgent
    const isChrome = ua.includes('Chrome')
    const isFirefox = ua.includes('Firefox')
    const isSafari = ua.includes('Safari') && !isChrome
    const isEdge = ua.includes('Edge')

    let browser = 'Unknown'
    if (isChrome) browser = 'Chrome'
    else if (isFirefox) browser = 'Firefox'
    else if (isSafari) browser = 'Safari'
    else if (isEdge) browser = 'Edge'

    return `${browser} (${navigator.platform})`
  }

  /**
   * Clear the cached bundle (useful for testing or forced reloads)
   */
  clearCache(): void {
    this.bundle = null
    this.loadingPromise = null
  }

  /**
   * Get bundle info for debugging
   */
  getBundleInfo(): DuckDBBundle | null {
    return this.bundle
  }
}

// Export singleton instance
export const bundleManager = DuckDBBundleManager.getInstance()

/**
 * React Query key factory for DuckDB bundles
 */
export const duckdbQueryKeys = {
  all: ['duckdb'] as const,
  bundle: () => [...duckdbQueryKeys.all, 'bundle'] as const,
  instances: () => [...duckdbQueryKeys.all, 'instances'] as const,
  instance: (id: string) => [...duckdbQueryKeys.instances(), id] as const,
  queries: () => [...duckdbQueryKeys.all, 'queries'] as const,
  query: (instanceId: string, sql: string) =>
    [...duckdbQueryKeys.queries(), instanceId, sql] as const,
}

/**
 * React Query function to get the DuckDB bundle
 * This leverages React Query's caching and deduplication
 */
export const getDuckDBBundle = async (): Promise<DuckDBBundle> => {
  return bundleManager.getBundle()
}
