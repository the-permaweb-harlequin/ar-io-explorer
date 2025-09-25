import { useAsync } from 'react-async-hook'

import { getDuckDBInstance } from '../instance-manager'
import {
  DuckDBInstanceConfig,
  DuckDBInstanceError,
  UseDuckDBResult,
} from '../types'

/**
 * React hook to access a DuckDB instance within components or other hooks.
 * Supports multiple instances via configuration.
 */
export const useDuckDB = (config: DuckDBInstanceConfig): UseDuckDBResult => {
  const {
    result: instance,
    loading,
    error,
  } = useAsync(async () => {
    try {
      const instance = await getDuckDBInstance(config)
      return instance
    } catch (error) {
      console.error(`Failed to get DuckDB instance '${config.id}':`, error)
      throw new DuckDBInstanceError(
        'Instance creation failed',
        `Failed to create or get DuckDB instance '${config.id}': ${error}`,
        config.id,
      )
    }
  }, [config.id, config.config, config.debug])

  return {
    db: instance?.db,
    loading,
    error,
    config: instance?.config,
  }
}

/**
 * Hook to get the default DuckDB instance
 */
export const useDefaultDuckDB = (
  options: Omit<DuckDBInstanceConfig, 'id'> = {},
): UseDuckDBResult => {
  return useDuckDB({
    id: 'default',
    name: 'Default Instance',
    ...options,
  })
}
