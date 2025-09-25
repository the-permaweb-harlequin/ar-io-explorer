import { useCallback } from 'react'

import { Table as Arrow } from 'apache-arrow'
import { useAsync } from 'react-async-hook'

import { instanceManager } from '../instance-manager'
import { DuckDBQueryError, QueryOptions, UseDuckDBQueryResult } from '../types'
import { runQuery } from '../utils/run-query'

/**
 * Execute a SQL query and return the result as Arrow.
 * Supports multi-instance usage via instanceId in options.
 *
 * If sql is undefined, returns undefined.
 */
export const useDuckDBQuery = (
  sql: string | undefined,
  options: QueryOptions = {},
): UseDuckDBQueryResult => {
  const { instanceId = 'default', debug = false } = options

  const asyncFn = useCallback(async () => {
    if (!sql) {
      return undefined
    }

    // Get the database instance
    const instance = instanceManager.getExistingInstance(instanceId)
    if (!instance) {
      throw new DuckDBQueryError(
        'Instance not found',
        `DuckDB instance '${instanceId}' not found. Please create it first.`,
        sql,
        instanceId,
      )
    }

    try {
      const arrow = await runQuery(instance.db, sql, debug)
      return arrow
    } catch (error) {
      console.error(`Query failed on instance '${instanceId}':`, { sql, error })
      throw new DuckDBQueryError(
        'Query execution failed',
        `Failed to execute query on instance '${instanceId}': ${error}`,
        sql,
        instanceId,
      )
    }
  }, [sql, instanceId, debug])

  const {
    result: arrow,
    loading,
    error,
    execute: refetch,
  } = useAsync(asyncFn, [sql, instanceId, debug])

  return {
    arrow,
    loading,
    error,
    refetch: () => {
      refetch()
    },
  }
}

/**
 * Hook to execute a query on the default instance
 */
export const useDefaultDuckDBQuery = (
  sql: string | undefined,
  options: Omit<QueryOptions, 'instanceId'> = {},
): UseDuckDBQueryResult => {
  return useDuckDBQuery(sql, {
    instanceId: 'default',
    ...options,
  })
}
